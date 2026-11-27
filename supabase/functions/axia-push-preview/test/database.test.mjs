import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID, createECDH } from "node:crypto";
import pg from "pg";
import { createHandler, validateRole } from "../handler.mjs";
import { sealSubscription } from "../../_shared/axia-push-delivery.mjs";

// Hard-coded loopback ONLY. No URL, remote host, account, legal data or hosted credential accepted.
Deno.test({ name: "native Deno/pg: isolated SQL gates, HMAC scheduler, live sender and rollback",
  ignore: Deno.env.get("AXIA_EDGE_SQL_TEST") !== "1",
  fn: async () => {
    assert.equal(Deno.env.get("CI"), "true", "Require an explicitly disposable test environment");
    const root = new URL("../../../../", import.meta.url);
    const read = path => Deno.readTextFile(new URL(path, root));
    const db = "axia_edge_verify_" + Deno.pid, settings = { host: "127.0.0.1", port: 5432, user: "postgres", database: "postgres" };
    const admin = new pg.Client(settings); await admin.connect();
    let c, owned = false, rolesOwned = false, operatorOwned = false, runtime;
    let checks = 0;
    const check = async (name, fn) => { await fn(); checks++; console.log("PASS " + name); };
    const user = "00000000-0000-4000-8000-000000000001", other = "00000000-0000-4000-8000-000000000002";
    const org = "00000000-0000-4000-8000-000000000100", session = "00000000-0000-4000-8000-000000000201";
    const origin = "https://fixture-git-edge.vercel.app", scope = "axia-push-preview-v1", secret = randomBytes(32).toString("base64url");
    const slot = () => Math.floor(Date.now() / 60000);
    try {
      assert.equal((await admin.query("select count(*)::int n from pg_roles where rolname in ('axia_push_api_owner','axia_push_dispatcher','axia_push_preview_worker','axia_push_migration_verify')")).rows[0].n, 0);
      // Match hosted postgres's relevant privilege shape: NOT a superuser.
      await admin.query("create role axia_push_migration_verify login nosuperuser createrole bypassrls"); operatorOwned=true;
      await admin.query(`create database "${db}" owner axia_push_migration_verify`); owned = true;
      c = new pg.Client({ ...settings, database: db, user: 'axia_push_migration_verify' }); await c.connect();
      await c.query(await read("tests/sql/push-fixture.sql")); rolesOwned = true;
      await c.query(await read("supabase/review/axia_push_android_proof.sql"));
      await c.query("insert into auth.users(id,email_confirmed_at,is_anonymous) values($1,now(),false),($2,now(),false)", [user, other]);
      await c.query("insert into auth.sessions(id,user_id) values($1,$2)", [session, user]);
      await c.query("insert into public.organizations values($1)", [org]);
      await c.query("insert into public.organization_members values($1,$2,'owner'),($1,$3,'viewer')", [org,user,other]);
      const before = JSON.stringify((await c.query("select (select count(*) from auth.users) users,(select count(*) from auth.sessions) sessions,(select count(*) from public.organization_members) members")).rows);
      await c.query(await read("supabase/review/axia_push_edge_prepare.sql"));
      await check("unapproved Edge window fails closed", async () => {
        assert.equal((await c.query("select private.axia_push_edge_begin($1) allowed", [slot()])).rows[0].allowed, false);
      });
      await c.query("update private.push_configuration set enabled=true,origin=$1,timebox_seconds=0,inactivity_seconds=0,single_session=false,auth_policy_verified_at=now()", [origin]);
      await c.query("update private.push_edge_control set enabled=true,test_user_id=$1,test_organization_id=$2,window_started_at=now(),approved_until=now()+interval '30 minutes'", [user,org]);
      await check("allowlist is account AND office, never broader membership", async () => {
        const live = (u,o) => c.query("select private.axia_push_live($1,$2,$3,now()+interval '15 minutes') live", [u,session,o]);
        assert.equal((await live(user,org)).rows[0].live,true);
        assert.equal((await live(other,org)).rows[0].live,false);
        assert.equal((await live(user,other)).rows[0].live,false);
      });
      await check("installation does not grant table or Vault access to runtime roles", async () => {
        for (const r of ['anon','authenticated','axia_push_dispatcher']) {
          assert.equal((await c.query("select has_table_privilege($1,'private.push_edge_control','select') allowed",[r])).rows[0].allowed,false);
          assert.equal((await c.query("select has_function_privilege($1,'private.axia_push_edge_begin(bigint)','execute') allowed",[r])).rows[0].allowed,r==='axia_push_dispatcher');
        }
      });
      const cronSource=await read("supabase/review/axia_push_edge_cron.sql");
      await check("missing pg_cron/pg_net dependencies reject scheduler installation", async () => {
        await assert.rejects(c.query(cronSource), /PUSH_CRON_PREREQUISITES_MISSING/); await c.query("rollback");
      });
      // Test ONLY substitutes extension interfaces; this is never a hosted migration.
      await c.query("create schema extensions; create extension pgcrypto with schema extensions; create schema vault; create schema net; create table vault.decrypted_secrets(name text,decrypted_secret text); create table net.test_requests(id bigserial,url text,headers jsonb,body jsonb,timeout integer)");
      await c.query("create function net.http_post(url text,body jsonb,headers jsonb,timeout_milliseconds int) returns bigint language sql as $$insert into net.test_requests(url,body,headers,timeout) values(url,body,headers,timeout_milliseconds) returning id$$");
      const prerequisite = /do \$\$ begin[\s\S]*?end \$\$;/;
      assert.match(cronSource,prerequisite);
      await c.query(cronSource.replace(prerequisite,"-- Isolated test extension interfaces above."));
      await check("no Vault key means zero enqueued requests", async () => {
        assert.equal((await c.query("select private.axia_push_edge_tick() id")).rows[0].id,null);
      });
      await c.query("insert into vault.decrypted_secrets values('axia_push_preview_cron_hmac',$1)",[secret]);
      await check("Cron signs exact fixed request without leaking Vault/admin secrets", async () => {
        assert.ok((await c.query("select private.axia_push_edge_tick() id")).rows[0].id);
        const q=(await c.query("select * from net.test_requests")).rows[0];
        assert.equal(q.url,"https://qshgczulivsxztgrbqew.supabase.co/functions/v1/axia-push-preview");
        assert.deepEqual(q.body,{}); assert.equal(q.timeout,50000);
        const signed=createHmac("sha256",secret).update(`axia-push-cron-v1\nqshgczulivsxztgrbqew\n${scope}\n${q.headers['x-axia-push-issued']}`).digest("hex");
        assert.equal(q.headers['x-axia-push-signature'],signed);
        assert.ok(!JSON.stringify(q).includes(secret));
        assert.equal((await c.query("select private.axia_push_edge_tick() id")).rows[0].id,null);
      });
      await check("reservation required and replayed slot cannot start twice", async () => {
        assert.equal((await c.query("select private.axia_push_edge_begin($1) allowed",[slot()])).rows[0].allowed,true);
        assert.equal((await c.query("select private.axia_push_edge_begin($1) allowed",[slot()])).rows[0].allowed,false);
      });
      await check("budget includes failed requests, and month rollover resets only the budget", async () => {
        await c.query("update private.push_edge_control set last_enqueued_slot=null,calls_this_month=200");
        assert.equal((await c.query("select private.axia_push_edge_tick() id")).rows[0].id,null);
        await c.query("update private.push_edge_control set usage_month=(date_trunc('month',now())-interval '1 month')::date");
        assert.ok((await c.query("select private.axia_push_edge_tick() id")).rows[0].id);
        assert.equal((await c.query("select calls_this_month from private.push_edge_control")).rows[0].calls_this_month,1);
      });
      await check("expired window stops both scheduling and authorization", async () => {
        await c.query("update private.push_edge_control set window_started_at=now()-interval '45 minutes',approved_until=now()-interval '1 minute',last_enqueued_slot=null");
        assert.equal((await c.query("select private.axia_push_edge_tick() id")).rows[0].id,null);
        assert.equal((await c.query("select private.axia_push_live($1,$2,$3,now()+interval '15 minutes') live",[user,session,org])).rows[0].live,false);
        await c.query("update private.push_edge_control set window_started_at=now(),approved_until=now()+interval '30 minutes'");
      });
      // Test-only LOGIN in this owned loopback DB. Never provisioned by review SQL.
      await c.query("create role axia_push_preview_worker login nosuperuser nocreatedb nocreaterole nobypassrls; grant axia_push_dispatcher to axia_push_preview_worker");
      const device=randomUUID(), ecdh=createECDH('prime256v1');
      const binding={scope,deviceId:device,userId:user,organizationId:org,sessionId:session,origin};
      const ciphertext=sealSubscription({endpoint:'https://fcm.googleapis.com/fcm/send/abcdefghijklmnopqrstuvwxyz_1234567890',keys:{p256dh:ecdh.generateKeys().toString('base64url'),auth:randomBytes(16).toString('base64url')}},binding,secret);
      await c.query("insert into private.push_devices(id,scope,user_id,organization_id,session_id,origin,endpoint_hash,ciphertext,expires_at) values($1,$2,$3,$4,$5,$6,$7,$8,now()+interval '15 minutes')",[device,scope,user,org,session,origin,'a'.repeat(64),ciphertext]);
      await c.query("insert into private.push_outbox(scope,device_id,request_id,scheduled_at,expires_at,next_attempt_at) values($1,$2,$3,now()-interval '1 second',now()+interval '4 minutes',now()-interval '1 second')",[scope,device,randomUUID()]);
      await c.query("update private.push_edge_control set last_enqueued_slot=null,last_started_slot=null");
      await c.query("select private.axia_push_edge_tick()");
      const q=(await c.query("select * from net.test_requests order by id desc limit 1")).rows[0];
      let sends=0;
      const handle=createHandler({env:()=>({AXIA_PUSH_EDGE_ENABLED:'1',AXIA_PUSH_ENABLED:'1',AXIA_PUSH_SCOPE:scope,AXIA_PUSH_DEPLOYMENT_MODE:'preview',AXIA_PUSH_ORIGIN:origin,
        AXIA_PUSH_EXPECTED_SUPABASE_REF:'qshgczulivsxztgrbqew',SUPABASE_URL:'https://qshgczulivsxztgrbqew.supabase.co',AXIA_PUSH_DB_HOST:'fixture.pooler.supabase.com',AXIA_PUSH_DB_NAME:'postgres',
        AXIA_PUSH_DISPATCH_DATABASE_URL:'postgres://axia_push_preview_worker.qshgczulivsxztgrbqew:fixture@fixture.pooler.supabase.com:5432/postgres',
        AXIA_PUSH_SUBSCRIPTION_KEY_V1:secret,AXIA_PUSH_VAPID_PUBLIC_KEY:'B'.repeat(87),AXIA_PUSH_VAPID_PRIVATE_KEY:secret,AXIA_PUSH_VAPID_SUBJECT:'https://example.invalid/contact',AXIA_PUSH_CRON_HMAC_KEY:secret}),
        makeClient:()=>{runtime=new pg.Client({...settings,database:db,user:'axia_push_preview_worker'});return runtime;},
        verifyRole:(client,config)=>validateRole(client,{...config,dbName:db}),
        agentFactory:async()=>({destroy(){}}),sendNotification:async(_subscription,payload)=>{assert.equal(payload,null);sends++;return {statusCode:201};}});
      await check("native Deno handler and restricted pg role process one generic job",async()=>{
        assert.equal((await handle(new Request(q.url,{method:'POST',headers:q.headers,body:'{}'}))).status,202);
        assert.equal(sends,1);assert.equal((await c.query("select state from private.push_outbox")).rows[0].state,'submitted');
        assert.equal((await handle(new Request(q.url,{method:'POST',headers:q.headers,body:'{}'}))).status,202);assert.equal(sends,1);
      });
      await check("120-second readiness tolerates minute cadence, stale heartbeat fails",async()=>{
        await c.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:user,session_id:session,exp:Math.floor(Date.now()/1000)+3600})]);
        await c.query("update private.push_configuration set dispatcher_seen_at=now()-interval '70 seconds'");
        assert.equal((await c.query("select public.axia_push_status($1) value",[org])).rows[0].value.workerReady,true);
        await c.query("update private.push_configuration set dispatcher_seen_at=now()-interval '3 minutes'");
        assert.equal((await c.query("select public.axia_push_status($1) value",[org])).rows[0].value.workerReady,false);
      });
      await check("full Push rollback preserves all original users, sessions and memberships",async()=>{
        // Isolated test LOGIN dependency only, remove before testing role drops.
        await c.query("drop role axia_push_preview_worker");
        await c.query(await read("supabase/review/axia_push_edge_rollback.sql"));
        assert.equal(JSON.stringify((await c.query("select (select count(*) from auth.users) users,(select count(*) from auth.sessions) sessions,(select count(*) from public.organization_members) members")).rows),before);
        assert.equal((await c.query("select to_regclass('private.push_edge_control') name")).rows[0].name,null);
      });
      console.log(`PASS ${checks} native Deno/pg SQL checks; no hosted SQL/network or real delivery.`);
    } finally {
      await runtime?.end().catch(()=>{}); await c?.end();
      if(owned)await admin.query(`drop database "${db}"`);
      if(rolesOwned)for(const role of ['axia_push_preview_worker','axia_push_api_owner','axia_push_dispatcher'])await admin.query('drop role if exists '+role);
      if(operatorOwned)await admin.query('drop role axia_push_migration_verify');
      await admin.end();
    }
  },
});
