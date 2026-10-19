begin;

-- D3: isolated source only. Requires separate approval before ANY hosted application.
-- Does not seed authority, replay history, change Auth settings or remove memberships.
do $$ begin
  if to_regprocedure('private.axia_platform_context()') is null
     or to_regprocedure('private.can_write_matter(uuid)') is null
     or to_regclass('storage.objects') is null then
    raise exception 'CONTROL_PREREQUISITES_MISSING';
  end if;
end $$;

create table private.office_controls (
  organization_id uuid primary key references public.organizations(id),
  status text not null default 'active' check(status in ('active','suspended')),
  plan text not null default 'manual' check(length(plan) between 1 and 80),
  expires_at timestamptz,
  seat_limit integer not null default 10 check(seat_limit between 1 and 10000),
  storage_limit_mb integer not null default 1024 check(storage_limit_mb between 1 and 1048576),
  rajih_enabled boolean not null default true,
  revision integer not null default 1 check(revision>0),
  updated_at timestamptz not null default clock_timestamp()
);
create table private.office_member_access (
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references auth.users(id),
  blocked boolean not null default false,
  primary key(organization_id,user_id)
);
create table private.control_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  organization_id uuid references public.organizations(id),
  action text not null,
  reason text not null check(length(reason) between 8 and 500),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp()
);
create index control_events_recent on private.control_events(created_at desc,id desc);
create index control_events_actor_recent on private.control_events(actor_id,created_at desc);
create index control_events_office_recent on private.control_events(organization_id,created_at desc);
create trigger control_events_immutable before update or delete on private.control_events
for each row execute function private.axia_platform_audit_immutable();
create trigger control_events_no_truncate before truncate on private.control_events
for each statement execute function private.axia_platform_audit_immutable();
create table private.office_support_grants (
  user_id uuid not null references auth.users(id),
  session_id uuid not null,
  organization_id uuid not null references public.organizations(id),
  purpose text not null check(purpose in ('read','export')),
  reason text not null,
  allowed_paths jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null,
  primary key(user_id,session_id)
);
do $$ declare t text; begin
  foreach t in array array['office_controls','office_member_access','control_events','office_support_grants'] loop
    execute format('alter table private.%I enable row level security',t);
    execute format('alter table private.%I force row level security',t);
    execute format('revoke all on private.%I from public,anon,authenticated',t);
  end loop;
end $$;

