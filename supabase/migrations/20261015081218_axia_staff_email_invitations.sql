-- Additive staff foundation. Apply only to a verified Development target.
-- Historical migrations are not replayed or rewritten by this migration.
begin;

do $$
begin
  if to_regclass('public.organization_members') is null
     or to_regclass('public.audit_logs') is null
     or to_regprocedure('private.has_organization_role(uuid,public.app_role[])') is null
     or to_regprocedure('private.can_access_matter(uuid)') is null then
    raise exception 'AXIA_STAFF_PREREQUISITES_MISSING';
  end if;
end $$;

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  email_normalized text not null check (
    email_normalized = lower(btrim(email_normalized)) and
    length(email_normalized) <= 254 and
    email_normalized ~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$'
  ),
  role public.app_role not null check (role::text in ('admin','lawyer','staff','trainee','viewer')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_by uuid not null references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  check ((status = 'accepted' and accepted_by is not null and accepted_at is not null)
    or (status <> 'accepted' and accepted_by is null and accepted_at is null)),
  check (expires_at > created_at)
);
create unique index staff_invitation_pending_email_idx
  on public.staff_invitations(organization_id, email_normalized) where status = 'pending';
create index staff_invitation_creator_idx on public.staff_invitations(created_by, created_at);
create index staff_invitation_acceptor_idx on public.staff_invitations(accepted_by);
alter table public.staff_invitations enable row level security;
alter table public.staff_invitations force row level security;
create policy staff_invitation_manager_read on public.staff_invitations for select to authenticated
using (private.has_organization_role(organization_id, array['owner','admin']::public.app_role[]));
revoke all on public.staff_invitations from public, anon, authenticated;
grant select (id, organization_id, email_normalized, role, status, created_by,
  accepted_by, accepted_at, created_at, updated_at, expires_at)
  on public.staff_invitations to authenticated;

