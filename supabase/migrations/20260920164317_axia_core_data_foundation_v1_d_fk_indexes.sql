-- AXIA Core Data Foundation v1 - Migration D
-- Covering indexes for tenant-safe composite foreign keys.

create index client_poa_client_tenant_idx
  on public.client_powers_of_attorney(client_id, organization_id);

create index client_poa_document_tenant_idx
  on public.client_powers_of_attorney(document_id, organization_id);

create index documents_matter_tenant_idx
  on public.documents(matter_id, organization_id);

create index financial_records_client_tenant_idx
  on public.financial_records(client_id, organization_id);

create index financial_records_matter_tenant_idx
  on public.financial_records(matter_id, organization_id);

create index hearings_matter_tenant_idx
  on public.hearings(matter_id, organization_id);

create index matter_parties_matter_tenant_idx
  on public.matter_parties(matter_id, organization_id);

create index matters_client_tenant_idx
  on public.matters(client_id, organization_id);

create index rajih_action_requests_matter_tenant_idx
  on public.rajih_action_requests(matter_id, organization_id);

create index tasks_matter_tenant_idx
  on public.tasks(matter_id, organization_id);
