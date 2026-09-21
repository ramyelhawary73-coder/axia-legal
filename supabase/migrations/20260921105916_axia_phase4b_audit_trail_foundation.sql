-- AXIA Phase 4B-B — Audit Trail Foundation
-- Prepared for review only. DO NOT apply without explicit owner approval.
--
-- Goal:
-- - make Core INSERT/UPDATE audit events database-enforced;
-- - keep Core business audit events out of application-only code paths;
-- - prevent authenticated users from fabricating Core audit namespaces;
-- - preserve the existing RAJIH usage event through a narrowly-scoped insert policy;
-- - avoid copying sensitive legal/client field values into audit metadata.
--
-- No DELETE capability is introduced by this migration.

create or replace function private.audit_core_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  organization_id_value uuid;
  resource_id_value uuid;
  resource_type_value text;
  action_prefix text;
  action_name text;
  old_row jsonb;
  new_row jsonb;
  changed_fields text[];
begin
  if tg_table_schema <> 'public' then
    raise exception 'AXIA audit trigger is restricted to public Core tables';
  end if;

  resource_type_value := case tg_table_name
    when 'clients' then 'client'
    when 'matters' then 'matter'
    when 'hearings' then 'hearing'
    when 'tasks' then 'task'
    when 'financial_records' then 'financial_record'
    when 'documents' then 'document'
    else null
  end;

  action_prefix := case tg_table_name
    when 'clients' then 'client'
    when 'matters' then 'matter'
    when 'hearings' then 'hearing'
    when 'tasks' then 'task'
    when 'financial_records' then 'finance'
    when 'documents' then 'document'
    else null
  end;

  if resource_type_value is null or action_prefix is null then
    raise exception 'AXIA audit trigger is not configured for table %', tg_table_name;
  end if;

  if tg_op = 'INSERT' then
    new_row := to_jsonb(new);
    organization_id_value := (new_row ->> 'organization_id')::uuid;
    resource_id_value := (new_row ->> 'id')::uuid;
    action_name := action_prefix || '.created';

    insert into public.audit_logs (
      organization_id,
      user_id,
      action,
      resource_type,
      resource_id,
      metadata
    )
    values (
      organization_id_value,
      actor_id,
      action_name,
      resource_type_value,
      resource_id_value,
      jsonb_build_object(
        'source', 'database_trigger'
      )
    );

    return new;
  end if;

  if tg_op = 'UPDATE' then
    old_row := to_jsonb(old) - 'updated_at';
    new_row := to_jsonb(new) - 'updated_at';

    select coalesce(
      array_agg(keys.key order by keys.key),
      array[]::text[]
    )
    into changed_fields
    from jsonb_object_keys(old_row || new_row) as keys(key)
    where (old_row -> keys.key) is distinct from (new_row -> keys.key);

    if cardinality(changed_fields) = 0 then
      return new;
    end if;

    organization_id_value := (new_row ->> 'organization_id')::uuid;
    resource_id_value := (new_row ->> 'id')::uuid;
    action_name := action_prefix || '.updated';

    insert into public.audit_logs (
      organization_id,
      user_id,
      action,
      resource_type,
      resource_id,
      metadata
    )
    values (
      organization_id_value,
      actor_id,
      action_name,
      resource_type_value,
      resource_id_value,
      jsonb_build_object(
        'source', 'database_trigger',
        'changed_fields', to_jsonb(changed_fields)
      )
    );

    return new;
  end if;

  raise exception 'AXIA audit trigger does not support operation %', tg_op;
end;
$function$;

revoke all on function private.audit_core_row()
from public, anon, authenticated;

drop trigger if exists clients_audit_core on public.clients;
create trigger clients_audit_core
after insert or update on public.clients
for each row
execute function private.audit_core_row();

drop trigger if exists matters_audit_core on public.matters;
create trigger matters_audit_core
after insert or update on public.matters
for each row
execute function private.audit_core_row();

drop trigger if exists hearings_audit_core on public.hearings;
create trigger hearings_audit_core
after insert or update on public.hearings
for each row
execute function private.audit_core_row();

drop trigger if exists tasks_audit_core on public.tasks;
create trigger tasks_audit_core
after insert or update on public.tasks
for each row
execute function private.audit_core_row();

drop trigger if exists financial_records_audit_core on public.financial_records;
create trigger financial_records_audit_core
after insert or update on public.financial_records
for each row
execute function private.audit_core_row();

drop trigger if exists documents_audit_core on public.documents;
create trigger documents_audit_core
after insert on public.documents
for each row
execute function private.audit_core_row();

-- Replace the broad self-insert policy with a transitional RAJIH-only usage event.
-- Core audit namespaces are inserted only by the database trigger function above.
drop policy if exists audit_logs_insert_self on public.audit_logs;
drop policy if exists audit_logs_insert_rajih_self on public.audit_logs;

create policy audit_logs_insert_rajih_self
on public.audit_logs
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and organization_id is not null
  and action = 'rajih.agent.run'
  and jsonb_typeof(metadata) = 'object'
  and private.is_organization_member(organization_id)
  and (
    (
      resource_type = 'legal_research'
      and resource_id is null
    )
    or
    (
      resource_type = 'matter'
      and resource_id is not null
      and private.can_access_matter(resource_id)
      and exists (
        select 1
        from public.matters m
        where m.id = resource_id
          and m.organization_id = audit_logs.organization_id
      )
    )
  )
);

-- Organization-wide audit visibility is limited to owner/admin.
-- Other members can read only their own rows while they still belong to the organization.
drop policy if exists audit_logs_select_authorized on public.audit_logs;

create policy audit_logs_select_authorized
on public.audit_logs
for select
to authenticated
using (
  (
    user_id = (select auth.uid())
    and (
      organization_id is null
      or private.is_organization_member(organization_id)
    )
  )
  or
  (
    organization_id is not null
    and private.has_organization_role(
      organization_id,
      array['owner','admin']::public.app_role[]
    )
  )
);

-- Keep the existing table-level INSERT/SELECT grants because RAJIH still writes
-- its constrained usage event through the authenticated session.
-- RLS above blocks direct authenticated insertion of Core audit namespaces.
revoke update, delete, truncate on table public.audit_logs from authenticated;
grant select, insert on table public.audit_logs to authenticated;
