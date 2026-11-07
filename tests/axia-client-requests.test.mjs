import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as domain from "../src/lib/client-requests.ts";

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const office = id(301), other = id(302), user = id(1), requestId = id(701);
const origin = "https://axia.example", path = origin + "/api/client-requests";
const input = { title: "طلب تجريبي", summary: "", client_id: id(401), matter_id: null, assigned_to: null, status: "new", follow_up_on: "2026-11-12" };
const post = (body, requestOrigin = origin) => new Request(path, {
  method: "POST", headers: { Origin: requestOrigin, "Content-Type": "application/json" }, body: JSON.stringify(body),
});
function load(file, modules = {}, env = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, URL, Response, Request, TextDecoder, process: { env }, require(name) {
    if (name in modules) return modules[name];
    throw new Error(`Unexpected module ${name}`);
  } });
  return exports;
}
function harness(options = {}) {
  const calls = [];
  const row = { id: requestId, ...input, revision: 2, archived: false };
  const chain = { then(resolve) { return Promise.resolve({ data: [row], error: null }).then(resolve); } };
  for (const method of ["select", "eq", "in", "order", "limit", "range", "insert", "update"]) {
    chain[method] = (...args) => { calls.push([method, ...args]); return chain; };
  }
  chain.single = chain.maybeSingle = async () => ({ data: options.empty ? null : row, error: options.error ?? null });
  const api = load("src/app/api/client-requests/route.ts", {
    "@/lib/client-requests": domain,
    "@/lib/platform-control": load("src/lib/platform-control.ts"),
    "@/lib/api/platform": { platformJson: (value, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } }) },
    "@/lib/api/errors": { workspaceErrorResponse: code => Response.json({ code }, { status: 401 }) },
    "@/lib/supabase/config": { getSupabasePublicConfig: () => ({}) },
    "@/lib/api/workspace": { resolveWorkspace: async () => {
      calls.push(["workspace"]);
      if (options.noSession) return { ok: false, code: "SESSION_EXPIRED" };
      return { ok: true, organizationId: office, userId: user, role: options.role ?? "owner", supabase: {
        auth: { getUser: async () => ({ data: { user: { id: options.wrongUser ? id(2) : user, is_anonymous: false } }, error: null }) },
        from: table => { calls.push(["table", table]); return chain; },
      } };
    } },
  }, { AXIA_CLIENT_REQUESTS_ENABLED: options.disabled ? "0" : "1" });
  return { api, calls };
}

test("request mutations fail closed when disabled, cross origin, too large or malformed", async () => {
  const off = harness({ disabled: true });
  assert.equal((await off.api.POST(post({ action: "create", officeId: office, input }))).status, 503);
  assert.deepEqual(off.calls, []);
  const h = harness();
  for (const [request, status] of [
    [post({ action: "create", officeId: office, input }, "https://foreign.example"), 403],
    [post({ action: "create", officeId: office, input: { ...input, created_by: id(2) } }), 400],
    [post({ action: ["archive"], officeId: office, id: requestId, revision: 1 }), 400],
    [post({ action: "create", officeId: office, input: { ...input, summary: "a".repeat(4200) } }), 400],
    [post({ action: "create", officeId: office, input: { ...input, follow_up_on: "2026-02-30" } }), 400],
  ]) assert.equal((await h.api.POST(request)).status, status);
  assert.deepEqual(h.calls, []);
});

test("fresh identity and office binding prevent unauthorized writes before table access", async () => {
  for (const [options, officeId, status] of [
    [{ noSession: true }, office, 401], [{ wrongUser: true }, office, 401],
    [{ role: "staff" }, office, 403], [{ role: "viewer" }, office, 403], [{}, other, 409],
  ]) {
    const h = harness(options);
    assert.equal((await h.api.POST(post({ action: "create", officeId, input }))).status, status);
    assert.deepEqual(h.calls, [["workspace"]]);
  }
});

test("request update filters office, row, revision and archive state and reports stale writes", async () => {
  const h = harness({ empty: true });
  const r = await h.api.POST(post({ action: "restore", officeId: office, id: requestId, revision: 1 }));
  assert.equal(r.status, 409);
  const filters = h.calls.filter(x => x[0] === "eq");
  assert.deepEqual(filters, [["eq", "organization_id", office], ["eq", "id", requestId], ["eq", "revision", 1], ["eq", "archived", true]]);
  assert.equal(r.headers.get("cache-control"), "private, no-store");
});

test("foreign request history is indistinguishable from a missing request", async () => {
  const h = harness({ empty: true });
  const r = await h.api.GET(new Request(path + "?history=" + requestId));
  assert.equal(r.status, 404);
  assert.equal(h.calls.some(x => x[0] === "table" && x[1] === "audit_logs"), false);
  assert.deepEqual(h.calls.filter(x => x[0] === "eq"), [["eq", "organization_id", office], ["eq", "id", requestId]]);
});
