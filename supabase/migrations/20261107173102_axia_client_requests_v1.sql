-- AXIA Client Requests V1. Local review only; requires the applied D3 foundation.
-- Additive schema and scoped policies. No seed data, Auth configuration, or delete grant.
begin;

-- Refuse to replace a D3 control function that has changed since review.
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
create index client_request_audit_idx on public.audit_logs(organization_id,resource_id,created_at desc,id desc) where resource_type='client_request';

alter table public.client_requests enable row level security;
revoke all on public.client_requests from public,anon,authenticated;
grant select on public.client_requests to authenticated;
grant insert(organization_id,client_id,matter_id,assigned_to,title,summary,status,follow_up_on) on public.client_requests to authenticated;
grant update(client_id,matter_id,assigned_to,title,summary,status,follow_up_on,archived) on public.client_requests to authenticated;

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

-- The normal SELECT policies on the audit table must not reveal the existence
-- of restricted requests. Reserve this namespace for the audit trigger.
create policy client_request_audit_scope on public.audit_logs as restrictive for select to authenticated using (
  (resource_type is distinct from 'client_request' and action not like 'client_request.%')
  or exists(select 1 from public.client_requests r where r.id=resource_id and r.organization_id=audit_logs.organization_id)
);
create policy client_request_audit_read on public.audit_logs for select to authenticated using (
  resource_type='client_request' and action like 'client_request.%'
  and exists(select 1 from public.client_requests r where r.id=resource_id and r.organization_id=audit_logs.organization_id)
);
create policy client_request_audit_no_forge on public.audit_logs as restrictive for insert to authenticated with check (
  resource_type is distinct from 'client_request' and action not like 'client_request.%'
);
create policy client_request_audit_no_rewrite on public.audit_logs as restrictive for update to authenticated
using (resource_type is distinct from 'client_request' and action not like 'client_request.%')
with check (resource_type is distinct from 'client_request' and action not like 'client_request.%');
create policy client_request_audit_no_delete on public.audit_logs as restrictive for delete to authenticated
using (resource_type is distinct from 'client_request' and action not like 'client_request.%');

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
revoke all on function private.client_request_revision(),private.audit_client_request() from public,anon,authenticated;
create trigger client_request_revision before update on public.client_requests for each row execute function private.client_request_revision();
create trigger client_request_audit after insert or update on public.client_requests for each row execute function private.audit_client_request();

-- Same D3 control function and guards; only the export table list/version changes.
-- Requests and their audit rows are captured by the same MVCC SELECT.
create or replace function private.axia_control(p_action text,p_office uuid,p_input jsonb) returns jsonb
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
    -- Email is an operator selector, not authority: ambiguous identities fail closed.
    select case when count(*)=1 then min(id::text)::uuid else null end into target
      from auth.users where lower(email)=lower(btrim(p_input->>'ownerEmail'));
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
        'financial_records','documents','matter_parties','client_powers_of_attorney','audit_logs','staff_invitations','rajih_action_requests','legal_drafts','legal_draft_versions','client_requests'] loop
        clause:=case table_name when 'organizations' then 't.id=$1'
          when 'profiles' then 't.id in(select user_id from public.organization_members where organization_id=$1)'
          when 'matter_members' then 't.matter_id in(select id from public.matters where organization_id=$1)'
          else 't.organization_id=$1' end;
        parts:=array_append(parts,format('%L,(select coalesce(jsonb_agg(%s),''[]''::jsonb) from public.%I t where %s)',table_name,
          case when table_name='staff_invitations' then 'to_jsonb(t)-''token_hash''' else 'to_jsonb(t)' end,table_name,clause));
      end loop;
      query_text:='select jsonb_build_object(''format'',''axia-office-snapshot'',''version'',2,''organizationId'',$1,''capturedAt'',statement_timestamp(),''tables'',jsonb_build_object('||array_to_string(parts,',')||'),''storage'',(select coalesce(jsonb_agg(jsonb_build_object(''path'',s.name,''size'',s.metadata->>''size'',''expectedHash'',(select d.content_hash from public.documents d where d.organization_id=$1 and d.storage_path=s.name limit 1))),''[]''::jsonb) from storage.objects s where s.bucket_id=''legal-documents'' and split_part(s.name,''/'',1)=$1::text))';
      execute query_text into result using p_office;
      -- An office without requests still exports its compatible v1 payload.
      if jsonb_array_length(result->'tables'->'client_requests')=0 then
        result:=jsonb_set(result #- '{tables,client_requests}', '{version}', '1'::jsonb);
      end if;
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

commit;
