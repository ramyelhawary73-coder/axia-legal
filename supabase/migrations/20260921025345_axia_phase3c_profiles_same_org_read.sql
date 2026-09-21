-- AXIA Phase 3C - Same-organization profile read
-- Allows authenticated organization members to read basic profiles of users
-- who share at least one organization. No write/delete permissions are added.

drop policy if exists profiles_select_same_org on public.profiles;

create policy profiles_select_same_org
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members target_membership
    where target_membership.user_id = profiles.id
      and private.is_organization_member(target_membership.organization_id)
  )
);
