import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Both backends are disposable test runtimes, never a live Supabase connection.
const modulePath = process.env.AXIA_SQL_TEST_MODULE;
if (!modulePath)
  throw new Error("Set AXIA_SQL_TEST_MODULE to the isolated test runtime entry point.");
const nativePostgres = process.env.AXIA_SQL_BACKEND === "postgres";
let db;
if (nativePostgres) {
  const driver = await import(pathToFileURL(modulePath).href);
  const Pool = driver.Pool ?? driver.default.Pool;
  const pool = new Pool({ host: "127.0.0.1", port: 5432, user: "postgres",
    database: "axia_staff_verification", max: 6, connectionTimeoutMillis: 5000,
    statement_timeout: 10000 });
  const admin = await pool.connect();
  db = {
    exec: sql => admin.query(sql),
    query: (...args) => admin.query(...args),
    async transaction(run) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const result = await run({ exec: sql => client.query(sql), query: (...args) => client.query(...args) });
        await client.query("commit");
        return result;
      } catch (error) { await client.query("rollback"); throw error; }
      finally { client.release(); }
    },
    async close() { admin.release(); await pool.end(); },
  };
} else {
  const { PGlite } = await import(pathToFileURL(modulePath).href);
  db = new PGlite();
}
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const org = uuid(101),
  otherOrg = uuid(102),
  matter = uuid(201);
let checks = 0;
async function check(name, run) {
  await run();
  checks++;
  console.log(`PASS ${name}`);
}
async function asUser(n, run) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
      uuid(n),
    ]);
    return run(tx);
  });
}
async function manage(
  actor,
  action,
  email = null,
  role = null,
  invitation = null,
  organization = org,
) {
  return asUser(
    actor,
    async (tx) =>
      (
        await tx.query(
          "select public.axia_staff_manage($1,$2,$3,$4,$5) as result",
          [organization, action, email, role, invitation],
        )
      ).rows[0].result,
  );
}
const accept = (actor, token) =>
  asUser(
    actor,
    async (tx) =>
      (await tx.query("select public.axia_staff_accept($1) as result", [token]))
        .rows[0].result,
  );
