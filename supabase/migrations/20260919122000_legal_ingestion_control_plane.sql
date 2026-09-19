create table if not exists public.legal_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.legal_sources(id) on delete restrict,
  source_url text not null,
  retrieved_at timestamptz not null default now(),
  http_status integer,
  etag text,
  last_modified text,
  content_type text,
  content_hash text not null,
  storage_path text,
  byte_size bigint,
  retrieval_method text not null default 'manual_or_api',
  error_message text,
  unique (source_url, content_hash)
);

create table if not exists public.legal_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.legal_sources(id) on delete restrict,
  snapshot_id uuid references public.legal_source_snapshots(id) on delete set null,
  job_type text not null check (job_type in ('discover', 'download', 'extract', 'parse', 'embed', 'reindex')),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  requested_by uuid references auth.users(id) on delete set null,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.legal_document_reviews (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.legal_knowledge_documents(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision public.knowledge_status not null check (decision in ('reviewed', 'approved', 'published', 'rejected')),
  notes text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.legal_ingestion_scope (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  legal_area text not null,
  jurisdiction text not null default 'EG',
  priority integer not null default 100 check (priority between 1 and 999),
  status text not null default 'planned' check (status in ('planned', 'collecting', 'reviewing', 'complete')),
  source_requirement text not null default 'official_source_required',
  created_at timestamptz not null default now()
);

alter table public.legal_knowledge_documents
  add column if not exists source_snapshot_id uuid references public.legal_source_snapshots(id) on delete set null;

create index if not exists legal_snapshots_source_idx on public.legal_source_snapshots(source_id, retrieved_at desc);
create index if not exists legal_jobs_status_idx on public.legal_ingestion_jobs(status, created_at);
create index if not exists legal_reviews_document_idx on public.legal_document_reviews(document_id, created_at desc);
create index if not exists legal_scope_priority_idx on public.legal_ingestion_scope(status, priority);

alter table public.legal_source_snapshots enable row level security;
alter table public.legal_ingestion_jobs enable row level security;
alter table public.legal_document_reviews enable row level security;
alter table public.legal_ingestion_scope enable row level security;

drop policy if exists legal_scope_select_authenticated on public.legal_ingestion_scope;
create policy legal_scope_select_authenticated on public.legal_ingestion_scope for select using (auth.role() = 'authenticated');
drop policy if exists legal_snapshots_select_authenticated on public.legal_source_snapshots;
create policy legal_snapshots_select_authenticated on public.legal_source_snapshots for select using (auth.role() = 'authenticated');
drop policy if exists legal_jobs_select_authenticated on public.legal_ingestion_jobs;
create policy legal_jobs_select_authenticated on public.legal_ingestion_jobs for select using (auth.role() = 'authenticated');
drop policy if exists legal_reviews_select_authenticated on public.legal_document_reviews;
create policy legal_reviews_select_authenticated on public.legal_document_reviews for select using (auth.role() = 'authenticated');

insert into public.legal_ingestion_scope (title, legal_area, priority)
values
  ('القانون المدني المصري', 'مدني', 1),
  ('قانون المرافعات المدنية والتجارية', 'مرافعات', 2),
  ('قانون العمل المصري', 'عمل', 3),
  ('قانون الشركات المصري', 'شركات', 4),
  ('قانون التجارة المصري', 'تجارة', 5)
on conflict (title) do nothing;
