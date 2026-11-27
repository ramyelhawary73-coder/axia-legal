import { setTimeout as pause } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { deliverClaim } from "./delivery.mjs";
export function readConfig(env) {
  if (env.AXIA_PUSH_ENABLED !== "1") return null;
  if (env.AXIA_PUSH_SCOPE !== "axia-push-preview-v1" || env.AXIA_PUSH_DEPLOYMENT_MODE !== "preview") throw new Error("invalid_scope");
  const origin = new URL(env.AXIA_PUSH_ORIGIN);
  if (origin.protocol !== "https:" || origin.origin !== env.AXIA_PUSH_ORIGIN || origin.username || origin.password ||
      !/^[a-z0-9-]+\.vercel\.app$/.test(origin.hostname) || !origin.hostname.includes("-git-") ||
      origin.hostname.includes("-git-main-")) throw new Error("invalid_origin");
  const ref = env.AXIA_PUSH_EXPECTED_SUPABASE_REF;
  if (!/^[a-z0-9]{20}$/.test(ref ?? "")) throw new Error("invalid_project");
  const db = new URL(env.AXIA_PUSH_DISPATCH_DATABASE_URL);
  const username = decodeURIComponent(db.username);
  const direct = db.hostname === "db." + ref + ".supabase.co" && username === "axia_push_preview_worker";
  const pooler = db.hostname.endsWith(".pooler.supabase.com") && username === "axia_push_preview_worker." + ref;
  if (!["postgres:", "postgresql:"].includes(db.protocol) || db.search || db.hash || !db.password ||
      db.hostname !== env.AXIA_PUSH_DB_HOST || db.pathname !== "/" + env.AXIA_PUSH_DB_NAME ||
      (!direct && !pooler)) throw new Error("invalid_database");
  if (!/^[A-Za-z0-9_-]{43}$/.test(env.AXIA_PUSH_SUBSCRIPTION_KEY_V1 ?? "") ||
      !/^[A-Za-z0-9_-]{87}$/.test(env.AXIA_PUSH_VAPID_PUBLIC_KEY ?? "") ||
      !/^[A-Za-z0-9_-]{43}$/.test(env.AXIA_PUSH_VAPID_PRIVATE_KEY ?? "")) throw new Error("invalid_keys");
  const subject = new URL(env.AXIA_PUSH_VAPID_SUBJECT);
  if (!["https:", "mailto:"].includes(subject.protocol) || subject.username || subject.password || subject.hash) throw new Error("invalid_subject");
  return { origin: origin.origin, db: env.AXIA_PUSH_DISPATCH_DATABASE_URL, dbName: env.AXIA_PUSH_DB_NAME, key: env.AXIA_PUSH_SUBSCRIPTION_KEY_V1,
    vapid: { publicKey: env.AXIA_PUSH_VAPID_PUBLIC_KEY, privateKey: env.AXIA_PUSH_VAPID_PRIVATE_KEY, subject: env.AXIA_PUSH_VAPID_SUBJECT } };
}
export async function run(env = process.env) {
  const config = readConfig(env);
  if (!config) { console.log("AXIA Push disabled; no database or provider connection."); return; }
  const [{ default: webpush }, { default: pg }] = await Promise.all([import("web-push"), import("pg")]);
  const pool = new pg.Pool({ connectionString: config.db, ssl: { rejectUnauthorized: true }, max: 2,
    connectionTimeoutMillis: 5000, statement_timeout: 5000, query_timeout: 7000, idleTimeoutMillis: 8000 });
  let stopped = false;
  const stop = () => { stopped = true; };
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
  try {
    const role = (await pool.query("select current_user as name,current_database() as db,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole,pg_has_role(current_user,'axia_push_dispatcher','member') as member,exists(select 1 from pg_auth_members am join pg_roles parent on parent.oid=am.roleid where am.member=(select oid from pg_roles where rolname=current_user) and parent.rolname<>'axia_push_dispatcher') as extra_membership from pg_roles where rolname=current_user")).rows[0];
    if (!role || role.name !== "axia_push_preview_worker" || role.db !== config.dbName || !role.member ||
        role.rolsuper || role.rolbypassrls || role.rolcreatedb || role.rolcreaterole || role.extra_membership) throw new Error("invalid_worker_role");
    const store = {
      async authorize(claim) {
        const value = (await pool.query("select private.axia_push_authorize($1,$2) value", [claim.id, claim.nonce])).rows[0].value;
        return value && value.binding.scope === "axia-push-preview-v1" && value.binding.origin === config.origin ? value : null;
      },
      async finish(claim, result) {
        await pool.query("select private.axia_push_finish($1,$2,$3,$4,$5)", [claim.id, claim.nonce, result.state, result.reason, result.nextAt ?? null]);
      },
    };
    do {
      for (let count = 0; count < 50 && !stopped; count++) {
        const claim = (await pool.query("select private.axia_push_claim() value")).rows[0].value;
        if (!claim) break;
        const result = await deliverClaim({ claim, store, sendNotification: webpush.sendNotification.bind(webpush), key: config.key, vapid: config.vapid });
        if (result.state === "halted") throw new Error("sender_halted");
      }
      if (process.argv.includes("--watch") && !stopped) await pause(5000);
    } while (process.argv.includes("--watch") && !stopped);
  } finally {
    process.off("SIGTERM", stop); process.off("SIGINT", stop); await pool.end();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(() => { console.error("AXIA Push stopped safely. Review restricted operational status; no credentials are printed."); process.exitCode = 1; });
}
