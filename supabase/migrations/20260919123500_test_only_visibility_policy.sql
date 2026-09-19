drop policy if exists rajih_knowledge_documents_select on public.legal_knowledge_documents;
create policy rajih_knowledge_documents_select on public.legal_knowledge_documents
  for select using (auth.role() = 'authenticated' and status = 'published' and is_test_only = false);

drop policy if exists rajih_knowledge_chunks_select on public.legal_knowledge_chunks;
create policy rajih_knowledge_chunks_select on public.legal_knowledge_chunks
  for select using (exists (
    select 1 from public.legal_knowledge_documents d
    where d.id = document_id and d.status = 'published' and d.is_test_only = false
  ));
