-- Disposable contract fixture from read-only column/constraint metadata on 2026-10-19.
-- NO customer rows, credentials, platform owner, policies or Auth settings are copied.
do $$ begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema auth;
create schema private;
create schema storage;
grant usage on schema public,private,auth,storage to authenticated;
grant usage on schema public to anon;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false,banned_until timestamptz);
create table auth.mfa_factors(id uuid primary key,user_id uuid references auth.users(id),factor_type text,status text);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),factor_id uuid,aal text,not_after timestamptz);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant select,insert,update on storage.objects to authenticated;
create type public."app_role" as enum ('owner','admin','lawyer','staff','trainee','viewer');
create type public."knowledge_status" as enum ('imported','parsed','reviewed','approved','published','superseded','rejected');
create table public."audit_logs" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid,
  "user_id" uuid,
  "action" text not null,
  "resource_type" text,
  "resource_id" uuid,
  "metadata" jsonb not null default '{}'::jsonb,
  "created_at" timestamp with time zone not null default now()
);
create table public."client_powers_of_attorney" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null,
  "client_id" uuid not null,
  "poa_number" text not null,
  "poa_year" integer,
  "notary_office" text,
  "issued_at" date,
  "expires_at" date,
  "scope" text,
  "status" text not null default 'active'::text,
  "document_id" uuid,
  "notes" text,
  "created_by" uuid not null,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);
create table public."clients" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null,
  "name" text not null,
  "type" text not null,
  "national_id_or_cr" text,
  "phone" text,
  "email" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "address" text,
  "notes" text,
  "status" text not null default 'active'::text,
  "created_by" uuid not null
);
create table public."documents" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null,
  "matter_id" uuid,
  "title" text not null,
  "storage_path" text not null,
  "mime_type" text not null,
  "content_hash" text not null,
  "created_by" uuid not null,
  "created_at" timestamp with time zone not null default now()
);
create table public."financial_records" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null,
  "client_id" uuid,
  "matter_id" uuid,
  "record_type" text not null,
  "direction" text not null,
  "amount" numeric(14,2) not null,
  "currency" text not null default 'EGP'::text,
  "status" text not null default 'pending'::text,
  "due_date" date,
  "occurred_at" timestamp with time zone,
  "receipt_number" text,
  "notes" text,
  "created_by" uuid not null,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);
create table public."hearings" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null,
  "matter_id" uuid not null,
  "hearing_date" date not null,
  "hearing_time" time without time zone,
  "court" text,
  "circuit" text,
  "hall" text,
  "roll_number" text,
  "purpose" text,
  "last_decision" text,
  "attending_user_id" uuid,
  "status" text not null default 'scheduled'::text,
  "pleading_notes" text,
  "is_archived" boolean not null default false,
  "created_by" uuid not null,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);
create table public."matter_members" (
  "matter_id" uuid not null,
  "user_id" uuid not null,
  "access_level" text not null default 'read'::text,
  "created_at" timestamp with time zone not null default now()
);
create table public."matter_parties" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null,
  "matter_id" uuid not null,
  "party_type" text not null,
  "name" text not null,
  "legal_role" text,
  "national_id_or_cr" text,
  "phone" text,
  "email" text,
  "address" text,
  "representative_name" text,
  "representative_contact" text,
  "notes" text,
  "created_by" uuid not null,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);
create table public."matters" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null,
  "client_id" uuid not null,
  "case_number" text not null,
  "title" text not null,
  "court" text,
  "category" text,
  "status" text not null default 'open'::text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "case_year" integer,
  "circuit" text,
  "stage" text not null default 'active'::text,
  "client_role" text,
  "filing_date" date,
  "claim_amount" numeric(14,2),
  "currency" text not null default 'EGP'::text,
  "notes" text,
  "created_by" uuid not null,
  "closed_at" timestamp with time zone
);
create table public."organization_members" (
  "organization_id" uuid not null,
  "user_id" uuid not null,
  "role" app_role not null,
  "created_at" timestamp with time zone not null default now()
);
create table public."organizations" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "slug" text not null,
  "created_by" uuid not null,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);
create table public."profiles" (
  "id" uuid not null,
  "full_name" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);
create table public."rajih_action_requests" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null,
  "requested_by" uuid not null,
  "matter_id" uuid,
  "action_type" text not null,
  "payload" jsonb not null default '{}'::jsonb,
  "status" text not null default 'proposed'::text,
  "idempotency_key" uuid not null default gen_random_uuid(),
  "approved_by" uuid,
  "approved_at" timestamp with time zone,
  "executed_at" timestamp with time zone,
  "error_message" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);
