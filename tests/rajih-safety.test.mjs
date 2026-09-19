import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync("src/app/api/rajih/route.ts", "utf8");
const policy = fs.readFileSync("src/lib/rajih/policy.ts", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260919091000_rajih_foundation.sql", "utf8");

test("RAJIH fails closed when approved retrieval is unavailable", () => {
  assert.match(route, /sources\.length === 0/);
  assert.match(route, /abstain\(/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/);
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
