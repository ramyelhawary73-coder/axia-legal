-- Operator transaction template, NOT a migration or an application RPC.
-- Render validated private parameters with platform-owner-operation.mjs.
-- Never paste unrendered placeholders, supply fake JWT claims, or replay D1 DDL.
begin isolation level repeatable read;
set local lock_timeout = '5s';
set local statement_timeout = '15s';
set local axia.operator.target_id = '__AXIA_TARGET_UUID__';
set local axia.operator.expected_email = E'__AXIA_EXPECTED_EMAIL__';
set local axia.operator.action = '__AXIA_OPERATION__';

do $operation$
declare
  target_id uuid := current_setting('axia.operator.target_id')::uuid;
  expected_email text := current_setting('axia.operator.expected_email');
  operation text := current_setting('axia.operator.action');
  principal private.platform_principals%rowtype;
  total_principals bigint;
  audit_before bigint;
  bootstrap_events bigint;
  revoked_events bigint;
  restored_events bigint;
  state_events bigint;
  expected_event text;
  changed boolean := false;
  members_before text;
  functions_manifest text;
begin
  if current_user <> 'postgres' or auth.uid() is not null or auth.jwt()->>'session_id' is not null then
    raise exception 'PLATFORM_OPERATOR_CONTEXT_REQUIRED';
  end if;
  if operation not in ('bootstrap','revoke','restore') or expected_email = '' then
    raise exception 'PLATFORM_OPERATOR_INVALID_INPUT';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations where name='axia_platform_owner_foundation')<>1
    or not exists(select 1 from supabase_migrations.schema_migrations
      where name='axia_platform_owner_foundation' and cardinality(statements)=1
      and encode(sha256(convert_to(statements[1],'UTF8')),'hex')='2f9a60b32b3ad1f29956953d9c06a68859742f40840bf208d08c1e107f657ce8') then
    raise exception 'PLATFORM_OPERATOR_SOURCE_MISMATCH';
  end if;
  select md5(string_agg(n.nspname||E'\n'||p.proname||E'\n'||pg_get_functiondef(p.oid),E'\n---\n' order by n.nspname,p.proname))
    into functions_manifest from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('private','public') and p.proname like 'axia_platform_%';
  if functions_manifest is distinct from 'fa47e6f2ac221d0d6286a93d1d26fe77' then
    raise exception 'PLATFORM_OPERATOR_FUNCTION_DRIFT';
  end if;
  if (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='private' and c.relname in ('platform_principals','platform_audit_events')
      and c.relkind='r' and c.relrowsecurity and c.relforcerowsecurity and pg_get_userbyid(c.relowner)='postgres')<>2
    or exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='private' and c.relname in ('platform_principals','platform_audit_events')
      and (has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        or has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')))
    or has_schema_privilege('authenticated','private','CREATE')
    or not has_schema_privilege('authenticated','private','USAGE') then
    raise exception 'PLATFORM_OPERATOR_TABLE_ACL_DRIFT';
  end if;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('private','public') and p.proname like 'axia_platform_%'
    and (pg_get_userbyid(p.proowner)<>'postgres' or has_function_privilege('anon',p.oid,'execute')
      or has_function_privilege('authenticated',p.oid,'execute') is distinct from
        (p.proname in ('axia_platform_context','axia_platform_read','axia_platform_offices','axia_platform_audit')))) then
    raise exception 'PLATFORM_OPERATOR_FUNCTION_ACL_DRIFT';
  end if;
  if (select count(*) from pg_trigger t where not t.tgisinternal and t.tgrelid in
      ('private.platform_principals'::regclass,'private.platform_audit_events'::regclass))<>5
    or (select count(*) from pg_trigger t where t.tgenabled='O' and
      (t.tgname,t.tgfoid) in (
        ('platform_principal_guard','private.axia_platform_principal_guard()'::regprocedure),
        ('platform_principal_no_truncate','private.axia_platform_principal_guard()'::regprocedure),
        ('platform_principal_audit','private.axia_platform_principal_audit()'::regprocedure),
        ('platform_audit_immutable','private.axia_platform_audit_immutable()'::regprocedure),
        ('platform_audit_no_truncate','private.axia_platform_audit_immutable()'::regprocedure)))<>5
    or not exists(select 1 from pg_index where indexrelid='private.platform_single_active_owner'::regclass
      and indisvalid and indisunique and indrelid='private.platform_principals'::regclass
      and pg_get_expr(indpred,indrelid)='enabled') then
    raise exception 'PLATFORM_OPERATOR_GUARD_DRIFT';
  end if;

  -- Serialize operator decisions; existing guarded reads still use their row lock.
  lock table private.platform_principals in share row exclusive mode;
  perform 1 from auth.users where id=target_id and lower(email)=lower(expected_email) for share;
  if not found then raise exception 'PLATFORM_OPERATOR_IDENTITY_MISMATCH'; end if;
  if operation in ('bootstrap','restore') and not exists(select 1 from auth.users where id=target_id
    and email_confirmed_at is not null and not coalesce(is_anonymous,false)
    and (banned_until is null or banned_until<clock_timestamp())) then
    raise exception 'PLATFORM_OPERATOR_VERIFIED_IDENTITY_REQUIRED';
  end if;
  select md5(coalesce(jsonb_agg(to_jsonb(m) order by organization_id,user_id)::text,'[]'))
    into members_before from public.organization_members m;
  select count(*) into total_principals from private.platform_principals;
  select count(*) into audit_before from private.platform_audit_events;
  select * into principal from private.platform_principals where user_id=target_id for update;

  if total_principals=0 then
    if operation<>'bootstrap' or audit_before<>0 then raise exception 'PLATFORM_OPERATOR_UNEXPECTED_HISTORY'; end if;
    insert into private.platform_principals(user_id) values(target_id);
    expected_event:='platform.owner.bootstrap'; changed:=true;
  else
    if total_principals<>1 or principal.user_id is null or principal.role<>'platform_owner' then
      raise exception 'PLATFORM_OPERATOR_UNEXPECTED_ROOT';
    end if;
    select count(*) filter(where action='platform.owner.bootstrap'),
      count(*) filter(where action='platform.owner.revoked'),count(*) filter(where action='platform.owner.restored')
      into bootstrap_events,revoked_events,restored_events from private.platform_audit_events
      where subject_id=target_id and actor_type='operator' and actor_id is null;
    select count(*) into state_events from private.platform_audit_events
      where action in ('platform.owner.bootstrap','platform.owner.revoked','platform.owner.restored');
    if bootstrap_events<>1 or state_events<>bootstrap_events+revoked_events+restored_events
      or revoked_events<restored_events or revoked_events>restored_events+1
      or principal.enabled is distinct from (revoked_events=restored_events) then
      raise exception 'PLATFORM_OPERATOR_UNEXPECTED_HISTORY';
    end if;
    if operation='bootstrap' then
      if not principal.enabled or revoked_events<>0 then raise exception 'PLATFORM_OPERATOR_BOOTSTRAP_NOT_RESTORE'; end if;
      -- Verified same initial principal/history: no write and no second audit.
    elsif operation='revoke' and principal.enabled then
      update private.platform_principals set enabled=false,revoked_at=clock_timestamp() where user_id=target_id;
      expected_event:='platform.owner.revoked'; changed:=true;
    elsif operation='restore' then
      if revoked_events=0 then raise exception 'PLATFORM_OPERATOR_NOT_REVOKED'; end if;
      if not principal.enabled then
        update private.platform_principals set enabled=true,revoked_at=null where user_id=target_id;
        expected_event:='platform.owner.restored'; changed:=true;
      end if;
    end if;
  end if;

  if (select count(*) from private.platform_principals)<>1
    or (select count(*) from private.platform_principals where user_id=target_id
      and role='platform_owner' and enabled=(operation<>'revoke'))<>1
    or (select count(*) from private.platform_audit_events)<>audit_before+(case when changed then 1 else 0 end) then
    raise exception 'PLATFORM_OPERATOR_POSTCONDITION_FAILED';
  end if;
  if changed and not exists(select 1 from private.platform_audit_events
    where subject_id=target_id and actor_type='operator' and actor_id is null and action=expected_event
      and created_at>=transaction_timestamp()) then
    raise exception 'PLATFORM_OPERATOR_AUDIT_MISSING';
  end if;
  if members_before is distinct from (select md5(coalesce(jsonb_agg(to_jsonb(m) order by organization_id,user_id)::text,'[]'))
    from public.organization_members m) then raise exception 'PLATFORM_OPERATOR_MEMBERSHIP_CHANGED'; end if;
end; $operation$;

select jsonb_build_object('operation',current_setting('axia.operator.action'),
  'active_owners',(select count(*) from private.platform_principals where enabled),
  'principals',(select count(*) from private.platform_principals),
  'audit_events',(select count(*) from private.platform_audit_events)) as operator_result;
commit;
