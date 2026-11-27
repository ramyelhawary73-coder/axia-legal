-- REVIEW ONLY. Apply AFTER the reviewed Android proof SQL, never automatically.
-- Existing Supabase project: logical Preview isolation, NOT a separate database/security boundary.
-- No Auth/business table, existing role assignment, control-center setting or Vault secret changed.
begin;
create table private.push_edge_control (
  scope text primary key references private.push_configuration(scope) check(scope='axia-push-preview-v1'),
  enabled boolean not null default false,
  test_user_id uuid references auth.users(id),
  test_organization_id uuid references public.organizations(id),
  window_started_at timestamptz,
  approved_until timestamptz,
  last_enqueued_slot bigint,
  last_started_slot bigint,
  usage_month date,
  calls_this_month integer not null default 0 check(calls_this_month>=0),
  monthly_cap integer not null default 200 check(monthly_cap between 1 and 200),
  check(not enabled or (test_user_id is not null and test_organization_id is not null
    and window_started_at is not null and approved_until>window_started_at
    and approved_until<=window_started_at+interval '1 hour'))
);
insert into private.push_edge_control(scope) values('axia-push-preview-v1');
alter table private.push_edge_control enable row level security;
alter table private.push_edge_control force row level security;
revoke all on private.push_edge_control from public,anon,authenticated,axia_push_dispatcher;
grant create on schema private to axia_push_api_owner;
alter table private.push_edge_control owner to axia_push_api_owner;
create policy push_edge_function_owner on private.push_edge_control to axia_push_api_owner using(true) with check(true);

create function private.axia_push_edge_begin(p_slot bigint) returns boolean
language plpgsql security definer set search_path='' as $$
declare e private.push_edge_control; current_slot bigint:=floor(extract(epoch from clock_timestamp())/60);
begin
  select * into e from private.push_edge_control where scope='axia-push-preview-v1' for update;
  if not found or not e.enabled or e.window_started_at>clock_timestamp() or e.approved_until<=clock_timestamp()
    or e.approved_until>e.window_started_at+interval '1 hour'
    or p_slot is null or p_slot not between current_slot-1 and current_slot
    or (e.last_started_slot is not null and p_slot<=e.last_started_slot)
    or not exists(select 1 from private.push_configuration c where c.scope=e.scope and c.enabled)
  then return false; end if;
  -- Budget is reserved by SQL before enqueue, so failures consume it too.
  if e.last_enqueued_slot is distinct from p_slot then return false; end if;
  update private.push_edge_control set last_started_slot=p_slot where scope=e.scope;
  return true;
end $$;
alter function private.axia_push_edge_begin(bigint) owner to axia_push_api_owner;
revoke all on function private.axia_push_edge_begin(bigint) from public,anon,authenticated;
grant execute on function private.axia_push_edge_begin(bigint) to axia_push_dispatcher;
revoke create on schema private from axia_push_api_owner;
-- Live authorization and readiness replacements follow; only Push functions are replaced.
create or replace function private.axia_push_live(p_user uuid,p_session uuid,p_org uuid,p_until timestamptz) returns boolean
language sql stable security definer set search_path='' as $$
 select p_until>statement_timestamp() and exists(
  select 1 from private.push_configuration c
  join auth.users u on u.id=p_user
  join auth.sessions s on s.id=p_session and s.user_id=u.id
  join public.organization_members m on m.user_id=u.id and m.organization_id=p_org
  where c.scope='axia-push-preview-v1' and c.enabled and c.origin is not null
    and exists(select 1 from private.push_edge_control e where e.scope=c.scope and e.enabled
      and e.window_started_at<=statement_timestamp() and e.approved_until>statement_timestamp()
      and e.test_user_id=p_user and e.test_organization_id=p_org)
    and c.auth_policy_verified_at between statement_timestamp()-interval '6 hours' and statement_timestamp()
    and c.timebox_seconds is not null and c.inactivity_seconds is not null and c.single_session is not null
    and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
    and (u.banned_until is null or u.banned_until<=statement_timestamp())
    and (s.not_after is null or s.not_after>statement_timestamp())
    and (c.timebox_seconds=0 or s.created_at+make_interval(secs=>c.timebox_seconds)>statement_timestamp())
    and (c.inactivity_seconds=0 or coalesce(s.refreshed_at,s.created_at)+make_interval(secs=>c.inactivity_seconds)>statement_timestamp())
    and (not c.single_session or not exists(select 1 from auth.sessions newer where newer.user_id=u.id and newer.created_at>s.created_at))
    and (not exists(select 1 from auth.mfa_factors f where f.user_id=u.id and f.status='verified')
      or (s.aal='aal2' and exists(select 1 from auth.mfa_factors f where f.id=s.factor_id and f.user_id=u.id and f.status='verified')))
    and not exists(select 1 from private.office_controls o where o.organization_id=p_org
      and (o.status<>'active' or (o.expires_at is not null and o.expires_at<=statement_timestamp())))
    and not exists(select 1 from private.office_member_access b where b.organization_id=p_org and b.user_id=u.id and b.blocked)
 );
$$;
create or replace function public.axia_push_status(p_org uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ctx jsonb; o text; heartbeat timestamptz; begin
  ctx:=private.axia_push_context(p_org);
  select origin,dispatcher_seen_at into o,heartbeat from private.push_configuration where scope='axia-push-preview-v1';
  return jsonb_build_object('ready',true,'origin',o,'leaseUntil',ctx->>'expires','testOnly',true,
    'workerReady',coalesce(heartbeat between statement_timestamp()-interval '120 seconds' and statement_timestamp()+interval '5 seconds',false));
end $$;


commit;
