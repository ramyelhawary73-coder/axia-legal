-- REVIEW ONLY. NOT in migrations/. Never run against hosted Supabase without explicit approval.
-- Bounded phase: own-device generic delayed test only. No legal-event scheduler or role/data changes.
-- Apply to an approved isolated database with synthetic users, after recording its actual Auth policy.
begin;
do $$ begin
  if to_regclass('auth.sessions') is null or to_regclass('auth.mfa_factors') is null
    or to_regclass('public.organization_members') is null or to_regclass('private.office_controls') is null
    or to_regclass('private.office_member_access') is null
    or not exists(select 1 from information_schema.columns where table_schema='auth' and table_name='sessions' and column_name='refreshed_at')
  then raise exception 'PUSH_PREREQUISITES_MISSING'; end if;
  if exists(select 1 from pg_roles where rolname in ('axia_push_api_owner','axia_push_dispatcher')) then
    raise exception 'PUSH_ROLE_ALREADY_EXISTS_REVIEW_REQUIRED'; end if;
end $$;
create role axia_push_api_owner nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
create role axia_push_dispatcher nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
grant usage on schema private, public, auth to axia_push_api_owner;
grant usage on schema private to axia_push_dispatcher;
-- Temporary CREATE is required for ownership transfer on non-superuser migration operators.
-- It is revoked before commit; no runtime identity gets schema DDL.
grant create on schema private,public to axia_push_api_owner;
do $$ begin
  if not has_function_privilege('axia_push_api_owner','auth.uid()','execute')
    or not has_function_privilege('axia_push_api_owner','auth.jwt()','execute')
  then raise exception 'PUSH_AUTH_HELPER_EXECUTE_MISSING'; end if;
end $$;

create table private.push_configuration (
  scope text primary key check(scope='axia-push-preview-v1'),
  enabled boolean not null default false,
  origin text,
  dispatcher_seen_at timestamptz,
  -- Attest actual current provider settings; NULL/stale attestation fails closed.
  timebox_seconds integer check(timebox_seconds>=0),
  inactivity_seconds integer check(inactivity_seconds>=0),
  single_session boolean,
  auth_policy_verified_at timestamptz,
  check(origin is null or origin ~ '^https://[a-zA-Z0-9-]+\.vercel\.app$')
);
insert into private.push_configuration(scope) values('axia-push-preview-v1');
create table private.push_devices (
  id uuid primary key,
  scope text not null references private.push_configuration(scope),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid references auth.sessions(id) on delete set null,
  origin text not null,
  endpoint_hash text not null check(endpoint_hash ~ '^[0-9a-f]{64}$'),
  ciphertext text check(length(ciphertext) between 40 and 8192 and ciphertext ~ '^[A-Za-z0-9_-]+$'),
  revision integer not null default 1 check(revision>0),
  consented_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check(revoked_at is not null or ciphertext is not null)
);
create unique index push_active_endpoint on private.push_devices(scope,endpoint_hash) where revoked_at is null;
create index push_own_devices on private.push_devices(scope,user_id,organization_id,expires_at) where revoked_at is null;
create table private.push_outbox (
  id uuid primary key default gen_random_uuid(),
  scope text not null check(scope='axia-push-preview-v1'),
  device_id uuid not null references private.push_devices(id) on delete cascade,
  request_id uuid not null,
  kind text not null default 'test' check(kind='test'),
  scheduled_at timestamptz not null,
  expires_at timestamptz not null,
  state text not null default 'pending' check(state in ('pending','claimed','submitted','retry','suppressed','expired','failed','revoked','halted')),
  attempt_count integer not null default 0 check(attempt_count between 0 and 3),
  next_attempt_at timestamptz not null,
  lease_until timestamptz,
  nonce_hash text,
  reason_code text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique(device_id,request_id),
  check(expires_at>scheduled_at and expires_at<=scheduled_at+interval '5 minutes')
);
create index push_due_jobs on private.push_outbox(scope,next_attempt_at,id) where state in ('pending','retry','claimed');
create table private.push_delivery_audit (
  id uuid primary key default gen_random_uuid(),
  scope text not null check(scope='axia-push-preview-v1'),
  device_id uuid,
  outbox_id uuid,
  actor_id uuid,
  action text not null check(action in ('enrolled','revoked','queued','submitted','retry','suppressed','expired','failed','halted')),
  reason_code text not null,
  created_at timestamptz not null default clock_timestamp()
);
create index push_audit_retention on private.push_delivery_audit(scope,created_at);
create index push_audit_rate on private.push_delivery_audit(scope,actor_id,action,created_at);
do $$ declare t text; begin
  foreach t in array array['push_configuration','push_devices','push_outbox','push_delivery_audit'] loop
    execute format('alter table private.%I enable row level security',t);
    execute format('alter table private.%I force row level security',t);
    execute format('revoke all on private.%I from public,anon,authenticated,axia_push_dispatcher',t);
    execute format('alter table private.%I owner to axia_push_api_owner',t);
    execute format('create policy push_function_owner on private.%I to axia_push_api_owner using(true) with check(true)',t);
  end loop;
