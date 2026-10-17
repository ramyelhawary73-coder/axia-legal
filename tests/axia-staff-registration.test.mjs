import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(path, modules = {}, env = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, URL, Response, TextDecoder, process: { env },
    require(name) {
      if (name === "next/server") return { NextResponse: { redirect: (url, init) => new Response(null, { ...init, headers: { ...init.headers, Location: String(url) } }) } };
      if (!(name in modules)) throw new Error(`Unexpected module: ${name}`);
      return modules[name];
    },
  });
  return exports;
}
const domain = load("src/lib/staff-invitations.ts");
const helpers = (env = {}) => load("src/lib/staff-registration.ts", { "@/lib/staff-invitations": domain }, env);
const origin = "https://axia.example";
const credentials = { email: " Employee@Example.com ", password: "private-test-password", passwordConfirmation: "private-test-password" };
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const request = (body = credentials, options = {}) => new Request(`${origin}/api/staff-registration`, {
  method: "POST", headers: { "Content-Type": "application/json", Origin: options.origin ?? origin, ...options.headers },
  body: options.raw ?? JSON.stringify(body),
});
function signupHarness(options = {}) {
  const calls = [];
  const client = { auth: {
    getUser: async () => { calls.push("getUser"); return { data: { user: options.currentUser ?? null }, error: options.currentError ?? null }; },
    signUp: async args => { calls.push(["signUp", args]); if (options.throws) throw new Error("provider-private-error"); return { data: { user: {}, session: options.autoSession ?? null }, error: options.error ?? null }; },
    signOut: async args => { calls.push(["signOut", args]); return { error: null }; },
  } };
  const api = load("src/app/api/staff-registration/route.ts", {
    "@/lib/supabase/server": { createClient: async () => { calls.push("createClient"); return client; } },
    "@/lib/supabase/config": { getSupabasePublicConfig: () => options.configured === false ? null : {} },
    "@/lib/staff-registration": { ...helpers(), getStaffRegistrationConfig: () => options.enabled === false ? null : { origin: options.applicationOrigin ?? origin } },
    "@/lib/api/staff-foundation": { staffJson: json, isSameOrigin: req => req.headers.get("origin") === new URL(req.url).origin },
  });
  return { api, calls };
}

