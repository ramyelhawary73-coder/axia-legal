import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { createSecureContext, TLSSocket } from "node:tls";
import { once } from "node:events";
import pg from "pg";
import { createReadinessHandler, readinessClientOptions, authenticateReadiness } from "../readiness.mjs";
import { authenticate } from "../handler.mjs";

const secret = randomBytes(32).toString("base64url"), t = Date.now();
const endpoint = "https://fixture.invalid/functions/v1/axia-push-preview";
const project = "qshgczulivsxztgrbqew", scope = "axia-push-preview-v1";
const config = () => ({ AXIA_PUSH_READINESS_ENABLED: "1", AXIA_PUSH_READINESS_UNTIL: new Date(t + 300000).toISOString(),
  AXIA_PUSH_ENABLED: "0", AXIA_PUSH_EDGE_ENABLED: "0", AXIA_PUSH_DEPLOYMENT_MODE: "preview", AXIA_PUSH_SCOPE: scope,
  AXIA_PUSH_EXPECTED_SUPABASE_REF: project, SUPABASE_URL: `https://${project}.supabase.co`,
  AXIA_PUSH_ORIGIN: "https://axia-legal-git-feat-axia-d5fb48-ramyelhawary73-coders-projects.vercel.app",
  AXIA_PUSH_DB_HOST: "aws-1-eu-west-1.pooler.supabase.com", AXIA_PUSH_DB_NAME: "postgres", AXIA_PUSH_CRON_HMAC_KEY: secret,
  AXIA_PUSH_DISPATCH_DATABASE_URL: `postgresql://axia_push_preview_worker.${project}:fixture@aws-1-eu-west-1.pooler.supabase.com:5432/postgres` });
const role = { name: "axia_push_preview_worker", db: "postgres", member: true, extra_membership: false,
  rolsuper: false, rolbypassrls: false, rolcreatedb: false, rolcreaterole: false };
function request({ issued = Math.floor(t / 1000).toString(), purpose = "axia-push-readiness-v1", method = "POST",
  body = "{}", headers = {}, url = endpoint } = {}) {
  return new Request(url, { method, ...(method === "POST" ? { body } : {}), headers: {
    "content-type": "application/json", "x-axia-push-purpose": "readiness", "x-axia-push-issued": issued,
    "x-axia-push-signature": createHmac("sha256", secret).update(`${purpose}\n${project}\n${scope}\n${issued}`).digest("hex"), ...headers } });
}
function fixture({ override = {}, roleOverride = {}, failure, advance, readOnly = true, backend = { ssl: true }, makeClient } = {}) {
  const env = { ...config(), ...override }, calls = []; let ended = 0, made = 0, clock = t, errorHandler;
  const client = { on(name, fn) { assert.equal(name, "error"); errorHandler = fn; },
    async connect() { calls.push("connect"); if (failure === "connect") throw new Error("private-password"); if (advance === "connect") clock += 300000; },
    async end() { ended++; },
    async query(sql) {
      calls.push(sql);
      if (advance === sql) clock += 300000;
      if (failure === sql) throw new Error("private-database-details");
      if (failure === "event") errorHandler(new Error("private-connection-error"));
      if (sql.includes("current_user as name")) return { rows: [{ ...role, ...roleOverride }] };
      if (sql.includes("transaction_read_only")) return { rows: [{ read_only: readOnly }] };
      if (sql.includes("pg_stat_ssl")) return { rows: backend ? [backend] : [] };
      assert.ok(["BEGIN READ ONLY", "SET LOCAL statement_timeout = '5s'", "SET LOCAL lock_timeout = '1s'", "ROLLBACK"].includes(sql), "unexpected SQL");
      return { rows: [] };
    } };
  const handle = createReadinessHandler({ env: () => env, now: () => clock, makeClient: options => {
    made++; assert.equal(options.ssl.rejectUnauthorized, true);
    assert.equal(options.ssl.servername, config().AXIA_PUSH_DB_HOST);
    assert.equal(options.options, "-c default_transaction_read_only=on");
    assert.equal(options.connectionTimeoutMillis, 5000); assert.equal(options.statement_timeout, 5000);
    assert.equal(options.query_timeout, 7000);
    return makeClient ? makeClient(options) : client;
  } });
  return { handle, calls, made: () => made, ended: () => ended, env };
}
async function denied(f, req = request()) {
  const r = await f.handle(req); assert.equal(r.status, 503);
  assert.equal(await r.text(), '{"code":"PUSH_READINESS_UNAVAILABLE"}');
  assert.equal(r.headers.get("cache-control"), "no-store");
}

