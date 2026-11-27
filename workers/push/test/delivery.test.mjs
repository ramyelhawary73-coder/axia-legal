import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { validateSubscription, sealSubscription, openSubscription, endpointHash, isPublicIPv4, pinnedAgent, classifyResult, deliverClaim } from "../delivery.mjs";
const key = randomBytes(32).toString("base64url"); // Ephemeral CI-only test material; never provider configuration.
const { publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const jwk = publicKey.export({ format: "jwk" });
const subscription = { endpoint: "https://fcm.googleapis.com/fcm/send/abcdefghijklmnopqrstuvwxyz_1234567890", keys: {
  p256dh: Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, "base64url"), Buffer.from(jwk.y, "base64url")]).toString("base64url"),
  auth: randomBytes(16).toString("base64url"),
} };
const binding = { scope: "axia-push-preview-v1", deviceId: "fixture-device", userId: "fixture-user", organizationId: "fixture-office", sessionId: "fixture-session", origin: "https://fixture.example" };
test("subscription validation accepts the Android provider and rejects arbitrary metadata", () => {
  assert.equal(validateSubscription(subscription).endpoint, subscription.endpoint);
  for (const endpoint of ["http://fcm.googleapis.com/fcm/send/abcdefghijklmnop", "https://127.0.0.1/fcm/send/abcdefghijklmnop",
    "https://fcm.googleapis.com.evil.example/fcm/send/abcdefghijklmnop", "https://fcm.googleapis.com:8443/fcm/send/abcdefghijklmnop",
    "https://user@fcm.googleapis.com/fcm/send/abcdefghijklmnop", subscription.endpoint + "?redirect=x", subscription.endpoint + "#x",
    "https://updates.push.services.mozilla.com/wpush/v2/abcdefghijklmnop"]) {
    assert.throws(() => validateSubscription({ ...subscription, endpoint }));
  }
  assert.throws(() => validateSubscription({ ...subscription, title: "legal-record" }));
  assert.throws(() => validateSubscription({ ...subscription, keys: { ...subscription.keys, auth: "bad" } }));
});
test("AEAD is randomized and bound to every identity field; no plaintext storage", () => {
  const a = sealSubscription(subscription, binding, key), b = sealSubscription(subscription, binding, key);
  assert.notEqual(a, b); assert.ok(!a.includes(subscription.endpoint));
  assert.deepEqual(openSubscription(a, binding, key), validateSubscription(subscription));
  for (const field of Object.keys(binding)) assert.throws(() => openSubscription(a, { ...binding, [field]: binding[field] + "changed" }, key));
  assert.throws(() => openSubscription(a, binding, randomBytes(32).toString("base64url")));
  const bytes = Buffer.from(a, "base64url"); bytes[30] ^= 1;
  assert.throws(() => openSubscription(bytes.toString("base64url"), binding, key));
  assert.equal(endpointHash(subscription).length, 64);
});
test("public IPv4 egress rejects private/reserved/ambiguous forms", () => {
  for (const address of ["0.1.2.3", "10.0.0.1", "127.0.0.1", "100.64.0.1", "169.254.169.254", "172.16.0.1", "192.168.1.1",
    "192.0.2.1", "198.18.0.1", "198.51.100.2", "203.0.113.1", "224.0.0.1", "255.255.255.255", "::1", "::ffff:127.0.0.1", "8.008.8.8"]) assert.equal(isPublicIPv4(address), false, address);
  assert.equal(isPublicIPv4("142.250.1.1"), true);
});
test("DNS answers are validated and pinned for the actual socket", async () => {
  let calls = 0;
  const agent = await pinnedAgent("fcm.googleapis.com", async () => { calls++; return ["142.250.1.1"]; });
  const pinned = await new Promise((resolve, reject) => agent.options.lookup("fcm.googleapis.com", { all: true }, (err, value) => err ? reject(err) : resolve(value)));
  assert.deepEqual(pinned, [{ address: "142.250.1.1", family: 4 }]); assert.equal(calls, 1); agent.destroy();
  await assert.rejects(pinnedAgent("fcm.googleapis.com", async () => ["142.250.1.1", "127.0.0.1"]));
  await assert.rejects(pinnedAgent("fcm.googleapis.com", async () => []));
  await assert.rejects(pinnedAgent("evil.example", async () => ["142.250.1.1"]));
});
test("bounded retries, expiry, revocation, and authorization halt", () => {
  assert.equal(classifyResult(201, 1, 300000, 0).state, "submitted");
  for (const status of [404, 410]) assert.equal(classifyResult(status, 1, 300000, 0).state, "revoked");
  for (const status of [401, 403]) assert.equal(classifyResult(status, 1, 300000, 0).state, "halted");
  assert.equal(classifyResult(429, 1, 300000, 0, "60").nextAt, "1970-01-01T00:01:00.000Z");
  assert.equal(classifyResult(503, 3, 300000, 0).state, "failed");
  assert.equal(classifyResult(503, 1, 20000, 0).state, "failed");
  assert.equal(classifyResult(302, 1, 300000, 0).state, "failed");
  assert.equal(classifyResult(429, 1, 300000, 0, "3600").state, "failed");
});
function fixture(overrides = {}) {
  const events = [], claim = { id: "fixture-job", nonce: "opaque" };
  const job = { ciphertext: sealSubscription(subscription, binding, key), binding, revision: 1, attempt: 1, expiresAt: new Date(200000).toISOString() };
  const store = { authorize: async () => { events.push("authorize"); return job; }, finish: async (_, value) => events.push(value) };
  const sendNotification = async (sub, payload, options) => {
    events.push("send"); assert.equal(sub.endpoint, subscription.endpoint); assert.equal(payload, null);
    assert.equal(options.TTL, 200); assert.equal(options.timeout, 10000); assert.equal(options.proxy, undefined);
    return { statusCode: 201 };
  };
  return { args: { claim, store, sendNotification, key, vapid: {}, now: () => 0, agentFactory: async () => ({ destroy() {} }), ...overrides }, events, job };
}
test("real sender adapter gets generic empty payload, TTL, and a fresh pre-send authorization", async () => {
  const f = fixture(), result = await deliverClaim(f.args);
  assert.equal(result.state, "submitted"); assert.deepEqual(f.events.slice(0, 3), ["authorize", "authorize", "send"]);
});
test("revocation during DNS stops sending", async () => {
  const f = fixture(); let checks = 0, sent = false;
  f.args.store.authorize = async () => ++checks === 1 ? f.job : null;
  f.args.sendNotification = async () => { sent = true; };
  assert.equal((await deliverClaim(f.args)).state, "suppressed"); assert.equal(sent, false);
});
test("stale ciphertext/revision never sends and transport errors do not leak provider text", async () => {
  const f = fixture(); let checks = 0;
  f.args.store.authorize = async () => ++checks === 1 ? f.job : { ...f.job, revision: 2 };
  assert.equal((await deliverClaim(f.args)).state, "suppressed");
  const g = fixture(); g.args.sendNotification = async () => { throw Object.assign(new Error(subscription.endpoint), { statusCode: 410 }); };
  const result = await deliverClaim(g.args); assert.equal(result.state, "revoked"); assert.ok(!JSON.stringify(result).includes(subscription.endpoint));
});
