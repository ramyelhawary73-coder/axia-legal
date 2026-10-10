import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import { NextRequest, NextResponse } from "next/server.js";

const require = createRequire(import.meta.url);
function loadTs(path, imports = {}, env = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(
    code,
    {
      module: loadedModule,
      exports: loadedModule.exports,
      require: (name) => (name in imports ? imports[name] : require(name)),
      process: { env },
      URL,
      atob,
      FormData,
      console,
    },
    { filename: path },
  );
  return loadedModule.exports;
}
const navigation = loadTs("src/lib/supabase/auth-navigation.ts");
const configFor = (env) => loadTs("src/lib/supabase/config.ts", {}, env);
const configuredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_fixture",
};

for (const next of [
  null,
  {},
  "https://evil.example",
  "//evil.example",
  "/\\evil.example",
  "/%5cevil.example",
  "/%2f%2fevil.example",
  "/%0aevil",
  "/login",
  "/login/reset",
  "/%",
  "/" + "a".repeat(2048),
]) {
  test(`Login rejects unsafe return target ${String(next).slice(0, 45)}`, () =>
    assert.equal(navigation.safeNextPath(next), "/"));
}
test("Login preserves a local path and query", () =>
  assert.equal(navigation.safeNextPath("/?view=matters"), "/?view=matters"));
test("Login never displays arbitrary error text", () => {
  assert.equal(navigation.loginErrorMessage("provider-secret"), null);
  assert.ok(navigation.loginErrorMessage("auth_unavailable"));
});

test("Configuration rejects missing, malformed and secret public credentials", () => {
  const serviceKey = `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signature`;
  for (const env of [
    {},
    { ...configuredEnv, NEXT_PUBLIC_SUPABASE_URL: "invalid" },
    { ...configuredEnv, NEXT_PUBLIC_SUPABASE_URL: "http://remote.example" },
    {
      ...configuredEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://user:password@example.com",
    },
    {
      ...configuredEnv,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_fixture",
    },
    { ...configuredEnv, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: serviceKey },
  ]) {
    const config = configFor(env);
    assert.equal(config.getSupabasePublicConfig(), null);
    assert.throws(() => config.requireSupabasePublicConfig());
  }
  assert.ok(configFor(configuredEnv).getSupabasePublicConfig());
  assert.ok(
    configFor({
      ...configuredEnv,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    }).getSupabasePublicConfig(),
  );
});

test("Server and browser clients refuse to create any client without configuration", async () => {
  let creates = 0;
  const config = configFor({});
  const server = loadTs("src/lib/supabase/server.ts", {
    "@/lib/supabase/config": config,
    "@supabase/ssr": {
      createServerClient: () => {
        creates++;
      },
    },
    "next/headers": {
      cookies: async () => {
        throw new Error("Must not read cookies");
      },
    },
  });
  const browser = loadTs("src/lib/supabase/client.ts", {
    "@/lib/supabase/config": config,
    "@supabase/supabase-js": {
      createClient: () => {
        creates++;
      },
    },
  });
  await assert.rejects(server.createClient());
  assert.throws(browser.getSupabaseBrowserClient);
  assert.equal(creates, 0);
});

function loginAction(signIn, createError = null) {
  return loadTs("src/app/login/actions.ts", {
    "@/lib/supabase/auth-navigation": navigation,
    "next/navigation": {
      redirect: (location) => {
        throw Object.assign(new Error("Redirect"), { location });
      },
    },
    "@/lib/supabase/server": {
      createClient: async () => {
        if (createError) throw createError;
        return { auth: { signInWithPassword: signIn } };
      },
    },
  }).login;
}
function form(next = "/?view=matters") {
  const result = new FormData();
  result.set("email", " lawyer@example.com ");
  result.set("password", "test-only-password");
  result.set("next", next);
  return result;
}
async function expectRedirect(action, input, expected) {
  await assert.rejects(
    () => action(input),
    (error) => {
      assert.equal(error.location, expected);
      return true;
    },
  );
}
test("Successful Login calls real auth boundary with credentials and honors safe return path", async () => {
  let credentials;
  const action = loginAction(async (input) => {
    credentials = input;
    return {
      data: { user: { id: "user-a" }, session: { access_token: "fixture" } },
      error: null,
    };
  });
  await expectRedirect(action, form(), "/?view=matters");
  assert.equal(credentials.email, "lawyer@example.com");
  assert.equal(credentials.password, "test-only-password");
});
test("Failed credentials cannot navigate to the workspace or reveal provider errors", async () => {
  const action = loginAction(async () => ({
    data: {},
    error: { status: 400, message: "sensitive provider information" },
  }));
  await expectRedirect(
    action,
    form("//evil.example"),
    "/login?error=invalid_credentials&next=%2F",
  );
});
test("A response without a real session cannot be treated as Login success", async () => {
  await expectRedirect(
    loginAction(async () => ({
      data: { user: { id: "a" }, session: null },
      error: null,
    })),
    form("/"),
    "/login?error=invalid_credentials&next=%2F",
  );
});
test("Missing configuration and network failures produce a controlled Login error", async () => {
  for (const action of [
    loginAction(null, new Error("config")),
    loginAction(async () => {
      throw new Error("network secret");
    }),
  ])
    await expectRedirect(
      action,
      form("/"),
      "/login?error=auth_unavailable&next=%2F",
    );
});
test("Login validates missing fields before creating an auth request", async () => {
  await expectRedirect(
    loginAction(() => {
      assert.fail("Auth must not be called");
    }),
    new FormData(),
    "/login?error=missing_credentials&next=%2F",
  );
});
test("Login respects provider throttling", async () => {
  await expectRedirect(
    loginAction(async () => ({ data: {}, error: { status: 429 } })),
    form("/"),
    "/login?error=rate_limited&next=%2F",
  );
});