-- Definers stay in the unexposed schema; public API wrappers are invokers.
-- No generic membership writes are granted to authenticated or anon.
create function private.axia_staff_manage(
  p_organization_id uuid, p_action text, p_email text default null,
  p_role text default null, p_invitation_id uuid default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_role public.app_role;
  item public.staff_invitations%rowtype;
  normalized_email text := lower(btrim(p_email));
  raw_token text;
begin
  if actor is null then raise exception using errcode='42501', message='STAFF_FORBIDDEN'; end if;
  -- A consistent lock order serializes duplicate creation, rotation and acceptance.
  perform 1 from public.organizations where id=p_organization_id for update;
  select role into actor_role from public.organization_members
    where organization_id=p_organization_id and user_id=actor for share;
  if actor_role is null or actor_role::text not in ('owner','admin') then
    raise exception using errcode='42501', message='STAFF_FORBIDDEN';
  end if;
  if p_action = 'create' then
    if p_role is null or p_role not in ('admin','lawyer','staff','trainee','viewer')
       or (p_role='admin' and actor_role::text <> 'owner') then
      raise exception using errcode='42501', message='STAFF_ROLE_FORBIDDEN';
    end if;
    if normalized_email is null or length(normalized_email)>254 or
       normalized_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$' then
      raise exception using errcode='22023', message='STAFF_INVALID_EMAIL';
    end if;
    if exists(select 1 from public.organization_members m join auth.users u on u.id=m.user_id
      where m.organization_id=p_organization_id and lower(u.email)=normalized_email) then
      raise exception using errcode='23505', message='STAFF_ALREADY_MEMBER';
    end if;
    if (select count(*) from public.staff_invitations where created_by=actor
      and created_at>clock_timestamp()-interval '1 hour') >= 30 then
      raise exception using errcode='P0001', message='STAFF_RATE_LIMIT';
    end if;
    raw_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
    insert into public.staff_invitations(organization_id,email_normalized,role,token_hash,created_by)
      values(p_organization_id,normalized_email,p_role::public.app_role,
        encode(sha256(convert_to(raw_token,'UTF8')),'hex'),actor) returning * into item;
  elsif p_action in ('rotate','revoke') then
    select * into item from public.staff_invitations
      where id=p_invitation_id and organization_id=p_organization_id for update;
    if item.id is null or item.status<>'pending' then
      raise exception using errcode='22023', message='STAFF_INVITATION_UNAVAILABLE';
    end if;
    if item.role::text='admin' and actor_role::text<>'owner' then
      raise exception using errcode='42501', message='STAFF_ROLE_FORBIDDEN';
    end if;
    if p_action='rotate' then
      if item.updated_at>clock_timestamp()-interval '1 minute' then
        raise exception using errcode='P0001', message='STAFF_RATE_LIMIT';
      end if;
      raw_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
      update public.staff_invitations set token_hash=encode(sha256(convert_to(raw_token,'UTF8')),'hex'),
        created_by=actor, expires_at=clock_timestamp()+interval '7 days', updated_at=clock_timestamp()
        where id=item.id returning * into item;
    else
      update public.staff_invitations set status='revoked', updated_at=clock_timestamp()
        where id=item.id returning * into item;
    end if;
  else
    raise exception using errcode='22023', message='STAFF_INVALID_ACTION';
  end if;
  insert into public.audit_logs(organization_id,user_id,action,resource_type,resource_id,metadata)
    values(p_organization_id,actor,'staff_invitation.'||p_action,'staff_invitation',item.id,
      jsonb_build_object('role',item.role));
  return jsonb_build_object('id',item.id,'token',raw_token,'expiresAt',item.expires_at);
end $$;

create function private.axia_staff_accept(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  verified_email text;
  item public.staff_invitations%rowtype;
  inviter_role public.app_role;
  inserted_members integer;
  target_org uuid;
begin
  if actor is null or p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode='42501', message='STAFF_INVITATION_UNAVAILABLE';
  end if;
  select lower(email) into verified_email from auth.users where id=actor
    and email_confirmed_at is not null and not coalesce(is_anonymous,false)
    and (banned_until is null or banned_until<clock_timestamp()) for update;
  if verified_email is null then
    raise exception using errcode='42501', message='STAFF_VERIFIED_EMAIL_REQUIRED';
  end if;
  select organization_id into target_org from public.staff_invitations
    where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
  perform 1 from public.organizations where id=target_org for update;
  select * into item from public.staff_invitations
    where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') for update;
  if item.id is null or item.email_normalized<>verified_email then
    raise exception using errcode='42501', message='STAFF_INVITATION_UNAVAILABLE';
  end if;
  if item.status='accepted' and item.accepted_by=actor then
    if not exists(select 1 from public.organization_members
      where organization_id=item.organization_id and user_id=actor) then
      raise exception using errcode='42501', message='STAFF_INVITATION_UNAVAILABLE';
    end if;
    return jsonb_build_object('organizationId',item.organization_id,'alreadyAccepted',true);
  end if;
  if item.status<>'pending' or item.expires_at<=clock_timestamp() then
    raise exception using errcode='42501', message='STAFF_INVITATION_UNAVAILABLE';
  end if;
  select role into inviter_role from public.organization_members
    where organization_id=item.organization_id and user_id=item.created_by for share;
  if inviter_role is null or inviter_role::text not in ('owner','admin') or
     (item.role::text='admin' and inviter_role::text<>'owner') then
    raise exception using errcode='42501', message='STAFF_INVITER_NO_LONGER_AUTHORIZED';
  end if;
  -- First-client scope: one office per recipient. Never silently choose a second office.
  if exists(select 1 from public.organization_members where user_id=actor
    and organization_id<>item.organization_id) then
    raise exception using errcode='42501', message='STAFF_WORKSPACE_CONFLICT';
  end if;
  insert into public.profiles(id) values(actor) on conflict(id) do nothing;
  insert into public.organization_members(organization_id,user_id,role)
    values(item.organization_id,actor,item.role) on conflict(organization_id,user_id) do nothing;
  get diagnostics inserted_members = row_count;
  -- Existing members keep their current role; invitations never perform promotions.
  update public.staff_invitations set status='accepted',accepted_by=actor,
    accepted_at=clock_timestamp(),updated_at=clock_timestamp() where id=item.id;
  insert into public.audit_logs(organization_id,user_id,action,resource_type,resource_id,metadata)
    values(item.organization_id,actor,'staff_invitation.accept','staff_invitation',item.id,
      jsonb_build_object('membershipCreated',inserted_members=1));
  return jsonb_build_object('organizationId',item.organization_id,'alreadyAccepted',false);
end $$;

create function public.axia_staff_manage(p_organization_id uuid, p_action text,
  p_email text default null, p_role text default null, p_invitation_id uuid default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.axia_staff_manage(p_organization_id,p_action,p_email,p_role,p_invitation_id);
$$;
create function public.axia_staff_accept(p_token text)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.axia_staff_accept(p_token);
$$;
create function public.axia_staff_capabilities(p_organization_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('version',1,'canInvite',
    private.has_organization_role(p_organization_id,array['owner','admin']::public.app_role[]));
$$;
revoke all on function private.axia_staff_manage(uuid,text,text,text,uuid),
  private.axia_staff_accept(text), public.axia_staff_manage(uuid,text,text,text,uuid),
  public.axia_staff_accept(text),public.axia_staff_capabilities(uuid) from public, anon, authenticated;
grant execute on function private.axia_staff_manage(uuid,text,text,text,uuid),
  private.axia_staff_accept(text), public.axia_staff_manage(uuid,text,text,text,uuid),
  public.axia_staff_accept(text),public.axia_staff_capabilities(uuid) to authenticated;
grant usage on schema private to authenticated;

-- Covers direct Data API writes, not only the Next.js routes. Assignment never grants case access.
create function private.axia_validate_task_assignee()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_role public.app_role;
  target_role public.app_role;
  assignment_changed boolean;
begin
  if actor is null then raise exception using errcode='42501',message='TASK_ASSIGNMENT_FORBIDDEN'; end if;
  select role into actor_role from public.organization_members
    where organization_id=new.organization_id and user_id=actor for share;
  assignment_changed := tg_op='INSERT';
  if tg_op='UPDATE' then
    assignment_changed := old.assigned_to is distinct from new.assigned_to
      or old.matter_id is distinct from new.matter_id or old.organization_id is distinct from new.organization_id;
  end if;
  if assignment_changed and (actor_role is null or
    (tg_op='UPDATE' and actor_role::text not in ('owner','admin','lawyer')) or
    (new.assigned_to is distinct from actor and actor_role::text not in ('owner','admin','lawyer'))) then
    raise exception using errcode='42501',message='TASK_ASSIGNMENT_FORBIDDEN';
  end if;
  if new.assigned_to is null then return new; end if;
  select role into target_role from public.organization_members
    where organization_id=new.organization_id and user_id=new.assigned_to for share;
  if target_role is null or target_role::text='viewer' then
    raise exception using errcode='42501',message='TASK_ASSIGNEE_UNAVAILABLE';
  end if;
  if new.matter_id is not null and not exists (
    select 1 from public.matters m where m.id=new.matter_id and m.organization_id=new.organization_id
      and (target_role::text in ('owner','admin','lawyer') or exists (
        select 1 from public.matter_members mm where mm.matter_id=m.id and mm.user_id=new.assigned_to
      ))
  ) then raise exception using errcode='42501',message='TASK_ASSIGNEE_MATTER_FORBIDDEN'; end if;
  return new;
end $$;
revoke all on function private.axia_validate_task_assignee() from public, anon, authenticated;
create trigger axia_task_assignee_guard before insert or update on public.tasks
for each row execute function private.axia_validate_task_assignee();

commit;
