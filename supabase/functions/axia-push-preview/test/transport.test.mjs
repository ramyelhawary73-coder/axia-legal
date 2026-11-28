import assert from "node:assert/strict";
import { Agent, createServer } from "node:https";
import { createECDH, randomBytes } from "node:crypto";
import webpush from "web-push";
import pg from "pg";
import { once } from "node:events";

Deno.test("locked npm pg and web-push load in native Deno", () => {
  assert.equal(typeof pg.Client, "function"); assert.equal(typeof webpush.sendNotification, "function");
});
Deno.test("real Web Push HTTPS request uses custom DNS pin, certificate verification and refuses redirects", async () => {
  // Local TLS fixture only. Deno --allow-net=127.0.0.1 forbids real provider/hosted access.
  const dir = await Deno.makeTempDir({ dir: "/tmp", prefix: "axia-edge-tls-" });
  let server;
  try {
    const result = await new Deno.Command("openssl", { args: ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
      "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost",
      "-keyout", `${dir}/key.pem`, "-out", `${dir}/cert.pem`], stdout: "null", stderr: "null" }).output();
    assert.equal(result.code, 0);
    let received = 0, lookupCalls = 0, code = 201;
    const cert = await Deno.readTextFile(`${dir}/cert.pem`);
    server = createServer({ key: await Deno.readTextFile(`${dir}/key.pem`), cert }, (req, res) => {
      received++; assert.equal(req.method, "POST"); assert.match(req.headers.authorization, /^vapid /);
      assert.equal(Number(req.headers.ttl), 90); let size = 0;
      req.on("data", chunk => { size += chunk.length; });
      req.on("end", () => { assert.equal(size, 0); res.writeHead(code, { Location: "https://127.0.0.1/forbidden-redirect" }); res.end(); });
    });
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    const ecdh = createECDH("prime256v1"), vapid = webpush.generateVAPIDKeys();
    const subscription = { endpoint: `https://localhost:${server.address().port}/fcm/send/fixture`,
      keys: { p256dh: ecdh.generateKeys().toString("base64url"), auth: randomBytes(16).toString("base64url") } };
    const agent = new Agent({ ca: cert, rejectUnauthorized: true, keepAlive: false,
      lookup(host, options, callback) {
        assert.equal(host, "localhost"); lookupCalls++;
        if (options?.all) callback(null, [{ address: "127.0.0.1", family: 4 }]); else callback(null, "127.0.0.1", 4);
      } });
    try {
      const options = { agent, vapidDetails: { ...vapid, subject: "https://example.invalid/contact" }, TTL: 90, timeout: 2000 };
      assert.equal((await webpush.sendNotification(subscription, null, options)).statusCode, 201);
      const untrusted = new Agent({ rejectUnauthorized: true, lookup: agent.options.lookup });
      try { await assert.rejects(webpush.sendNotification(subscription, null, { ...options, agent: untrusted })); }
      finally { untrusted.destroy(); }
      assert.equal(received, 1, "untrusted TLS never reaches the HTTP handler");
      code = 302;
      await assert.rejects(webpush.sendNotification(subscription, null, options), error => error.statusCode === 302);
      assert.equal(received, 2); assert.ok(lookupCalls >= 1);
    } finally { agent.destroy(); }
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    await Deno.remove(dir, { recursive: true });
  }
});