Deno.test("readiness: absent/default-off/expired/overlong window and sending gates prevent any DB construction", async () => {
  for (const override of [{ AXIA_PUSH_READINESS_ENABLED: undefined }, { AXIA_PUSH_READINESS_ENABLED: "0" },
    { AXIA_PUSH_READINESS_UNTIL: undefined }, { AXIA_PUSH_READINESS_UNTIL: "invalid" },
    { AXIA_PUSH_READINESS_UNTIL: new Date(t).toISOString() }, { AXIA_PUSH_READINESS_UNTIL: new Date(t + 300001).toISOString() },
    { AXIA_PUSH_ENABLED: "1" }, { AXIA_PUSH_EDGE_ENABLED: "1" }, { AXIA_PUSH_ENABLED: undefined }]) {
    const f = fixture({ override }); await denied(f); assert.equal(f.made(), 0);
  }
});
Deno.test("readiness: fixed project/origin/host/database/login/TLS URL checks fail before construction", async () => {
  const url = config().AXIA_PUSH_DISPATCH_DATABASE_URL;
  for (const override of [{ AXIA_PUSH_DEPLOYMENT_MODE: "production" }, { AXIA_PUSH_SCOPE: "other" },
    { AXIA_PUSH_EXPECTED_SUPABASE_REF: "a".repeat(20) }, { SUPABASE_URL: "https://other.supabase.co" },
    { AXIA_PUSH_ORIGIN: "https://axia-legal-psi.vercel.app" }, { AXIA_PUSH_DB_HOST: "other.pooler.supabase.com" },
    { AXIA_PUSH_DB_NAME: "other" }, { AXIA_PUSH_CRON_HMAC_KEY: "bad" },
    ...[url.replace("postgresql:", "http:"), url.replace("aws-1-eu-west-1", "other"), url.replace(":5432/", ":6543/"),
      url.replace(`axia_push_preview_worker.${project}`, "postgres"), url.replace(":fixture@", "@"),
      url.replace("/postgres", "/other"), `${url}?sslmode=no-verify`, `${url}#fragment`]
      .map(value => ({ AXIA_PUSH_DISPATCH_DATABASE_URL: value }))]) {
    const f = fixture({ override }); await denied(f); assert.equal(f.made(), 0);
  }
});
Deno.test("readiness: HMAC purpose separation and exact age boundaries", () => {
  assert.equal(authenticateReadiness(request(), secret, t), true);
  assert.equal(authenticateReadiness(request({ purpose: "axia-push-cron-v1" }), secret, t), false);
  assert.equal(authenticate(request(), secret, t), false);
  const stamp = Math.floor(t / 1000).toString(), base = Number(stamp) * 1000;
  assert.equal(authenticateReadiness(request({ issued: stamp }), secret, base + 30000), true);
  assert.equal(authenticateReadiness(request({ issued: stamp }), secret, base + 30001), false);
  assert.equal(authenticateReadiness(request({ issued: stamp }), secret, base - 5000), true);
  assert.equal(authenticateReadiness(request({ issued: stamp }), secret, base - 5001), false);
});
Deno.test("readiness: malformed/stale/future signatures never create a client", async () => {
  for (const req of [request({ headers: { "x-axia-push-signature": "" } }),
    request({ headers: { "x-axia-push-signature": "0".repeat(64) } }), request({ headers: { "x-axia-push-issued": "NaN" } }),
    request({ issued: String(Math.floor(t / 1000) - 31) }), request({ issued: String(Math.floor(t / 1000) + 6) }),
    request({ purpose: "axia-push-cron-v1" })]) {
    const f = fixture(); await denied(f, req); assert.equal(f.made(), 0);
  }
});
Deno.test("readiness: invalid envelope cannot reach DB or sender", async () => {
  for (const req of [request({ method: "GET" }), request({ url: `${endpoint}?dispatch=1` }),
    request({ url: `${endpoint}/other` }), request({ headers: { origin: "https://example.invalid" } }),
    request({ headers: { "x-axia-push-purpose": "cron" } }), request({ headers: { "transfer-encoding": "chunked" } }),
    request({ headers: { "content-type": "text/plain" } }), request({ headers: { "content-length": "999" } }),
    request({ body: '{"recipient":"other"}' }), request({ body: "[]" }), request({ body: "" }), request({ body: "é" })]) {
    const f = fixture(); await denied(f, req); assert.equal(f.made(), 0);
  }
});
Deno.test("readiness: bounded streaming body times out before any connection", async () => {
  const good = request(), stream = new ReadableStream({ start() {} });
  const req = new Request(endpoint, { method: "POST", headers: good.headers, body: stream, duplex: "half" });
  const f = fixture(); await denied(f, req); assert.equal(f.made(), 0);
});
Deno.test("readiness: exact read-only query sequence; response exposes only booleans", async () => {
  const f = fixture(), r = await f.handle(request());
  assert.equal(r.status, 200); assert.deepEqual(await r.json(), { code: "PUSH_READINESS_OK", readOnly: true,
    restrictedRole: true, backendTlsObserved: true });
  assert.equal(f.made(), 1); assert.equal(f.ended(), 1); assert.equal(f.calls.length, 8);
  assert.equal(f.calls[0], "connect"); assert.equal(f.calls[1], "BEGIN READ ONLY"); assert.equal(f.calls.at(-1), "ROLLBACK");
  for (const sql of f.calls.slice(1)) assert.ok(!/axia_push_|push_devices|push_outbox|vault\.|auth\.|advisory_lock|insert|update|delete|create|grant/i.test(sql.replace(/'axia_push_dispatcher'|'axia_push_preview_worker'|rolcreatedb|rolcreaterole/g, "")));
  assert.equal(r.headers.get("cache-control"), "no-store");
});
Deno.test("readiness: pooler-backend TLS observation is distinct from client certificate validation", async () => {
  const f = fixture({ backend: { ssl: false, version: null } }), r = await f.handle(request());
  assert.equal(r.status, 200); assert.equal((await r.json()).backendTlsObserved, false);
  const missing = fixture({ backend: null }); await denied(missing); assert.equal(missing.ended(), 1);
});
Deno.test("readiness: unexpected or broad role and non-read-only transaction fail closed and roll back", async () => {
  for (const roleOverride of [{ name: "postgres" }, { db: "other" }, { member: false }, { extra_membership: true },
    { rolsuper: true }, { rolbypassrls: true }, { rolcreatedb: true }, { rolcreaterole: true }]) {
    const f = fixture({ roleOverride }); await denied(f); assert.equal(f.ended(), 1); assert.equal(f.calls.at(-1), "ROLLBACK");
    assert.ok(!f.calls.some(s => s.includes("pg_stat_ssl")));
  }
  const f = fixture({ readOnly: false }); await denied(f); assert.equal(f.ended(), 1);
});
Deno.test("readiness: errors after connect are redacted and connections always close", async () => {
  for (const failure of ["connect", "BEGIN READ ONLY", "SET LOCAL statement_timeout = '5s'", "event", "ROLLBACK"]) {
    const f = fixture({ failure }); await denied(f); assert.equal(f.ended(), 1);
  }
});
Deno.test("readiness: expiry while awaiting connection/query prevents later diagnostic queries", async () => {
  for (const advance of ["connect", "SET LOCAL lock_timeout = '1s'"]) {
    const f = fixture({ advance }); await denied(f); assert.equal(f.ended(), 1);
    assert.ok(!f.calls.some(s => s.includes("current_user as name")));
  }
});

