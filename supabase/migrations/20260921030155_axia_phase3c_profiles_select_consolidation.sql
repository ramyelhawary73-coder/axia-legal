-- AXIA Phase 3C - Consolidate profile SELECT policies
-- Keeps the same security boundary: self OR a user sharing an organization.
-- No INSERT/UPDATE/DELETE permissions are added.

drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_select_same_org on public.profiles;
drop policy if exists profiles_select_self_or_same_org on public.profiles;

create policy profiles_select_self_or_same_org
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or exists (
    select 1
    from public.organization_members target_membership
    where target_membership.user_id = profiles.id
      and private.is_organization_member(target_membership.organization_id)
  )
);
