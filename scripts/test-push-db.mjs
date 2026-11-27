import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
// Never accept a URL or hosted credentials. Only this owned loopback CI PostgreSQL database is used.
if (process.env.CI !== "true" || !process.env.AXIA_SQL_TEST_MODULE) throw new Error("Disposable CI PostgreSQL required");
const { default: pg } = await import(pathToFileURL(process.env.AXIA_SQL_TEST_MODULE).href);
const options = { host: "127.0.0.1", port: 5432, user: "postgres", connectionTimeoutMillis: 5000, statement_timeout: 10000 };
const control = new pg.Pool({ ...options, database: "postgres", max: 1 });
const name = "axia_push_verify_" + process.pid;
let pool, owned = false, rolesOwned = false, checks = 0, poolFailure;
const id = n => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
const office = id(100), otherOffice = id(101);
async function check(name, fn) { await fn(); console.log("PASS " + name); checks++; }
async function user(n, fn, override = {}) {
  const client = await pool.connect();
  try {
    await client.query("begin"); await client.query("set local session authorization authenticated");
    await client.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: id(n), session_id: id(200+n), exp: Math.floor(Date.now()/1000)+3600, ...override })]);
    const value = await fn(client); await client.query("commit"); return value;
  } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
}
async function worker(fn) {
  const client = await pool.connect();
  try { await client.query("begin"); await client.query("set local session authorization axia_push_dispatcher"); const r=await fn(client); await client.query("commit"); return r; }
  catch(error) { await client.query("rollback"); throw error; } finally { client.release(); }
}
const rpc = (n, sql, params, override) => user(n, async c => (await c.query(sql, params)).rows[0]?.value, override);
const status = (n=1, org=office, override) => rpc(n, "select public.axia_push_status($1) value", [org], override);
const enroll = (n=1, org=office, hash=randomUUID().replaceAll("-","").repeat(2), device=randomUUID()) =>
  rpc(n,"select public.axia_push_enroll($1,$2,$3,$4) value",[org,device,hash,"A".repeat(100)]);