function proxy(config, claims = { data: null, error: null }, env = {}) {
  return loadTs(
    "src/lib/supabase/proxy.ts",
    {
      "next/server": { NextResponse },
      "@/lib/supabase/config": { getSupabasePublicConfig: () => config },
      "@supabase/ssr": {
        createServerClient: (_url, _key, options) => ({
          auth: {
            getClaims: async () => {
              if (claims instanceof Error) throw claims;
              options.cookies.setAll([
                {
                  name: "session-fixture",
                  value: "refreshed",
                  options: { httpOnly: true },
                },
              ]);
              return claims;
            },
          },
        }),
      },
    },
    env,
  ).updateSession;
}
for (const environment of ["development", "preview", "production"]) {
  test(`Missing config fails closed in ${environment}, while Login remains explainable`, async () => {
    const update = proxy(null, null, { VERCEL_ENV: environment });
    for (const path of ["/", "/dashboard", "/api/tasks", "/api/rajih"]) {
      const response = await update(
        new NextRequest(`https://axia.example${path}`),
      );
      assert.equal(response.status, 503);
      assert.match(response.headers.get("cache-control"), /no-store/);
      if (path.startsWith("/api/"))
        assert.equal((await response.json()).code, "WORKSPACE_UNAVAILABLE");
    }
    assert.equal(
      (await update(new NextRequest("https://axia.example/login"))).status,
      200,
    );
  });
}
test("Anonymous protected navigation retains destination and refreshed cookies", async () => {
  const response = await proxy({
    url: "https://example.supabase.co",
    publishableKey: "fixture",
  })(new NextRequest("https://axia.example/?view=matters"));
  assert.equal(response.status, 307);
  const location = new URL(response.headers.get("location"));
  assert.equal(location.pathname, "/login");
  assert.equal(location.searchParams.get("next"), "/?view=matters");
  assert.equal(response.cookies.get("session-fixture").value, "refreshed");
});
test("Validated claims pass a protected route; anonymous RAJIH delegates to its JSON auth gate", async () => {
  const config = {
    url: "https://example.supabase.co",
    publishableKey: "fixture",
  };
  assert.equal(
    (
      await proxy(config, { data: { claims: { sub: "user-a" } }, error: null })(
        new NextRequest("https://axia.example/"),
      )
    ).status,
    200,
  );
  assert.equal(
    (await proxy(config)(new NextRequest("https://axia.example/api/rajih")))
      .status,
    200,
  );
});
test("Auth service failure never permits protected navigation", async () => {
  assert.equal(
    (
      await proxy(
        configuredEnv,
        new Error("offline"),
      )(new NextRequest("https://axia.example/"))
    ).status,
    503,
  );
});

function workspace(memberships, options = {}) {
  const calls = [];
  const client = {
    auth: {
      getClaims: async () => ({
        data: { claims: { sub: options.userId ?? "user-a" } },
        error: options.authError ?? null,
      }),
    },
    from(table) {
      calls.push(table);
      return {
        select() {
          return this;
        },
        eq(field, value) {
          calls.push([field, value]);
          return this;
        },
        order: async () => ({
          data: memberships,
          error: options.membershipError ?? null,
        }),
        maybeSingle: async () => ({ data: { full_name: "Lawyer A" } }),
      };
    },
  };
  const resolver = loadTs("src/lib/api/workspace.ts", {
    "@/lib/supabase/server": {
      createClient: async () => {
        if (options.createError) throw options.createError;
        return client;
      },
    },
  }).resolveWorkspace;
  return { resolver, calls };
}
const membership = (organization_id) => ({
  organization_id,
  role: "lawyer",
  created_at: "2026-01-01",
});
test("Workspace derives identity and organization from authenticated membership", async () => {
  const { resolver, calls } = workspace([membership("org-a")]);
  const result = await resolver();
  assert.equal(result.ok, true);
  assert.equal(result.userId, "user-a");
  assert.equal(result.organizationId, "org-a");
  assert.equal(result.role, "lawyer");
  assert.ok(
    calls.some(
      (x) => Array.isArray(x) && x[0] === "user_id" && x[1] === "user-a",
    ),
  );
});
test("Forged organization headers cannot select another tenant", async () => {
  const result = await workspace([membership("org-a")]).resolver(
    new Request("https://axia.example/api/tasks", {
      headers: { "x-axia-organization-id": "org-b" },
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, "WORKSPACE_FORBIDDEN");
});
test("Multi-organization accounts require an explicit permitted selection", async () => {
  const { resolver } = workspace([membership("org-a"), membership("org-b")]);
  assert.equal((await resolver()).code, "WORKSPACE_AMBIGUOUS");
  assert.equal(
    (
      await resolver(
        new Request("https://axia.example/api/tasks", {
          headers: { "x-axia-organization-id": "org-b" },
        }),
      )
    ).organizationId,
    "org-b",
  );
});
test("Workspace service outages and expired sessions return safe codes without querying business data", async () => {
  assert.equal(
    (await workspace([], { createError: new Error("config") }).resolver()).code,
    "WORKSPACE_UNAVAILABLE",
  );
  const { resolver, calls } = workspace([], {
    authError: { message: "expired" },
  });
  assert.equal((await resolver()).code, "SESSION_EXPIRED");
  assert.equal(calls.length, 0);
  assert.equal((await workspace([]).resolver()).code, "WORKSPACE_MISSING");
});
