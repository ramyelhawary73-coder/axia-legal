-- AXIA Phase 3B - Document Storage Foundation
-- Private bucket + least-privilege Storage/Documents INSERT/SELECT only.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'legal-documents',
  'legal-documents',
  false,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.can_read_legal_storage_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    array_length(string_to_array(object_name, '/'), 1) = 3
    and split_part(object_name, '/', 3) <> ''
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = (select auth.uid())
        and om.organization_id::text = split_part(object_name, '/', 1)
        and (
          split_part(object_name, '/', 2) = 'general'
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

create or replace function private.can_write_legal_storage_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
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

revoke all on function private.can_read_legal_storage_object(text) from public, anon;
revoke all on function private.can_write_legal_storage_object(text) from public, anon;
grant execute on function private.can_read_legal_storage_object(text) to authenticated;
grant execute on function private.can_write_legal_storage_object(text) to authenticated;

drop policy if exists legal_documents_storage_select on storage.objects;
drop policy if exists legal_documents_storage_insert on storage.objects;

create policy legal_documents_storage_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'legal-documents'
  and private.can_read_legal_storage_object(name)
);

create policy legal_documents_storage_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'legal-documents'
  and private.can_write_legal_storage_object(name)
);

revoke all on table public.documents from anon;
grant select, insert on table public.documents to authenticated;

drop policy if exists documents_insert_authorized on public.documents;

create policy documents_insert_authorized
on public.documents
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and split_part(storage_path, '/', 1) = organization_id::text
  and split_part(storage_path, '/', 2) = coalesce(matter_id::text, 'general')
  and private.can_write_legal_storage_object(storage_path)
);
