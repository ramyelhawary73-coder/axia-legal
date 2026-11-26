-- D1 source only. DO NOT apply to hosted Supabase without separate approval.
-- No real principal seed, tenant policy/helper changes, or membership writes.
do $$ begin
  if to_regclass('public.organization_members') is null
     or to_regclass('auth.sessions') is null
     or to_regclass('auth.mfa_factors') is null
     or not exists(select 1 from information_schema.columns where table_schema='auth' and table_name='sessions' and column_name='factor_id')
  then raise exception 'PLATFORM_PREREQUISITES_MISSING'; end if;
end $$;

create table private.platform_principals (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role text not null default 'platform_owner' check (role='platform_owner'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (enabled = (revoked_at is null))
);
create unique index platform_single_active_owner on private.platform_principals(role) where enabled;

create table private.platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_type text not null check(actor_type in ('user','operator')),
  subject_id uuid,
  action text not null check(action in ('platform.owner.bootstrap','platform.owner.revoked','platform.owner.restored','platform.offices.read','platform.audit.read')),
  created_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null default gen_random_uuid(),
  check ((actor_type='operator' and actor_id is null) or (actor_type='user' and actor_id is not null))
);
create index platform_audit_recent on private.platform_audit_events(created_at desc,id desc);
create index platform_audit_actor_recent on private.platform_audit_events(actor_id,created_at desc);
alter table private.platform_principals enable row level security;
alter table private.platform_principals force row level security;
alter table private.platform_audit_events enable row level security;
alter table private.platform_audit_events force row level security;
revoke all on private.platform_principals,private.platform_audit_events from public,anon,authenticated;

create function private.axia_platform_principal_guard() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op in ('DELETE','TRUNCATE') then raise exception using errcode='42501',message='PLATFORM_PRINCIPAL_DELETE_FORBIDDEN'; end if;
  if tg_op='UPDATE' and (new.user_id<>old.user_id or new.created_at is distinct from old.created_at
    or (new.enabled=old.enabled and new.revoked_at is distinct from old.revoked_at)) then
    raise exception using errcode='42501',message='PLATFORM_IDENTITY_IMMUTABLE';
  end if;
  if new.enabled and not exists(select 1 from auth.users where id=new.user_id
    and email_confirmed_at is not null and not coalesce(is_anonymous,false)
    and (banned_until is null or banned_until<clock_timestamp())) then
    raise exception using errcode='42501',message='PLATFORM_VERIFIED_IDENTITY_REQUIRED';
  end if;
  return new;
end $$;
create trigger platform_principal_guard before insert or update or delete on private.platform_principals
for each row execute function private.axia_platform_principal_guard();
create trigger platform_principal_no_truncate before truncate on private.platform_principals
for each statement execute function private.axia_platform_principal_guard();

create function private.axia_platform_principal_audit() returns trigger
language plpgsql security definer set search_path='' as $$
declare event_action text;
begin
  if tg_op='INSERT' then event_action:='platform.owner.bootstrap';
  elsif new.enabled is distinct from old.enabled then
    event_action:=case when new.enabled then 'platform.owner.restored' else 'platform.owner.revoked' end;
  else return new; end if;
  insert into private.platform_audit_events(actor_id,actor_type,subject_id,action)
    values(auth.uid(),case when auth.uid() is null then 'operator' else 'user' end,new.user_id,event_action);
  return new;
end $$;
create trigger platform_principal_audit after insert or update on private.platform_principals
for each row execute function private.axia_platform_principal_audit();

create function private.axia_platform_audit_immutable() returns trigger
language plpgsql set search_path='' as $$
begin raise exception using errcode='42501',message='PLATFORM_AUDIT_IMMUTABLE'; end $$;
create trigger platform_audit_immutable before update or delete on private.platform_audit_events
for each row execute function private.axia_platform_audit_immutable();
create trigger platform_audit_no_truncate before truncate on private.platform_audit_events
for each statement execute function private.axia_platform_audit_immutable();

create function private.axia_platform_context() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); session_text text:=auth.jwt()->>'session_id';
  session_aal text; session_factor uuid;