Deno.test("readiness: sending gate opened during connection aborts without queries", async () => {
  let ended = 0;
  const f = fixture({ makeClient() { return { on() {}, async connect() { f.env.AXIA_PUSH_ENABLED = "1"; },
    async query() { assert.fail("must not issue SQL after sending gate changes"); }, async end() { ended++; } }; } });
  await denied(f); assert.equal(ended, 1);
});

Deno.test("readiness: gateway-normalized path is allowed, sibling functions remain denied", async () => {
  const f = fixture(), r = await f.handle(request({ url: "https://fixture.invalid/axia-push-preview" }));
  assert.equal(r.status, 200); await r.body.cancel();
  const other = fixture(); await denied(other, request({ url: "https://fixture.invalid/other" })); assert.equal(other.made(), 0);
});

Deno.test("entrypoint: all purpose headers route to diagnostics; ordinary sender remains disabled", async () => {
  const serve = Deno.serve, keys = ["AXIA_PUSH_ENABLED", "AXIA_PUSH_EDGE_ENABLED", "AXIA_PUSH_READINESS_ENABLED"];
  const previous = keys.map(k => Deno.env.get(k)); let entry;
  try {
    for (const key of keys) Deno.env.set(key, "0");
    Deno.serve = handler => { entry = handler; };
    await import("../index.mjs");
    assert.equal(typeof entry, "function");
    for (const purpose of ["readiness", "typo", ""]) {
      const r = await entry(request({ headers: { "x-axia-push-purpose": purpose } }));
      assert.equal(await r.text(), '{"code":"PUSH_READINESS_UNAVAILABLE"}');
    }
    const normal = request(); normal.headers.delete("x-axia-push-purpose");
    const r = await entry(normal); assert.equal(await r.text(), '{"code":"PUSH_DISABLED"}');
  } finally {
    Deno.serve = serve;
    keys.forEach((k, i) => previous[i] === undefined ? Deno.env.delete(k) : Deno.env.set(k, previous[i]));
  }
});