-- Legacy offices are unchanged until explicitly configured. This gate grants no membership.
create function private.axia_office_access(p_office uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select not exists(select 1 from private.office_controls c where c.organization_id=p_office
    and (c.status<>'active' or (c.expires_at is not null and c.expires_at<=statement_timestamp())))
    and not exists(select 1 from private.office_member_access b where b.organization_id=p_office
      and b.user_id=auth.uid() and b.blocked);
$$;
create or replace function private.is_organization_member(target_organization_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select private.axia_office_access(target_organization_id) and exists(select 1 from public.organization_members m
    where m.organization_id=target_organization_id and m.user_id=auth.uid());
$$;
create or replace function private.has_organization_role(target_organization_id uuid,allowed_roles public.app_role[]) returns boolean
language sql stable security definer set search_path='' as $$
  select private.axia_office_access(target_organization_id) and exists(select 1 from public.organization_members m
    where m.organization_id=target_organization_id and m.user_id=auth.uid() and m.role=any(allowed_roles));
$$;
create or replace function private.can_access_matter(target_matter uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.matters m join public.organization_members om
    on om.organization_id=m.organization_id and om.user_id=auth.uid()
    left join public.matter_members mm on mm.matter_id=m.id and mm.user_id=auth.uid()
    where m.id=target_matter and private.axia_office_access(m.organization_id)
    and (om.role=any(array['owner','admin','lawyer']::public.app_role[]) or mm.user_id is not null));
$$;

-- Additional restrictive policies preserve every existing tenant/case policy.
do $$ declare t text; begin
  foreach t in array array['clients','matters','tasks','documents','hearings','financial_records',
    'matter_parties','client_powers_of_attorney','audit_logs','staff_invitations','rajih_action_requests','organization_members'] loop
    execute format('create policy control_office_gate on public.%I as restrictive to authenticated using(private.axia_office_access(organization_id)) with check(private.axia_office_access(organization_id))',t);
  end loop;
end $$;
create policy control_matter_members_gate on public.matter_members as restrictive to authenticated
using(exists(select 1 from public.matters m where m.id=matter_id and private.axia_office_access(m.organization_id)))
with check(exists(select 1 from public.matters m where m.id=matter_id and private.axia_office_access(m.organization_id)));

-- Old invitation definers inspect membership rows directly. Retain their implementation
-- behind a non-callable private name and preserve the public API through these guards.
alter function private.axia_staff_manage(uuid,text,text,text,uuid) rename to axia_staff_manage_before_control;
revoke all on function private.axia_staff_manage_before_control(uuid,text,text,text,uuid) from public,anon,authenticated;
create function private.axia_staff_manage(p_organization_id uuid,p_action text,p_email text default null,p_role text default null,p_invitation_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$ begin
  if not private.is_organization_member(p_organization_id) then raise exception using errcode='42501',message='CONTROL_OFFICE_UNAVAILABLE'; end if;
  return private.axia_staff_manage_before_control(p_organization_id,p_action,p_email,p_role,p_invitation_id);
end $$;
alter function private.axia_staff_accept(text) rename to axia_staff_accept_before_control;
revoke all on function private.axia_staff_accept_before_control(text) from public,anon,authenticated;
create function private.axia_staff_accept(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item public.staff_invitations; begin
  select * into item from public.staff_invitations where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
  if found and (not private.axia_office_access(item.organization_id) or exists(select 1 from private.office_member_access b
    where b.organization_id=item.organization_id and b.user_id=item.created_by and b.blocked)) then
    raise exception using errcode='42501',message='CONTROL_OFFICE_UNAVAILABLE'; end if;
  return private.axia_staff_accept_before_control(p_token);
end $$;
revoke all on function private.axia_staff_manage(uuid,text,text,text,uuid),private.axia_staff_accept(text) from public,anon,authenticated;
grant execute on function private.axia_staff_manage(uuid,text,text,text,uuid),private.axia_staff_accept(text) to authenticated;

create function private.axia_control_tenant_write_guard() returns trigger
language plpgsql security definer set search_path='' as $$ begin
  if auth.uid() is not null and not private.axia_office_access(new.organization_id) then
    raise exception using errcode='42501',message='CONTROL_OFFICE_UNAVAILABLE'; end if;
  return new;
end $$;
do $$ declare t text; begin
  foreach t in array array['clients','matters','tasks','documents','hearings','financial_records','matter_parties','client_powers_of_attorney','staff_invitations','rajih_action_requests'] loop
    execute format('create trigger control_write_gate before insert or update on public.%I for each row execute function private.axia_control_tenant_write_guard()',t);
  end loop;
end $$;

create function private.axia_control_membership_guard() returns trigger
language plpgsql security definer set search_path='' as $$
declare cap integer; begin
  perform 1 from public.organizations where id=new.organization_id for update;
  select seat_limit into cap from private.office_controls where organization_id=new.organization_id;
  if tg_op='INSERT' and cap is not null and (select count(*) from public.organization_members where organization_id=new.organization_id)>=cap then
    raise exception using errcode='23514',message='CONTROL_SEAT_LIMIT';
  end if;
  return new;
end $$;
create trigger control_membership_capacity before insert on public.organization_members
for each row execute function private.axia_control_membership_guard();

-- Storage first INSERTs an authorization probe with no final size, then rolls it back.
-- A deferred constraint checks the CURRENT final row at COMMIT, so probes can roll
-- back but no size-less row can commit. Known final bytes are serialized per office.
create function private.axia_control_storage_guard() returns trigger
language plpgsql security definer set search_path='' as $$
declare office uuid; cap bigint; used bigint; size_text text; current_row storage.objects; begin
  if tg_when='AFTER' then
    select * into current_row from storage.objects where id=new.id;
    if not found then return null; end if;
    new:=current_row;
  end if;
  if new.bucket_id<>'legal-documents' then return new; end if;
  if split_part(new.name,'/',1)!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return new; end if;
  office:=split_part(new.name,'/',1)::uuid;
  perform 1 from public.organizations where id=office for update;
  select storage_limit_mb::bigint*1048576 into cap from private.office_controls where organization_id=office;
  if cap is null then return new; end if;
  size_text:=new.metadata->>'size';
  if size_text is null or size_text!~'^[0-9]{1,12}$' then
    if tg_when='BEFORE' then return new; end if;
    raise exception 'CONTROL_STORAGE_SIZE_REQUIRED';
  end if;
  select coalesce(sum(case when metadata->>'size' ~ '^[0-9]{1,12}$' then (metadata->>'size')::bigint else cap end),0)
    into used from storage.objects where bucket_id=new.bucket_id and split_part(name,'/',1)=office::text and id<>new.id;
  if used+size_text::bigint>cap then raise exception 'CONTROL_STORAGE_LIMIT'; end if;
  return new;
end $$;
create trigger control_storage_capacity before insert or update of metadata on storage.objects
for each row execute function private.axia_control_storage_guard();
create constraint trigger control_storage_capacity_commit after insert or update on storage.objects
deferrable initially deferred for each row execute function private.axia_control_storage_guard();
create function private.axia_control_storage_access(object_name text) returns boolean
language sql stable security definer set search_path='' as $$
  select array_length(string_to_array(object_name,'/'),1)=3 and exists(
    select 1 from public.organization_members m where m.user_id=auth.uid()
      and m.organization_id::text=split_part(object_name,'/',1) and private.axia_office_access(m.organization_id));
$$;
-- AND existing storage permissions: blocked/suspended office members cannot use old URLs
-- except already-issued signed links, whose lifetime must remain short.
create function private.axia_control_support_file(object_name text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  if private.axia_platform_context()->>'state'<>'ready' then return false; end if;
  return exists(select 1 from private.office_support_grants g where g.user_id=auth.uid()
    and g.session_id=(auth.jwt()->>'session_id')::uuid and g.expires_at>clock_timestamp()
    and g.organization_id::text=split_part(object_name,'/',1) and g.allowed_paths ? object_name);
end $$;
create policy control_support_storage_read on storage.objects for select to authenticated
using(bucket_id='legal-documents' and private.axia_control_support_file(name));
create policy control_storage_gate on storage.objects as restrictive to authenticated
using(bucket_id<>'legal-documents' or private.axia_control_storage_access(name) or private.axia_control_support_file(name))
with check(bucket_id<>'legal-documents' or private.axia_control_storage_access(name));

create table public.legal_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  matter_id uuid,
  client_id uuid,
  created_by uuid not null references auth.users(id),
  legacy_id text,
  payload jsonb not null,
  revision integer not null default 1,
  archived boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique(id,organization_id),
  unique(organization_id,created_by,legacy_id),
  foreign key(matter_id,organization_id) references public.matters(id,organization_id),
  foreign key(client_id,organization_id) references public.clients(id,organization_id)
);
create index legal_drafts_office_recent on public.legal_drafts(organization_id,updated_at desc,id);
create index legal_drafts_matter on public.legal_drafts(matter_id) where matter_id is not null;
create index legal_drafts_creator on public.legal_drafts(created_by);
create index legal_drafts_client on public.legal_drafts(client_id) where client_id is not null;
create table public.legal_draft_versions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null,
  organization_id uuid not null,
  revision integer not null,
  payload jsonb not null,
  archived boolean not null,
  actor_id uuid not null references auth.users(id),
  created_at timestamptz not null default clock_timestamp(),
  unique(draft_id,revision),
  foreign key(draft_id,organization_id) references public.legal_drafts(id,organization_id)
);
create index legal_draft_versions_office on public.legal_draft_versions(organization_id,draft_id,revision);
create index legal_draft_versions_actor on public.legal_draft_versions(actor_id);
create trigger legal_draft_versions_immutable before update or delete on public.legal_draft_versions
for each row execute function private.axia_platform_audit_immutable();
create trigger legal_draft_versions_no_truncate before truncate on public.legal_draft_versions
for each statement execute function private.axia_platform_audit_immutable();
alter table public.legal_drafts enable row level security;
alter table public.legal_draft_versions enable row level security;
revoke all on public.legal_drafts,public.legal_draft_versions from public,anon,authenticated;
grant select on public.legal_drafts,public.legal_draft_versions to authenticated;
create policy legal_drafts_read on public.legal_drafts for select to authenticated using(
  private.is_organization_member(organization_id) and (matter_id is null or private.can_access_matter(matter_id)));
create policy legal_draft_versions_read on public.legal_draft_versions for select to authenticated using(
  exists(select 1 from public.legal_drafts d where d.id=draft_id and d.organization_id=legal_draft_versions.organization_id));

create function private.axia_draft_save(p_office uuid,p_id uuid,p_revision integer,p_payload jsonb,p_archived boolean,p_legacy_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare old_row public.legal_drafts; saved public.legal_drafts; matter uuid; client uuid; creator uuid; saved_at timestamptz:=clock_timestamp(); begin
  if not private.has_organization_role(p_office,array['owner','admin','lawyer','staff','trainee']::public.app_role[]) then
    raise exception using errcode='42501',message='DRAFT_FORBIDDEN'; end if;
  if p_id is null or p_revision is null or p_revision<0 or p_payload is null or jsonb_typeof(p_payload)<>'object'
    or octet_length(p_payload::text)>1048576 or length(coalesce(p_payload->>'title','')) not between 1 and 300
    or jsonb_typeof(p_payload->'contentHtml') is distinct from 'string' or jsonb_typeof(p_payload->'versions') is distinct from 'array'
    or jsonb_array_length(p_payload->'versions')>200 or p_archived is null
    or (p_legacy_id is not null and length(p_legacy_id) not between 1 and 120) then
    raise exception using errcode='22023',message='DRAFT_INVALID'; end if;
  select * into old_row from public.legal_drafts where id=p_id for update;
  if found and (old_row.organization_id<>p_office or old_row.revision<>p_revision) then
    raise exception using errcode='40001',message='DRAFT_CONFLICT'; end if;
  if not found and p_revision<>0 then raise exception using errcode='40001',message='DRAFT_CONFLICT'; end if;
  creator:=coalesce(old_row.created_by,auth.uid());
  if creator<>auth.uid() and not private.has_organization_role(p_office,array['owner','admin','lawyer']::public.app_role[]) then
    raise exception using errcode='42501',message='DRAFT_FORBIDDEN'; end if;
  if old_row.matter_id is not null and not private.can_write_matter(old_row.matter_id) then
    raise exception using errcode='42501',message='DRAFT_FORBIDDEN'; end if;
  matter:=nullif(p_payload->>'matterId','')::uuid; client:=nullif(p_payload->>'clientId','')::uuid;
  if matter is not null and (not private.can_write_matter(matter) or not exists(select 1 from public.matters where id=matter and organization_id=p_office
      and (client is null or client_id=client))) then raise exception using errcode='42501',message='DRAFT_FORBIDDEN'; end if;
  if client is not null and not exists(select 1 from public.clients where id=client and organization_id=p_office) then
    raise exception using errcode='42501',message='DRAFT_FORBIDDEN'; end if;
  -- Payload identity/time are canonical even when an authenticated client calls RPC directly.
  p_payload:=p_payload||jsonb_build_object('id',p_id,'createdAt',coalesce(old_row.created_at,saved_at),'updatedAt',saved_at);
  insert into public.legal_drafts(id,organization_id,matter_id,client_id,created_by,legacy_id,payload,revision,archived,created_at,updated_at)
    values(p_id,p_office,matter,client,creator,p_legacy_id,p_payload,1,p_archived,coalesce(old_row.created_at,saved_at),saved_at)
    on conflict(id) do update set matter_id=excluded.matter_id,client_id=excluded.client_id,payload=excluded.payload,
      revision=legal_drafts.revision+1,archived=excluded.archived,updated_at=saved_at
    where legal_drafts.organization_id=p_office and legal_drafts.revision=p_revision and legal_drafts.created_by=creator
    returning * into saved;
  -- Includes simultaneous first saves: the loser must never overwrite another office/creator.
  if not found then raise exception using errcode='40001',message='DRAFT_CONFLICT'; end if;
  insert into public.legal_draft_versions(draft_id,organization_id,revision,payload,archived,actor_id)
    values(saved.id,p_office,saved.revision,saved.payload,saved.archived,auth.uid());
  return to_jsonb(saved);
end $$;
create function public.axia_draft_save(p_office uuid,p_id uuid,p_revision integer,p_payload jsonb,p_archived boolean default false,p_legacy_id text default null) returns jsonb
language sql security invoker set search_path='' as $$ select private.axia_draft_save(p_office,p_id,p_revision,p_payload,p_archived,p_legacy_id) $$;

create function private.axia_control(p_action text,p_office uuid,p_input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ctx jsonb; result jsonb; before_row jsonb; after_row jsonb; reason text; actor uuid:=auth.uid();
  sid uuid; limit_rows integer:=20; after_id uuid; target uuid; new_id uuid; member_role public.app_role;
  old_role public.app_role; old_blocked boolean; cfg private.office_controls; dataset text; allowed text[];
  paths jsonb; query_text text; table_name text; clause text; parts text[]:=array[]::text[]; row_count bigint;
begin
  ctx:=private.axia_platform_context();
  if ctx->>'state'<>'ready' then raise exception using errcode='42501',message='CONTROL_FORBIDDEN'; end if;
  sid:=(auth.jwt()->>'session_id')::uuid;
  if p_action is null or p_action not in ('capabilities','list','overview','members','configure','create','member','support','end_support','records','export','file','audit')
    or p_input is null or jsonb_typeof(p_input)<>'object' or octet_length(p_input::text)>8192 then
    raise exception using errcode='22023',message='CONTROL_INVALID'; end if;
  if (select count(*) from private.control_events where actor_id=actor and created_at>clock_timestamp()-interval '1 minute')>=120 then raise exception 'CONTROL_RATE_LIMIT'; end if;
  allowed:=case p_action
    when 'capabilities' then array[]::text[] when 'list' then array['limit','after'] when 'overview' then array[]::text[]
    when 'members' then array['limit','after'] when 'audit' then array['limit','after']
    when 'configure' then array['revision','status','plan','expiresAt','seatLimit','storageLimitMb','rajihEnabled','reason']
    when 'create' then array['name','slug','ownerEmail','reason'] when 'member' then array['userId','role','blocked','reason']
    when 'support' then array['reason'] when 'end_support' then array[]::text[]
    when 'records' then array['dataset','limit','after'] when 'export' then array['reason'] when 'file' then array['path'] end;
  if exists(select 1 from jsonb_object_keys(p_input) k where not k=any(allowed)) then raise exception using errcode='22023',message='CONTROL_INVALID'; end if;
  if p_action not in ('capabilities','list','audit','create') and not exists(select 1 from public.organizations where id=p_office) then
    raise exception using errcode='22023',message='CONTROL_OFFICE_REQUIRED'; end if;
  if p_action in ('list','members','records','audit') then
    limit_rows:=coalesce((p_input->>'limit')::integer,20); after_id:=nullif(p_input->>'after','')::uuid;
    if limit_rows<1 or limit_rows>50 then raise exception using errcode='22023',message='CONTROL_INVALID'; end if;
  end if;
  if p_action in ('configure','create','member','support','export') then
    reason:=btrim(p_input->>'reason');
    if reason is null or length(reason) not between 8 and 500 then raise exception using errcode='22023',message='CONTROL_REASON_REQUIRED'; end if;
  else reason:='Authenticated control center '||p_action; end if;
  if p_action='capabilities' then
    result:=jsonb_build_object('version',1,'offices',(select count(*) from public.organizations),
      'members',(select count(*) from public.organization_members),'configured',(select count(*) from private.office_controls));
  elsif p_action='list' then
    select jsonb_build_object('items',coalesce(jsonb_agg(to_jsonb(x) order by x.id),'[]'::jsonb),'nextCursor',
      case when count(*)=limit_rows then max(x.id::text) else null end) into result from (
      select o.id,o.name,o.slug,o.created_at as "createdAt",coalesce(c.status,'active') as status,
        coalesce(c.plan,'unconfigured') as plan,c.expires_at as "expiresAt",coalesce(c.revision,0) as revision
      from public.organizations o left join private.office_controls c on c.organization_id=o.id
      where after_id is null or o.id>after_id order by o.id limit limit_rows) x;
  elsif p_action='overview' then
    select jsonb_build_object('office',to_jsonb(o),'control',to_jsonb(c),'members',(select count(*) from public.organization_members where organization_id=p_office),
      'storageBytes',(select coalesce(sum(case when metadata->>'size' ~ '^[0-9]{1,12}$' then (metadata->>'size')::bigint else 0 end),0) from storage.objects where bucket_id='legal-documents' and split_part(name,'/',1)=p_office::text),
      'clients',(select count(*) from public.clients where organization_id=p_office),'matters',(select count(*) from public.matters where organization_id=p_office),
      'drafts',(select count(*) from public.legal_drafts where organization_id=p_office)) into result
      from public.organizations o left join private.office_controls c on c.organization_id=o.id where o.id=p_office;
  elsif p_action='members' then
    select jsonb_build_object('items',coalesce(jsonb_agg(to_jsonb(x) order by x.id),'[]'::jsonb),'nextCursor',case when count(*)=limit_rows then max(x.id::text) else null end)
      into result from (select m.user_id as id,m.role,u.email,p.full_name as name,coalesce(b.blocked,false) as blocked,
        exists(select 1 from private.platform_principals pr where pr.user_id=m.user_id) as protected
        from public.organization_members m join auth.users u on u.id=m.user_id left join public.profiles p on p.id=m.user_id
        left join private.office_member_access b on b.organization_id=m.organization_id and b.user_id=m.user_id
        where m.organization_id=p_office and (after_id is null or m.user_id>after_id) order by m.user_id limit limit_rows) x;
  elsif p_action='configure' then
    perform 1 from public.organizations where id=p_office for update;
    select * into cfg from private.office_controls where organization_id=p_office;
    if coalesce(cfg.revision,0) is distinct from (p_input->>'revision')::integer then raise exception using errcode='40001',message='CONTROL_CONFLICT'; end if;
    before_row:=to_jsonb(cfg);
    if p_input->>'status' is null or p_input->>'plan' is null or p_input->>'seatLimit' is null or p_input->>'storageLimitMb' is null
      or jsonb_typeof(p_input->'rajihEnabled') is distinct from 'boolean' then raise exception using errcode='22023',message='CONTROL_INVALID'; end if;
    insert into private.office_controls(organization_id,status,plan,expires_at,seat_limit,storage_limit_mb,rajih_enabled)
      values(p_office,p_input->>'status',btrim(p_input->>'plan'),nullif(p_input->>'expiresAt','')::timestamptz,
        (p_input->>'seatLimit')::integer,(p_input->>'storageLimitMb')::integer,(p_input->>'rajihEnabled')::boolean)
      on conflict(organization_id) do update set status=excluded.status,plan=excluded.plan,expires_at=excluded.expires_at,seat_limit=excluded.seat_limit,
        storage_limit_mb=excluded.storage_limit_mb,rajih_enabled=excluded.rajih_enabled,revision=office_controls.revision+1,updated_at=clock_timestamp()
      returning to_jsonb(office_controls) into after_row;
    result:=after_row;
  elsif p_action='create' then
    select id into target from auth.users where lower(email)=lower(btrim(p_input->>'ownerEmail'));
    if length(btrim(coalesce(p_input->>'name',''))) not between 2 and 120 or coalesce(p_input->>'slug','')!~'^[a-z0-9]+(-[a-z0-9]+)*$'
      or length(p_input->>'slug') not between 2 and 64 then raise exception using errcode='22023',message='CONTROL_INVALID'; end if;
    perform 1 from auth.users where id=target and email_confirmed_at is not null and not coalesce(is_anonymous,false)
      and (banned_until is null or banned_until<clock_timestamp()) for update;
    if not found or exists(select 1 from public.organization_members where user_id=target) then raise exception using errcode='42501',message='CONTROL_OWNER_UNAVAILABLE'; end if;
    new_id:=gen_random_uuid();
    insert into public.organizations(id,name,slug,created_by) values(new_id,btrim(p_input->>'name'),p_input->>'slug',actor);
    insert into public.organization_members(organization_id,user_id,role) values(new_id,target,'owner');
    p_office:=new_id; result:=jsonb_build_object('id',new_id); after_row:=jsonb_build_object('ownerId',target,'name',p_input->>'name');
  elsif p_action='member' then
    perform 1 from public.organizations where id=p_office for update;
    target:=(p_input->>'userId')::uuid; member_role:=(p_input->>'role')::public.app_role;
    if target is null or member_role is null or jsonb_typeof(p_input->'blocked') is distinct from 'boolean' then raise exception using errcode='22023',message='CONTROL_INVALID'; end if;
    if exists(select 1 from private.platform_principals where user_id=target) then raise exception using errcode='42501',message='CONTROL_PROTECTED_IDENTITY'; end if;
    select role into old_role from public.organization_members where organization_id=p_office and user_id=target for update;
    if not found then raise exception using errcode='42501',message='CONTROL_MEMBER_UNAVAILABLE'; end if;
    if member_role='owner' and not (p_input->>'blocked')::boolean and not exists(select 1 from auth.users where id=target
      and email_confirmed_at is not null and not coalesce(is_anonymous,false) and (banned_until is null or banned_until<clock_timestamp())) then
      raise exception using errcode='42501',message='CONTROL_OWNER_UNAVAILABLE'; end if;
    select coalesce(blocked,false) into old_blocked from private.office_member_access where organization_id=p_office and user_id=target;
    if old_role='owner' and (member_role<>'owner' or (p_input->>'blocked')::boolean) and
      not exists(select 1 from public.organization_members m left join private.office_member_access b on b.organization_id=m.organization_id and b.user_id=m.user_id
        join auth.users u on u.id=m.user_id and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
          and (u.banned_until is null or u.banned_until<clock_timestamp())
        where m.organization_id=p_office and m.user_id<>target and m.role='owner' and not coalesce(b.blocked,false)) then
      raise exception using errcode='42501',message='CONTROL_LAST_OWNER'; end if;
    before_row:=jsonb_build_object('userId',target,'role',old_role,'blocked',coalesce(old_blocked,false));
    update public.organization_members set role=member_role where organization_id=p_office and user_id=target;
    insert into private.office_member_access values(p_office,target,(p_input->>'blocked')::boolean)
      on conflict(organization_id,user_id) do update set blocked=excluded.blocked;
    after_row:=jsonb_build_object('userId',target,'role',member_role,'blocked',(p_input->>'blocked')::boolean);result:=after_row;
  elsif p_action in ('support','export') then
    if p_action='support' then
      select coalesce(jsonb_agg(storage_path),'[]'::jsonb) into paths from public.documents where organization_id=p_office;
      result:=jsonb_build_object('expiresAt',clock_timestamp()+interval '15 minutes');
    else
      -- ONE SELECT captures all relations with one MVCC snapshot, never page-by-page.
      foreach table_name in array array['organizations','organization_members','profiles','clients','matters','matter_members','tasks','hearings',
        'financial_records','documents','matter_parties','client_powers_of_attorney','audit_logs','staff_invitations','rajih_action_requests','legal_drafts','legal_draft_versions'] loop
        clause:=case table_name when 'organizations' then 't.id=$1'
          when 'profiles' then 't.id in(select user_id from public.organization_members where organization_id=$1)'
          when 'matter_members' then 't.matter_id in(select id from public.matters where organization_id=$1)'
          else 't.organization_id=$1' end;
        parts:=array_append(parts,format('%L,(select coalesce(jsonb_agg(%s),''[]''::jsonb) from public.%I t where %s)',table_name,
          case when table_name='staff_invitations' then 'to_jsonb(t)-''token_hash''' else 'to_jsonb(t)' end,table_name,clause));
      end loop;
      query_text:='select jsonb_build_object(''format'',''axia-office-snapshot'',''version'',1,''organizationId'',$1,''capturedAt'',statement_timestamp(),''tables'',jsonb_build_object('||array_to_string(parts,',')||'),''storage'',(select coalesce(jsonb_agg(jsonb_build_object(''path'',s.name,''size'',s.metadata->>''size'',''expectedHash'',(select d.content_hash from public.documents d where d.organization_id=$1 and d.storage_path=s.name limit 1))),''[]''::jsonb) from storage.objects s where s.bucket_id=''legal-documents'' and split_part(s.name,''/'',1)=$1::text))';
      execute query_text into result using p_office;
      select coalesce(sum(jsonb_array_length(value)),0) into row_count from jsonb_each(result->'tables');
      if row_count>10000 or octet_length(result::text)>3145728 or jsonb_array_length(result->'storage')>200 then raise exception 'CONTROL_EXPORT_TOO_LARGE'; end if;
      if exists(select 1 from jsonb_array_elements(result->'storage') f where f->>'size' is null or f->>'size'!~'^[0-9]{1,12}$'
        or array_length(string_to_array(f->>'path','/'),1)<>3 or position('..' in (f->>'path'))>0) then raise exception 'CONTROL_FILE_MANIFEST_INVALID'; end if;
      if exists(select 1 from jsonb_array_elements(result->'tables'->'documents') d where not exists(select 1 from jsonb_array_elements(result->'storage') f where f->>'path'=d->>'storage_path')) then raise exception 'CONTROL_FILE_MISSING'; end if;
      select coalesce(jsonb_agg(f->>'path'),'[]'::jsonb) into paths from jsonb_array_elements(result->'storage') f;
      after_row:=jsonb_build_object('rows',row_count,'files',jsonb_array_length(paths),'capturedAt',result->>'capturedAt');
    end if;
    insert into private.office_support_grants(user_id,session_id,organization_id,purpose,reason,allowed_paths,expires_at)
      values(actor,sid,p_office,case when p_action='export' then 'export' else 'read' end,reason,paths,clock_timestamp()+interval '15 minutes')
      on conflict(user_id,session_id) do update set organization_id=excluded.organization_id,purpose=excluded.purpose,reason=excluded.reason,
        allowed_paths=excluded.allowed_paths,expires_at=excluded.expires_at;
  elsif p_action='end_support' then
    update private.office_support_grants set expires_at=clock_timestamp() where user_id=actor and session_id=sid and organization_id=p_office;
    result:=jsonb_build_object('ended',true);
  elsif p_action in ('records','file') then
    if not exists(select 1 from private.office_support_grants where user_id=actor and session_id=sid and organization_id=p_office and expires_at>clock_timestamp()) then
      raise exception using errcode='42501',message='CONTROL_SUPPORT_REQUIRED'; end if;
    if p_action='file' then
      if not private.axia_control_support_file(p_input->>'path') then raise exception using errcode='42501',message='CONTROL_FILE_FORBIDDEN'; end if;
      result:=jsonb_build_object('path',p_input->>'path');after_row:=jsonb_build_object('path',p_input->>'path');
    else
      dataset:=p_input->>'dataset';
      if dataset is null or dataset not in ('clients','matters','tasks','hearings','financial_records','documents','legal_drafts') then raise exception using errcode='22023',message='CONTROL_INVALID'; end if;
      execute format('select jsonb_build_object(''items'',coalesce(jsonb_agg(to_jsonb(x) order by x.id),''[]''::jsonb),''nextCursor'',case when count(*)=$3 then max(x.id::text) else null end) from (select * from public.%I where organization_id=$1 and ($2 is null or id>$2) order by id limit $3) x',dataset)
        into result using p_office,after_id,limit_rows;
      after_row:=jsonb_build_object('dataset',dataset,'rows',jsonb_array_length(result->'items'));
    end if;
  elsif p_action='audit' then
    select jsonb_build_object('items',coalesce(jsonb_agg(to_jsonb(x) order by x.id),'[]'::jsonb),'nextCursor',case when count(*)=limit_rows then max(x.id::text) else null end)
      into result from (select * from private.control_events where (p_office is null or organization_id=p_office) and (after_id is null or id>after_id) order by id limit limit_rows) x;
  end if;
  insert into private.control_events(actor_id,organization_id,action,reason,detail) values(actor,p_office,'control.'||p_action,reason,
    jsonb_strip_nulls(jsonb_build_object('before',before_row,'after',after_row)));
  return result;
end $$;
create function public.axia_control(p_action text,p_office uuid default null,p_input jsonb default '{}'::jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select private.axia_control(p_action,p_office,p_input) $$;

create function private.axia_rajih_entitled(p_office uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select private.is_organization_member(p_office) and not exists(select 1 from private.office_controls where organization_id=p_office and not rajih_enabled);
$$;
create function public.axia_rajih_entitled(p_office uuid) returns boolean
language sql security invoker set search_path='' as $$ select private.axia_rajih_entitled(p_office) $$;
create policy control_rajih_entitlement on public.rajih_action_requests as restrictive to authenticated
using(private.axia_rajih_entitled(organization_id)) with check(private.axia_rajih_entitled(organization_id));

-- Own routing/status metadata only, including suspended memberships. No office data.
create function private.axia_workspace_access() returns jsonb
language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('organization_id',m.organization_id,'role',m.role,'created_at',m.created_at,
    'access',case when coalesce(b.blocked,false) then 'MEMBER_SUSPENDED' when c.status='suspended' then 'WORKSPACE_SUSPENDED'
      when c.expires_at is not null and c.expires_at<=statement_timestamp() then 'WORKSPACE_EXPIRED' else 'ready' end) order by m.created_at),'[]'::jsonb)
  from public.organization_members m left join private.office_controls c on c.organization_id=m.organization_id
    left join private.office_member_access b on b.organization_id=m.organization_id and b.user_id=m.user_id where m.user_id=auth.uid();
$$;
create function public.axia_workspace_access() returns jsonb
language sql security invoker set search_path='' as $$ select private.axia_workspace_access() $$;

-- Harden every new function explicitly; PUBLIC inheritance must never grant access.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','private') and (p.proname like 'axia_control%' or p.proname in ('axia_office_access','axia_draft_save','axia_rajih_entitled','axia_workspace_access')) loop
    execute format('revoke all on function %s from public,anon,authenticated',f.sig);
    if f.sig::text not like '%guard()' then execute format('grant execute on function %s to authenticated',f.sig); end if;
  end loop;
end $$;

commit;