begin
  if actor is null then return jsonb_build_object('version',1,'state','forbidden'); end if;
  -- Hold the principal until the caller's transaction ends; revocation is serialized.
  perform 1 from private.platform_principals where user_id=actor and enabled for share;
  if not found then return jsonb_build_object('version',1,'state','forbidden'); end if;
  perform 1 from auth.users where id=actor and email_confirmed_at is not null
    and not coalesce(is_anonymous,false) and (banned_until is null or banned_until<clock_timestamp()) for share;
  if not found or session_text is null or session_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('version',1,'state','forbidden');
  end if;
  select aal::text,factor_id into session_aal,session_factor from auth.sessions
    where id=session_text::uuid and user_id=actor and (not_after is null or not_after>clock_timestamp()) for share;
  if not found then return jsonb_build_object('version',1,'state','forbidden'); end if;
  if auth.jwt()->>'aal' is distinct from 'aal2' or session_aal is distinct from 'aal2'
     or not exists(select 1 from auth.mfa_factors where id=session_factor and user_id=actor and status='verified' and factor_type='totp') then
    return jsonb_build_object('version',1,'state','mfa_required','userId',actor);
  end if;
  return jsonb_build_object('version',1,'state','ready','userId',actor);
end $$;

create function private.axia_platform_read(p_kind text,p_limit integer,p_after_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare context jsonb; result jsonb; cursor_time timestamptz;
begin
  context:=private.axia_platform_context();
  if context->>'state'<>'ready' then raise exception using errcode='42501',message='PLATFORM_FORBIDDEN'; end if;
  if p_kind is null or p_kind not in ('offices','audit') or p_limit is null or p_limit<1 or p_limit>50 then
    raise exception using errcode='22023',message='PLATFORM_INVALID_PAGE';
  end if;
  if (select count(*) from private.platform_audit_events where actor_id=auth.uid() and created_at>clock_timestamp()-interval '1 minute')>=120 then
    raise exception using errcode='P0001',message='PLATFORM_RATE_LIMIT';
  end if;
  if p_kind='offices' then
    if p_after_id is not null and not exists(select 1 from public.organizations where id=p_after_id) then
      raise exception using errcode='22023',message='PLATFORM_INVALID_CURSOR';
    end if;
    with candidates as (
      select id,name,slug,created_at as "createdAt" from public.organizations
      where p_after_id is null or id>p_after_id order by id limit p_limit+1
    ), page as (select * from candidates order by id limit p_limit)
    select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(p) order by p.id) from page p),'[]'::jsonb),
      'nextCursor',case when (select count(*) from candidates)>p_limit then (select id from page order by id desc limit 1) else null end) into result;
  else
    if p_after_id is not null then
      select created_at into cursor_time from private.platform_audit_events where id=p_after_id;
      if not found then raise exception using errcode='22023',message='PLATFORM_INVALID_CURSOR'; end if;
    end if;
    with candidates as (
      select id,actor_id as "actorId",actor_type as "actorType",subject_id as "subjectId",action,created_at as "createdAt"
      from private.platform_audit_events
      where p_after_id is null or (created_at,id)<(cursor_time,p_after_id)
      order by created_at desc,id desc limit p_limit+1
    ), page as (select * from candidates order by "createdAt" desc,id desc limit p_limit)
    select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(p) order by p."createdAt" desc,p.id desc) from page p),'[]'::jsonb),
      'nextCursor',case when (select count(*) from candidates)>p_limit then (select id from page order by "createdAt",id limit 1) else null end) into result;
  end if;
  insert into private.platform_audit_events(actor_id,actor_type,action)
    values(auth.uid(),'user',case p_kind when 'offices' then 'platform.offices.read' else 'platform.audit.read' end);
  return result;
end $$;

create function public.axia_platform_context() returns jsonb language sql security invoker set search_path=''
as $$ select private.axia_platform_context(); $$;
create function public.axia_platform_offices(p_limit integer default 20,p_after_id uuid default null) returns jsonb
language sql security invoker set search_path='' as $$ select private.axia_platform_read('offices',p_limit,p_after_id); $$;
create function public.axia_platform_audit(p_limit integer default 20,p_after_id uuid default null) returns jsonb
language sql security invoker set search_path='' as $$ select private.axia_platform_read('audit',p_limit,p_after_id); $$;

revoke all on function private.axia_platform_principal_guard(),private.axia_platform_principal_audit(),private.axia_platform_audit_immutable(),
  private.axia_platform_context(),private.axia_platform_read(text,integer,uuid),
  public.axia_platform_context(),public.axia_platform_offices(integer,uuid),public.axia_platform_audit(integer,uuid) from public,anon,authenticated;
grant execute on function private.axia_platform_context(),private.axia_platform_read(text,integer,uuid),
  public.axia_platform_context(),public.axia_platform_offices(integer,uuid),public.axia_platform_audit(integer,uuid) to authenticated;
-- Existing foundation already grants USAGE on private to authenticated. No table grants.