const enqueue = (n, device, request=randomUUID()) => rpc(n,"select public.axia_push_test($1,$2,$3) value",[office,device,request]);
const claim = () => worker(async c => (await c.query("select private.axia_push_claim() value")).rows[0].value);
const authorize = job => worker(async c => (await c.query("select private.axia_push_authorize($1,$2) value",[job.id,job.nonce])).rows[0].value);
const finish = (job,state,reason,next=null) => worker(c => c.query("select private.axia_push_finish($1,$2,$3,$4,$5)",[job.id,job.nonce,state,reason,next]));
const deny = fn => assert.rejects(fn,/PUSH_|permission denied|row-level security/);
try {
  const prior = await control.query("select rolname from pg_roles where rolname in ('axia_push_api_owner','axia_push_dispatcher')");
  assert.equal(prior.rows.length,0,"Never replace or delete a pre-existing role");
  await control.query('create database "'+name+'"'); owned=true;
  pool = new pg.Pool({ ...options, database: name, max: 6 });
  pool.on("error", error => { poolFailure ??= error.code ?? "unknown"; });
  await pool.query(await fs.readFile("tests/sql/push-fixture.sql","utf8"));
  rolesOwned = true;
  await pool.query(await fs.readFile("supabase/review/axia_push_android_proof.sql","utf8"));
  for(let n=1;n<=9;n++) {
    await pool.query("insert into auth.users(id,email_confirmed_at,is_anonymous) values($1,now(),false)",[id(n)]);
    await pool.query("insert into auth.sessions(id,user_id) values($1,$2)",[id(200+n),id(n)]);
  }
  await pool.query("insert into public.organizations values($1),($2)",[office,otherOffice]);
  for(let n=1;n<=9;n++) await pool.query("insert into public.organization_members values($1,$2,$3)",
    [n===7?otherOffice:office,id(n),["owner","admin","lawyer","staff","trainee","viewer"][(n-1)%6]]);
  await check("default configuration is disabled",()=>deny(()=>status()));
  await pool.query("update private.push_configuration set enabled=true,dispatcher_seen_at=now(),origin='https://fixture-git-push.vercel.app',timebox_seconds=0,inactivity_seconds=0,single_session=false,auth_policy_verified_at=now()");
  await check("each existing office role gets only its own generic test consent",async()=>{for(let n=1;n<=6;n++) assert.equal((await status(n)).ready,true);});
  await check("worker heartbeat is fresh before enrollment readiness",async()=>{
    assert.equal((await status()).workerReady,true);
    await pool.query("update private.push_configuration set dispatcher_seen_at=now()-interval '1 minute'");
    assert.equal((await status()).workerReady,false);
    await pool.query("update private.push_configuration set dispatcher_seen_at=now()");
  });
  await check("foreign office and forged session cannot enroll",async()=>{await deny(()=>status(7));await deny(()=>status(1,otherOffice));await deny(()=>status(1,office,{session_id:id(202)}));});
  await check("expired JWT fails closed",()=>deny(()=>status(1,office,{exp:Math.floor(Date.now()/1000)-1})));
  for(const [label,column,value,reset] of [
    ["unconfirmed","email_confirmed_at",null,"now()"],["anonymous","is_anonymous",true,"false"],["banned","banned_until",new Date(Date.now()+3600000),"null"]]) {
    await check(label+" account is denied",async()=>{await pool.query("update auth.users set "+column+"=$1 where id=$2",[value,id(9)]);await deny(()=>status(9));await pool.query("update auth.users set "+column+"="+reset+" where id=$1",[id(9)]);});
  }
  await check("session not_after is enforced despite a valid JWT",async()=>{await pool.query("update auth.sessions set not_after=now()-interval '1 second' where id=$1",[id(209)]);await deny(()=>status(9));await pool.query("update auth.sessions set not_after=null where id=$1",[id(209)]);});
  await check("timebox, inactivity and stale policy attestation fail closed",async()=>{
    for(const sql of ["timebox_seconds=1","inactivity_seconds=1","auth_policy_verified_at=now()-interval '7 hours'"]) {
      await pool.query("update auth.sessions set created_at=now()-interval '1 hour',refreshed_at=now()-interval '1 hour' where id=$1",[id(209)]);
      await pool.query("update private.push_configuration set "+sql);await deny(()=>status(9));
      await pool.query("update private.push_configuration set timebox_seconds=0,inactivity_seconds=0,auth_policy_verified_at=now()");
    }
  });
  await check("single-session policy rejects an older still-present session",async()=> {
    await pool.query("insert into auth.sessions(id,user_id) values($1,$2)",[id(999),id(9)]);
    await pool.query("update private.push_configuration set single_session=true");await deny(()=>status(9));
    await pool.query("delete from auth.sessions where id=$1",[id(999)]);await pool.query("update private.push_configuration set single_session=false");
  });
  await check("verified MFA requires current AAL2 factor",async()=> {
    await pool.query("insert into auth.mfa_factors values($1,$2,'verified')",[id(309),id(9)]);
    await deny(()=>status(9));await pool.query("update auth.sessions set aal='aal2',factor_id=$1 where id=$2",[id(309),id(209)]);
    assert.equal((await status(9)).ready,true);await pool.query("delete from auth.mfa_factors where id=$1",[id(309)]);
  });
  await check("office suspension, expiry and blocked member are enforced without enabling control center",async()=> {
    await pool.query("insert into private.office_controls values($1,'suspended',null)",[office]);await deny(()=>status());
    await pool.query("update private.office_controls set status='active',expires_at=now()-interval '1 second'");await deny(()=>status());
    await pool.query("delete from private.office_controls");await pool.query("insert into private.office_member_access values($1,$2,true)",[office,id(1)]);
    await deny(()=>status());await pool.query("delete from private.office_member_access");
  });
  await check("no direct table, read bridge, or owner-role access for users/dispatcher",async()=> {
    for(const roleFn of [fn=>user(1,fn),worker]) {
      for(const table of ["private.push_devices","private.push_outbox","private.push_delivery_audit","auth.users","auth.sessions"])
        await assert.rejects(()=>roleFn(c=>c.query("select * from "+table)),/permission denied/);
      await assert.rejects(()=>roleFn(c=>c.query("select private.axia_push_live($1,$2,$3,now())",[id(1),id(201),office])),/permission denied/);
      await assert.rejects(()=>roleFn(c=>c.query("set role axia_push_api_owner")),/permission denied/);
    }
  });
  const hash="1".repeat(64), device=(await enroll(1,office,hash)).id;
  await check("lease is short and within JWT expiration",async()=> {
    const d=(await pool.query("select * from private.push_devices where id=$1",[device])).rows[0];
    assert.ok(d.expires_at.getTime()<=Date.now()+15*60000);assert.equal(d.session_id,id(201));
  });
  await check("cross-user endpoint takeover is rejected",()=>deny(()=>enroll(2,office,hash)));
  let queued;
  await check("test enqueues once for an idempotent request and is delayed 90s",async()=> {
    const request=randomUUID();queued=await enqueue(1,device,request);
    assert.equal((await enqueue(1,device,request)).id,queued.id);assert.ok(Date.parse(queued.scheduledAt)>Date.now()+85000);
    assert.equal(await claim(),null);
  });
  await check("one job can be claimed only once under concurrent workers",async()=> {
    await pool.query("update private.push_outbox set scheduled_at=now()-interval '1 second',next_attempt_at=now()-interval '1 second',expires_at=now()+interval '4 minutes' where id=$1",[queued.id]);
    const claims=await Promise.all([claim(),claim()]);assert.equal(claims.filter(Boolean).length,1);
    queued=claims.find(Boolean);assert.equal((await authorize(queued)).binding.userId,id(1));
    assert.equal(await authorize({...queued,nonce:"forged"}),null);
  });
  await check("membership loss after claim is checked immediately before send",async()=> {
    await pool.query("delete from public.organization_members where user_id=$1",[id(1)]);assert.equal(await authorize(queued),null);
    await pool.query("insert into public.organization_members values($1,$2,'owner')",[office,id(1)]);
  });
  await check("stale finish nonce cannot mark delivery",async()=> {
    await finish({...queued,nonce:"forged"},"submitted","provider_accepted");
    assert.equal((await pool.query("select state from private.push_outbox where id=$1",[queued.id])).rows[0].state,"claimed");
  });
  await check("404/410 revocation deletes ciphertext and suppresses pending work",async()=>{
    await finish(queued,"revoked","subscription_gone");
    const d=(await pool.query("select ciphertext,revoked_at from private.push_devices where id=$1",[device])).rows[0];
    assert.equal(d.ciphertext,null);assert.ok(d.revoked_at);
  });
  const next=(await enroll()).id;
  await check("test has a three-per-ten-minute rate limit",async()=>{
    await enqueue(1,next);await enqueue(1,next);await enqueue(1,next);await deny(()=>enqueue(1,next));
  });
  await check("logout is never blocked by a Push device and immediately invalidates authorization",async()=>{
    await pool.query("update private.push_outbox set scheduled_at=now()-interval '1 second',next_attempt_at=now()-interval '1 second',expires_at=now()+interval '4 minutes' where device_id=$1",[next]);
    const job=await claim();assert.ok(job);await pool.query("delete from auth.sessions where id=$1",[id(201)]);
    assert.equal(await authorize(job),null);
    assert.equal((await pool.query("select session_id from private.push_devices where id=$1",[next])).rows[0].session_id,null);
  });
  await check("worker role has no login or RLS bypass and owner role is not a runtime membership",async()=>{
    const roles=(await pool.query("select rolname,rolcanlogin,rolsuper,rolbypassrls from pg_roles where rolname in ('axia_push_api_owner','axia_push_dispatcher')")).rows;
    assert.equal(roles.length,2);for(const r of roles){assert.equal(r.rolcanlogin,false);assert.equal(r.rolsuper,false);assert.equal(r.rolbypassrls,false);}
    assert.equal((await pool.query("select count(*)::int n from pg_auth_members where roleid=(select oid from pg_roles where rolname='axia_push_api_owner')")).rows[0].n,0);
  });
  await check("all new tables force RLS and audit stores only opaque status",async()=>{
    const rows=(await pool.query("select relname,relrowsecurity,relforcerowsecurity from pg_class where relnamespace='private'::regnamespace and relname in ('push_configuration','push_devices','push_outbox','push_delivery_audit')")).rows;
    assert.equal(rows.length,4);for(const r of rows){assert.ok(r.relrowsecurity);assert.ok(r.relforcerowsecurity);}
    const audit=JSON.stringify((await pool.query("select * from private.push_delivery_audit")).rows);
    for(const bad of ["ciphertext","endpoint","token","fixture@","password"]) assert.ok(!audit.includes(bad));
  });
  await check("rollback removes only this Push package and preserves existing Auth and office fixtures",async()=>{
    const snapshot=async()=>JSON.stringify((await pool.query("select (select count(*) from auth.users) users,(select count(*) from auth.sessions) sessions,(select count(*) from public.organization_members) members,(select count(*) from public.organizations) offices")).rows);
    const before=await snapshot();
    await pool.query(await fs.readFile("supabase/review/axia_push_android_proof_rollback.sql","utf8"));
    assert.equal(await snapshot(),before);
    assert.equal((await pool.query("select to_regclass('private.push_devices') value")).rows[0].value,null);
    assert.equal((await pool.query("select count(*)::int n from pg_roles where rolname in ('axia_push_api_owner','axia_push_dispatcher')")).rows[0].n,0);
  });
  console.log("PASS "+checks+" isolated Push SQL/security/concurrency checks; no hosted connection.");
} finally {
  await pool?.end();
  if(owned)await control.query('drop database "'+name+'"');
  if(rolesOwned)for(const role of ["axia_push_api_owner","axia_push_dispatcher"])await control.query("drop role if exists "+role);
  await control.end();
  assert.equal(poolFailure,undefined,"No unexpected database pool failure during isolated test cleanup");
}
