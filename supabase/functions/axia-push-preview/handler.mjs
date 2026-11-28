import { createHmac, timingSafeEqual } from "node:crypto";
import { readConfig } from "../_shared/axia-push-config.mjs";
import { deliverClaim } from "../_shared/axia-push-delivery.mjs";

export const scope = "axia-push-preview-v1";
const project = "qshgczulivsxztgrbqew";
const response = (code, status) => Response.json({ code }, {
  status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});

async function emptyObjectBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return false;
  let text = "", timer;
  try {
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("body_timeout")), 1000); });
    while (true) {
      const { value, done } = await Promise.race([reader.read(), timeout]);
      if (done) return text === "{}";
      if (value.length + text.length > 2) return false;
      text += new TextDecoder().decode(value);
    }
  } catch { return false; }
  finally { clearTimeout(timer); void reader.cancel().catch(() => {}); }
}

export function authenticate(request, secret, now = Date.now()) {
  if (typeof secret !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(secret)) return false;
  const issued = request.headers.get("x-axia-push-issued");
  const mac = request.headers.get("x-axia-push-signature");
  if (!/^\d{10}$/.test(issued ?? "") || !/^[a-f0-9]{64}$/.test(mac ?? "")) return false;
  const delta = now - Number(issued) * 1000;
  if (delta < -5000 || delta > 60000) return false;
  // No broad project/admin key in pg_net's readable request queue.
  const expected = createHmac("sha256", secret)
    .update(`axia-push-cron-v1\n${project}\n${scope}\n${issued}`).digest();
  return timingSafeEqual(expected, Buffer.from(mac, "hex"));
}

export function edgeConfig(env) {
  if (env.AXIA_PUSH_EDGE_ENABLED !== "1") return null;
  if (env.AXIA_PUSH_EXPECTED_SUPABASE_REF !== project ||
      env.SUPABASE_URL !== `https://${project}.supabase.co`) throw new Error("invalid_edge_project");
  const config = readConfig(env);
  if (!config || !/^[A-Za-z0-9_-]{43}$/.test(env.AXIA_PUSH_CRON_HMAC_KEY ?? "")) throw new Error("invalid_edge_config");
  // Session pooler, no paid IPv4 add-on and no prepared-statement assumptions.
  const db = new URL(config.db);
  if (!db.hostname.endsWith(".pooler.supabase.com") || db.port !== "5432" ||
      config.dbName !== "postgres") throw new Error("invalid_edge_pooler");
  return { ...config, cronKey: env.AXIA_PUSH_CRON_HMAC_KEY };
}

export async function validateRole(client, config) {
  const role = (await client.query("select current_user as name,current_database() as db,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole,pg_has_role(current_user,'axia_push_dispatcher','member') as member,exists(select 1 from pg_auth_members am join pg_roles parent on parent.oid=am.roleid where am.member=(select oid from pg_roles where rolname=current_user) and parent.rolname<>'axia_push_dispatcher') as extra_membership from pg_roles where rolname=current_user")).rows[0];
  if (!role || role.name !== "axia_push_preview_worker" || role.db !== config.dbName || !role.member ||
      role.rolsuper || role.rolbypassrls || role.rolcreatedb || role.rolcreaterole || role.extra_membership)
    throw new Error("invalid_worker_role");
}

// Exported for native Deno tests. Production uses only locked npm packages from index.mjs.
export function createHandler({ env, makeClient, sendNotification, now = Date.now, agentFactory, verifyRole = validateRole }) {
  return async function handle(request) {
    let config;
    try { config = edgeConfig(env()); } catch { return response("PUSH_UNAVAILABLE", 503); }
    if (!config) return response("PUSH_DISABLED", 503);
    if (request.method !== "POST") return response("PUSH_METHOD_DENIED", 405);
    // Invocation contains no endpoint, recipient, user, job, or notification payload.
    if (new URL(request.url).search || request.headers.has("origin") ||
        request.headers.has("transfer-encoding") ||
        ![null, "2"].includes(request.headers.get("content-length")) ||
        request.headers.get("content-type") !== "application/json")
      return response("PUSH_REQUEST_DENIED", 400);
    if (!authenticate(request, config.cronKey, now())) return response("PUSH_UNAUTHORIZED", 401);
    if (!await emptyObjectBody(request)) return response("PUSH_REQUEST_DENIED", 400);
    let client, connectionError = false;
    try {
      client = makeClient(config);
      client.on("error", () => { connectionError = true; });
      await client.connect();
      await verifyRole(client, config);
      const lock = (await client.query("select pg_try_advisory_lock(hashtextextended('axia-push-edge-preview-v1',0)) as locked")).rows[0];
      if (!lock?.locked) return response("PUSH_BUSY", 202);
      const slot = Math.floor(Number(request.headers.get("x-axia-push-issued")) / 60);
      const admitted = (await client.query("select private.axia_push_edge_begin($1) as allowed", [slot])).rows[0];
      if (!admitted?.allowed) return response("PUSH_IDLE", 202);
      // One short batch per minute. No daemon/watch/sleep, persistent pool or transaction during I/O.
      const claim = (await client.query("select private.axia_push_claim() as value")).rows[0].value;
      if (!claim) return response("PUSH_IDLE", 202);
      const store = {
        async authorize(value) {
          if (connectionError) return null;
          const job = (await client.query("select private.axia_push_authorize($1,$2) as value", [value.id, value.nonce])).rows[0].value;
          return job && job.binding.scope === scope && job.binding.origin === config.origin ? job : null;
        },
        async finish(value, result) {
          await client.query("select private.axia_push_finish($1,$2,$3,$4,$5)",
            [value.id, value.nonce, result.state, result.reason, result.nextAt ?? null]);
        },
      };
      await deliverClaim({ claim, store, sendNotification, key: config.key, vapid: config.vapid, now, agentFactory });
      return response("PUSH_PROCESSED", 202);
    } catch {
      // Neither database/provider error objects nor endpoint/ciphertext/keys enter logs or responses.
      return response("PUSH_UNAVAILABLE", 503);
    } finally {
      // Closing this one dedicated connection releases its advisory lock even after a failed request.
      if (client) await client.end().catch(() => {});
    }
  };
}
