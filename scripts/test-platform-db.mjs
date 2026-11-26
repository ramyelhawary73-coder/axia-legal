import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// No URL/env credential is accepted. PGlite is in-process; native creates its OWN
// named database on loopback inside the explicitly disposable CI PostgreSQL service.
const modulePath = process.env.AXIA_SQL_TEST_MODULE;
if (!modulePath) throw new Error("Set AXIA_SQL_TEST_MODULE to a disposable test module");
const native = process.env.AXIA_SQL_BACKEND === "postgres";
let db, pool, control, ownedDatabase;
if (native) {
  if (process.env.CI !== "true" && process.env.AXIA_DISPOSABLE_PLATFORM_DB !== "1") throw new Error("Native platform tests require an explicitly disposable local server");
  const driver = await import(pathToFileURL(modulePath).href);
  const Pool = driver.Pool ?? driver.default.Pool;
  const options = { host: "127.0.0.1", port: 5432, user: "postgres", connectionTimeoutMillis: 5000, statement_timeout: 10000 };
  control = new Pool({ ...options, database: "postgres", max: 1 });
  ownedDatabase = `axia_platform_verify_${process.pid}`;
  await control.query(`create database "${ownedDatabase}"`); // fails rather than replacing an existing database
  pool = new Pool({ ...options, database: ownedDatabase, max: 6 });
  db = { query: (...args) => pool.query(...args), exec: sql => pool.query(sql), async transaction(run) {
    const client = await pool.connect();
    try { await client.query("begin"); const result = await run({ exec: sql => client.query(sql), query: (...args) => client.query(...args) }); await client.query("commit"); return result; }
    catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  } };
} else {
  const { PGlite } = await import(pathToFileURL(modulePath).href);
  db = new PGlite();
}
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
let checks = 0;
const check = async (name, run) => { await run(); checks++; console.log(`PASS ${name}`); };
async function claims(tx, n, extra = {}, role = "authenticated") {
  await tx.exec(`set local role ${role}`);
  await tx.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: uuid(n), session_id: uuid(100+n), aal: "aal2", ...extra })]);
}
const asUser = (n, run, extra = {}, role) => db.transaction(async tx => { await claims(tx,n,extra,role); return run(tx); });
const context = (n=1, extra) => asUser(n,async tx => (await tx.query("select public.axia_platform_context() as data")).rows[0].data,extra);
const read = (n=1,kind="offices",limit=20,after=null) => asUser(n,async tx => (await tx.query(`select public.axia_platform_${kind}($1,$2) as data`,[limit,after])).rows[0].data);
const denied = run => assert.rejects(run,/PLATFORM_|permission denied|row-level security|duplicate key|foreign key/);
const snapshot = async () => JSON.stringify((await db.query(`select jsonb_build_object(
  'policies',(select jsonb_agg(to_jsonb(p) order by tablename,policyname) from pg_policies p where schemaname='public'),
  'grants',(select jsonb_agg(to_jsonb(g) order by table_name,grantee,privilege_type) from information_schema.role_table_grants g where table_schema='public'),
  'members',(select jsonb_agg(to_jsonb(m) order by user_id) from public.organization_members m),
  'helper',pg_get_functiondef('private.is_organization_member(uuid)'::regprocedure)) as data`)).rows[0].data);
