-- Isolated test scaffold matching the live prerequisite contracts, not a historical replay.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema private;
grant usage on schema public,auth,private to authenticated;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,
  is_anonymous boolean default false,banned_until timestamptz);
create type public.app_role as enum('owner','admin','lawyer','staff','trainee','viewer');
create table public.profiles(id uuid primary key references auth.users(id),full_name text);
create table public.organizations(id uuid primary key,name text not null);
create table public.organization_members(organization_id uuid references public.organizations(id),
  user_id uuid references auth.users(id),role public.app_role,created_at timestamptz default now(),
  primary key(organization_id,user_id));
create table public.matters(id uuid primary key,organization_id uuid references public.organizations(id));
create table public.matter_members(matter_id uuid references public.matters(id),user_id uuid references auth.users(id),
  primary key(matter_id,user_id));
create table public.tasks(id uuid primary key default gen_random_uuid(),organization_id uuid references public.organizations(id),
  matter_id uuid references public.matters(id),assigned_to uuid references auth.users(id),
  created_by uuid references auth.users(id),title text);
create table public.audit_logs(id uuid primary key default gen_random_uuid(),organization_id uuid,user_id uuid,
  action text,resource_type text,resource_id uuid,metadata jsonb);
create function private.is_organization_member(target_organization_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.organization_members where organization_id=target_organization_id and user_id=auth.uid());
$$;
create function private.has_organization_role(target_organization_id uuid,allowed_roles public.app_role[]) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.organization_members where organization_id=target_organization_id
    and user_id=auth.uid() and role=any(allowed_roles));
$$;
create function private.can_access_matter(target_matter uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.matters m join public.organization_members om
    on om.organization_id=m.organization_id and om.user_id=auth.uid()
    left join public.matter_members mm on mm.matter_id=m.id and mm.user_id=auth.uid()
    where m.id=target_matter and (om.role::text in ('owner','admin','lawyer') or mm.user_id is not null));
$$;
alter table public.organization_members enable row level security;
alter table public.organization_members force row level security;
create policy members_read on public.organization_members for select to authenticated using(private.is_organization_member(organization_id));
grant select on public.organization_members to authenticated;
alter table public.tasks enable row level security;
create policy tasks_insert on public.tasks for insert to authenticated with check (
  created_by=auth.uid() and private.has_organization_role(organization_id,array['owner','admin','lawyer','staff','trainee']::public.app_role[])
  and (matter_id is null or exists(select 1 from public.matters m where m.id=tasks.matter_id and m.organization_id=tasks.organization_id))
  and (assigned_to is null or exists(select 1 from public.organization_members om where om.organization_id=tasks.organization_id and om.user_id=tasks.assigned_to)));
grant select,insert,update on public.tasks to authenticated;
create policy tasks_read on public.tasks for select to authenticated using(
  private.is_organization_member(organization_id) and (matter_id is null or private.can_access_matter(matter_id)));
create policy tasks_update on public.tasks for update to authenticated
using(private.has_organization_role(organization_id,array['owner','admin','lawyer','staff','trainee']::public.app_role[]))
with check(private.has_organization_role(organization_id,array['owner','admin','lawyer','staff','trainee']::public.app_role[]));
alter table public.matters enable row level security;
create policy matters_read on public.matters for select to authenticated using(private.can_access_matter(id));
grant select on public.matters,public.matter_members to authenticated;
