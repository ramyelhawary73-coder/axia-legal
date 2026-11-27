-- REVIEW ONLY: remove Edge add-on AND base Push package together.
-- First disable the one named Cron job and Edge function/app flags; review Push-only export/disposal.
-- Vault HMAC and isolated worker LOGIN removal are separate approvals. Never drop extensions.
-- REVIEW ONLY. Requires separate approval and a Push-only backup/disposal decision first.
-- Stop sender and enrollment. Never drop existing business/Auth/control objects or use CASCADE.
begin;
update private.push_edge_control set enabled=false;
drop function if exists private.axia_push_edge_tick();
drop function private.axia_push_edge_begin(bigint);
update private.push_configuration set enabled=false where scope='axia-push-preview-v1';
drop function public.axia_push_status(uuid);
drop function public.axia_push_enroll(uuid,uuid,text,text);
drop function public.axia_push_revoke(uuid,uuid);
drop function public.axia_push_test(uuid,uuid,uuid);
drop function private.axia_push_claim();
drop function private.axia_push_authorize(uuid,text);
drop function private.axia_push_finish(uuid,text,text,text,timestamptz);
drop function private.axia_push_context(uuid);
drop function private.axia_push_live(uuid,uuid,uuid,timestamptz);
drop table private.push_delivery_audit;
drop table private.push_outbox;
drop table private.push_devices;
drop table private.push_edge_control;
drop table private.push_configuration;
revoke usage on schema private,public,auth from axia_push_api_owner;
revoke usage on schema private from axia_push_dispatcher;
-- Drop any separately approved LOGIN only after verifying it has no unrelated grants/dependencies.
-- Runtime LOGIN provisioning is deliberately absent from this package.
drop role axia_push_api_owner;
drop role axia_push_dispatcher;
commit;