try {
  await db.exec(await fs.readFile("tests/sql/platform-foundation-fixture.sql","utf8"));
  for (let i=1;i<=13;i++) {
    await db.query("insert into auth.users values($1,$2,$3,$4,$5)",[uuid(i),`fixture${i}@example.invalid`,i===9?null:new Date().toISOString(),i===10,i===11?"2099-01-01":null]);
    await db.query("insert into auth.mfa_factors values($1,$2,'totp','verified')",[uuid(200+i),uuid(i)]);
    await db.query("insert into auth.sessions values($1,$2,$3,'aal2',null)",[uuid(100+i),uuid(i),uuid(200+i)]);
  }
  for (let i=1;i<=3;i++) await db.query("insert into public.organizations(id,name,slug) values($1,$2,$3)",[uuid(300+i),`مكتب اختبار ${i}`,`fixture-office-${i}`]);
  for (const [n,role] of [[2,"owner"],[3,"admin"],[4,"lawyer"],[5,"staff"],[6,"trainee"],[7,"viewer"],[8,"owner"]]) await db.query("insert into public.organization_members values($1,$2,$3)",[uuid(n===8?302:301),uuid(n),role]);
  for (const t of ["clients","matters","tasks","financial_records","documents"]) await db.exec(`insert into public.${t} values('${uuid(401)}','${uuid(301)}','synthetic A'),('${uuid(402)}','${uuid(302)}','synthetic B')`);
  const before = await snapshot();
  const migration = (await fs.readdir("supabase/migrations")).filter(p=>p.endsWith("_axia_platform_owner_foundation.sql"));
  assert.equal(migration.length,1);
  await db.exec(await fs.readFile(`supabase/migrations/${migration[0]}`,"utf8"));
  await check("additive migration preserves tenant policies, grants, helper and memberships",async()=>assert.equal(await snapshot(),before));
  await check("migration seeds no platform authority or audit identities",async()=>{
    assert.equal(Number((await db.query("select count(*) as n from private.platform_principals")).rows[0].n),0);
    assert.equal(Number((await db.query("select count(*) as n from private.platform_audit_events")).rows[0].n),0);
  });
  await check("operator bootstrap rejects missing, unconfirmed, anonymous and banned accounts",async()=>{
    for (const n of [9,10,11,999]) await denied(()=>db.query("insert into private.platform_principals(user_id) values($1)",[uuid(n)]));
  });
  await db.query("insert into private.platform_principals(user_id) values($1)",[uuid(1)]);
  await check("same identity bootstrap is idempotent; a second active root is rejected",async()=>{
    await db.query("insert into private.platform_principals(user_id) values($1) on conflict(user_id) do nothing",[uuid(1)]);
    await denied(()=>db.query("insert into private.platform_principals(user_id) values($1)",[uuid(12)]));
    const rows=(await db.query("select actor_id,actor_type,subject_id,action from private.platform_audit_events")).rows;
    assert.equal(rows.length,1); assert.equal(rows[0].actor_id,null); assert.equal(rows[0].actor_type,"operator"); assert.equal(rows[0].subject_id,uuid(1));
  });
  await check("verified MFA root reaches the console without office membership",async()=>assert.equal((await context()).state,"ready"));
  await check("principal identity/history cannot be rewritten or deleted by accident",async()=>{
    await denied(()=>db.query("update private.platform_principals set user_id=$1 where user_id=$2",[uuid(12),uuid(1)]));
    await denied(()=>db.exec("update private.platform_principals set created_at='2000-01-01'"));
    await denied(()=>db.exec("delete from private.platform_principals"));
    await denied(()=>db.exec("truncate private.platform_principals"));
  });
  await check("office roles and metadata impersonation never grant platform access",async()=>{
    for (const n of [2,3,4,5,6,7,8]) { assert.equal((await context(n,{user_metadata:{role:"platform_owner",email:"developer@example.invalid"},app_metadata:{role:"platform_owner"}})).state,"forbidden"); await denied(()=>read(n)); }
  });
  await check("anonymous database role cannot execute public/private platform functions",async()=>{
    for (const sql of ["select public.axia_platform_context()","select public.axia_platform_offices()","select private.axia_platform_context()"])
      await denied(()=>asUser(1,tx=>tx.exec(sql),{},"anon"));
  });
  await check("root and staff cannot read/write platform tables directly",async()=>{
    for (const n of [1,2,5]) for (const sql of ["select * from private.platform_principals","insert into private.platform_principals(user_id) values('"+uuid(12)+"')","update private.platform_principals set enabled=false","delete from private.platform_principals","select * from private.platform_audit_events","insert into private.platform_audit_events(actor_type,action) values('operator','platform.owner.bootstrap')"])
      await denied(()=>asUser(n,tx=>tx.exec(sql)));
  });
  await check("directory is paginated and exposes only fixed non-legal office fields",async()=>{
    const first=await read(1,"offices",2); assert.equal(first.items.length,2); assert.equal(first.nextCursor,uuid(302));
    assert.deepEqual(Object.keys(first.items[0]).sort(),["createdAt","id","name","slug"]);
    const last=await read(1,"offices",2,first.nextCursor); assert.equal(last.items.length,1); assert.equal(last.nextCursor,null);
  });
  await check("platform role does not bypass representative tenant RLS or case data",async()=>{
    for (const t of ["clients","matters","tasks","financial_records","documents"]) {
      assert.equal(Number((await asUser(1,tx=>tx.query(`select count(*) as n from public.${t}`))).rows[0].n),0);
      const own=await asUser(2,tx=>tx.query(`select title from public.${t}`)); assert.deepEqual(own.rows,[{title:"synthetic A"}]);
      await denied(()=>asUser(1,tx=>tx.query(`insert into public.${t} values($1,$2,'blocked')`,[uuid(499),uuid(301)])));
    }
  });
  await check("changed email does not remove or assign UUID-based authority",async()=>{
    await db.query("update auth.users set email='changed@example.invalid' where id=$1",[uuid(1)]); assert.equal((await context()).state,"ready");
  });
  await check("AAL1 claim or downgraded server session requires MFA",async()=>{
    assert.equal((await context(1,{aal:"aal1"})).state,"mfa_required");
    await db.query("update auth.sessions set aal='aal1' where id=$1",[uuid(101)]); assert.equal((await context()).state,"mfa_required");
    await db.query("update auth.sessions set aal='aal2' where id=$1",[uuid(101)]);
  });
  await check("removed/unverified or another user's factor cannot authorize a stale token",async()=>{
    await db.query("delete from auth.mfa_factors where id=$1",[uuid(201)]); assert.equal((await context()).state,"mfa_required");
    await db.query("insert into auth.mfa_factors values($1,$2,'totp','verified')",[uuid(201),uuid(1)]);
    await db.query("update auth.mfa_factors set status='unverified' where id=$1",[uuid(201)]); assert.equal((await context()).state,"mfa_required");
    await db.query("update auth.mfa_factors set status='verified' where id=$1",[uuid(201)]);
    await db.query("update auth.sessions set factor_id=$1 where id=$2",[uuid(202),uuid(101)]); assert.equal((await context()).state,"mfa_required");
    await db.query("update auth.sessions set factor_id=$1 where id=$2",[uuid(201),uuid(101)]);
  });
  await check("malformed/missing/foreign session is denied before private data",async()=>{
    for (const session_id of [null,"not-a-uuid",uuid(102),uuid(999)]) assert.equal((await context(1,{session_id})).state,"forbidden");
    await db.query("update auth.sessions set not_after='2000-01-01' where id=$1",[uuid(101)]); assert.equal((await context()).state,"forbidden");
    await db.query("update auth.sessions set not_after=null where id=$1",[uuid(101)]);
    await db.query("delete from auth.sessions where id=$1",[uuid(101)]); assert.equal((await context()).state,"forbidden");
    await db.query("insert into auth.sessions values($1,$2,$3,'aal2',null)",[uuid(101),uuid(1),uuid(201)]);
  });
  await check("banned/anonymous/unconfirmed root is rechecked in the database",async()=>{
    for (const [column,bad,good] of [["banned_until","2099-01-01",null],["is_anonymous",true,false],["email_confirmed_at",null,new Date().toISOString()]]) {
      await db.query(`update auth.users set ${column}=$1 where id=$2`,[bad,uuid(1)]); assert.equal((await context()).state,"forbidden");
      await db.query(`update auth.users set ${column}=$1 where id=$2`,[good,uuid(1)]);
    }
  });
  await check("revocation wins over existing JWT/app_metadata authority",async()=>{
    await db.query("update private.platform_principals set enabled=false,revoked_at=now() where user_id=$1",[uuid(1)]);
    assert.equal((await context()).state,"forbidden"); await denied(()=>read());
    await db.query("update private.platform_principals set enabled=true,revoked_at=null where user_id=$1",[uuid(1)]);
  });
  await check("invalid bounds/cursors/kinds never become arbitrary SQL access",async()=>{
    for (const n of [0,51,null]) await denied(()=>read(1,"offices",n));
    for (const kind of ["offices","audit"]) await denied(()=>read(1,kind,20,uuid(999)));
    await denied(()=>asUser(1,tx=>tx.query("select private.axia_platform_read('clients',20,null)")));
  });
  await check("successful accesses are audited; audit is immutable even for the operator",async()=>{
    const page=await read(1,"audit",2); assert.equal(page.items.length,2); assert.ok(page.nextCursor);
    assert.deepEqual(Object.keys(page.items[0]).sort(),["action","actorId","actorType","createdAt","id","subjectId"]);
    await denied(()=>db.exec("update private.platform_audit_events set action='platform.offices.read'"));
    await denied(()=>db.exec("delete from private.platform_audit_events"));
    await denied(()=>db.exec("truncate private.platform_audit_events"));
    assert.ok((await db.query("select count(*) as n from private.platform_audit_events where action='platform.offices.read' and actor_id=$1",[uuid(1)])).rows[0].n>0);
  });
  await check("function privileges and definer search paths are explicit",async()=>{
    const rows=(await db.query("select p.proname,p.prosecdef,p.proconfig,has_function_privilege('anon',p.oid,'execute') as anonymous from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 'axia_platform_%'")).rows;
    for (const row of rows) { assert.equal(row.anonymous,false); assert.ok(row.proconfig.some(s=>s.startsWith('search_path='))); }
    const wrappers=(await db.query("select prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'axia_platform_%'")).rows;
    assert.ok(wrappers.every(r=>r.prosecdef===false));
  });
  await check("read audit rate limit is bounded without changing tenant data",async()=>{
    await db.transaction(async tx=>{
      await tx.query("insert into private.platform_audit_events(actor_id,actor_type,action) select $1,'user','platform.offices.read' from generate_series(1,121)",[uuid(1)]);
      await claims(tx,1);
      await assert.rejects(()=>tx.query("select public.axia_platform_offices()"),/PLATFORM_RATE_LIMIT/);
      // Transaction is aborted on native Postgres; outer wrapper rolls back below.
      throw new Error("ROLLBACK_RATE_FIXTURE");
    }).catch(error=>{ assert.match(error.message,/ROLLBACK_RATE_FIXTURE/); });
    assert.equal(await snapshot(),before);
  });
  if (native) {
    await check("concurrent root read and revocation serialize on the principal",async()=>{
      const reader=await pool.connect(),writer=await pool.connect();
      try {
        await reader.query("begin"); await claims({exec:s=>reader.query(s),query:(...a)=>reader.query(...a)},1);
        await reader.query("select public.axia_platform_offices()");
        const writing=writer.query("/* axia_d1_revoke */ update private.platform_principals set enabled=false,revoked_at=now() where user_id=$1",[uuid(1)]);
        let blocked=false;
        for(let i=0;i<30;i++){ const x=await pool.query("select cardinality(pg_blocking_pids($1)) as n",[writer.processID]); if(x.rows[0].n>0){blocked=true;break;} await delay(20); }
        assert.ok(blocked); await reader.query("commit"); await writing;
        assert.equal((await context()).state,"forbidden");
        await pool.query("update private.platform_principals set enabled=true,revoked_at=null where user_id=$1",[uuid(1)]);
      } finally { await reader.query("rollback"); reader.release();writer.release(); }
    });
    await check("competing operator bootstraps cannot create two active platform owners",async()=>{
      await pool.query("update private.platform_principals set enabled=false,revoked_at=now() where user_id=$1",[uuid(1)]);
      const a=await pool.connect(),b=await pool.connect();
      try {
        await a.query("begin"); await a.query("insert into private.platform_principals(user_id) values($1)",[uuid(12)]);
        const competing=b.query("insert into private.platform_principals(user_id) values($1)",[uuid(13)]).then(()=>null,e=>e);
        let blocked=false;
        for(let i=0;i<30;i++){const x=await pool.query("select cardinality(pg_blocking_pids($1)) as n",[b.processID]);if(x.rows[0].n>0){blocked=true;break;}await delay(20);}
        assert.ok(blocked);
        await a.query("commit"); assert.equal((await competing)?.code,"23505");
        assert.equal(Number((await pool.query("select count(*) as n from private.platform_principals where enabled")).rows[0].n),1);
        await pool.query("update private.platform_principals set enabled=false,revoked_at=now() where user_id=$1",[uuid(12)]);
        await pool.query("update private.platform_principals set enabled=true,revoked_at=null where user_id=$1",[uuid(1)]);
      } finally { await a.query("rollback");a.release();b.release(); }
    });
  }
  console.log(`Platform SQL checks: ${checks}; ${(await db.query('select version()')).rows[0].version}`);
} finally {
  if (native) { await pool?.end(); if(ownedDatabase) await control.query(`drop database "${ownedDatabase}"`); await control?.end(); }
  else await db?.close();
}
