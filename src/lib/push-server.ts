import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { resolveWorkspace } from "@/lib/api/workspace";
import { derivePushKey, endpointHash, sealSubscription, validateSubscription } from "../../workers/push/delivery.mjs";

const branch = "feat/axia-push-edge-free-20261127";
const scope = "axia-push-preview-v1";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function pushResponse(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie, Origin", "X-Content-Type-Options": "nosniff" } });
}
function config() {
  if (process.env.AXIA_PUSH_ENABLED !== "1" || process.env.AXIA_PUSH_SCOPE !== scope ||
      process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== branch) return null;
  const origin = process.env.AXIA_PUSH_ORIGIN, key = process.env.AXIA_PUSH_SUBSCRIPTION_KEY_V1;
  const publicKey = process.env.AXIA_PUSH_VAPID_PUBLIC_KEY, ref = process.env.AXIA_PUSH_EXPECTED_SUPABASE_REF;
  const supabase = getSupabasePublicConfig();
  if (!origin || !key || !publicKey || !ref || !supabase || !/^[a-z0-9]{20}$/.test(ref) ||
      supabase.url !== "https://" + ref + ".supabase.co" || !/^[A-Za-z0-9_-]{43}$/.test(key) ||
      Buffer.from(key, "base64url").toString("base64url") !== key || !/^[A-Za-z0-9_-]{87}$/.test(publicKey) ||
      Buffer.from(publicKey, "base64url").length !== 65 || Buffer.from(publicKey, "base64url")[0] !== 4) return null;
  try {
    const url = new URL(origin);
    if (url.origin !== origin || url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app") ||
        !url.hostname.includes("-git-") || url.hostname.includes("-git-main-")) return null;
  } catch { return null; }
  return { origin, key, publicKey };
}
function sameOrigin(request: Request, origin: string, mutation: boolean) {
  return new URL(request.url).origin === origin && request.headers.get("x-axia-push-client") === "1" &&
    request.headers.get("sec-fetch-site") === "same-origin" &&
    (!mutation || request.headers.get("origin") === origin);
}
type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid");
  return value as JsonObject;
}
async function body(request: Request, fields: string[]) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json" || !request.body) throw new Error("invalid");
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > 8192)) throw new Error("too_large");
  const reader = request.body.getReader(), chunks: Uint8Array[] = []; let size = 0, timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("invalid")), 5000); });
    for (;;) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.length; if (size > 8192) throw new Error("too_large"); chunks.push(value);
    }
  } finally { clearTimeout(timer); void reader.cancel().catch(() => {}); }
  const value = object(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))));
  if (Object.keys(value).length !== fields.length || fields.some(k => !Object.hasOwn(value, k))) throw new Error("invalid");
  return value;
}
function csrfMac(key: string, workspace: string, sessionId: string, origin: string, issued: string, nonce: string) {
  return createHmac("sha256", derivePushKey(key, "csrf")).update(JSON.stringify(["push-csrf-v1", workspace, sessionId, origin, issued, nonce])).digest("base64url");
}
function csrfValid(token: string | null, key: string, workspace: string, sessionId: string, origin: string) {
  if (!token || !/^\d{10}\.[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const [issued, nonce, supplied] = token.split("."), delta = Math.floor(Date.now()/1000) - Number(issued);
  if (delta < -10 || delta > 600) return false;
  const expected = csrfMac(key, workspace, sessionId, origin, issued, nonce);
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}
export async function handlePush(request: Request, action: string) {
  const cfg = config(), mutation = request.method !== "GET";
  if (!cfg) return pushResponse({ enabled: false, code: "PUSH_NOT_CONFIGURED" }, mutation ? 503 : 200);
  if (!sameOrigin(request, cfg.origin, mutation)) return pushResponse({ code: "PUSH_ORIGIN_DENIED" }, 403);
  try {
    const ctx = await resolveWorkspace(request);
    if (!ctx.ok) return pushResponse({ code: "PUSH_SESSION_REQUIRED" }, 401);
    const fresh = await ctx.supabase.auth.getUser(), verified = await ctx.supabase.auth.getClaims();
    const claims = verified.data?.claims, user = fresh.data.user, sessionId = claims?.session_id;
    if (fresh.error || verified.error || !user || user.id !== ctx.userId || claims?.sub !== ctx.userId ||
        user.is_anonymous || !user.email_confirmed_at || typeof sessionId !== "string" || !uuid.test(sessionId) ||
        typeof claims?.exp !== "number" || claims.exp * 1000 <= Date.now()) return pushResponse({ code: "PUSH_SESSION_REQUIRED" }, 401);
    const workspace = ctx.organizationId + ":" + ctx.userId;
    const ready = await ctx.supabase.rpc("axia_push_status", { p_org: ctx.organizationId });
    if (ready.error || !ready.data || ready.data.ready !== true || ready.data.origin !== cfg.origin) {
      return pushResponse({ enabled: false, code: "PUSH_NOT_PROVISIONED" }, mutation ? 503 : 200);
    }
    if (!mutation) {
      if (ready.data.workerReady !== true) return pushResponse({ enabled: false, code: "PUSH_WORKER_UNAVAILABLE" });
      const issued = String(Math.floor(Date.now()/1000)), nonce = randomBytes(18).toString("base64url");
      return pushResponse({ enabled: true, testOnly: true, publicKey: cfg.publicKey, workspace,
        leaseUntil: ready.data.leaseUntil,
        csrf: issued + "." + nonce + "." + csrfMac(cfg.key, workspace, sessionId, cfg.origin, issued, nonce) });
    }
    if (!csrfValid(request.headers.get("x-axia-push-csrf"), cfg.key, workspace, sessionId, cfg.origin)) return pushResponse({ code: "PUSH_CSRF_DENIED" }, 403);
    if (request.method !== "DELETE" && ready.data.workerReady !== true) return pushResponse({ code: "PUSH_WORKER_UNAVAILABLE" }, 503);
    let result;
    if (action === "device" && request.method === "POST") {
      const input = await body(request, ["installationId", "subscription"]);
      if (typeof input.installationId !== "string" || !uuid.test(input.installationId)) throw new Error("invalid");
      const subscription = validateSubscription(input.subscription);
      const binding = { scope, deviceId: input.installationId, userId: ctx.userId, organizationId: ctx.organizationId, sessionId, origin: cfg.origin };
      result = await ctx.supabase.rpc("axia_push_enroll", { p_org: ctx.organizationId, p_device: input.installationId,
        p_hash: endpointHash(subscription, cfg.key), p_ciphertext: sealSubscription(subscription, binding, cfg.key) });
    } else if (action === "device" && request.method === "DELETE") {
      const input = await body(request, ["deviceId"]);
      if (typeof input.deviceId !== "string" || !uuid.test(input.deviceId)) throw new Error("invalid");
      result = await ctx.supabase.rpc("axia_push_revoke", { p_org: ctx.organizationId, p_device: input.deviceId });
    } else if (action === "test" && request.method === "POST") {
      const input = await body(request, ["deviceId", "requestId"]);
      if (typeof input.deviceId !== "string" || typeof input.requestId !== "string" || !uuid.test(input.deviceId) || !uuid.test(input.requestId)) throw new Error("invalid");
      result = await ctx.supabase.rpc("axia_push_test", { p_org: ctx.organizationId, p_device: input.deviceId, p_request: input.requestId });
    } else return pushResponse({ code: "PUSH_METHOD_DENIED" }, 405);
    if (result.error) return pushResponse({ code: "PUSH_REQUEST_REJECTED" }, result.error.message === "PUSH_RATE_LIMIT" ? 429 : 403);
    // RPC outputs are narrow; never return submitted subscription, endpoint, session claims, or provider messages.
    const output = object(result.data);
    if (action === "test") return pushResponse({ accepted: true, id: output.id, scheduledAt: output.scheduledAt }, 202);
    if (request.method === "DELETE") return pushResponse({ revoked: output.revoked === true });
    return pushResponse({ id: output.id, expiresAt: output.expiresAt }, 201);
  } catch (error) {
    return pushResponse({ code: "PUSH_REQUEST_INVALID" }, error instanceof Error && error.message === "too_large" ? 413 : 400);
  }
}
