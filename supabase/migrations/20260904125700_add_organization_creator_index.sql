-- AXIA Legal Phase 1B — cover tenant creator foreign key for predictable lookups/deletes.
create index organizations_created_by_idx on public.organizations(created_by);
