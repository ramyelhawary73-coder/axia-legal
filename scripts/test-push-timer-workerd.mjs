// Local Cloudflare runtime only. No account, tokens, remote service or provider delivery.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { dirname } from "node:path";
import { authenticate } from "../supabase/functions/axia-push-preview/handler.mjs";
import { endpoint, scope, project } from "../workers/push-timer/timer.mjs";

const modulePath = process.env.AXIA_MINIFLARE_MODULE;
assert.ok(modulePath?.startsWith("/"), "Supply an explicitly installed local Miniflare module");
assert.ok(process.env.AXIA_TIMER_BUNDLE?.startsWith("/"), "Supply the locally built Wrangler dry-run bundle");
const { Miniflare, Response: LocalResponse, convertV4MiniflareOptions } = await import(modulePath);
const secret = randomBytes(32).toString("base64url");
let calls = 0, responseStatus = 202;
const t = Date.now(), minute = Math.floor(t / 60000) * 60000;
const base = { host: "127.0.0.1", port: 0, modules: true,
  rootPath: dirname(process.env.AXIA_TIMER_BUNDLE),
  scriptPath: process.env.AXIA_TIMER_BUNDLE,
  compatibilityDate: "2026-11-27",
  // Every outgoing request is captured locally; DNS/Internet/FCM are never used.
  outboundService: async request => {
    calls++; assert.equal(request.url, endpoint); assert.equal(request.method, "POST");
    assert.equal(await request.text(), "{}"); assert.equal(request.headers.has("origin"), false);
    assert.equal(authenticate(request, secret), true);
    return new LocalResponse(null, { status: responseStatus, headers: { Location: "https://never-follow.invalid/" } });
  },
  bindings: { AXIA_PUSH_TIMER_ENABLED: "0", AXIA_PUSH_DEPLOYMENT_MODE: "preview",
    AXIA_PUSH_SCOPE: scope, AXIA_PUSH_EXPECTED_SUPABASE_REF: project, AXIA_PUSH_CRON_HMAC_KEY: secret,
    AXIA_PUSH_WINDOW_STARTED_AT: new Date(minute).toISOString(),
    AXIA_PUSH_APPROVED_UNTIL: new Date(minute + 1800000).toISOString() } };
const options = value => ({ ...convertV4MiniflareOptions(value), telemetry: { enabled: false }, cf: false,
  enableDevRegistry: false });
const mf = new Miniflare(options(base));
try {
  let worker = await mf.getWorker();
  await worker.scheduled({ cron: "* * * * *", scheduledTime: new Date() });
  assert.equal(calls, 0); console.log("PASS workerd disabled scheduled event never calls out");
  const response = await mf.dispatchFetch("https://fixture.invalid/?run=1", { method: "POST" });
  assert.equal(response.status, 404); assert.equal(calls, 0);
  console.log("PASS workerd HTTP route cannot dispatch");
  await mf.setOptions(options({ ...base, bindings: { ...base.bindings, AXIA_PUSH_TIMER_ENABLED: "1" } }));
  worker = await mf.getWorker();
  await worker.scheduled({ cron: "* * * * *", scheduledTime: new Date() });
  assert.equal(calls, 1); console.log("PASS real workerd Web Crypto signs request accepted by Edge authenticator");
  responseStatus = 302;
  await worker.scheduled({ cron: "* * * * *", scheduledTime: new Date() });
  assert.equal(calls, 2); console.log("PASS workerd manual redirect never follows Location or retries");
  await mf.setOptions(options({ ...base, bindings: { ...base.bindings, AXIA_PUSH_TIMER_ENABLED: "1",
    AXIA_PUSH_WINDOW_STARTED_AT: new Date(minute - 1800000).toISOString(),
    AXIA_PUSH_APPROVED_UNTIL: new Date(minute).toISOString() } }));
  worker = await mf.getWorker(); await worker.scheduled({ cron: "* * * * *", scheduledTime: new Date() });
  assert.equal(calls, 2); console.log("PASS workerd expired window never calls out");
} finally { await mf.dispose(); }
