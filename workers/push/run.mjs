import { setTimeout as pause } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { deliverClaim } from "./delivery.mjs";
import { readConfig } from "../../supabase/functions/_shared/axia-push-config.mjs";
export { readConfig };
export async function run(env = process.env) {
  const config = readConfig(env);
  if (!config) { console.log("AXIA Push disabled; no database or provider connection."); return; }
  const [{ default: webpush }, { default: pg }] = await Promise.all([import("web-push"), import("pg")]);
  const pool = new pg.Pool({ connectionString: config.db, ssl: { rejectUnauthorized: true }, max: 2,
    connectionTimeoutMillis: 5000, statement_timeout: 5000, query_timeout: 7000, idleTimeoutMillis: 8000 });
  let stopped = false, poolFailure = false;
  // pg idle errors can include its client/config object. Never let EventEmitter dump credentials.
  pool.on("error", () => { poolFailure = true; stopped = true; });
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
      if (poolFailure) throw new Error("worker_connection_lost");
      if (process.argv.includes("--watch") && !stopped) await pause(5000);
    } while (process.argv.includes("--watch") && !stopped);
    if (poolFailure) throw new Error("worker_connection_lost");
  } finally {
    process.off("SIGTERM", stop); process.off("SIGINT", stop); await pool.end();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(() => { console.error("AXIA Push stopped safely. Review restricted operational status; no credentials are printed."); process.exitCode = 1; });
}
