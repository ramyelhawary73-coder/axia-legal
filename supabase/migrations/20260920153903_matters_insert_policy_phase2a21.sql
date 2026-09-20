create policy matters_insert_authorized
on public.matters
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer']::public.app_role[]
  )
  and exists (
    select 1
    from public.clients c
    where c.id = matters.client_id
      and c.organization_id = matters.organization_id
  )
);
