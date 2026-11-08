import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { renderPlatformOwnerOperation } from "./platform-owner-operation.mjs";

// No hosted URL or credential is accepted. Native mode owns a new loopback DB.
const modulePath = process.env.AXIA_SQL_TEST_MODULE;
if (!modulePath) throw new Error("Set AXIA_SQL_TEST_MODULE to a disposable test module");
const native = process.env.AXIA_SQL_BACKEND === "postgres";
let db, pool, control, ownedDatabase;
if (native) {
  if (process.env.CI !== "true" && process.env.AXIA_DISPOSABLE_PLATFORM_DB !== "1") throw new Error("Disposable native server required");
  const driver = await import(pathToFileURL(modulePath).href);
  const Pool = driver.Pool ?? driver.default.Pool;
  const options = { host: "127.0.0.1", port: 5432, user: "postgres", connectionTimeoutMillis: 5000, statement_timeout: 20000 };
  control = new Pool({ ...options, database: "postgres", max: 1 });
  ownedDatabase = `axia_operator_verify_${process.pid}`;
  await control.query(`create database "${ownedDatabase}"`);
  // One connection retains the operator transaction/session across its SQL batch.
  pool = new Pool({ ...options, database: ownedDatabase, max: 1 });
  db = { exec: sql => pool.query(sql), query: (...args) => pool.query(...args) };
} else {
  const { PGlite } = await import(pathToFileURL(modulePath).href);
  db = new PGlite();
}
const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const email = n => `operator-fixture${n}@example.invalid`;
const execute = async sql => {
  try { return await db.exec(sql); }
  catch (error) { await db.exec("rollback"); throw error; }
};
const operate = async (action, n = 1, expectedEmail = email(n)) => execute(await renderPlatformOwnerOperation({ userId: uid(n), expectedEmail, action }));
const counts = async () => (await db.query("select (select count(*)::int from private.platform_principals) as principals,(select count(*)::int from private.platform_audit_events) as events")).rows[0];
const context = async n => {
  try {
    await db.exec("begin; set local role authenticated");
    await db.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: uid(n), session_id: uid(100+n), aal: "aal1", user_metadata: { role: "platform_owner" } })]);
    return (await db.query("select public.axia_platform_context() as data")).rows[0].data;
  } finally { await db.exec("rollback"); }
};
const snapshot = async () => JSON.stringify((await db.query(`select jsonb_build_object(
  'members',(select jsonb_agg(to_jsonb(m) order by user_id) from public.organization_members m),
  'policies',(select jsonb_agg(to_jsonb(p) order by tablename,policyname) from pg_policies p where schemaname='public'),
  'grants',(select jsonb_agg(to_jsonb(g) order by table_name,grantee,privilege_type) from information_schema.role_table_grants g where table_schema='public'),
  'helper',pg_get_functiondef('private.is_organization_member(uuid)'::regprocedure),
  'users',(select jsonb_agg(to_jsonb(u) order by id) from auth.users u),
  'sessions',(select jsonb_agg(to_jsonb(s) order by id) from auth.sessions s),
  'factors',(select coalesce(jsonb_agg(to_jsonb(f) order by id),'[]') from auth.mfa_factors f)) as data`)).rows[0].data);
