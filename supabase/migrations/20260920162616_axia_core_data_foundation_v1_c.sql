-- AXIA Core Data Foundation v1 - Migration C
-- Private matter access helpers, least-privilege grants, and RLS matrix.

grant usage on schema private to authenticated;

create or replace function private.can_access_matter(target_matter uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.matters m
    join public.organization_members om
      on om.organization_id = m.organization_id
     and om.user_id = (select auth.uid())
    left join public.matter_members mm
      on mm.matter_id = m.id
     and mm.user_id = (select auth.uid())
    where m.id = target_matter
      and (
        om.role = any(array['owner','admin','lawyer']::public.app_role[])
        or mm.user_id is not null
      )
  );
$function$;

create or replace function private.can_write_matter(target_matter uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.matters m
    join public.organization_members om
      on om.organization_id = m.organization_id
     and om.user_id = (select auth.uid())
    left join public.matter_members mm
      on mm.matter_id = m.id
     and mm.user_id = (select auth.uid())
    where m.id = target_matter
      and (
        om.role = any(array['owner','admin','lawyer']::public.app_role[])
        or mm.access_level in ('write','manage')
      )
  );
$function$;

revoke all on function private.can_access_matter(uuid) from public, anon;
revoke all on function private.can_write_matter(uuid) from public, anon;
grant execute on function private.can_access_matter(uuid) to authenticated;
grant execute on function private.can_write_matter(uuid) to authenticated;

drop policy if exists rajih_clients_select on public.clients;
drop policy if exists rajih_matters_select on public.matters;
drop policy if exists matters_insert_authorized on public.matters;
drop policy if exists rajih_matter_members_select on public.matter_members;
drop policy if exists rajih_documents_select on public.documents;

revoke all on table public.clients from anon, authenticated;
grant select, insert on table public.clients to authenticated;
grant update (name,type,national_id_or_cr,phone,email,address,notes,status,updated_at) on table public.clients to authenticated;

create policy clients_select_member on public.clients for select to authenticated
using (private.is_organization_member(organization_id));

create policy clients_insert_authorized on public.clients for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer','staff']::public.app_role[]
  )
);

create policy clients_update_authorized on public.clients for update to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer','staff']::public.app_role[]
  )
)
with check (
  private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer','staff']::public.app_role[]
  )
);

revoke all on table public.client_powers_of_attorney from anon, authenticated;
grant select, insert on table public.client_powers_of_attorney to authenticated;
grant update (poa_number,poa_year,notary_office,issued_at,expires_at,scope,status,document_id,notes,updated_at)
on table public.client_powers_of_attorney to authenticated;

create policy client_poa_select_member on public.client_powers_of_attorney for select to authenticated
using (private.is_organization_member(organization_id));

create policy client_poa_insert_authorized on public.client_powers_of_attorney for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer','staff']::public.app_role[]
  )
  and exists (
    select 1 from public.clients c
    where c.id = client_powers_of_attorney.client_id
      and c.organization_id = client_powers_of_attorney.organization_id
  )
  and (
    document_id is null
    or exists (
      select 1 from public.documents d
      where d.id = client_powers_of_attorney.document_id
        and d.organization_id = client_powers_of_attorney.organization_id
    )
  )
);

create policy client_poa_update_authorized on public.client_powers_of_attorney for update to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer','staff']::public.app_role[]
  )
)
with check (
  private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer','staff']::public.app_role[]
  )
  and (
    document_id is null
    or exists (
      select 1 from public.documents d
      where d.id = client_powers_of_attorney.document_id
        and d.organization_id = client_powers_of_attorney.organization_id
    )
  )
);

revoke all on table public.matters from anon, authenticated;
grant select, insert on table public.matters to authenticated;
grant update (
  client_id,case_number,title,court,category,status,case_year,circuit,stage,
  client_role,filing_date,claim_amount,currency,notes,closed_at,updated_at
) on table public.matters to authenticated;

create policy matters_select_authorized on public.matters for select to authenticated
using (private.can_access_matter(id));

create policy matters_insert_authorized on public.matters for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer']::public.app_role[]
  )
  and exists (
    select 1 from public.clients c
    where c.id = matters.client_id and c.organization_id = matters.organization_id
  )
);

create policy matters_update_authorized on public.matters for update to authenticated
using (private.can_write_matter(id))
with check (
  private.can_write_matter(id)
  and exists (
    select 1 from public.clients c
    where c.id = matters.client_id and c.organization_id = matters.organization_id
  )
);

revoke all on table public.matter_members from anon, authenticated;
grant select, insert on table public.matter_members to authenticated;
grant update (access_level) on table public.matter_members to authenticated;

