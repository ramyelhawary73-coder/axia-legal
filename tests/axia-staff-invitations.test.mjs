import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(path, modules = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    URL,
    Response,
    console,
    require(name) {
      if (name === "next/server")
        return { NextResponse: { json: (...args) => Response.json(...args) } };
      if (!(name in modules)) throw new Error(`Unexpected module ${name}`);
      return modules[name];
    },
  });
  return exports;
}
const domain = load("src/lib/staff-invitations.ts");
const org = "00000000-0000-4000-8000-000000000101";
const member = "00000000-0000-4000-8000-000000000004";
const taskId = "00000000-0000-4000-8000-000000000201";
const validation = load("src/lib/api/validation.ts");
const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
const errors = {
  apiError: (code, error, status) => json({ code, error }, status),
  workspaceErrorResponse: (code) => json({ code }, 401),
};

test("staff roles exclude ownership and admin-to-admin grants", () => {
  for (const actor of [
    "owner",
    "admin",
    "lawyer",
    "staff",
    "trainee",
    "viewer",
  ])
    assert.equal(domain.canInviteRole(actor, "owner"), false);
  assert.equal(domain.canInviteRole("owner", "admin"), true);
  assert.equal(domain.canInviteRole("admin", "admin"), false);
  assert.equal(domain.canInviteRole("admin", "staff"), true);
  assert.equal(domain.canInviteRole("staff", "trainee"), false);
  assert.equal(domain.canInviteRole("owner", "constructor"), false);
});
test("email normalization preserves aliases and rejects invalid controls and oversized input", () => {
  assert.equal(
    domain.normalizeStaffEmail(" Person+Law@Example.COM "),
    "person+law@example.com",
  );
  for (const value of [
    null,
    {},
    "person\n@example.com",
    "a@localhost",
    "a".repeat(255) + "@example.com",
  ])
    assert.equal(domain.normalizeStaffEmail(value), null);
  assert.equal(domain.isInvitationToken("a".repeat(64)), true);
  assert.equal(
    domain.isInvitationToken("https://example.com/" + "a".repeat(64)),
    false,
  );
});

