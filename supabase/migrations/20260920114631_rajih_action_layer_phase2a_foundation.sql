-- RAJIH Action Layer Phase 2A.1
-- Persistent tasks + approval foundation + audit hardening.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  matter_id uuid null references public.matters(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 500),
  category text not null check (char_length(btrim(category)) between 1 and 120),
  court_or_office text null check (court_or_office is null or char_length(btrim(court_or_office)) <= 240),
  assigned_to uuid null references auth.users(id) on delete set null,
  deadline date not null,
  priority text not null default 'normal'
    check (priority in ('critical', 'urgent', 'normal')),
  status text not null default 'in_progress'
    check (status in ('pending', 'in_progress', 'completed', 'on_hold')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_organization_id_idx on public.tasks(organization_id);
create index tasks_matter_id_idx on public.tasks(matter_id) where matter_id is not null;
create index tasks_assigned_to_idx on public.tasks(assigned_to) where assigned_to is not null;
create index tasks_deadline_status_idx on public.tasks(deadline, status);

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

revoke all on table public.tasks from anon, authenticated;
grant select, insert on table public.tasks to authenticated;
grant update (
  matter_id,
  title,
  category,
  court_or_office,
  assigned_to,
  deadline,
  priority,
  status,
  updated_at
) on table public.tasks to authenticated;

create policy tasks_select_authorized
on public.tasks
for select
to authenticated
using (
  private.is_organization_member(organization_id)
  and (
    matter_id is null
    or exists (
      select 1
      from public.matters m
      where m.id = tasks.matter_id
        and m.organization_id = tasks.organization_id
    )
  )
);

create policy tasks_insert_authorized
on public.tasks
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer','staff','trainee']::public.app_role[]
  )
  and (
    matter_id is null
    or exists (
      select 1
      from public.matters m
      where m.id = tasks.matter_id
        and m.organization_id = tasks.organization_id
    )
  )
  and (
    assigned_to is null
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = tasks.organization_id
        and om.user_id = tasks.assigned_to
    )
  )
);

create policy tasks_update_authorized
on public.tasks
for update
to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer','staff','trainee']::public.app_role[]
  )
  and (
    matter_id is null
    or exists (
      select 1
      from public.matters m
      where m.id = tasks.matter_id
        and m.organization_id = tasks.organization_id
    )
  )
)
with check (
  private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer','staff','trainee']::public.app_role[]
  )
  and (
    matter_id is null
    or exists (
      select 1
      from public.matters m
      where m.id = tasks.matter_id
        and m.organization_id = tasks.organization_id
    )
  )
  and (
    assigned_to is null
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = tasks.organization_id
        and om.user_id = tasks.assigned_to
    )
  )
);

create table public.rajih_action_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  matter_id uuid null references public.matters(id) on delete restrict,
  action_type text not null
    check (action_type in ('create_task', 'update_task_status')),
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  status text not null default 'proposed'
    check (status in ('proposed', 'approved', 'rejected', 'executed', 'failed', 'expired')),
  idempotency_key uuid not null default gen_random_uuid() unique,
  approved_by uuid null references auth.users(id) on delete restrict,
  approved_at timestamptz null,
  executed_at timestamptz null,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rajih_action_requests_org_status_idx
  on public.rajih_action_requests(organization_id, status, created_at desc);
create index rajih_action_requests_requester_idx
  on public.rajih_action_requests(requested_by, created_at desc);
create index rajih_action_requests_matter_idx
  on public.rajih_action_requests(matter_id)
  where matter_id is not null;

create trigger rajih_action_requests_set_updated_at
before update on public.rajih_action_requests
for each row execute function public.set_updated_at();

alter table public.rajih_action_requests enable row level security;

revoke all on table public.rajih_action_requests from anon, authenticated;
grant select, insert on table public.rajih_action_requests to authenticated;

create policy rajih_action_requests_select_authorized
on public.rajih_action_requests
for select
to authenticated
using (
  requested_by = (select auth.uid())
  or private.has_organization_role(
    organization_id,
    array['owner','admin']::public.app_role[]
  )
);

create policy rajih_action_requests_insert_own_proposal
on public.rajih_action_requests
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and requested_by = (select auth.uid())
  and status = 'proposed'
  and approved_by is null
  and approved_at is null
  and executed_at is null
  and error_message is null
  and private.has_organization_role(
    organization_id,
    array['owner','admin','lawyer','staff','trainee']::public.app_role[]
  )
  and (
    matter_id is null
    or exists (
      select 1
      from public.matters m
      where m.id = rajih_action_requests.matter_id
        and m.organization_id = rajih_action_requests.organization_id
    )
  )
);

drop policy if exists rajih_audit_select on public.audit_logs;

revoke all on table public.audit_logs from anon, authenticated;
grant select, insert on table public.audit_logs to authenticated;

create policy audit_logs_select_authorized
on public.audit_logs
for select
to authenticated
using (
  (
    organization_id is null
    and user_id = (select auth.uid())
  )
  or (
    organization_id is not null
    and private.is_organization_member(organization_id)
  )
);

create policy audit_logs_insert_self
on public.audit_logs
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    organization_id is null
    or private.is_organization_member(organization_id)
  )
);
