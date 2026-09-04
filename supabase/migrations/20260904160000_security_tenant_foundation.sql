-- AXIA Legal Phase 1B — Security & Tenant Foundation
-- Scope: profiles, organizations, organization membership, RLS, safe onboarding RPC.

create extension if not exists pgcrypto;

create type public.app_role as enum ('owner', 'admin', 'lawyer', 'staff', 'trainee', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 2 and 64),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members(user_id);
create index organization_members_organization_id_role_idx on public.organization_members(organization_id, role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_organization_role(
  target_organization_id uuid,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function public.create_organization(organization_name text, organization_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  new_organization_id uuid;
  normalized_name text := trim(organization_name);
  normalized_slug text := lower(trim(organization_slug));
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if char_length(normalized_name) < 2 or char_length(normalized_name) > 120 then
    raise exception 'invalid organization name' using errcode = '22023';
  end if;

  if normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or char_length(normalized_slug) < 2 or char_length(normalized_slug) > 64 then
    raise exception 'invalid organization slug' using errcode = '22023';
  end if;

  insert into public.organizations (name, slug, created_by)
  values (normalized_name, normalized_slug, actor_id)
  returning id into new_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization_id, actor_id, 'owner');

  return new_organization_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

alter table public.profiles force row level security;
alter table public.organizations force row level security;
alter table public.organization_members force row level security;

create policy profiles_select_self
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy organizations_select_member
on public.organizations
for select
to authenticated
using (public.is_organization_member(id));

create policy organizations_update_owner_admin
on public.organizations
for update
to authenticated
using (public.has_organization_role(id, array['owner', 'admin']::public.app_role[]))
with check (public.has_organization_role(id, array['owner', 'admin']::public.app_role[]));

create policy organization_members_select_same_org
on public.organization_members
for select
to authenticated
using (public.is_organization_member(organization_id));

revoke all on public.profiles from anon, authenticated;
revoke all on public.organizations from anon, authenticated;
revoke all on public.organization_members from anon, authenticated;

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.has_organization_role(uuid, public.app_role[]) from public;
revoke all on function public.create_organization(text, text) from public;

revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;

grant select, update (full_name) on public.profiles to authenticated;
grant select, update (name, slug) on public.organizations to authenticated;
grant select on public.organization_members to authenticated;

grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.has_organization_role(uuid, public.app_role[]) to authenticated;
grant execute on function public.create_organization(text, text) to authenticated;

comment on table public.profiles is 'Private authenticated user profile. Phase 1B exposes only the current user profile.';
comment on table public.organizations is 'Tenant root. Browser creation is allowed only through create_organization().' ;
comment on table public.organization_members is 'Tenant membership and role assignment. Direct browser mutation is intentionally disabled in Phase 1B.';
