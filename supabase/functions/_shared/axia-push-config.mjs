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
