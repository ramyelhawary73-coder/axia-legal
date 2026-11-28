-- REVIEW ONLY / NOT APPLIED. Replaces pg_net reservation with atomic admission.
-- No new table/role/grant/extension, no secret write, job or gate activation.
-- Apply only with all gates off, no window, no legacy Cron and pg_net absent.
begin;
lock table private.push_edge_control, private.push_configuration in access exclusive mode;
do $$ begin
  if (select count(*) from private.push_edge_control) <> 1
    or (select count(*) from private.push_configuration) <> 1
    or exists(select 1 from private.push_edge_control where enabled
      or window_started_at is not null or approved_until is not null)
    or exists(select 1 from private.push_configuration where enabled)
    or exists(select 1 from pg_extension where extname='pg_net')
    or to_regprocedure('private.axia_push_edge_begin(bigint)') is null
    or to_regprocedure('private.axia_push_edge_tick()') is null
  then raise exception 'PUSH_EXTERNAL_TIMER_PREPARATION_NOT_DISABLED'; end if;
  if to_regclass('cron.job') is not null then
    if exists(select 1 from cron.job where jobname='axia-push-preview-minute'
      or command like '%axia_push_edge_tick%')
    then raise exception 'PUSH_LEGACY_CRON_PRESENT'; end if;
  end if;
end $$;

create or replace function private.axia_push_edge_begin(p_slot bigint) returns boolean
language plpgsql security definer set search_path='' as $$
declare e private.push_edge_control; t timestamptz; current_slot bigint; month date; used integer;
begin
  select * into e from private.push_edge_control where scope='axia-push-preview-v1' for update;
  -- Time is read AFTER the row lock: a waiting request must not use an expired window.
  t:=clock_timestamp(); current_slot:=floor(extract(epoch from t)/60);
  month:=date_trunc('month',t at time zone 'UTC')::date;
  if not found or not e.enabled or e.test_user_id is null or e.test_organization_id is null
    or e.window_started_at is null or e.approved_until is null
    or e.window_started_at>t or e.approved_until<=t or e.approved_until<=e.window_started_at
    or e.approved_until>e.window_started_at+interval '30 minutes'
    or p_slot is null or p_slot not between current_slot-1 and current_slot
    or (e.last_started_slot is not null and current_slot<=e.last_started_slot)
    or not exists(select 1 from private.push_configuration c where c.scope=e.scope and c.enabled)
  then return false; end if;
  used:=case when e.usage_month=month then e.calls_this_month else 0 end;
  if used>=e.monthly_cap then return false; end if;
  -- One admission per DATABASE minute, even for signed previous/current-minute requests.
  -- Reservation commits before sender I/O; admitted failures/empty batches consume the cap.
  update private.push_edge_control set usage_month=month,calls_this_month=used+1,
    last_enqueued_slot=current_slot,last_started_slot=current_slot where scope=e.scope;
  return true;
end $$;
-- CREATE OR REPLACE retains the existing API-owner/ACL. Refuse unexpected privilege drift.
do $$ begin
  if (select r.rolname from pg_proc p join pg_roles r on r.oid=p.proowner
      where p.oid='private.axia_push_edge_begin(bigint)'::regprocedure) <> 'axia_push_api_owner'
    or has_function_privilege('anon','private.axia_push_edge_begin(bigint)','execute')
    or has_function_privilege('authenticated','private.axia_push_edge_begin(bigint)','execute')
    or not has_function_privilege('axia_push_dispatcher','private.axia_push_edge_begin(bigint)','execute')
  then raise exception 'PUSH_EXTERNAL_TIMER_ACL_DRIFT'; end if;
end $$;

-- Retire the old operator-only tick without dropping a shared extension or reading Vault.
-- Keeps its original owner and ACL; restores no network access even if called accidentally.
create or replace function private.axia_push_edge_tick() returns bigint
language sql security definer set search_path='' as $$ select null::bigint $$;
commit;
