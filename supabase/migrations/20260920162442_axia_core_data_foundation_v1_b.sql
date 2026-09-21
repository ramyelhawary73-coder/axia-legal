-- AXIA Core Data Foundation v1 - Migration B
-- Tenant-safe composite relationships, indexes, and updated_at triggers.

alter table public.clients
  add constraint clients_id_organization_key unique (id, organization_id);

alter table public.matters
  add constraint matters_id_organization_key unique (id, organization_id);

alter table public.documents
  add constraint documents_id_organization_key unique (id, organization_id);

alter table public.matters
  add constraint matters_client_tenant_fkey
    foreign key (client_id, organization_id)
    references public.clients(id, organization_id)
    on delete restrict;

alter table public.tasks
  add constraint tasks_matter_tenant_fkey
    foreign key (matter_id, organization_id)
    references public.matters(id, organization_id)
    on delete restrict;

alter table public.documents
  add constraint documents_matter_tenant_fkey
    foreign key (matter_id, organization_id)
    references public.matters(id, organization_id)
    on delete cascade;

alter table public.rajih_action_requests
  add constraint rajih_action_requests_matter_tenant_fkey
    foreign key (matter_id, organization_id)
    references public.matters(id, organization_id)
    on delete restrict;

alter table public.client_powers_of_attorney
  add constraint client_poa_client_tenant_fkey
    foreign key (client_id, organization_id)
    references public.clients(id, organization_id)
    on delete restrict,
  add constraint client_poa_document_tenant_fkey
    foreign key (document_id, organization_id)
    references public.documents(id, organization_id)
    on delete set null (document_id);

alter table public.matter_parties
  add constraint matter_parties_matter_tenant_fkey
    foreign key (matter_id, organization_id)
    references public.matters(id, organization_id)
    on delete cascade;

alter table public.hearings
  add constraint hearings_matter_tenant_fkey
    foreign key (matter_id, organization_id)
    references public.matters(id, organization_id)
    on delete cascade;

alter table public.financial_records
  add constraint financial_records_client_tenant_fkey
    foreign key (client_id, organization_id)
    references public.clients(id, organization_id)
    on delete restrict,
  add constraint financial_records_matter_tenant_fkey
    foreign key (matter_id, organization_id)
    references public.matters(id, organization_id)
    on delete restrict;

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger matters_set_updated_at
before update on public.matters
for each row execute function public.set_updated_at();

create trigger client_powers_of_attorney_set_updated_at
before update on public.client_powers_of_attorney
for each row execute function public.set_updated_at();

create trigger matter_parties_set_updated_at
before update on public.matter_parties
for each row execute function public.set_updated_at();

create trigger hearings_set_updated_at
before update on public.hearings
for each row execute function public.set_updated_at();

create trigger financial_records_set_updated_at
before update on public.financial_records
for each row execute function public.set_updated_at();

create index clients_created_by_idx on public.clients(created_by);
create index matters_client_id_idx on public.matters(client_id);
create index matters_created_by_idx on public.matters(created_by);
create index matters_status_stage_idx on public.matters(organization_id, status, stage);
create index documents_organization_id_idx on public.documents(organization_id);
create index documents_created_by_idx on public.documents(created_by);
create index matter_members_user_id_idx on public.matter_members(user_id);
create index audit_logs_organization_id_idx on public.audit_logs(organization_id) where organization_id is not null;
create index audit_logs_user_id_idx on public.audit_logs(user_id) where user_id is not null;
create index client_powers_of_attorney_org_client_idx on public.client_powers_of_attorney(organization_id, client_id);
create index client_powers_of_attorney_document_idx on public.client_powers_of_attorney(document_id) where document_id is not null;
create index client_powers_of_attorney_created_by_idx on public.client_powers_of_attorney(created_by);
create index matter_parties_org_matter_idx on public.matter_parties(organization_id, matter_id);
create index matter_parties_created_by_idx on public.matter_parties(created_by);
create index hearings_org_date_idx on public.hearings(organization_id, hearing_date, status);
create index hearings_matter_date_idx on public.hearings(matter_id, hearing_date);
create index hearings_attending_user_idx on public.hearings(attending_user_id) where attending_user_id is not null;
create index hearings_created_by_idx on public.hearings(created_by);
create index financial_records_org_status_due_idx on public.financial_records(organization_id, status, due_date);
create index financial_records_client_idx on public.financial_records(client_id) where client_id is not null;
create index financial_records_matter_idx on public.financial_records(matter_id) where matter_id is not null;
create index financial_records_created_by_idx on public.financial_records(created_by);
