-- AXIA Client Requests V1 — stage 1: install the locked schema.
-- Review only. No API grants, changes to existing audit policies, or export format switch.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '20s';

-- Verify the required D3 baseline before installing the schema.
do $guard$ begin
  if (select md5(prosrc) from pg_catalog.pg_proc
      where oid=to_regprocedure('private.axia_control(text,uuid,jsonb)')) is distinct from '68cddcdf198457414fbe346c2dda3a63' then
    raise exception 'CLIENT_REQUESTS_D3_BASELINE_MISMATCH';
  end if;
end $guard$;

-- Existing case/client keys already enforce the office. This key also keeps a
-- linked request with the case's actual client if a case is reassigned later.
create unique index client_requests_matter_client_key on public.matters(id,organization_id,client_id);

create table public.client_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  client_id uuid not null,
  matter_id uuid,
  assigned_to uuid,
  title text not null check(char_length(btrim(title)) between 2 and 140 and char_length(title)<=140),
  summary text not null default '' check(char_length(summary)<=600),
  status text not null default 'new' check(status in ('new','in_progress','waiting','closed')),
  follow_up_on date check(follow_up_on between date '2000-01-01' and date '2100-12-31'),
  archived boolean not null default false,
  revision integer not null default 1 check(revision>=1),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(client_id,organization_id) references public.clients(id,organization_id),
  foreign key(matter_id,organization_id,client_id) references public.matters(id,organization_id,client_id),
  foreign key(organization_id,assigned_to) references public.organization_members(organization_id,user_id) on delete set null(assigned_to)
);
create index client_requests_office_list_idx on public.client_requests(organization_id,archived,updated_at desc,id desc);
create index client_requests_client_fk_idx on public.client_requests(client_id,organization_id);
create index client_requests_matter_fk_idx on public.client_requests(matter_id,organization_id,client_id) where matter_id is not null;
create index client_requests_assignee_fk_idx on public.client_requests(organization_id,assigned_to) where assigned_to is not null;
create index client_requests_creator_fk_idx on public.client_requests(created_by);

alter table public.client_requests enable row level security;
-- Supabase may grant access to new public tables by default. Keep all API roles closed.
revoke all on public.client_requests from public,anon,authenticated,service_role;

create policy client_requests_read on public.client_requests for select to authenticated using (
  coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true'
  and (private.has_organization_role(organization_id,array['owner','admin','lawyer']::public.app_role[])
    or (assigned_to=(select auth.uid()) and private.has_organization_role(organization_id,array['staff']::public.app_role[])))
  and (matter_id is null or private.can_access_matter(matter_id))
);
create policy client_requests_insert on public.client_requests for insert to authenticated with check (
  coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true' and created_by=(select auth.uid())
  and private.has_organization_role(organization_id,array['owner','admin','lawyer']::public.app_role[])
  and (matter_id is null or private.can_write_matter(matter_id))
  and (assigned_to is null or exists(select 1 from public.organization_members m
    where m.organization_id=client_requests.organization_id and m.user_id=assigned_to and m.role in ('owner','admin','lawyer','staff')))
);
create policy client_requests_update on public.client_requests for update to authenticated using (
  coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true'
  and private.has_organization_role(organization_id,array['owner','admin','lawyer']::public.app_role[])
  and (matter_id is null or private.can_write_matter(matter_id))
) with check (
  coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true'
  and private.has_organization_role(organization_id,array['owner','admin','lawyer']::public.app_role[])
  and (matter_id is null or private.can_write_matter(matter_id))
  and (assigned_to is null or exists(select 1 from public.organization_members m
    where m.organization_id=client_requests.organization_id and m.user_id=assigned_to and m.role in ('owner','admin','lawyer','staff')))
);

create function private.client_request_revision() returns trigger
language plpgsql set search_path='' as $$
begin
  if new is distinct from old then
    new.revision:=old.revision+1;
    new.updated_at:=clock_timestamp();
  end if;
  return new;
end $$;

create function private.audit_client_request() returns trigger
language plpgsql security definer set search_path='' as $$
declare event text; changed text[];
begin
  if tg_op='INSERT' then
    event:='created'; changed:=array[]::text[];
  else
    if new is not distinct from old then return new; end if;
    event:=case when new.archived<>old.archived then case when new.archived then 'archived' else 'restored' end else 'updated' end;
    select array_agg(k order by k) into changed
    from unnest(array['client_id','matter_id','assigned_to','title','summary','status','follow_up_on','archived']) k
    where to_jsonb(new)->k is distinct from to_jsonb(old)->k;
  end if;
  insert into public.audit_logs(organization_id,user_id,action,resource_type,resource_id,metadata)
  values(new.organization_id,auth.uid(),'client_request.'||event,'client_request',new.id,
    jsonb_build_object('source','database_trigger','revision',new.revision,'changed_fields',coalesce(changed,array[]::text[])));
  return new;
end $$;
revoke all on function private.client_request_revision(),private.audit_client_request() from public,anon,authenticated,service_role;
create trigger client_request_revision before update on public.client_requests for each row execute function private.client_request_revision();
create trigger client_request_audit after insert or update on public.client_requests for each row execute function private.audit_client_request();

commit;