let checks = 0;
const check = async (name, run) => { await run(); checks++; console.log(`PASS ${name}`); };
try {
  await db.exec(await fs.readFile("tests/sql/platform-foundation-fixture.sql", "utf8"));
  const migration = await fs.readFile("supabase/migrations/20261018173401_axia_platform_owner_foundation.sql", "utf8");
  await db.exec(migration);
  await db.exec("create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key,name text,statements text[])");
  await db.query("insert into supabase_migrations.schema_migrations values('fixture_version','axia_platform_owner_foundation',$1)", [[migration]]);
  for (let n = 1; n <= 5; n++) {
    await db.query("insert into auth.users values($1,$2,$3,$4,$5)", [uid(n), email(n), n === 3 ? null : new Date().toISOString(), n === 4, n === 5 ? "2099-01-01" : null]);
    await db.query("insert into auth.sessions values($1,$2,null,'aal1',null)", [uid(100+n), uid(n)]);
  }
  await db.query("insert into public.organizations values($1,'Synthetic operator office','operator-fixture',now())", [uid(301)]);
  await db.query("insert into public.organization_members values($1,$2,'owner')", [uid(301), uid(1)]);
  const before = await snapshot();
  await check("renderer rejects incomplete UUID, control characters and arbitrary action", async () => {
    for (const params of [{ userId: "not-uuid", expectedEmail: email(1), action: "bootstrap" }, { userId: uid(1), expectedEmail: "bad\n@example.invalid", action: "bootstrap" }, { userId: uid(1), expectedEmail: email(1), action: "admin" }]) await assert.rejects(() => renderPlatformOwnerOperation(params));
  });
  await check("source mismatch refuses any initial grant", async () => {
    await db.exec("update supabase_migrations.schema_migrations set statements=array['wrong source']");
    await assert.rejects(() => operate("bootstrap"), /PLATFORM_OPERATOR_SOURCE_MISMATCH/);
    await db.query("update supabase_migrations.schema_migrations set statements=$1", [[migration]]);
    assert.deepEqual(await counts(), { principals: 0, events: 0 });
  });
  await check("wrong email, missing UUID, unconfirmed, anonymous and banned identities cannot bootstrap", async () => {
    await assert.rejects(() => operate("bootstrap", 1, email(2)), /IDENTITY_MISMATCH/);
    await assert.rejects(() => operate("bootstrap", 999), /IDENTITY_MISMATCH/);
    for (const n of [3,4,5]) await assert.rejects(() => operate("bootstrap", n), /VERIFIED_IDENTITY_REQUIRED/);
    assert.deepEqual(await counts(), { principals: 0, events: 0 });
  });
  await check("SQL-quoted identity text stays data and cannot execute a second statement", async () => {
    await assert.rejects(() => operate("bootstrap", 1, "x'\\;select(1);--@example.invalid"), /IDENTITY_MISMATCH/);
    assert.deepEqual(await counts(), { principals: 0, events: 0 });
  });
  await check("a failed audit insert rolls back the principal insert in the same transaction", async () => {
    await db.exec("alter table private.platform_audit_events add constraint fixture_block_bootstrap check(action<>'platform.owner.bootstrap')");
    await assert.rejects(() => operate("bootstrap"), /fixture_block_bootstrap/);
    assert.deepEqual(await counts(), { principals: 0, events: 0 });
    await db.exec("alter table private.platform_audit_events drop constraint fixture_block_bootstrap");
  });
  await check("real operator bootstrap grants one exact principal and one automatic operator audit", async () => {
    await operate("bootstrap");
    assert.deepEqual(await counts(), { principals: 1, events: 1 });
    assert.deepEqual((await db.query("select user_id,enabled,revoked_at from private.platform_principals")).rows, [{ user_id: uid(1), enabled: true, revoked_at: null }]);
    assert.deepEqual((await db.query("select actor_id,actor_type,subject_id,action from private.platform_audit_events")).rows, [{ actor_id: null, actor_type: "operator", subject_id: uid(1), action: "platform.owner.bootstrap" }]);
  });
  await check("repeating bootstrap is a verified no-op, not another event", async () => { await operate("bootstrap"); assert.deepEqual(await counts(), { principals: 1, events: 1 }); });
  await check("foreign root and fresh restore cannot silently change the initial authority", async () => {
    await assert.rejects(() => operate("bootstrap", 2), /UNEXPECTED_ROOT/);
    await assert.rejects(() => operate("restore"), /NOT_REVOKED/);
    assert.deepEqual(await counts(), { principals: 1, events: 1 });
  });
  await check("grant without TOTP still requires MFA; another identity/metadata remains forbidden", async () => {
    assert.equal((await context(1)).state, "mfa_required");
    assert.equal((await context(2)).state, "forbidden");
  });
  await check("ordinary authenticated session cannot run the operator transaction", async () => {
    await db.exec("set role authenticated");
    try { await assert.rejects(() => operate("revoke"), /OPERATOR_CONTEXT_REQUIRED|permission denied/); }
    finally { await db.exec("reset role"); }
    assert.deepEqual(await counts(), { principals: 1, events: 1 });
  });
  await check("an operator carrying a user claim cannot fabricate user attribution", async () => {
    await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: uid(1) })]);
    try { await assert.rejects(() => operate("revoke"), /OPERATOR_CONTEXT_REQUIRED/); }
    finally { await db.query("select set_config('request.jwt.claims','{}',false)"); }
    assert.deepEqual(await counts(), { principals: 1, events: 1 });
  });
  await check("revoke and repeated revoke append exactly one event and deny existing claims", async () => {
    await operate("revoke"); await operate("revoke");
    assert.deepEqual(await counts(), { principals: 1, events: 2 });
    assert.equal((await context(1)).state, "forbidden");
    await assert.rejects(() => operate("bootstrap"), /BOOTSTRAP_NOT_RESTORE/);
  });
  await check("explicit restore and repeated restore append once and keep MFA required", async () => {
    await operate("restore"); await operate("restore");
    assert.deepEqual(await counts(), { principals: 1, events: 3 });
    assert.equal((await context(1)).state, "mfa_required");
  });
  await check("function ACL drift refuses an operator state change", async () => {
    await db.exec("grant execute on function public.axia_platform_context() to anon");
    await assert.rejects(() => operate("revoke"), /FUNCTION_ACL_DRIFT/);
    await db.exec("revoke execute on function public.axia_platform_context() from anon");
    assert.deepEqual(await counts(), { principals: 1, events: 3 });
  });
  await check("changed function source refuses an operator state change", async () => {
    const original = (await db.query("select pg_get_functiondef('public.axia_platform_context()'::regprocedure) as definition")).rows[0].definition;
    await db.exec("create or replace function public.axia_platform_context() returns jsonb language sql security invoker set search_path='' as $$select '{}'::jsonb$$");
    await assert.rejects(() => operate("revoke"), /FUNCTION_DRIFT/);
    await db.exec(original);
    assert.deepEqual(await counts(), { principals: 1, events: 3 });
  });
  await check("table privilege drift refuses an operator state change", async () => {
    await db.exec("grant select on private.platform_principals to authenticated");
    await assert.rejects(() => operate("revoke"), /TABLE_ACL_DRIFT/);
    await db.exec("revoke select on private.platform_principals from authenticated");
  });
  await check("disabled audit trigger refuses a state change before a missing audit is possible", async () => {
    await db.exec("alter table private.platform_principals disable trigger platform_principal_audit");
    await assert.rejects(() => operate("revoke"), /GUARD_DRIFT/);
    await db.exec("alter table private.platform_principals enable trigger platform_principal_audit");
  });
  await check("unexpected role history causes rollback before a new state event", async () => {
    await db.query("insert into private.platform_audit_events(actor_type,subject_id,action) values('operator',$1,'platform.owner.bootstrap')", [uid(1)]);
    await assert.rejects(() => operate("revoke"), /UNEXPECTED_HISTORY/);
    assert.equal((await db.query("select enabled from private.platform_principals")).rows[0].enabled, true);
    assert.deepEqual(await counts(), { principals: 1, events: 4 });
  });
  await check("all operator operations preserve memberships, Auth metadata and tenant authority", async () => assert.equal(await snapshot(), before));
  console.log(`Platform operator SQL checks: ${checks}; ${(await db.query("select version()")).rows[0].version}`);
} finally {
  if (native) { await pool?.end(); if (ownedDatabase) await control.query(`drop database "${ownedDatabase}"`); await control?.end(); }
  else await db?.close();
}