test("staff registration defaults off and accepts only an explicitly configured HTTPS origin", () => {
  assert.equal(helpers().getStaffRegistrationConfig(), null);
  for (const value of ["http://axia.example", "https://axia.example/path", "https://user:pass@axia.example", "https://axia.example?next=x", "https://axia.example#x", "bad-url"])
    assert.equal(helpers({ AXIA_STAFF_REGISTRATION_ENABLED: "1", AXIA_STAFF_REGISTRATION_ORIGIN: value }).getStaffRegistrationConfig(), null);
  assert.equal(helpers({ AXIA_STAFF_REGISTRATION_ENABLED: "1", AXIA_STAFF_REGISTRATION_ORIGIN: origin }).getStaffRegistrationConfig().origin, origin);
});
test("disabled and missing-config signup fail before touching Auth", async () => {
  for (const options of [{ enabled: false }, { configured: false }]) {
    const h = signupHarness(options);
    assert.equal((await h.api.POST(request())).status, 503);
    assert.equal(h.calls.length, 0);
  }
});
test("signup uses the reviewed public Origin and rejects a different configured origin", async () => {
  const wrong = signupHarness({ applicationOrigin: "https://another.example" });
  assert.equal((await wrong.api.POST(request())).status, 403);
  assert.equal(wrong.calls.length, 0);
  const h = signupHarness();
  const r = new Request("http://internal-next-server/api/staff-registration", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
  assert.equal((await h.api.POST(r)).status, 202);
  assert.equal(h.calls.filter(c => Array.isArray(c) && c[0] === "signUp").length, 1);
});
test("cross-origin or missing Origin signup cannot touch Auth", async () => {
  for (const value of ["https://attacker.example", "null", ""]) {
    const h = signupHarness();
    assert.equal((await h.api.POST(request(credentials, { origin: value }))).status, 403);
    assert.equal(h.calls.length, 0);
  }
});
test("signup rejects oversized declared and streamed bodies, malformed JSON and non-JSON", async () => {
  for (const [options, status] of [
    [{ headers: { "Content-Length": "9999" } }, 413],
    [{ raw: "x".repeat(4097) }, 413],
    [{ raw: "{" }, 400], [{ raw: "[]" }, 400],
    [{ headers: { "Content-Type": "text/plain" } }, 415],
  ]) {
    const h = signupHarness();
    assert.equal((await h.api.POST(request(credentials, options))).status, status);
    assert.equal(h.calls.length, 0);
  }
});
test("email, password bounds and confirmation are checked before signup", async () => {
  for (const body of [
    { ...credentials, email: "not-an-email" }, { ...credentials, password: "short", passwordConfirmation: "short" },
    { ...credentials, passwordConfirmation: "different" }, { ...credentials, password: " ".repeat(14), passwordConfirmation: " ".repeat(14) },
    { ...credentials, password: "a".repeat(129), passwordConfirmation: "a".repeat(129) },
  ]) {
    const h = signupHarness();
    assert.equal((await h.api.POST(request(body))).status, 400);
    assert.equal(h.calls.length, 0);
  }
});
test("signup never replaces a signed-in owner and fails closed on identity lookup errors", async () => {
  for (const [options, status] of [[{ currentUser: { id: "owner" } }, 409], [{ currentError: { name: "AuthApiError" } }, 503]]) {
    const h = signupHarness(options);
    assert.equal((await h.api.POST(request())).status, status);
    assert.equal(h.calls.filter(c => Array.isArray(c)).length, 0);
  }
});
test("signup sends only normalized credentials and a fixed callback; no role, office or invitation token", async () => {
  const h = signupHarness({ currentError: { name: "AuthSessionMissingError" } });
  const response = await h.api.POST(request({ ...credentials, role: "owner", organizationId: "other-office", token: "a".repeat(64), redirectTo: "https://attacker.example" }));
  assert.equal(response.status, 202);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls.find(c => Array.isArray(c) && c[0] === "signUp")[1])), {
    email: "employee@example.com", password: credentials.password, options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  assert.deepEqual(await response.json(), { status: "check_email" });
});
test("existing emails share the generic pending response; provider errors and rate limits never leak", async () => {
  for (const options of [{}, { error: { status: 422, code: "user_already_exists", message: "secret-provider-detail" } }]) {
    const h = signupHarness(options);
    const r = await h.api.POST(request());
    assert.equal(r.status, 202);
    assert.equal(await r.text(), '{"status":"check_email"}');
  }
  for (const [options, status] of [[{ error: { status: 429, message: "secret-provider-detail" } }, 429], [{ error: { status: 503, message: "secret-provider-detail" } }, 503], [{ throws: true }, 503]]) {
    const h = signupHarness(options); const r = await h.api.POST(request());
    assert.equal(r.status, status); assert.doesNotMatch(await r.text(), /secret-provider|provider-private|password/);
  }
});
test("an unexpected auto-confirmed signup session is signed out locally, never accepted", async () => {
  const h = signupHarness({ autoSession: { access_token: "fixture-only" } });
  assert.equal((await h.api.POST(request())).status, 503);
  assert.equal(h.calls.filter(c => Array.isArray(c) && c[0] === "signOut").length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls.at(-1))), ["signOut", { scope: "local" }]);
});

