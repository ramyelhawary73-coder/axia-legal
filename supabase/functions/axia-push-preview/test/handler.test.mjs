import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { createHandler, authenticate, edgeConfig, validateRole } from "../handler.mjs";

// Ephemeral test material only; never persisted as operational keys or sent to Supabase/FCM.
const secret = randomBytes(32).toString("base64url"), current = Date.now();
const origin = "https://fixture-git-push.vercel.app";
const env = () => ({ AXIA_PUSH_EDGE_ENABLED: "1", AXIA_PUSH_ENABLED: "1", AXIA_PUSH_SCOPE: "axia-push-preview-v1",
  AXIA_PUSH_DEPLOYMENT_MODE: "preview", AXIA_PUSH_ORIGIN: origin,
  AXIA_PUSH_EXPECTED_SUPABASE_REF: "qshgczulivsxztgrbqew", SUPABASE_URL: "https://qshgczulivsxztgrbqew.supabase.co",
  AXIA_PUSH_DB_HOST: "fixture.pooler.supabase.com", AXIA_PUSH_DB_NAME: "postgres",
  AXIA_PUSH_DISPATCH_DATABASE_URL: "postgresql://axia_push_preview_worker.qshgczulivsxztgrbqew:fixture@fixture.pooler.supabase.com:5432/postgres",
  AXIA_PUSH_SUBSCRIPTION_KEY_V1: secret, AXIA_PUSH_VAPID_PUBLIC_KEY: "B".repeat(87), AXIA_PUSH_VAPID_PRIVATE_KEY: secret,
  AXIA_PUSH_VAPID_SUBJECT: "https://example.invalid/contact", AXIA_PUSH_CRON_HMAC_KEY: secret });
function request({ issued = Math.floor(current / 1000).toString(), body = "{}", headers = {}, method = "POST" } = {}) {
  return new Request("https://fixture.invalid/functions/v1/axia-push-preview", { method,
    ...(method === "POST" ? { body } : {}), headers: { "content-type": "application/json",
      "x-axia-push-issued": issued, "x-axia-push-signature": createHmac("sha256", secret)
        .update(`axia-push-cron-v1\nqshgczulivsxztgrbqew\naxia-push-preview-v1\n${issued}`).digest("hex"), ...headers } });
}
const role = { name: "axia_push_preview_worker", db: "postgres", member: true, extra_membership: false,
  rolsuper: false, rolbypassrls: false, rolcreatedb: false, rolcreaterole: false };
function fixture({ override = {}, admitted = true, locked = true, roleOverride = {}, fail = false } = {}) {
  const calls = []; let ended = 0;
  const client = { on() {}, async connect() { calls.push("connect"); }, async end() { ended++; }, async query(sql) {
    calls.push(sql);
    if (fail) throw new Error("sensitive-database-details");
    if (sql.includes("current_user as name")) return { rows: [{ ...role, ...roleOverride }] };
    if (sql.includes("advisory_lock")) return { rows: [{ locked }] };
    if (sql.includes("edge_begin")) return { rows: [{ allowed: admitted }] };
    if (sql.includes("push_claim")) return { rows: [{ value: null }] };
    throw new Error("unexpected_sql");
  } };
  const handle = createHandler({ env: () => ({ ...env(), ...override }), now: () => current,
    makeClient: () => client, sendNotification: () => { throw new Error("never_contact_provider"); } });
  return { handle, calls, ended: () => ended };
}
Deno.test("disabled Edge and invalid project never connect to database/provider", async () => {
  for (const override of [{ AXIA_PUSH_EDGE_ENABLED: "0" }, { AXIA_PUSH_ENABLED: "0" },
    { SUPABASE_URL: "https://other.supabase.co" }, { AXIA_PUSH_EXPECTED_SUPABASE_REF: "a".repeat(20) },
    { AXIA_PUSH_DISPATCH_DATABASE_URL: env().AXIA_PUSH_DISPATCH_DATABASE_URL.replace(":5432/", ":6543/") }]) {
    const f = fixture({ override }); assert.equal((await f.handle(request())).status, 503); assert.deepEqual(f.calls, []);
  }
});
Deno.test("dedicated HMAC rejects unsigned, forged, stale, future and cross-scope invocation", () => {
  assert.equal(authenticate(request(), secret, current), true);
  for (const r of [request({ issued: Math.floor(current / 1000 - 61).toString() }),
    request({ issued: Math.floor(current / 1000 + 10).toString() }),
    request({ headers: { "x-axia-push-signature": "0".repeat(64) } })]) assert.equal(authenticate(r, secret, current), false);
});
Deno.test("method, browser origin, body injection and broad project key cannot start work", async () => {
  for (const r of [request({ method: "GET" }), request({ headers: { origin } }), request({ body: '{"recipient":"other"}' }),
    request({ headers: { "x-axia-push-signature": "", apikey: "fixture-project-secret" } })]) {
    const f = fixture(); assert.ok((await f.handle(r)).status >= 400); assert.deepEqual(f.calls, []);
  }
});
Deno.test("one bounded tick closes connection and duplicate/disabled/budget decisions are respected", async () => {
  for (const options of [{}, { admitted: false }, { locked: false }]) {
    const f = fixture(options); assert.equal((await f.handle(request())).status, 202); assert.equal(f.ended(), 1);
    assert.equal(f.calls.filter(s => s.includes("push_claim")).length, options.admitted === false || options.locked === false ? 0 : 1);
    assert.ok(!f.calls.some(s => /begin;|set role|auth\.users|service_role/i.test(s)));
  }
});
Deno.test("unsafe worker privileges and connection errors fail closed with redacted responses", async () => {
  for (const options of [{ roleOverride: { rolsuper: true } }, { roleOverride: { extra_membership: true } }, { fail: true }]) {
    const f = fixture(options), r = await f.handle(request()); assert.equal(r.status, 503); assert.equal(f.ended(), 1);
    assert.equal(await r.text(), '{"code":"PUSH_UNAVAILABLE"}');
    assert.ok(!f.calls.some(s => s.includes("push_claim")));
  }
  await assert.rejects(() => validateRole({ query: () => ({ rows: [{ ...role, name: "postgres" }] }) }, edgeConfig(env())));
});
