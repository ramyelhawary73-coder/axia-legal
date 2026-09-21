-- AXIA Core Data Foundation v1 - Migration A
-- Core relational schema and safe backfill only.

alter table public.clients
  add column address text,
  add column notes text,
  add column status text not null default 'active',
  add column created_by uuid;

update public.clients c
set created_by = o.created_by
from public.organizations o
where o.id = c.organization_id
  and c.created_by is null;

alter table public.clients
  alter column created_by set not null,
  add constraint clients_status_check
    check (status in ('active','inactive','archived')),
  add constraint clients_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete restrict;

alter table public.matters
  add column case_year integer,
  add column circuit text,
  add column stage text not null default 'active',
  add column client_role text,
  add column filing_date date,
  add column claim_amount numeric(14,2),
  add column currency text not null default 'EGP',
  add column notes text,
  add column created_by uuid,
  add column closed_at timestamptz;

update public.matters m
set created_by = o.created_by
from public.organizations o
where o.id = m.organization_id
  and m.created_by is null;

alter table public.matters
  alter column created_by set not null,
  add constraint matters_case_year_check
    check (case_year is null or case_year between 1900 and 2200),
  add constraint matters_stage_check
    check (stage in (
      'active',
      'reserved_for_judgment',
      'documents_pending',
      'judgment_issued',
      'appeal',
      'cassation'
    )),
  add constraint matters_claim_amount_check
    check (claim_amount is null or claim_amount >= 0),
  add constraint matters_currency_check
    check (currency ~ '^[A-Z]{3}$'),
  add constraint matters_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete restrict;

create table public.client_powers_of_attorney (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  poa_number text not null check (char_length(btrim(poa_number)) between 1 and 120),
  poa_year integer check (poa_year is null or poa_year between 1900 and 2200),
  notary_office text,
  issued_at date,
  expires_at date,
  scope text,
  status text not null default 'active'
    check (status in ('active','revoked','expired')),
  document_id uuid references public.documents(id) on delete set null,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_poa_dates_check
    check (expires_at is null or issued_at is null or expires_at >= issued_at)
);

create table public.matter_parties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  matter_id uuid not null references public.matters(id) on delete cascade,
  party_type text not null
    check (party_type in ('client','opponent','witness','expert','other')),
  name text not null check (char_length(btrim(name)) between 1 and 300),
  legal_role text,
  national_id_or_cr text,
  phone text,
  email text,
  address text,
  representative_name text,
  representative_contact text,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hearings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  matter_id uuid not null references public.matters(id) on delete cascade,
  hearing_date date not null,
  hearing_time time,
  court text,
  circuit text,
  hall text,
  roll_number text,
  purpose text,
  last_decision text,
  attending_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'scheduled'
    check (status in ('scheduled','completed','postponed','cancelled')),
  pleading_notes text,
  is_archived boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete restrict,
  matter_id uuid references public.matters(id) on delete restrict,
  record_type text not null
    check (record_type in (
      'fee_payment',
      'expert_deposit',
      'court_fee',
      'administrative_expense',
      'success_fee',
      'other'
    )),
  direction text not null check (direction in ('income','expense')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'EGP' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending'
    check (status in ('pending','completed','cancelled')),
  due_date date,
  occurred_at timestamptz,
  receipt_number text,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_powers_of_attorney enable row level security;
alter table public.matter_parties enable row level security;
alter table public.hearings enable row level security;
alter table public.financial_records enable row level security;
