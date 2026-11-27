-- Bounded corrective rollback for the pg_net extension installed by PR59 preparation.
-- Not a general rollback or permission downgrade for an extension already in use.
-- Owner approval for this exact removal is required by the provider confirmation flow.
begin;
do $$ begin
  if not exists(select 1 from pg_extension where extname='pg_net') then
    raise exception 'PUSH_NET_NOT_INSTALLED_RECHECK'; end if;
  if exists(select 1 from cron.job)
    or exists(select 1 from net.http_request_queue)
    or exists(select 1 from private.push_devices)
    or exists(select 1 from private.push_outbox)
    or exists(select 1 from pg_roles where rolname='axia_push_preview_worker')
    or exists(select 1 from vault.secrets where name='axia_push_preview_cron_hmac')
  then raise exception 'PUSH_NET_NOT_UNUSED_STOP'; end if;
end $$;
update private.push_configuration set enabled=false where scope='axia-push-preview-v1';
update private.push_edge_control set enabled=false where scope='axia-push-preview-v1';
drop extension pg_net;
-- No CASCADE, no shared schema deletion, no business/Auth changes. pg_cron remains idle.
commit;
