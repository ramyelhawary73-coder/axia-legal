-- AXIA Legal Phase 1B — harden SECURITY DEFINER exposure.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

drop policy if exists organizations_select_member on public.organizations;
drop policy if exists organizations_update_owner_admin on public.organizations;
drop policy if exists organization_members_select_same_org on public.organization_members;

drop function if exists public.is_organization_member(uuid);
drop function if exists public.has_organization_role(uuid, public.app_role[]);
drop function if exists public.create_organization(text, text);

create or replace function private.is_organization_member(target_organization_id uuid)
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

create or replace function private.has_organization_role(
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

create or replace function private.add_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger organizations_add_owner
after insert on public.organizations
for each row execute function private.add_organization_owner();

create policy organizations_select_member
on public.organizations
for select
to authenticated
using (private.is_organization_member(id));

create policy organizations_insert_self
on public.organizations
for insert
to authenticated
with check ((select auth.uid()) = created_by);

create policy organizations_update_owner_admin
on public.organizations
for update
to authenticated
using (private.has_organization_role(id, array['owner', 'admin']::public.app_role[]))
with check (private.has_organization_role(id, array['owner', 'admin']::public.app_role[]));

create policy organization_members_select_same_org
on public.organization_members
for select
to authenticated
using (private.is_organization_member(organization_id));

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function private.is_organization_member(uuid) from public, anon, authenticated;
revoke all on function private.has_organization_role(uuid, public.app_role[]) from public, anon, authenticated;
revoke all on function private.add_organization_owner() from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.has_organization_role(uuid, public.app_role[]) to authenticated;

grant insert (name, slug, created_by) on public.organizations to authenticated;
