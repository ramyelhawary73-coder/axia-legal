import { createHmac, timingSafeEqual } from "node:crypto";

const project = "qshgczulivsxztgrbqew", scope = "axia-push-preview-v1";
const origin = "https://axia-legal-git-feat-axia-d5fb48-ramyelhawary73-coders-projects.vercel.app";
const host = "aws-1-eu-west-1.pooler.supabase.com";
// Supabase's gateway may strip /functions/v1 before forwarding to the worker.
const paths = new Set(["/functions/v1/axia-push-preview", "/axia-push-preview"]);
const unavailable = () => Response.json({ code: "PUSH_READINESS_UNAVAILABLE" }, {
  status: 503, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});

// Independent of sending configuration: never synthesize enabled sending flags.
export function readinessConfig(env, now) {
  const until = Date.parse(env.AXIA_PUSH_READINESS_UNTIL ?? "");
  if (env.AXIA_PUSH_READINESS_ENABLED !== "1" || !Number.isFinite(now) ||
      !Number.isFinite(until) || until <= now || until - now > 300000 ||
      env.AXIA_PUSH_ENABLED !== "0" || env.AXIA_PUSH_EDGE_ENABLED !== "0") return null;
  if (env.AXIA_PUSH_DEPLOYMENT_MODE !== "preview" || env.AXIA_PUSH_SCOPE !== scope ||
      env.AXIA_PUSH_EXPECTED_SUPABASE_REF !== project || env.SUPABASE_URL !== `https://${project}.supabase.co` ||
      env.AXIA_PUSH_ORIGIN !== origin || env.AXIA_PUSH_DB_HOST !== host || env.AXIA_PUSH_DB_NAME !== "postgres" ||
      !/^[A-Za-z0-9_-]{43}$/.test(env.AXIA_PUSH_CRON_HMAC_KEY ?? "")) throw new Error("invalid_readiness_config");
  const db = new URL(env.AXIA_PUSH_DISPATCH_DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(db.protocol) || db.hostname !== host || db.port !== "5432" ||
      decodeURIComponent(db.username) !== `axia_push_preview_worker.${project}` || !db.password ||
      db.pathname !== "/postgres" || db.search || db.hash) throw new Error("invalid_readiness_database");
  return { db: db.href, key: env.AXIA_PUSH_CRON_HMAC_KEY, until };
}

export function readinessClientOptions(config) {
  return { connectionString: config.db, ssl: { rejectUnauthorized: true, servername: host },
    connectionTimeoutMillis: 5000, statement_timeout: 5000, query_timeout: 7000,
    // Read-only from connection startup as well as the explicit transaction below.
    options: "-c default_transaction_read_only=on" };
}

export function authenticateReadiness(request, key, now) {
  const issued = request.headers.get("x-axia-push-issued"), mac = request.headers.get("x-axia-push-signature");
  if (!/^[A-Za-z0-9_-]{43}$/.test(key ?? "") || !/^\d{10}$/.test(issued ?? "") ||
      !/^[a-f0-9]{64}$/.test(mac ?? "")) return false;
  const delta = now - Number(issued) * 1000;
  if (!Number.isFinite(delta) || delta < -5000 || delta > 30000) return false;
  const expected = createHmac("sha256", key)
    .update(`axia-push-readiness-v1\n${project}\n${scope}\n${issued}`).digest();
  return timingSafeEqual(expected, Buffer.from(mac, "hex"));
}

async function emptyBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return false;
  let timer, size = 0, body = "";
  try {
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("body_timeout")), 1000); });
    while (true) {
      const { value, done } = await Promise.race([reader.read(), timeout]);
      if (done) return body === "{}";
      size += value.byteLength;
      if (size > 2) return false;
      body += new TextDecoder().decode(value);
    }
  } catch { return false; }
  finally { clearTimeout(timer); void reader.cancel().catch(() => {}); }
}

const roleQuery = "select current_user as name,current_database() as db,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole,pg_has_role(current_user,'axia_push_dispatcher','member') as member,exists(select 1 from pg_auth_members am join pg_roles parent on parent.oid=am.roleid where am.member=(select oid from pg_roles where rolname=current_user) and parent.rolname<>'axia_push_dispatcher') as extra_membership from pg_roles where rolname=current_user";

// No delivery imports, subscriptions, sending functions or SQL writes in this module.
export function createReadinessHandler({ env, makeClient, now = Date.now }) {
  return async request => {
    let client, transaction = false, connectionError = false;
    try {
      const config = readinessConfig(env(), now());
      if (!config) return unavailable();
      const url = new URL(request.url);
      if (request.method !== "POST" || !paths.has(url.pathname) || url.search ||
          request.headers.get("x-axia-push-purpose") !== "readiness" || request.headers.has("origin") ||
          request.headers.has("transfer-encoding") || request.headers.get("content-type") !== "application/json" ||
          ![null, "2"].includes(request.headers.get("content-length")) ||
          !authenticateReadiness(request, config.key, now()) || !await emptyBody(request)) return unavailable();
      const active = () => {
        const fresh = readinessConfig(env(), now());
        if (connectionError || !fresh || fresh.db !== config.db || fresh.key !== config.key || fresh.until !== config.until)
          throw new Error("readiness_closed");
      };
      const query = async sql => { active(); const result = await client.query(sql); active(); return result; };
      active();
      client = makeClient(readinessClientOptions(config));
      client.on("error", () => { connectionError = true; });
      await client.connect();
      active();
      await query("BEGIN READ ONLY"); transaction = true;
      await query("SET LOCAL statement_timeout = '5s'");
      await query("SET LOCAL lock_timeout = '1s'");
      const role = (await query(roleQuery)).rows[0];
      if (!role || role.name !== "axia_push_preview_worker" || role.db !== "postgres" || role.member !== true ||
          role.extra_membership !== false || role.rolsuper !== false || role.rolbypassrls !== false ||
          role.rolcreatedb !== false || role.rolcreaterole !== false) throw new Error("invalid_readiness_role");
      const readOnly = (await query("select current_setting('transaction_read_only') = 'on' as read_only")).rows[0];
      if (readOnly?.read_only !== true) throw new Error("not_read_only");
      // Pooler -> Postgres observation only. Not proof of Edge -> pooler TLS.
      const backend = (await query("select ssl,version from pg_stat_ssl where pid=pg_backend_pid()")).rows[0];
      if (typeof backend?.ssl !== "boolean") throw new Error("missing_backend_tls_observation");
      await client.query("ROLLBACK"); transaction = false;
      active();
      return Response.json({ code: "PUSH_READINESS_OK", readOnly: true, restrictedRole: true,
        backendTlsObserved: backend.ssl }, {
        headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
      });
    } catch { return unavailable(); }
    finally {
      if (client) {
        if (transaction) await client.query("ROLLBACK").catch(() => {});
        await client.end().catch(() => {});
      }
    }
  };
}
