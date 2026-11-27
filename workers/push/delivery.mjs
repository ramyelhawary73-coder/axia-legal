import { Agent } from "node:https";
import { resolve4 } from "node:dns/promises";
import { createCipheriv, createDecipheriv, createHash, createHmac, ECDH, randomBytes } from "node:crypto";

// Initial acceptance transport: Android Chrome's provider only.
// Add a provider only with a separately reviewed endpoint/egress contract.
export function validateSubscription(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_subscription");
  if (Object.keys(value).some(k => !["endpoint", "expirationTime", "keys"].includes(k))) throw new Error("invalid_subscription");
  const { endpoint, keys } = value;
  if (typeof endpoint !== "string" || endpoint.length > 2048) throw new Error("invalid_subscription");
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.hostname !== "fcm.googleapis.com" || url.port || url.username || url.password || url.hash || url.search ||
      !/^\/fcm\/send\/[A-Za-z0-9_:-]{16,1024}$/.test(url.pathname)) throw new Error("invalid_endpoint");
  if (!keys || typeof keys !== "object" || Object.keys(keys).sort().join(",") !== "auth,p256dh") throw new Error("invalid_keys");
  for (const [field, bytes] of [["auth", 16], ["p256dh", 65]]) {
    const key = keys[field];
    if (typeof key !== "string" || !/^[A-Za-z0-9_-]+$/.test(key) || Buffer.from(key, "base64url").length !== bytes ||
        Buffer.from(key, "base64url").toString("base64url") !== key) throw new Error("invalid_keys");
  }
  if (Buffer.from(keys.p256dh, "base64url")[0] !== 4) throw new Error("invalid_keys");
  ECDH.convertKey(Buffer.from(keys.p256dh, "base64url"), "prime256v1", undefined, undefined, "uncompressed");
  if (value.expirationTime != null && (!Number.isSafeInteger(value.expirationTime) || value.expirationTime <= Date.now())) throw new Error("expired_subscription");
  return { endpoint, expirationTime: value.expirationTime ?? null, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}