end $$;

-- Sole privileged read bridge, owned by the migration operator (normally postgres).
-- No grants on existing tables, RLS changes, auth triggers, token reads, or impersonation.
-- Review its exact source and owner before approval. Only NOLOGIN API owner can execute it.
create function private.axia_push_live(p_user uuid,p_session uuid,p_org uuid,p_until timestamptz) returns boolean
language sql stable security definer set search_path='' as $$
 select p_until>statement_timestamp() and exists(
  select 1 from private.push_configuration c
  join auth.users u on u.id=p_user
  join auth.sessions s on s.id=p_session and s.user_id=u.id
  join public.organization_members m on m.user_id=u.id and m.organization_id=p_org
  where c.scope='axia-push-preview-v1' and c.enabled and c.origin is not null
    and c.auth_policy_verified_at between statement_timestamp()-interval '6 hours' and statement_timestamp()
    and c.timebox_seconds is not null and c.inactivity_seconds is not null and c.single_session is not null
    and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
    and (u.banned_until is null or u.banned_until<=statement_timestamp())
    and (s.not_after is null or s.not_after>statement_timestamp())
    and (c.timebox_seconds=0 or s.created_at+make_interval(secs=>c.timebox_seconds)>statement_timestamp())
    and (c.inactivity_seconds=0 or coalesce(s.refreshed_at,s.created_at)+make_interval(secs=>c.inactivity_seconds)>statement_timestamp())
    and (not c.single_session or not exists(select 1 from auth.sessions newer where newer.user_id=u.id and newer.created_at>s.created_at))
    and (not exists(select 1 from auth.mfa_factors f where f.user_id=u.id and f.status='verified')
      or (s.aal='aal2' and exists(select 1 from auth.mfa_factors f where f.id=s.factor_id and f.user_id=u.id and f.status='verified')))
    and not exists(select 1 from private.office_controls o where o.organization_id=p_org
      and (o.status<>'active' or (o.expires_at is not null and o.expires_at<=statement_timestamp())))
    and not exists(select 1 from private.office_member_access b where b.organization_id=p_org and b.user_id=u.id and b.blocked)
 );
$$;
revoke all on function private.axia_push_live(uuid,uuid,uuid,timestamptz) from public,anon,authenticated,axia_push_dispatcher;
grant execute on function private.axia_push_live(uuid,uuid,uuid,timestamptz) to axia_push_api_owner;

create function private.axia_push_context(p_org uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); s uuid; e timestamptz; begin
  s:=(auth.jwt()->>'session_id')::uuid;
  e:=to_timestamp((auth.jwt()->>'exp')::double precision);
  if u is null or s is null or e is null or not private.axia_push_live(u,s,p_org,e)
    then raise exception using errcode='42501',message='PUSH_UNAVAILABLE'; end if;
  return jsonb_build_object('user',u,'session',s,'expires',least(e,clock_timestamp()+interval '15 minutes'));
end $$;

