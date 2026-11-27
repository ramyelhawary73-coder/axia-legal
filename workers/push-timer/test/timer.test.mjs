import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes, createHmac, webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createTimer, endpoint, project, scope } from "../timer.mjs";
import { authenticate } from "../../../supabase/functions/axia-push-preview/handler.mjs";

const time = Date.parse("2026-11-27T12:01:00Z");
const secret = randomBytes(32).toString("base64url"); // Ephemeral fixture only.
const env = () => ({ AXIA_PUSH_TIMER_ENABLED: "1", AXIA_PUSH_DEPLOYMENT_MODE: "preview",
  AXIA_PUSH_EXPECTED_SUPABASE_REF: project, AXIA_PUSH_SCOPE: scope, AXIA_PUSH_CRON_HMAC_KEY: secret,
  AXIA_PUSH_WINDOW_STARTED_AT: new Date(time - 60000).toISOString(),
  AXIA_PUSH_APPROVED_UNTIL: new Date(time + 1740000).toISOString() });
const event = () => ({ cron: "* * * * *", scheduledTime: time });
function fixture(deps = {}) {
  const calls = [];
  const timer = createTimer({ now: () => time, subtle: webcrypto.subtle,
    fetcher: async (...args) => { calls.push(args); return new Response(null, { status: 202 }); }, ...deps });
  return { timer, calls };
}

test("disabled and invalid Preview/window/key bindings perform no fetch", async () => {
  const changes = [ { AXIA_PUSH_TIMER_ENABLED: "0" }, { AXIA_PUSH_TIMER_ENABLED: undefined },
    { AXIA_PUSH_DEPLOYMENT_MODE: "production" }, { AXIA_PUSH_EXPECTED_SUPABASE_REF: "other" },
    { AXIA_PUSH_SCOPE: "other" }, { AXIA_PUSH_CRON_HMAC_KEY: "invalid" },
    { AXIA_PUSH_WINDOW_STARTED_AT: "" }, { AXIA_PUSH_APPROVED_UNTIL: "invalid" },
    { AXIA_PUSH_APPROVED_UNTIL: new Date(time).toISOString() },
    { AXIA_PUSH_WINDOW_STARTED_AT: new Date(time + 1).toISOString() },
    { AXIA_PUSH_APPROVED_UNTIL: new Date(time + 1740001).toISOString() } ];
  for (const change of changes) {
    const { timer, calls } = fixture(); await timer.scheduled(event(), { ...env(), ...change });
    assert.equal(calls.length, 0);
  }
});

test("unrecognized, delayed, future and out-of-window events never fetch", async () => {
  for (const change of [ { cron: "*/5 * * * *" }, { scheduledTime: NaN },
    { scheduledTime: time - 60001 }, { scheduledTime: time + 5001 },
    { scheduledTime: time - 120000 }, { scheduledTime: time + 1800000 } ]) {
    const { timer, calls } = fixture(); await timer.scheduled({ ...event(), ...change }, env());
    assert.equal(calls.length, 0);
  }
});

test("exact fixed request interoperates with Edge HMAC and contains no recipient or secret", async () => {
  const { timer, calls } = fixture();
  assert.equal(await timer.scheduled(event(), { ...env(), ENDPOINT: "https://attacker.invalid", DATABASE_URL: "unused" }), "ACCEPTED_OR_IDLE");
  assert.equal(calls.length, 1); const [url, options] = calls[0];
  assert.equal(url, endpoint); assert.equal(options.body, "{}"); assert.equal(options.method, "POST");
  assert.equal(options.redirect, "manual"); assert.equal(options.cache, "no-store");
  assert.ok(options.signal instanceof AbortSignal);
  assert.deepEqual(Object.keys(options.headers).sort(), ["Content-Type", "x-axia-push-issued", "x-axia-push-signature"]);
  const request = new Request(url, options);
  assert.equal(authenticate(request, secret, time), true);
  assert.equal(authenticate(request, randomBytes(32).toString("base64url"), time), false);
  assert.equal(authenticate(request, secret, time + 60001), false);
  const issued = Math.floor(time / 1000).toString();
  assert.equal(options.headers["x-axia-push-signature"], createHmac("sha256", secret)
    .update(`axia-push-cron-v1\n${project}\n${scope}\n${issued}`).digest("hex"));
  assert.ok(!JSON.stringify(calls).includes(secret));
});

test("cutoff during async key import or signing stops request", async () => {
  for (const stage of ["importKey", "sign"]) {
    let current = time;
    const subtle = Object.fromEntries(["importKey", "sign"].map(name => [name, async (...args) => {
      const value = await webcrypto.subtle[name](...args);
      if (name === stage) current = Date.parse(env().AXIA_PUSH_APPROVED_UNTIL);
      return value;
    }]));
    const { timer, calls } = fixture({ now: () => current, subtle });
    assert.equal(await timer.scheduled(event(), env()), "DENIED"); assert.equal(calls.length, 0);
  }
});

test("provider rejection/network timeout/redirect failure never retry or leak error", async () => {
  for (const status of [302, 307, 401, 429, 503, "throw"]) {
    let calls = 0;
    const { timer } = fixture({ fetcher: async () => {
      calls++; if (status === "throw") throw new Error(secret);
      return new Response(secret, { status });
    } });
    assert.equal(await timer.scheduled(event(), env()), "UNAVAILABLE"); assert.equal(calls, 1);
  }
});

test("HTTP routes never trigger a schedule or disclose configuration", async () => {
  const { timer, calls } = fixture();
  for (const method of ["GET", "POST"]) {
    const r = await timer.fetch(new Request("https://fixture.invalid/?run=1", { method }), env());
    assert.equal(r.status, 404); assert.equal(await r.text(), "");
  }
  assert.equal(calls.length, 0);
});

test("checked-in config has no routes, Cron, credentials or active window", async () => {
  const config = JSON.parse(await readFile(new URL("../wrangler.json", import.meta.url), "utf8"));
  assert.equal(config.workers_dev, false); assert.equal(config.preview_urls, false);
  assert.deepEqual(config.routes, []); assert.deepEqual(config.triggers.crons, []);
  assert.equal(config.observability.enabled, false); assert.equal(config.vars.AXIA_PUSH_TIMER_ENABLED, "0");
  assert.equal(config.vars.AXIA_PUSH_WINDOW_STARTED_AT, ""); assert.equal(config.vars.AXIA_PUSH_APPROVED_UNTIL, "");
  assert.ok(!("account_id" in config)); assert.ok(!("AXIA_PUSH_CRON_HMAC_KEY" in config.vars));
});
