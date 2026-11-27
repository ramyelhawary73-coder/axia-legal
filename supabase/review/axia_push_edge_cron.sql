-- REVIEW ONLY. pg_cron / pg_net enablement and Vault key provisioning require separate approval.
-- Requires pgcrypto in extensions, pg_net in net and Vault in vault. No key is provisioned here.
-- Dedicated 43-character HMAC key must already be stored as axia_push_preview_cron_hmac.
begin;
do $$ begin
  if not exists(select 1 from pg_extension where extname='pg_cron')
    or not exists(select 1 from pg_extension where extname='pg_net')
    or to_regprocedure('extensions.hmac(bytea,bytea,text)') is null
  then raise exception 'PUSH_CRON_PREREQUISITES_MISSING'; end if;
end $$;

-- Owned by migration operator, callable ONLY by that operator's Cron job.
-- Vault is read only here; no runtime dispatcher or user gets Vault access.
create function private.axia_push_edge_tick() returns bigint
language plpgsql security definer set search_path='' as $$
declare e private.push_edge_control; issued text; slot bigint; secret text; signature text; month date;
begin
  select * into e from private.push_edge_control where scope='axia-push-preview-v1' for update;
  month:=date_trunc('month',clock_timestamp() at time zone 'UTC')::date;
  issued:=floor(extract(epoch from clock_timestamp()))::bigint::text;
  slot:=floor(issued::bigint/60);
  if not found or not e.enabled or e.window_started_at>clock_timestamp() or e.approved_until<=clock_timestamp()
    or (e.last_enqueued_slot is not null and slot<=e.last_enqueued_slot)
    or (e.usage_month=month and e.calls_this_month>=e.monthly_cap)
    or not exists(select 1 from private.push_configuration c where c.scope=e.scope and c.enabled)
  then return null; end if;
  select decrypted_secret into secret from vault.decrypted_secrets where name='axia_push_preview_cron_hmac';
  if secret is null or secret !~ '^[A-Za-z0-9_-]{43}$' then return null; end if;
  signature:=encode(extensions.hmac(convert_to('axia-push-cron-v1'||chr(10)||'qshgczulivsxztgrbqew'||chr(10)||e.scope||chr(10)||issued,'UTF8'),convert_to(secret,'UTF8'),'sha256'),'hex');
  update private.push_edge_control set usage_month=month,
    calls_this_month=case when usage_month=month then calls_this_month+1 else 1 end,
    last_enqueued_slot=slot where scope=e.scope;
  return net.http_post(
    url:='https://qshgczulivsxztgrbqew.supabase.co/functions/v1/axia-push-preview',
    headers:=jsonb_build_object('Content-Type','application/json','x-axia-push-issued',issued,'x-axia-push-signature',signature),
    body:='{}'::jsonb, timeout_milliseconds:=50000
  );
end $$;
revoke all on function private.axia_push_edge_tick() from public,anon,authenticated,axia_push_api_owner,axia_push_dispatcher;
-- Deliberately DOES NOT register a cron job, switch enabled flags, or write any key.
-- Later activation review: named job axia-push-preview-minute, '* * * * *',
-- command 'select private.axia_push_edge_tick();', owner must be reviewed migration operator.
commit;