create table public."tasks" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null,
  "matter_id" uuid,
  "title" text not null,
  "category" text not null,
  "court_or_office" text,
  "assigned_to" uuid,
  "deadline" date not null,
  "priority" text not null default 'normal'::text,
  "status" text not null default 'in_progress'::text,
  "created_by" uuid not null,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);
alter table public."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY (id);
alter table public."client_powers_of_attorney" add constraint "client_powers_of_attorney_pkey" PRIMARY KEY (id);
alter table public."clients" add constraint "clients_pkey" PRIMARY KEY (id);
alter table public."documents" add constraint "documents_pkey" PRIMARY KEY (id);
alter table public."financial_records" add constraint "financial_records_pkey" PRIMARY KEY (id);
alter table public."hearings" add constraint "hearings_pkey" PRIMARY KEY (id);
alter table public."matter_members" add constraint "matter_members_pkey" PRIMARY KEY (matter_id, user_id);
alter table public."matter_parties" add constraint "matter_parties_pkey" PRIMARY KEY (id);
alter table public."matters" add constraint "matters_pkey" PRIMARY KEY (id);
alter table public."organization_members" add constraint "organization_members_pkey" PRIMARY KEY (organization_id, user_id);
alter table public."organizations" add constraint "organizations_pkey" PRIMARY KEY (id);
alter table public."profiles" add constraint "profiles_pkey" PRIMARY KEY (id);
alter table public."rajih_action_requests" add constraint "rajih_action_requests_pkey" PRIMARY KEY (id);
alter table public."tasks" add constraint "tasks_pkey" PRIMARY KEY (id);
alter table public."clients" add constraint "clients_id_organization_key" UNIQUE (id, organization_id);
alter table public."documents" add constraint "documents_id_organization_key" UNIQUE (id, organization_id);
alter table public."matters" add constraint "matters_id_organization_key" UNIQUE (id, organization_id);
alter table public."matters" add constraint "matters_organization_id_case_number_key" UNIQUE (organization_id, case_number);
alter table public."organizations" add constraint "organizations_slug_key" UNIQUE (slug);
alter table public."rajih_action_requests" add constraint "rajih_action_requests_idempotency_key_key" UNIQUE (idempotency_key);
alter table public."client_powers_of_attorney" add constraint "client_poa_dates_check" CHECK (((expires_at IS NULL) OR (issued_at IS NULL) OR (expires_at >= issued_at)));
alter table public."client_powers_of_attorney" add constraint "client_powers_of_attorney_poa_number_check" CHECK (((char_length(btrim(poa_number)) >= 1) AND (char_length(btrim(poa_number)) <= 120)));
alter table public."client_powers_of_attorney" add constraint "client_powers_of_attorney_poa_year_check" CHECK (((poa_year IS NULL) OR ((poa_year >= 1900) AND (poa_year <= 2200))));
alter table public."client_powers_of_attorney" add constraint "client_powers_of_attorney_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'revoked'::text, 'expired'::text])));
alter table public."clients" add constraint "clients_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])));
alter table public."clients" add constraint "clients_type_check" CHECK ((type = ANY (ARRAY['company'::text, 'individual'::text])));
alter table public."financial_records" add constraint "financial_records_amount_check" CHECK ((amount > (0)::numeric));
alter table public."financial_records" add constraint "financial_records_currency_check" CHECK ((currency ~ '^[A-Z]{3}$'::text));
alter table public."financial_records" add constraint "financial_records_direction_check" CHECK ((direction = ANY (ARRAY['income'::text, 'expense'::text])));
alter table public."financial_records" add constraint "financial_records_record_type_check" CHECK ((record_type = ANY (ARRAY['fee_payment'::text, 'expert_deposit'::text, 'court_fee'::text, 'administrative_expense'::text, 'success_fee'::text, 'other'::text])));
alter table public."financial_records" add constraint "financial_records_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text])));
alter table public."hearings" add constraint "hearings_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'postponed'::text, 'cancelled'::text])));
alter table public."matter_members" add constraint "matter_members_access_level_check" CHECK ((access_level = ANY (ARRAY['read'::text, 'write'::text, 'manage'::text])));
alter table public."matter_parties" add constraint "matter_parties_name_check" CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 300)));
alter table public."matter_parties" add constraint "matter_parties_party_type_check" CHECK ((party_type = ANY (ARRAY['client'::text, 'opponent'::text, 'witness'::text, 'expert'::text, 'other'::text])));
alter table public."matters" add constraint "matters_case_year_check" CHECK (((case_year IS NULL) OR ((case_year >= 1900) AND (case_year <= 2200))));
alter table public."matters" add constraint "matters_claim_amount_check" CHECK (((claim_amount IS NULL) OR (claim_amount >= (0)::numeric)));
alter table public."matters" add constraint "matters_currency_check" CHECK ((currency ~ '^[A-Z]{3}$'::text));
alter table public."matters" add constraint "matters_stage_check" CHECK ((stage = ANY (ARRAY['active'::text, 'reserved_for_judgment'::text, 'documents_pending'::text, 'judgment_issued'::text, 'appeal'::text, 'cassation'::text])));
alter table public."matters" add constraint "matters_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'archived'::text])));
alter table public."organizations" add constraint "organizations_name_check" CHECK (((char_length(TRIM(BOTH FROM name)) >= 2) AND (char_length(TRIM(BOTH FROM name)) <= 120)));
alter table public."organizations" add constraint "organizations_slug_check" CHECK (((slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text) AND ((char_length(slug) >= 2) AND (char_length(slug) <= 64))));
alter table public."rajih_action_requests" add constraint "rajih_action_requests_action_type_check" CHECK ((action_type = ANY (ARRAY['create_task'::text, 'update_task_status'::text])));
alter table public."rajih_action_requests" add constraint "rajih_action_requests_payload_check" CHECK ((jsonb_typeof(payload) = 'object'::text));
alter table public."rajih_action_requests" add constraint "rajih_action_requests_status_check" CHECK ((status = ANY (ARRAY['proposed'::text, 'approved'::text, 'rejected'::text, 'executed'::text, 'failed'::text, 'expired'::text])));
alter table public."tasks" add constraint "tasks_category_check" CHECK (((char_length(btrim(category)) >= 1) AND (char_length(btrim(category)) <= 120)));
alter table public."tasks" add constraint "tasks_court_or_office_check" CHECK (((court_or_office IS NULL) OR (char_length(btrim(court_or_office)) <= 240)));
alter table public."tasks" add constraint "tasks_priority_check" CHECK ((priority = ANY (ARRAY['critical'::text, 'urgent'::text, 'normal'::text])));
alter table public."tasks" add constraint "tasks_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'on_hold'::text])));
alter table public."tasks" add constraint "tasks_title_check" CHECK (((char_length(btrim(title)) >= 1) AND (char_length(btrim(title)) <= 500)));
alter table public."audit_logs" add constraint "audit_logs_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
alter table public."audit_logs" add constraint "audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public."client_powers_of_attorney" add constraint "client_poa_client_tenant_fkey" FOREIGN KEY (client_id, organization_id) REFERENCES clients(id, organization_id) ON DELETE RESTRICT;
alter table public."client_powers_of_attorney" add constraint "client_poa_document_tenant_fkey" FOREIGN KEY (document_id, organization_id) REFERENCES documents(id, organization_id) ON DELETE SET NULL (document_id);
alter table public."client_powers_of_attorney" add constraint "client_powers_of_attorney_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
alter table public."client_powers_of_attorney" add constraint "client_powers_of_attorney_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."client_powers_of_attorney" add constraint "client_powers_of_attorney_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;
alter table public."client_powers_of_attorney" add constraint "client_powers_of_attorney_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public."clients" add constraint "clients_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."clients" add constraint "clients_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public."documents" add constraint "documents_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public."documents" add constraint "documents_matter_id_fkey" FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE;
alter table public."documents" add constraint "documents_matter_tenant_fkey" FOREIGN KEY (matter_id, organization_id) REFERENCES matters(id, organization_id) ON DELETE CASCADE;
alter table public."documents" add constraint "documents_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public."financial_records" add constraint "financial_records_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
alter table public."financial_records" add constraint "financial_records_client_tenant_fkey" FOREIGN KEY (client_id, organization_id) REFERENCES clients(id, organization_id) ON DELETE RESTRICT;
alter table public."financial_records" add constraint "financial_records_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."financial_records" add constraint "financial_records_matter_id_fkey" FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE RESTRICT;
alter table public."financial_records" add constraint "financial_records_matter_tenant_fkey" FOREIGN KEY (matter_id, organization_id) REFERENCES matters(id, organization_id) ON DELETE RESTRICT;
alter table public."financial_records" add constraint "financial_records_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public."hearings" add constraint "hearings_attending_user_id_fkey" FOREIGN KEY (attending_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public."hearings" add constraint "hearings_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."hearings" add constraint "hearings_matter_id_fkey" FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE;
alter table public."hearings" add constraint "hearings_matter_tenant_fkey" FOREIGN KEY (matter_id, organization_id) REFERENCES matters(id, organization_id) ON DELETE CASCADE;
alter table public."hearings" add constraint "hearings_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public."matter_members" add constraint "matter_members_matter_id_fkey" FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE;
alter table public."matter_members" add constraint "matter_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."matter_parties" add constraint "matter_parties_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."matter_parties" add constraint "matter_parties_matter_id_fkey" FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE;
alter table public."matter_parties" add constraint "matter_parties_matter_tenant_fkey" FOREIGN KEY (matter_id, organization_id) REFERENCES matters(id, organization_id) ON DELETE CASCADE;
alter table public."matter_parties" add constraint "matter_parties_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public."matters" add constraint "matters_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
alter table public."matters" add constraint "matters_client_tenant_fkey" FOREIGN KEY (client_id, organization_id) REFERENCES clients(id, organization_id) ON DELETE RESTRICT;
alter table public."matters" add constraint "matters_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."matters" add constraint "matters_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public."organization_members" add constraint "organization_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public."organization_members" add constraint "organization_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."organizations" add constraint "organizations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."rajih_action_requests" add constraint "rajih_action_requests_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."rajih_action_requests" add constraint "rajih_action_requests_matter_id_fkey" FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE RESTRICT;
alter table public."rajih_action_requests" add constraint "rajih_action_requests_matter_tenant_fkey" FOREIGN KEY (matter_id, organization_id) REFERENCES matters(id, organization_id) ON DELETE RESTRICT;
alter table public."rajih_action_requests" add constraint "rajih_action_requests_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public."rajih_action_requests" add constraint "rajih_action_requests_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."tasks" add constraint "tasks_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public."tasks" add constraint "tasks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table public."tasks" add constraint "tasks_matter_id_fkey" FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE RESTRICT;
alter table public."tasks" add constraint "tasks_matter_tenant_fkey" FOREIGN KEY (matter_id, organization_id) REFERENCES matters(id, organization_id) ON DELETE RESTRICT;
alter table public."tasks" add constraint "tasks_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE OR REPLACE FUNCTION private.is_organization_member(target_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
  );
