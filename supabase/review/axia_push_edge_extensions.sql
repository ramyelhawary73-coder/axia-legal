-- REVIEW ONLY. Explicit approval required: this enables shared database capabilities.
-- Recorded 2026-11-27: pg_cron and pg_net are NOT installed on AXIA.
-- If either was enabled since review, abort and re-review its existing uses/ACLs.
begin;
do $$ begin
  if exists(select 1 from pg_extension where extname in ('pg_cron','pg_net'))
    then raise exception 'PUSH_EXTENSIONS_CHANGED_REVIEW_REQUIRED'; end if;
end $$;
create extension pg_cron;
create extension pg_net with schema extensions;
-- Only the approved operator's Cron job calls net.http_post. Harden NEW extension defaults.
-- No grants/role memberships or ACLs on existing business/Auth schemas are changed.
revoke usage on schema net from public,anon,authenticated;
revoke all on all tables in schema net from public,anon,authenticated;
revoke all on all sequences in schema net from public,anon,authenticated;
revoke execute on all functions in schema net from public,anon,authenticated;
-- BEGIN EFFECTIVE ACL CHECK
-- A managed extension may be owned by supabase_admin. REVOKE by postgres can be a
-- warning/no-op; success must be measured, not inferred from the command result.
do $$ begin
  if has_schema_privilege('anon','net','usage')
    or has_schema_privilege('authenticated','net','usage')
    or exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='net' and p.proname in ('http_post','http_get','http_delete')
        and (has_function_privilege('anon',p.oid,'execute')
          or has_function_privilege('authenticated',p.oid,'execute')))
  then raise exception 'PUSH_NET_ACL_NOT_ENFORCED_STOP'; end if;
end $$;
-- END EFFECTIVE ACL CHECK
commit;