Deno.test("readiness pg TLS: untrusted certificate and trusted wrong hostname fail before SQL", async () => {
  const dir = await Deno.makeTempDir({ dir: "/tmp", prefix: "axia-readiness-pg-tls-" });
  const sockets = new Set(), failures = []; let server, startup = 0, sslRequests = 0;
  try {
    const result = await new Deno.Command("openssl", { args: ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
      "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost", "-keyout", `${dir}/key`, "-out", `${dir}/cert`],
      stdout: "null", stderr: "null" }).output(); assert.equal(result.code, 0);
    const cert = await Deno.readTextFile(`${dir}/cert`);
    const context = createSecureContext({ key: await Deno.readTextFile(`${dir}/key`), cert });
    server = createServer(socket => {
      sockets.add(socket); socket.on("error", () => {}); socket.on("close", () => sockets.delete(socket));
      socket.once("data", data => {
        assert.equal(data.length, 8); assert.equal(data.readInt32BE(4), 80877103); sslRequests++; socket.write("S");
        const tls = new TLSSocket(socket, { isServer: true, secureContext: context });
        tls.on("error", () => {}); tls.on("data", () => { startup++; });
      });
    });
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    for (const trusted of [false, true]) {
      const f = fixture({ makeClient(options) {
        // Local fixture endpoint only; preserve production TLS options/servername.
        const local = readinessClientOptions({ db: `postgresql://fixture:fixture@127.0.0.1:${server.address().port}/postgres` });
        assert.deepEqual(local.ssl, options.ssl);
        const client = new pg.Client({ ...local, ssl: { ...local.ssl, ...(trusted ? { ca: cert } : {}) } });
        const connect = client.connect.bind(client);
        client.connect = async () => { try { await connect(); } catch (e) { failures.push(e.code); throw e; } };
        return client;
      } });
      await denied(f);
    }
    assert.equal(sslRequests, 2);
    assert.match(failures[0], /SELF_SIGNED|CERTIFICATE_VERIFY_FAILED/);
    assert.equal(failures[1], "ERR_TLS_CERT_ALTNAME_INVALID");
    assert.equal(startup, 0, "neither invalid certificate may reach PostgreSQL authentication or queries");
  } finally {
    for (const socket of sockets) socket.destroy();
    if (server) await new Promise(resolve => server.close(resolve));
    await Deno.remove(dir, { recursive: true });
  }
});