const denied = (
  fn,
  pattern = /STAFF_|permission denied|row-level security|TASK_/,
) => assert.rejects(fn, pattern);
try {
  await db.exec(
    await fs.readFile("tests/sql/staff-foundation-fixture.sql", "utf8"),
  );
  const migration = (await fs.readdir("supabase/migrations")).find((p) =>
    p.endsWith("_axia_staff_email_invitations.sql"),
  );
  await db.exec(await fs.readFile(`supabase/migrations/${migration}`, "utf8"));
  await db.query("insert into public.organizations values($1,$2),($3,$4)", [
    org,
    "Office A",
    otherOrg,
    "Office B",
  ]);
  for (let i = 1; i <= 16; i++)
    await db.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,$2,$3)",
      [
        uuid(i),
        `person${i}@example.invalid`,
        i === 9 ? null : new Date().toISOString(),
      ],
    );
  for (const [id, role] of [
    [1, "owner"],
    [2, "admin"],
    [3, "lawyer"],
    [4, "staff"],
    [5, "trainee"],
    [6, "viewer"],
  ])
    await db.query(
      "insert into public.organization_members values($1,$2,$3,now())",
      [org, uuid(id), role],
    );
  await db.query(
    "insert into public.organization_members values($1,$2,'owner',now())",
    [otherOrg, uuid(7)],
  );
  await db.query("insert into public.matters values($1,$2)", [matter, org]);
  await check("anon cannot call privileged wrappers", () =>
    denied(() =>
      db.exec(
        "set role anon; select public.axia_staff_accept(repeat('0',64));",
      ),
    ),
  );
  await db.exec("reset role");
  await check("lower roles cannot invite", async () => {
    for (const n of [3, 4, 5, 6])
      await denied(() =>
        manage(n, "create", "person8@example.invalid", "staff"),
      );
  });
  await check(
    "owner and admin cannot grant owner; admin cannot grant admin",
    async () => {
      await denied(() =>
        manage(1, "create", "person8@example.invalid", "owner"),
      );
      await denied(() =>
        manage(2, "create", "person8@example.invalid", "admin"),
      );
    },
  );
  await check("cross-tenant manager denied", () =>
    denied(() => manage(7, "create", "person8@example.invalid", "staff")),
  );
  const invitation = await manage(
    1,
    "create",
    " PERSON8@example.invalid ",
    "staff",
  );
  await check("raw token returned once, stored only as a hash", async () => {
    assert.match(invitation.token, /^[0-9a-f]{64}$/);
    const row = (
      await db.query("select * from public.staff_invitations where id=$1", [
        invitation.id,
      ])
    ).rows[0];
    assert.equal(row.email_normalized, "person8@example.invalid");
    assert.notEqual(row.token_hash, invitation.token);
    await denied(() =>
      asUser(1, (tx) =>
        tx.query("select token_hash from public.staff_invitations"),
      ),
    );
  });
  await check(
    "pending duplicate and existing member do not create invitations",
    async () => {
      await denied(
        () => manage(1, "create", "person8@example.invalid", "staff"),
        /duplicate key/,
      );
      await denied(
        () => manage(1, "create", "person4@example.invalid", "admin"),
        /STAFF_ALREADY_MEMBER/,
      );
    },
  );
  await check(
    "invitations are tenant scoped for managers and hidden from staff",
    async () => {
      assert.equal(
        (
          await asUser(7, (tx) =>
            tx.query("select id from public.staff_invitations"),
          )
        ).rows.length,
        0,
      );
      assert.equal(
        (
          await asUser(4, (tx) =>
            tx.query("select id from public.staff_invitations"),
          )
        ).rows.length,
        0,
      );
      await denied(() =>
        asUser(1, (tx) =>
          tx.query("update public.staff_invitations set status='accepted'"),
        ),
      );
    },
  );
  await check(
    "wrong recipient and unconfirmed email cannot accept",
    async () => {
      await denied(() => accept(10, invitation.token));
      const unverified = await manage(
        1,
        "create",
        "person9@example.invalid",
        "staff",
      );
      await denied(() => accept(9, unverified.token), /VERIFIED_EMAIL/);
    },
  );
  await check(
    "verified recipient gains only the intended membership",
    async () => {
      const result = await accept(8, invitation.token);
      assert.equal(result.organizationId, org);
      assert.equal(
        (
          await db.query(
            "select role from public.organization_members where user_id=$1",
            [uuid(8)],
          )
        ).rows[0].role,
        "staff",
      );
      assert.equal(
        (
          await db.query("select id from public.profiles where id=$1", [
            uuid(8),
          ])
        ).rows.length,
        1,
      );
    },
  );
  await check(
    "repeated acceptance is idempotent and does not promote existing member",
    async () => {
      assert.equal((await accept(8, invitation.token)).alreadyAccepted, true);
      assert.equal(
        (
          await db.query(
            "select count(*)::int as n from public.audit_logs where action='staff_invitation.accept'",
          )
        ).rows[0].n,
        1,
      );
      const race = await manage(
        1,
        "create",
        "person10@example.invalid",
        "admin",
      );
      await db.query(
        "insert into public.organization_members values($1,$2,'viewer',now())",
        [org, uuid(10)],
      );
      await accept(10, race.token);
      assert.equal(
        (
          await db.query(
            "select role from public.organization_members where user_id=$1",
            [uuid(10)],
          )
        ).rows[0].role,
        "viewer",
      );
    },
  );
  const rotate = await manage(1, "create", "person11@example.invalid", "staff");
  await check(
    "rotation has a cooldown and invalidates the old token",
    async () => {
      await denied(
        () => manage(1, "rotate", null, null, rotate.id),
        /RATE_LIMIT/,
      );
      await db.query(
        "update public.staff_invitations set updated_at=now()-interval '2 minutes' where id=$1",
        [rotate.id],
      );
      const rotated = await manage(1, "rotate", null, null, rotate.id);
      await denied(() => accept(11, rotate.token));
      await manage(1, "revoke", null, null, rotate.id);
      await denied(() => accept(11, rotated.token));
    },
  );
  await check("expiry and inviter demotion invalidate acceptance", async () => {
    const expired = await manage(
      1,
      "create",
      "person12@example.invalid",
      "staff",
    );
    await db.query(
      "update public.staff_invitations set created_at=now()-interval '8 days',expires_at=now()-interval '1 day' where id=$1",
      [expired.id],
    );
    await denied(() => accept(12, expired.token));
    const demoted = await manage(
      2,
      "create",
      "person13@example.invalid",
      "staff",
    );
    await db.query(
      "update public.organization_members set role='staff' where user_id=$1",
      [uuid(2)],
    );
    await denied(() => accept(13, demoted.token), /INVITER_NO_LONGER/);
  });
  await check("a second office is never selected implicitly", async () => {
    const second = await manage(
      1,
      "create",
      "person7@example.invalid",
      "staff",
    );
    await denied(() => accept(7, second.token), /WORKSPACE_CONFLICT/);
  });
  await check("accepted link never restores removed membership", async () => {
    await db.query("delete from public.organization_members where user_id=$1", [
      uuid(8),
    ]);
    await denied(() => accept(8, invitation.token));
  });
  const task = (actor, assignee, caseId = null, organization = org) =>
    asUser(actor, (tx) =>
      tx.query(
        "insert into public.tasks(organization_id,assigned_to,matter_id,created_by,title) values($1,$2,$3,$4,'task')",
        [organization, uuid(assignee), caseId, uuid(actor)],
      ),
    );
  await check(
    "database guard rejects cross-tenant, viewer and staff reassignment",
    async () => {
      await denied(() => task(1, 7));
      await denied(() => task(1, 6));
      await denied(() => task(4, 3));
    },
  );
  await check(
    "assignment needs recipient case access; no ACL is granted by assignment",
    async () => {
      await denied(() => task(1, 4, matter), /MATTER_FORBIDDEN/);
      assert.equal(
        (await db.query("select * from public.matter_members")).rows.length,
        0,
      );
      await db.query("insert into public.matter_members values($1,$2)", [
        matter,
        uuid(4),
      ]);
      await task(1, 4, matter);
      await task(4, 4, matter);
      await task(3, 3, matter);
    },
  );
  await check(
    "staff cannot take another members task; managers can reassign eligible tasks",
    async () => {
      const id = (
        await db.query(
          "select id from public.tasks where assigned_to=$1 limit 1",
          [uuid(3)],
        )
      ).rows[0].id;
      await denied(() =>
        asUser(4, (tx) =>
          tx.query("update public.tasks set assigned_to=$1 where id=$2", [
            uuid(4),
            id,
          ]),
        ),
      );
      await asUser(1, (tx) =>
        tx.query("update public.tasks set assigned_to=$1 where id=$2", [
          uuid(4),
          id,
        ]),
      );
      assert.equal(
        (
          await db.query("select assigned_to from public.tasks where id=$1", [
            id,
          ])
        ).rows[0].assigned_to,
        uuid(4),
      );
    },
  );
  await check(
    "existing member mutations remain unavailable directly and wrappers remain invokers",
    async () => {
      await denied(() =>
        asUser(4, (tx) =>
          tx.query(
            "insert into public.organization_members values($1,$2,'owner',now())",
            [org, uuid(14)],
          ),
        ),
      );
      const functions = (
        await db.query(
          "select p.proname,p.prosecdef from pg_proc p join pg_namespace n on p.pronamespace=n.oid where n.nspname='public' and p.proname like 'axia_staff_%'",
        )
      ).rows;
      assert.equal(functions.length, 3);
      assert.ok(functions.every((fn) => !fn.prosecdef));
    },
  );
  if (nativePostgres) {
    await check("concurrent duplicate creation and acceptance produce exactly one membership", async () => {
      const creations = await Promise.allSettled([
        manage(1,"create","person14@example.invalid","staff"),
        manage(1,"create","person14@example.invalid","staff"),
      ]);
      const success = creations.filter(result => result.status === "fulfilled");
      assert.equal(success.length,1);
      const created = success[0].value;
      const accepted = await Promise.all([accept(14,created.token),accept(14,created.token)]);
      assert.equal(accepted.filter(result=>result.alreadyAccepted).length,1);
      assert.equal((await db.query("select count(*)::int as n from public.organization_members where user_id=$1",[uuid(14)])).rows[0].n,1);
      assert.equal((await db.query("select count(*)::int as n from public.audit_logs where resource_id=$1 and action='staff_invitation.accept'",[created.id])).rows[0].n,1);
    });
    await check("rotation racing acceptance cannot replace an accepted token or grant twice",async()=>{
      const item=await manage(1,"create","person15@example.invalid","staff");
      await db.query("update public.staff_invitations set updated_at=now()-interval '2 minutes' where id=$1",[item.id]);
      const outcomes=await Promise.allSettled([manage(1,"rotate",null,null,item.id),accept(15,item.token)]);
      assert.equal(outcomes.filter(result=>result.status==="fulfilled").length,1);
      const row=(await db.query("select status from public.staff_invitations where id=$1",[item.id])).rows[0];
      const count=(await db.query("select count(*)::int as n from public.organization_members where user_id=$1",[uuid(15)])).rows[0].n;
      assert.equal(count,row.status==="accepted"?1:0);
    });
    await check("concurrent invitations to different offices cannot join one recipient twice",async()=>{
      const first=await manage(1,"create","person16@example.invalid","staff");
      const second=await manage(7,"create","person16@example.invalid","staff",null,otherOrg);
      const outcomes=await Promise.allSettled([accept(16,first.token),accept(16,second.token)]);
      assert.equal(outcomes.filter(result=>result.status==="fulfilled").length,1);
      assert.equal((await db.query("select count(*)::int as n from public.organization_members where user_id=$1",[uuid(16)])).rows[0].n,1);
    });
  }
  await check(
    "audit metadata contains no invitation tokens or recipient emails",
    async () => {
      const text = JSON.stringify(
        (await db.query("select metadata from public.audit_logs")).rows,
      );
      assert.ok(!text.includes(invitation.token));
      assert.ok(!text.includes("@example.invalid"));
    },
  );
  console.log(
    `SQL checks: ${checks}; ${(await db.query("select version() as version")).rows[0].version}`,
  );
} finally {
  await db.close();
}
