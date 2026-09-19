create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.membership_role as enum ('owner', 'admin', 'partner', 'lawyer', 'paralegal', 'trainee', 'viewer');
create type public.knowledge_status as enum ('imported', 'parsed', 'reviewed', 'approved', 'published', 'superseded', 'rejected');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  type text not null check (type in ('company', 'individual')),
  national_id_or_cr text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  case_number text not null,
  title text not null,
  court text,
  category text,
  status text not null default 'open' check (status in ('open', 'closed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, case_number)
);

create table public.matter_members (
  matter_id uuid not null references public.matters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_level text not null default 'read' check (access_level in ('read', 'write', 'manage')),
  created_at timestamptz not null default now(),
  primary key (matter_id, user_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  matter_id uuid references public.matters(id) on delete cascade,
  title text not null,
  storage_path text not null,
  mime_type text not null,
  content_hash text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.legal_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  authority text not null,
  source_url text,
  jurisdiction text not null default 'EG',
  created_at timestamptz not null default now()
);

create table public.legal_knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.legal_sources(id) on delete restrict,
  title text not null,
  version text not null,
  source_url text,
  original_storage_path text,
  content_hash text not null,
  publication_date date,
  effective_from date,
  effective_to date,
  jurisdiction text not null default 'EG',
  court text,
  legal_area text,
  status public.knowledge_status not null default 'imported',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source_id, version, content_hash)
);

create table public.legal_knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.legal_knowledge_documents(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  heading text,
  article_number text,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index clients_org_idx on public.clients(organization_id);
create index matters_org_idx on public.matters(organization_id);
create index matters_client_idx on public.matters(client_id);
create index documents_matter_idx on public.documents(matter_id);
create index knowledge_status_idx on public.legal_knowledge_documents(status, effective_from, effective_to);
create index knowledge_chunks_fts_idx on public.legal_knowledge_chunks using gin (to_tsvector('simple', content));
create index knowledge_chunks_embedding_idx on public.legal_knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 50);

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships m where m.organization_id = target_org and m.user_id = auth.uid());
$$;

create or replace function public.can_access_matter(target_matter uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.matters ma
    join public.memberships om on om.organization_id = ma.organization_id and om.user_id = auth.uid()
    left join public.matter_members mm on mm.matter_id = ma.id and mm.user_id = auth.uid()
    where ma.id = target_matter and (om.role in ('owner', 'admin', 'partner') or mm.user_id is not null)
  );
$$;

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.clients enable row level security;
alter table public.matters enable row level security;
alter table public.matter_members enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.legal_sources enable row level security;
alter table public.legal_knowledge_documents enable row level security;
alter table public.legal_knowledge_chunks enable row level security;

create policy org_member_select on public.organizations for select using (public.is_org_member(id));
create policy membership_self_select on public.memberships for select using (user_id = auth.uid() or public.is_org_member(organization_id));
create policy clients_org_select on public.clients for select using (public.is_org_member(organization_id));
create policy matters_acl_select on public.matters for select using (public.can_access_matter(id));
create policy matter_members_acl_select on public.matter_members for select using (public.can_access_matter(matter_id));
create policy documents_acl_select on public.documents for select using (matter_id is null and public.is_org_member(organization_id) or matter_id is not null and public.can_access_matter(matter_id));
create policy audit_org_select on public.audit_logs for select using (organization_id is null or public.is_org_member(organization_id));
create policy legal_sources_authenticated_select on public.legal_sources for select using (auth.role() = 'authenticated');
create policy legal_knowledge_authenticated_select on public.legal_knowledge_documents for select using (auth.role() = 'authenticated' and status = 'published');
create policy legal_chunks_published_select on public.legal_knowledge_chunks for select using (exists (select 1 from public.legal_knowledge_documents d where d.id = document_id and d.status = 'published'));

revoke all on all tables in schema public from anon;