function keyBytes(key) {
  if (typeof key !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(key) || Buffer.from(key, "base64url").length !== 32 ||
      Buffer.from(key, "base64url").toString("base64url") !== key) throw new Error("invalid_encryption_key");
  return Buffer.from(key, "base64url");
}
export function bindingAAD(binding) {
  const fields = ["scope", "deviceId", "userId", "organizationId", "sessionId", "origin"];
  if (fields.some(k => typeof binding[k] !== "string" || !binding[k] || binding[k].length > 2048)) throw new Error("invalid_binding");
  return Buffer.from(JSON.stringify(fields.map(k => binding[k])));
}
export function sealSubscription(subscription, binding, key) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", keyBytes(key), iv);
  cipher.setAAD(bindingAAD(binding));
  const data = Buffer.concat([cipher.update(JSON.stringify(validateSubscription(subscription))), cipher.final()]);
  return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function openSubscription(envelope, binding, key) {
  if (typeof envelope !== "string" || !/^[A-Za-z0-9_-]{40,8192}$/.test(envelope)) throw new Error("invalid_envelope");
  const bytes = Buffer.from(envelope, "base64url");
  if (bytes[0] !== 1 || bytes.length < 30) throw new Error("invalid_envelope");
  const cipher = createDecipheriv("aes-256-gcm", keyBytes(key), bytes.subarray(1, 13));
  cipher.setAAD(bindingAAD(binding)); cipher.setAuthTag(bytes.subarray(13, 29));
  return validateSubscription(JSON.parse(Buffer.concat([cipher.update(bytes.subarray(29)), cipher.final()]).toString()));
}
export function endpointHash(subscription, key) {
  return createHmac("sha256", keyBytes(key)).update("axia-push-endpoint-v1\0").update(validateSubscription(subscription).endpoint).digest("hex");
}
// IPv4-only pinned egress is deliberate. Never fall back to a different DNS result/IPv6/proxy.
export function isPublicIPv4(address) {
  if (typeof address !== "string" || !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(address)) return false;
  const p = address.split(".").map(Number);
  if (p.some((n, i) => n > 255 || String(n) !== address.split(".")[i])) return false;
  const [a, b, c] = p;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
}
export async function pinnedAgent(hostname, lookup = resolve4) {
  if (hostname !== "fcm.googleapis.com") throw new Error("invalid_endpoint");
  let timer;
  const addresses = await Promise.race([
    lookup(hostname),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("dns_timeout")), 5000); }),
  ]).finally(() => clearTimeout(timer));
  if (!Array.isArray(addresses) || !addresses.length || addresses.some(a => !isPublicIPv4(a))) throw new Error("unsafe_dns");
  const address = addresses[0];
  return new Agent({ keepAlive: false, maxCachedSessions: 0, lookup: (host, options, callback) => {
    if (host !== hostname) return callback(new Error("invalid_endpoint"));
    if (options?.all) callback(null, [{ address, family: 4 }]);
    else callback(null, address, 4);
  } });
}
export function classifyResult(status, attempt, expiresAt, now, retryAfter) {
  if (status >= 200 && status < 300) return { state: "submitted", reason: "provider_accepted" };
  if (status === 404 || status === 410) return { state: "revoked", reason: "subscription_gone" };
  if (status === 401 || status === 403) return { state: "halted", reason: "sender_authorization" };
  if ((status === 0 || status === 429 || status >= 500) && attempt < 3) {
    let delay = attempt === 1 ? 30000 : 120000;
    if (typeof retryAfter === "string") {
      const suggested = /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - now;
      if (Number.isFinite(suggested)) delay = Math.max(delay, suggested);
    }
    if (now + delay < expiresAt) return { state: "retry", reason: "transient", nextAt: new Date(now + delay).toISOString() };
  }
  return { state: "failed", reason: status === 0 ? "network_unknown" : "provider_rejected" };
}
// The store must authorize immediately before returning ciphertext. No DB transaction crosses network I/O.
// Error text/headers/provider body must never be logged: they may contain subscription secrets.
export async function deliverClaim({ claim, store, sendNotification, key, vapid, now = Date.now, agentFactory = pinnedAgent }) {
  const job = await store.authorize(claim);
  if (!job) {
    const result = { state: "suppressed", reason: "ineligible" };
    await store.finish(claim, result); return result;
  }
  let agent;
  let status = 0, retryAfter;
  try {
    const subscription = openSubscription(job.ciphertext, job.binding, key);
    agent = await agentFactory(new URL(subscription.endpoint).hostname);
    // DNS can take time: authorization is repeated directly before the provider call.
    const fresh = await store.authorize(claim);
    const current = now(), expiresAt = Date.parse(job.expiresAt);
    if (!fresh || fresh.revision !== job.revision || fresh.ciphertext !== job.ciphertext ||
        !Number.isFinite(expiresAt) || expiresAt <= current) {
      const result = { state: "suppressed", reason: "ineligible" };
      await store.finish(claim, result); return result;
    }
    const result = await sendNotification(subscription, null, {
      vapidDetails: vapid, TTL: Math.min(300, Math.max(1, Math.floor((expiresAt - current) / 1000))),
      urgency: "normal", topic: createHash("sha256").update(claim.id).digest("base64url").slice(0, 32),
      timeout: 10000, agent, contentEncoding: "aes128gcm",
    });
    status = result.statusCode;
  } catch (error) {
    if (Number.isInteger(error?.statusCode)) {
      status = error.statusCode;
      // Only Retry-After is consumed; never persist the provider response/headers.
      retryAfter = error.headers?.["retry-after"];
    } else if (!agent) {
      const result = { state: "failed", reason: "invalid_transport" };
      await store.finish(claim, result); return result;
    }
  } finally { agent?.destroy(); }
  const result = classifyResult(status, job.attempt, Date.parse(job.expiresAt), now(), retryAfter);
  await store.finish(claim, result);
  return result;
}