function confirmationHarness(options = {}) {
  const calls = []; let verified = false;
  const auth = {
    getUser: async () => {
      calls.push("getUser");
      return { data: { user: verified ? options.verifiedUser ?? { id: "employee", email_confirmed_at: "2030-01-01" } : options.currentUser ?? null }, error: options.lookupError ?? null };
    },
    exchangeCodeForSession: async code => { calls.push(["code", code]); verified = true; return { data: { session: options.noSession ? null : {} }, error: options.error ?? null }; },
    verifyOtp: async args => { calls.push(["otp", args]); verified = true; return { data: { session: options.noSession ? null : {} }, error: options.error ?? null }; },
    signOut: async args => { calls.push(["signOut", args]); },
  };
  const api = load("src/app/auth/confirm/route.ts", {
    "@/lib/supabase/server": { createClient: async () => { calls.push("createClient"); return { auth }; } },
    "@/lib/supabase/config": { getSupabasePublicConfig: () => options.configured === false ? null : {} },
    "@/lib/staff-registration": { ...helpers(), getStaffRegistrationConfig: () => options.enabled === false ? null : { origin } },
  });
  return { api, calls };
}
const callback = params => new Request(`${origin}/auth/confirm?${params}`);
test("confirmation rejects unsupported, duplicate, mixed or oversized credentials without Auth calls", async () => {
  for (const params of ["", "token_hash=abc&type=invite", "token_hash=abc&type=recovery", "code=a&code=b", "code=a&token_hash=b&type=email", "token_hash=abc&type=email&type=email", "code=" + "x".repeat(2049)]) {
    const h = confirmationHarness(); const r = await h.api.GET(callback(params));
    assert.equal(r.headers.get("Location"), `${origin}/invitations/accept?confirmation=failed`);
    assert.equal(h.calls.length, 0);
  }
});
test("disabled or wrong-host confirmation cannot consume credentials; HEAD has no Auth effects", async () => {
  const disabled = confirmationHarness({ enabled: false });
  assert.match((await disabled.api.GET(callback("code=fixture"))).headers.get("Location"), /confirmation=unavailable$/);
  assert.equal(disabled.calls.length, 0);
  const h = confirmationHarness();
  await h.api.GET(new Request("https://other.example/auth/confirm?code=fixture"));
  assert.equal(h.calls.length, 0);
  assert.equal(h.api.HEAD().status, 405); assert.equal(h.calls.length, 0);
});
test("confirmation preserves an existing owner session without consuming another account's link", async () => {
  const h = confirmationHarness({ currentUser: { id: "owner" } });
  const r = await h.api.GET(callback("code=fixture"));
  assert.match(r.headers.get("Location"), /confirmation=account_conflict$/);
  assert.deepEqual(h.calls, ["createClient", "getUser"]);
});
test("PKCE and email OTP confirmations redirect only to the invitation landing without membership writes", async () => {
  for (const params of ["code=fixture-pkce&next=https://attacker.example", "token_hash=fixture-hash&type=email&next=//attacker.example", "token_hash=fixture-hash&type=signup"]) {
    const h = confirmationHarness(); const r = await h.api.GET(callback(params));
    assert.equal(r.status, 303);
    assert.equal(r.headers.get("Location"), `${origin}/invitations/accept?confirmation=success`);
    assert.equal(r.headers.get("Referrer-Policy"), "no-referrer");
    assert.equal(r.headers.get("Cache-Control"), "private, no-store");
    assert.equal(h.calls.filter(c => Array.isArray(c)).length, 1);
    assert.equal(h.calls.at(-1), "getUser");
  }
});
test("expired/replayed confirmation and an unconfirmed or anonymous session cannot produce success", async () => {
  for (const options of [{ error: { message: "provider-secret" } }, { noSession: true }, { verifiedUser: { id: "employee" } }, { verifiedUser: { id: "employee", email_confirmed_at: "2030-01-01", is_anonymous: true } }]) {
    const h = confirmationHarness(options); const r = await h.api.GET(callback("code=fixture"));
    assert.match(r.headers.get("Location"), /confirmation=failed$/);
    assert.doesNotMatch(r.headers.get("Location"), /provider-secret|fixture/);
  }
});

test("proxy opens only the two exact onboarding endpoints and preserves existing login redirects", async () => {
  function response(status = 200, location) {
    const r = new Response(null, { status, headers: location ? { Location: String(location) } : {} });
    r.cookies = { getAll: () => [], set() {} };return r;
  }
  const make = claims => {
    // This module uses NextResponse as a class only for the missing Production-config branch.
    function NextResponse(body, options) { return new Response(body, options); }
    NextResponse.next = () => response();
    NextResponse.redirect = url => response(307, url);
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync("src/lib/supabase/proxy.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { exports, URL, process: { env: {} }, require(name) {
      if(name === "next/server") return { NextResponse };
      if(name === "@/lib/supabase/config") return { getSupabasePublicConfig: () => ({url:"https://supabase.example",publishableKey:"fixture"}) };
      if(name === "@supabase/ssr") return { createServerClient: () => ({auth:{ getClaims:async()=>({data:{claims},error:null}) }}) };
      throw new Error(name);
    } });
    return exports;
  };
  const req = path => ({ nextUrl: { pathname: path, clone: () => new URL(origin+path) }, cookies: {getAll:()=>[],set(){} } });
  const anon=make(null);
  for(const path of ["/auth/confirm","/api/staff-registration","/invitations/accept"])
    assert.equal((await anon.updateSession(req(path))).status,200);
  for(const path of ["/auth/confirm/extra","/api/staff-registration/extra","/api/clients","/"])
    assert.equal(new URL((await anon.updateSession(req(path))).headers.get("Location")).pathname,"/login");
  assert.equal((await make({sub:"owner"}).updateSession(req("/login"))).headers.get("Location"),origin+"/");
});

test("invitation session metadata advertises registration availability without granting membership", async () => {
  for (const enabled of [false,true]) {
    const api=load("src/app/api/staff-invitations/accept/route.ts",{
      "@/lib/supabase/server":{createClient:async()=>({auth:{getUser:async()=>({data:{user:null},error:null})}})},
      "@/lib/supabase/config":{getSupabasePublicConfig:()=>({})},
      "@/lib/staff-registration":{getStaffRegistrationConfig:()=>enabled?{origin}:null},
      "@/lib/staff-invitations":domain,
      "@/lib/api/validation":{},
      "@/lib/api/staff-foundation":{staffJson:json},
    });
    const r=await api.GET();
    assert.equal(r.status,401);
    assert.deepEqual(await r.json(),{authenticated:false,registrationEnabled:enabled});
    assert.equal(r.headers.get("Cache-Control"),"private, no-store");
  }
});
