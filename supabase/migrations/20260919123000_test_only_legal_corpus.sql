alter table public.legal_knowledge_documents
  add column if not exists is_test_only boolean not null default false;

create index if not exists legal_documents_test_visibility_idx
  on public.legal_knowledge_documents(status, is_test_only, effective_from);

create or replace function public.match_legal_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  heading text,
  article_number text,
  similarity float
)
language sql stable security invoker set search_path = public as $$
  select c.id, c.document_id, c.content, c.heading, c.article_number,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.legal_knowledge_chunks c
  join public.legal_knowledge_documents d on d.id = c.document_id
  where d.status = 'published'
    and d.is_test_only = false
    and c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) >= match_threshold
  order by c.embedding <=> query_embedding
  limit least(match_count, 20);
$$;