create policy matter_members_select_authorized on public.matter_members for select to authenticated
using (private.can_access_matter(matter_id));

create policy matter_members_insert_authorized on public.matter_members for insert to authenticated
with check (
  exists (
    select 1 from public.matters m
    where m.id = matter_members.matter_id
      and private.has_organization_role(
        m.organization_id,
        array['owner','admin','lawyer']::public.app_role[]
      )
  )
  and exists (
    select 1
    from public.matters m
    join public.organization_members om on om.organization_id = m.organization_id
    where m.id = matter_members.matter_id and om.user_id = matter_members.user_id
  )
);

create policy matter_members_update_authorized on public.matter_members for update to authenticated
using (
  exists (
    select 1 from public.matters m
    where m.id = matter_members.matter_id
      and private.has_organization_role(
        m.organization_id,
        array['owner','admin','lawyer']::public.app_role[]
      )
  )
)
with check (
  exists (
    select 1 from public.matters m
    where m.id = matter_members.matter_id
      and private.has_organization_role(
        m.organization_id,
        array['owner','admin','lawyer']::public.app_role[]
      )
  )
);

revoke all on table public.documents from anon, authenticated;
grant select on table public.documents to authenticated;

create policy documents_select_authorized on public.documents for select to authenticated
using (
  (matter_id is null and private.is_organization_member(organization_id))
  or (matter_id is not null and private.can_access_matter(matter_id))
);

revoke all on table public.matter_parties from anon, authenticated;
grant select, insert on table public.matter_parties to authenticated;
grant update (
  party_type,name,legal_role,national_id_or_cr,phone,email,address,
  representative_name,representative_contact,notes,updated_at
) on table public.matter_parties to authenticated;

create policy matter_parties_select_authorized on public.matter_parties for select to authenticated
using (private.can_access_matter(matter_id));

create policy matter_parties_insert_authorized on public.matter_parties for insert to authenticated
with check (created_by = (select auth.uid()) and private.can_write_matter(matter_id));

create policy matter_parties_update_authorized on public.matter_parties for update to authenticated
using (private.can_write_matter(matter_id))
with check (private.can_write_matter(matter_id));

revoke all on table public.hearings from anon, authenticated;
grant select, insert on table public.hearings to authenticated;
grant update (
  hearing_date,hearing_time,court,circuit,hall,roll_number,purpose,last_decision,
  attending_user_id,status,pleading_notes,is_archived,updated_at
) on table public.hearings to authenticated;

create policy hearings_select_authorized on public.hearings for select to authenticated
using (private.can_access_matter(matter_id));

create policy hearings_insert_authorized on public.hearings for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.can_write_matter(matter_id)
  and (
    attending_user_id is null
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = hearings.organization_id
        and om.user_id = hearings.attending_user_id
    )
  )
);

create policy hearings_update_authorized on public.hearings for update to authenticated
using (private.can_write_matter(matter_id))
with check (
  private.can_write_matter(matter_id)
  and (
    attending_user_id is null
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = hearings.organization_id
        and om.user_id = hearings.attending_user_id
    )
  )
);

revoke all on table public.financial_records from anon, authenticated;
grant select, insert on table public.financial_records to authenticated;
grant update (
  client_id,matter_id,record_type,direction,amount,currency,status,due_date,
  occurred_at,receipt_number,notes,updated_at
) on table public.financial_records to authenticated;

create policy financial_records_select_authorized on public.financial_records for select to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner','admin']::public.app_role[]
  )
);

create policy financial_records_insert_authorized on public.financial_records for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner','admin']::public.app_role[]
  )
  and (
    client_id is null
    or exists (
      select 1 from public.clients c
      where c.id = financial_records.client_id
        and c.organization_id = financial_records.organization_id
    )
  )
  and (
    matter_id is null
    or exists (
      select 1 from public.matters m
      where m.id = financial_records.matter_id
        and m.organization_id = financial_records.organization_id
    )
  )
);

create policy financial_records_update_authorized on public.financial_records for update to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner','admin']::public.app_role[]
  )
)
with check (
  private.has_organization_role(
    organization_id,
    array['owner','admin']::public.app_role[]
  )
  and (
    client_id is null
    or exists (
      select 1 from public.clients c
      where c.id = financial_records.client_id
        and c.organization_id = financial_records.organization_id
    )
  )
  and (
    matter_id is null
    or exists (
      select 1 from public.matters m
      where m.id = financial_records.matter_id
        and m.organization_id = financial_records.organization_id
    )
  )
);

revoke all on table public.tasks from anon;
revoke all on table public.audit_logs from anon;
revoke all on table public.rajih_action_requests from anon;

drop function public.rajih_can_access_matter(uuid);