function invitationHarness({
  role = "owner",
  authenticated = true,
  configured = true,
  rpcError = null,
} = {}) {
  const calls = [];
  const foundation = load("src/lib/api/staff-foundation.ts", {
    "@/lib/supabase/config": {
      getSupabasePublicConfig: () => (configured ? {} : null),
    },
  });
  const workspace = {
    ok: true,
    userId: member,
    organizationId: org,
    role,
    supabase: {
      rpc: async (name, args) => {
        calls.push({ name, args });
        return {
          data: {
            id: taskId,
            token: "a".repeat(64),
            expiresAt: "2026-10-22",
            version: 1,
          },
          error: rpcError,
        };
      },
    },
  };
  const api = load("src/app/api/staff-invitations/route.ts", {
    "@/lib/api/workspace": {
      resolveWorkspace: async () =>
        authenticated ? workspace : { ok: false, code: "SESSION_EXPIRED" },
    },
    "@/lib/api/errors": errors,
    "@/lib/api/validation": validation,
    "@/lib/supabase/config": {
      getSupabasePublicConfig: () => (configured ? {} : null),
    },
    "@/lib/staff-invitations": domain,
    "@/lib/api/staff-foundation": foundation,
  });
  return { api, calls };
}
const request = (body, origin = "https://axia.example") =>
  new Request("https://axia.example/api/staff-invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
test("invitation mutations reject cross-origin and unauthenticated requests before RPC", async () => {
  const h = invitationHarness();
  assert.equal(
    (await h.api.POST(request({ action: "create" }, "https://other.example")))
      .status,
    403,
  );
  assert.equal(h.calls.length, 0);
  const anon = invitationHarness({ authenticated: false });
  assert.equal(
    (await anon.api.POST(request({ action: "create" }))).status,
    401,
  );
  assert.equal(anon.calls.length, 0);
});
test("unconfigured environments cannot issue mock invitations", async () => {
  const h = invitationHarness({ configured: false });
  assert.equal((await h.api.POST(request({ action: "create" }))).status, 503);
  assert.equal(h.calls.length, 0);
  assert.equal(
    (await (await h.api.GET(new Request("https://axia.example"))).json())
      .enabled,
    false,
  );
});
test("invitation API derives tenant from verified membership, never request body", async () => {
  const h = invitationHarness();
  const response = await h.api.POST(
    request({
      action: "create",
      email: " Test@Example.com ",
      role: "staff",
      organizationId: "attacker-office",
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(h.calls[0].args.p_organization_id, org);
  assert.equal(h.calls[0].args.p_email, "test@example.com");
  const body = await response.json();
  assert.equal(body.delivery, "not_sent");
  assert.match(
    body.invitationPath,
    /^\/invitations\/accept#token=[a-f0-9]{64}$/,
  );
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});
test("lower roles, owner grants and admin grants are denied before invitation creation", async () => {
  const staff = invitationHarness({ role: "staff" });
  assert.equal(
    (
      await staff.api.POST(
        request({ action: "create", email: "x@example.com", role: "staff" }),
      )
    ).status,
    403,
  );
  assert.equal(staff.calls.length, 0);
  const admin = invitationHarness({ role: "admin" });
  assert.equal(
    (
      await admin.api.POST(
        request({ action: "create", email: "x@example.com", role: "admin" }),
      )
    ).status,
    400,
  );
  assert.equal(admin.calls.length, 0);
});
test("invitation failure never returns a usable token or successful delivery", async () => {
  const h = invitationHarness({ rpcError: { code: "23505" } });
  const response = await h.api.POST(
    request({ action: "create", email: "x@example.com", role: "staff" }),
  );
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.invitationPath, undefined);
  assert.equal(body.delivery, undefined);
});

test("acceptance validates fresh Auth user without requiring preexisting membership", async () => {
  let called = 0;
  const foundation = load("src/lib/api/staff-foundation.ts", {
    "@/lib/supabase/config": { getSupabasePublicConfig: () => ({}) },
  });
  const api = load("src/app/api/staff-invitations/accept/route.ts", {
    "@/lib/supabase/server": {
      createClient: async () => ({
        auth: {
          getUser: async () => ({
            data: { user: { id: member } },
            error: null,
          }),
        },
        rpc: async (name, args) => {
          called++;
          assert.equal(name, "axia_staff_accept");
          assert.equal(args.p_token, "a".repeat(64));
          return { data: { organizationId: org }, error: null };
        },
      }),
    },
    "@/lib/supabase/config": { getSupabasePublicConfig: () => ({}) },
    "@/lib/api/validation": validation,
    "@/lib/staff-invitations": domain,
    "@/lib/api/staff-foundation": foundation,
  });
  assert.equal((await api.POST(request({ token: "not-a-token" }))).status, 400);
  assert.equal(called, 0);
  const response = await api.POST(request({ token: "a".repeat(64) }));
  assert.equal(response.status, 200);
  assert.equal(called, 1);
  assert.deepEqual(await response.json(), {
    organizationId: org,
    accepted: true,
  });
});

function assignmentHarness({
  role = "owner",
  eligible = true,
  foundation = true,
} = {}) {
  const calls = [];
  let updating = false;
  const chain = {};
  for (const name of ["select", "eq"])
    chain[name] = (...args) => {
      calls.push([name, ...args]);
      return chain;
    };
  chain.update = (value) => {
    updating = true;
    calls.push(["update", value]);
    return chain;
  };
  chain.single = async () => ({
    data: updating ? { id: taskId } : { id: taskId, matter_id: "case-a" },
    error: null,
  });
  const api = load("src/app/api/tasks/assignment/route.ts", {
    "@/lib/api/workspace": {
      resolveWorkspace: async () => ({
        ok: true,
        organizationId: org,
        role,
        supabase: { from: () => chain },
      }),
    },
    "@/lib/api/errors": errors,
    "@/lib/api/validation": validation,
    "@/lib/api/staff-foundation": {
      isSameOrigin: () => true,
      hasStaffFoundation: async () => foundation,
      staffJson: json,
    },
    "@/lib/api/task-assignees": {
      canAssignOthers: (value) => ["owner", "admin", "lawyer"].includes(value),
      loadTaskAssignees: async () =>
        eligible
          ? [{ id: member, name: "Employee", matterIds: ["case-a"] }]
          : [],
    },
  });
  return { api, calls };
}
test("assignment API rejects lower roles, unavailable migration, and ineligible IDs before update", async () => {
  for (const options of [
    { role: "staff" },
    { foundation: false },
    { eligible: false },
  ]) {
    const h = assignmentHarness(options);
    assert.ok(
      (await h.api.POST(request({ taskId, assigneeId: member }))).status >= 400,
    );
    assert.equal(
      h.calls.some((c) => c[0] === "update"),
      false,
    );
  }
});
test("assignment writes only the validated user ID in the verified tenant", async () => {
  const h = assignmentHarness();
  const response = await h.api.POST(
    request({ taskId, assigneeId: member, organizationId: "attacker" }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(
    JSON.parse(JSON.stringify(h.calls.find((c) => c[0] === "update")[1])),
    { assigned_to: member },
  );
  assert.equal(
    h.calls.filter(
      (c) => c[0] === "eq" && c[1] === "organization_id" && c[2] === org,
    ).length,
    2,
  );
});