create function public.axia_push_status(p_org uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ctx jsonb; o text; heartbeat timestamptz; begin
  ctx:=private.axia_push_context(p_org);
  select origin,dispatcher_seen_at into o,heartbeat from private.push_configuration where scope='axia-push-preview-v1';
  return jsonb_build_object('ready',true,'origin',o,'leaseUntil',ctx->>'expires','testOnly',true,
    'workerReady',coalesce(heartbeat between statement_timestamp()-interval '30 seconds' and statement_timestamp()+interval '5 seconds',false));
end $$;

create function public.axia_push_enroll(p_org uuid,p_device uuid,p_hash text,p_ciphertext text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ctx jsonb; u uuid; s uuid; o text; e timestamptz; begin
  ctx:=private.axia_push_context(p_org); u:=(ctx->>'user')::uuid; s:=(ctx->>'session')::uuid; e:=(ctx->>'expires')::timestamptz;
  perform pg_advisory_xact_lock(hashtextextended('push-enroll:'||u::text||':'||p_org::text,0));
  if p_device is null or p_hash !~ '^[0-9a-f]{64}$' or (length(p_ciphertext) not between 40 and 8192 or p_ciphertext !~ '^[A-Za-z0-9_-]+$')
    or p_hash is null or p_ciphertext is null or e<clock_timestamp()+interval '7 minutes' then
    raise exception using errcode='22023',message='PUSH_INVALID'; end if;
  if (select count(*) from private.push_delivery_audit where scope='axia-push-preview-v1' and actor_id=u and action='enrolled'
    and created_at>clock_timestamp()-interval '10 minutes')>=10 then raise exception 'PUSH_RATE_LIMIT'; end if;
  if exists(select 1 from private.push_devices where id=p_device)
    or exists(select 1 from private.push_devices where scope='axia-push-preview-v1' and endpoint_hash=p_hash and revoked_at is null
      and (user_id<>u or organization_id<>p_org)) then raise exception using errcode='42501',message='PUSH_UNAVAILABLE'; end if;
  -- Explicit enrollment renews only this user's matching endpoint. Never silently rebind another account.
  update private.push_devices set revoked_at=clock_timestamp(),ciphertext=null,revision=revision+1
    where scope='axia-push-preview-v1' and user_id=u and organization_id=p_org and revoked_at is null
      and (endpoint_hash=p_hash or expires_at<=clock_timestamp());
  update private.push_outbox j set state='revoked',reason_code='consent_replaced',updated_at=clock_timestamp()
    where j.device_id in(select d.id from private.push_devices d where d.user_id=u and d.organization_id=p_org and d.revoked_at is not null)
      and j.state in ('pending','retry','claimed');
  if (select count(*) from private.push_devices where scope='axia-push-preview-v1' and user_id=u and organization_id=p_org and revoked_at is null)>=5
    then raise exception 'PUSH_DEVICE_LIMIT'; end if;
  select origin into o from private.push_configuration where scope='axia-push-preview-v1';
  insert into private.push_devices(id,scope,user_id,organization_id,session_id,origin,endpoint_hash,ciphertext,expires_at)
    values(p_device,'axia-push-preview-v1',u,p_org,s,o,p_hash,p_ciphertext,e);
  insert into private.push_delivery_audit(scope,device_id,actor_id,action,reason_code)
    values('axia-push-preview-v1',p_device,u,'enrolled','explicit_test_consent');
  return jsonb_build_object('id',p_device,'expiresAt',e);
end $$;

create function public.axia_push_revoke(p_org uuid,p_device uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ctx jsonb; u uuid; begin
  ctx:=private.axia_push_context(p_org); u:=(ctx->>'user')::uuid;
  update private.push_devices set revoked_at=coalesce(revoked_at,clock_timestamp()),ciphertext=null,revision=revision+1
    where id=p_device and user_id=u and organization_id=p_org and revoked_at is null;
  if found then
    update private.push_outbox set state='revoked',reason_code='explicit_revoke',updated_at=clock_timestamp()
      where device_id=p_device and state in ('pending','retry','claimed');
    insert into private.push_delivery_audit(scope,device_id,actor_id,action,reason_code)
      values('axia-push-preview-v1',p_device,u,'revoked','explicit_revoke');
  end if;
  return jsonb_build_object('revoked',true);
end $$;

create function public.axia_push_test(p_org uuid,p_device uuid,p_request uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ctx jsonb; u uuid; d private.push_devices; j private.push_outbox; at_time timestamptz:=clock_timestamp()+interval '90 seconds'; begin
  ctx:=private.axia_push_context(p_org); u:=(ctx->>'user')::uuid;
  select * into d from private.push_devices where id=p_device and user_id=u and organization_id=p_org for update;
  if not found or d.session_id is distinct from (ctx->>'session')::uuid or d.revoked_at is not null or d.expires_at<at_time+interval '5 minutes' or p_request is null
    then raise exception using errcode='42501',message='PUSH_UNAVAILABLE'; end if;
  select * into j from private.push_outbox where device_id=d.id and request_id=p_request;
  if found then return jsonb_build_object('id',j.id,'scheduledAt',j.scheduled_at,'accepted',true); end if;
  if (select count(*) from private.push_outbox where device_id=d.id and created_at>clock_timestamp()-interval '10 minutes')>=3
    then raise exception 'PUSH_RATE_LIMIT'; end if;
  insert into private.push_outbox(scope,device_id,request_id,scheduled_at,expires_at,next_attempt_at)
    values('axia-push-preview-v1',d.id,p_request,at_time,at_time+interval '5 minutes',at_time) returning * into j;
  insert into private.push_delivery_audit(scope,device_id,outbox_id,actor_id,action,reason_code)
    values('axia-push-preview-v1',d.id,j.id,u,'queued','explicit_delayed_test');
  return jsonb_build_object('id',j.id,'scheduledAt',j.scheduled_at,'accepted',true);
end $$;

create function private.axia_push_claim() returns jsonb
language plpgsql security definer set search_path='' as $$
declare j private.push_outbox; n text; begin
  if not exists(select 1 from private.push_configuration where scope='axia-push-preview-v1' and enabled) then return null; end if;
  update private.push_configuration set dispatcher_seen_at=clock_timestamp() where scope='axia-push-preview-v1';
  -- Ciphertext is removed promptly when binding expires/session disappears; no Auth-table trigger.
  update private.push_devices set revoked_at=clock_timestamp(),ciphertext=null,revision=revision+1
    where scope='axia-push-preview-v1' and revoked_at is null and (session_id is null or expires_at<=clock_timestamp());
  update private.push_outbox set state='expired',reason_code='expired',updated_at=clock_timestamp()
    where scope='axia-push-preview-v1' and state in ('pending','retry','claimed') and expires_at<=clock_timestamp();
  select * into j from private.push_outbox where scope='axia-push-preview-v1' and attempt_count<3 and expires_at>clock_timestamp()
    and ((state in ('pending','retry') and next_attempt_at<=clock_timestamp()) or (state='claimed' and lease_until<clock_timestamp()))
    order by next_attempt_at,id for update skip locked limit 1;
  if not found then return null; end if;
  n:=gen_random_uuid()::text||gen_random_uuid()::text;
  update private.push_outbox set state='claimed',attempt_count=attempt_count+1,lease_until=clock_timestamp()+interval '60 seconds',
    nonce_hash=encode(sha256(convert_to(n,'UTF8')),'hex'),updated_at=clock_timestamp() where id=j.id;
  return jsonb_build_object('id',j.id,'nonce',n);
end $$;

create function private.axia_push_authorize(p_job uuid,p_nonce text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j private.push_outbox; d private.push_devices; o text; begin
  select * into j from private.push_outbox where id=p_job and scope='axia-push-preview-v1' and state='claimed'
    and lease_until>clock_timestamp() and expires_at>clock_timestamp()
    and nonce_hash=encode(sha256(convert_to(p_nonce,'UTF8')),'hex');
  if not found then return null; end if;
  select * into d from private.push_devices where id=j.device_id;
  select origin into o from private.push_configuration where scope='axia-push-preview-v1';
  if d.revoked_at is not null or d.ciphertext is null or d.origin is distinct from o
    or not private.axia_push_live(d.user_id,d.session_id,d.organization_id,d.expires_at) then return null; end if;
  return jsonb_build_object('ciphertext',d.ciphertext,'revision',d.revision,'attempt',j.attempt_count,'expiresAt',least(j.expires_at,d.expires_at),
    'binding',jsonb_build_object('scope',d.scope,'deviceId',d.id,'userId',d.user_id,'organizationId',d.organization_id,'sessionId',d.session_id,'origin',d.origin));
end $$;

create function private.axia_push_finish(p_job uuid,p_nonce text,p_state text,p_reason text,p_next timestamptz default null) returns void
language plpgsql security definer set search_path='' as $$
declare j private.push_outbox; begin
  if p_state is null or p_reason is null or not ((p_state='submitted' and p_reason='provider_accepted')
    or (p_state='revoked' and p_reason='subscription_gone') or (p_state='halted' and p_reason='sender_authorization')
    or (p_state='retry' and p_reason='transient') or (p_state='suppressed' and p_reason='ineligible')
    or (p_state='failed' and p_reason in ('network_unknown','provider_rejected','invalid_transport')))
    then raise exception 'PUSH_INVALID_RESULT'; end if;
  select * into j from private.push_outbox where id=p_job and scope='axia-push-preview-v1' and state='claimed'
    and lease_until>clock_timestamp() and nonce_hash=encode(sha256(convert_to(p_nonce,'UTF8')),'hex') for update;
  if not found then return; end if;
  if p_state='retry' and (j.attempt_count>=3 or p_next is null or p_next<clock_timestamp()+interval '29 seconds' or p_next>=j.expires_at)
    then raise exception 'PUSH_INVALID_RETRY'; end if;
  update private.push_outbox set state=p_state,reason_code=p_reason,next_attempt_at=coalesce(p_next,next_attempt_at),nonce_hash=null,lease_until=null,updated_at=clock_timestamp() where id=j.id;
  if p_state='revoked' then
    update private.push_devices set revoked_at=clock_timestamp(),ciphertext=null,revision=revision+1 where id=j.device_id;
    update private.push_outbox set state='revoked',reason_code='subscription_gone',updated_at=clock_timestamp()
      where device_id=j.device_id and state in ('pending','retry','claimed');
  end if;
  if p_state='halted' then update private.push_configuration set enabled=false where scope='axia-push-preview-v1'; end if;
  insert into private.push_delivery_audit(scope,device_id,outbox_id,action,reason_code)
    values('axia-push-preview-v1',j.device_id,j.id,case when p_state='revoked' then 'revoked' else p_state end,p_reason);
end $$;

-- No anonymous/default execution. Runtime identities get only narrow function execution.
do $$ declare signature text; begin
  foreach signature in array array[
    'private.axia_push_context(uuid)','public.axia_push_status(uuid)',
    'public.axia_push_enroll(uuid,uuid,text,text)','public.axia_push_revoke(uuid,uuid)',
    'public.axia_push_test(uuid,uuid,uuid)','private.axia_push_claim()',
    'private.axia_push_authorize(uuid,text)','private.axia_push_finish(uuid,text,text,text,timestamptz)'] loop
    execute 'alter function '||signature||' owner to axia_push_api_owner';
    execute 'revoke all on function '||signature||' from public,anon,authenticated,axia_push_dispatcher';
  end loop;
end $$;
revoke create on schema private,public from axia_push_api_owner;
grant execute on function public.axia_push_status(uuid),public.axia_push_enroll(uuid,uuid,text,text),
  public.axia_push_revoke(uuid,uuid),public.axia_push_test(uuid,uuid,uuid) to authenticated;
grant execute on function private.axia_push_claim(),private.axia_push_authorize(uuid,text),
  private.axia_push_finish(uuid,text,text,text,timestamptz) to axia_push_dispatcher;
commit;
