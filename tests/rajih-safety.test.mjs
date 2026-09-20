import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync("src/app/api/rajih/route.ts", "utf8");
const policy = fs.readFileSync("src/lib/rajih/policy.ts", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260919091000_rajih_foundation.sql", "utf8");
const authProxy = fs.readFileSync("src/lib/supabase/proxy.ts", "utf8");
const serverClient = fs.readFileSync("src/lib/supabase/server.ts", "utf8");

test("RAJIH fails closed when approved retrieval is unavailable", () => {
  assert.match(route, /sources\.length === 0/);
  assert.match(route, /abstain\(/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("RAJIH requires verified authenticated claims", () => {
  assert.match(route, /auth\.getClaims\(\)/);
  assert.match(route, /authentication_required/);
  assert.match(route, /status: 401/);
  assert.doesNotMatch(route, /auth\.getSession\(\)/);
});

test("Supabase SSR session is cookie-based and refreshed by proxy", () => {
  assert.match(serverClient, /createServerClient/);
  assert.match(serverClient, /cookieStore\.getAll\(\)/);
  assert.match(authProxy, /auth\.getClaims\(\)/);
  assert.match(authProxy, /\/api\/rajih/);
  assert.match(authProxy, /NextResponse\.redirect/);
});

test("RAJIH policy requires citations and lawyer review", () => {
  assert.match(policy, /approved and published sources/);
  assert.match(policy, /Never invent/);
  assert.match(policy, /needsLawyerReview: true/);
});

test("legal data migration includes tenant and matter isolation", () => {
  assert.match(migration, /organization_id uuid/);
  assert.match(migration, /matter_members/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /can_access_matter/);
  assert.match(migration, /status public\.knowledge_status/);
});