$function$;

CREATE OR REPLACE FUNCTION private.has_organization_role(target_organization_id uuid, allowed_roles app_role[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.role = any(allowed_roles)
  );
$function$;

CREATE OR REPLACE FUNCTION private.can_access_matter(target_matter uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

CREATE OR REPLACE FUNCTION private.can_write_matter(target_matter uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

CREATE OR REPLACE FUNCTION private.can_read_legal_storage_object(object_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    array_length(string_to_array(object_name, '/'), 1) = 3
    and split_part(object_name, '/', 3) <> ''
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = (select auth.uid())
        and om.organization_id::text = split_part(object_name, '/', 1)
        and (
          (
            split_part(object_name, '/', 2) = 'general'
          )
          or exists (
            select 1
            from public.matters m
            where m.organization_id = om.organization_id
              and m.id::text = split_part(object_name, '/', 2)
              and private.can_access_matter(m.id)
          )
        )
    );
$function$;

CREATE OR REPLACE FUNCTION private.can_write_legal_storage_object(object_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    array_length(string_to_array(object_name, '/'), 1) = 3
    and split_part(object_name, '/', 3) <> ''
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = (select auth.uid())
        and om.organization_id::text = split_part(object_name, '/', 1)
        and (
          (
            split_part(object_name, '/', 2) = 'general'
            and om.role = any(
              array['owner','admin','lawyer','staff']::public.app_role[]
            )
          )
          or exists (
            select 1
            from public.matters m
            where m.organization_id = om.organization_id
              and m.id::text = split_part(object_name, '/', 2)
              and private.can_write_matter(m.id)
          )
        )
    );
$function$;
alter table public."audit_logs" enable row level security;
revoke all on public."audit_logs" from public,anon,authenticated;
grant select,insert,update on public."audit_logs" to authenticated;
create policy fixture_tenant on public."audit_logs" to authenticated using(private.is_organization_member(organization_id)) with check(private.is_organization_member(organization_id));
alter table public."client_powers_of_attorney" enable row level security;
revoke all on public."client_powers_of_attorney" from public,anon,authenticated;
grant select,insert,update on public."client_powers_of_attorney" to authenticated;
create policy fixture_tenant on public."client_powers_of_attorney" to authenticated using(private.is_organization_member(organization_id)) with check(private.is_organization_member(organization_id));
alter table public."clients" enable row level security;
revoke all on public."clients" from public,anon,authenticated;
grant select,insert,update on public."clients" to authenticated;
create policy fixture_tenant on public."clients" to authenticated using(private.is_organization_member(organization_id)) with check(private.is_organization_member(organization_id));
alter table public."documents" enable row level security;
revoke all on public."documents" from public,anon,authenticated;
grant select,insert,update on public."documents" to authenticated;
create policy fixture_tenant on public."documents" to authenticated using(private.is_organization_member(organization_id)) with check(private.is_organization_member(organization_id));
alter table public."financial_records" enable row level security;
revoke all on public."financial_records" from public,anon,authenticated;
grant select,insert,update on public."financial_records" to authenticated;
create policy fixture_tenant on public."financial_records" to authenticated using(private.is_organization_member(organization_id)) with check(private.is_organization_member(organization_id));
alter table public."hearings" enable row level security;
revoke all on public."hearings" from public,anon,authenticated;
grant select,insert,update on public."hearings" to authenticated;
create policy fixture_tenant on public."hearings" to authenticated using(private.is_organization_member(organization_id)) with check(private.is_organization_member(organization_id));
alter table public."matter_members" enable row level security;
revoke all on public."matter_members" from public,anon,authenticated;
grant select,insert,update on public."matter_members" to authenticated;
create policy fixture_tenant on public."matter_members" to authenticated using(private.can_access_matter(matter_id)) with check(private.can_access_matter(matter_id));
alter table public."matter_parties" enable row level security;
revoke all on public."matter_parties" from public,anon,authenticated;
grant select,insert,update on public."matter_parties" to authenticated;
create policy fixture_tenant on public."matter_parties" to authenticated using(private.is_organization_member(organization_id)) with check(private.is_organization_member(organization_id));
alter table public."matters" enable row level security;
revoke all on public."matters" from public,anon,authenticated;
grant select,insert,update on public."matters" to authenticated;
create policy fixture_tenant on public."matters" to authenticated using(private.can_access_matter(id)) with check(private.can_access_matter(id));
alter table public."organization_members" enable row level security;
revoke all on public."organization_members" from public,anon,authenticated;
grant select,insert,update on public."organization_members" to authenticated;
create policy fixture_tenant on public."organization_members" to authenticated using(private.is_organization_member(organization_id)) with check(private.is_organization_member(organization_id));
alter table public."organizations" enable row level security;
revoke all on public."organizations" from public,anon,authenticated;
grant select,insert,update on public."organizations" to authenticated;
create policy fixture_tenant on public."organizations" to authenticated using(private.is_organization_member(id)) with check(private.is_organization_member(id));
alter table public."profiles" enable row level security;
revoke all on public."profiles" from public,anon,authenticated;
grant select,insert,update on public."profiles" to authenticated;
create policy fixture_tenant on public."profiles" to authenticated using(id=auth.uid()) with check(id=auth.uid());
alter table public."rajih_action_requests" enable row level security;
revoke all on public."rajih_action_requests" from public,anon,authenticated;
grant select,insert,update on public."rajih_action_requests" to authenticated;
create policy fixture_tenant on public."rajih_action_requests" to authenticated using(private.is_organization_member(organization_id)) with check(private.is_organization_member(organization_id));
alter table public."tasks" enable row level security;
revoke all on public."tasks" from public,anon,authenticated;
grant select,insert,update on public."tasks" to authenticated;
create policy fixture_tenant on public."tasks" to authenticated using(private.is_organization_member(organization_id)) with check(private.is_organization_member(organization_id));
create policy fixture_storage_read on storage.objects for select to authenticated using(bucket_id='legal-documents' and private.can_read_legal_storage_object(name));
create policy fixture_storage_insert on storage.objects for insert to authenticated with check(bucket_id='legal-documents' and private.can_write_legal_storage_object(name));

revoke insert,update on public.organizations,public.organization_members,public.profiles from authenticated;
