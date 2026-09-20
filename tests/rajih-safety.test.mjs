import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync("src/app/api/rajih/route.ts", "utf8");
const agent = fs.readFileSync("src/lib/rajih/agent.ts", "utf8");
const provider = fs.readFileSync("src/lib/rajih/provider.ts", "utf8");
const tools = fs.readFileSync("src/lib/rajih/tools.ts", "utf8");
const policy = fs.readFileSync("src/lib/rajih/policy.ts", "utf8");
const retrieval = fs.readFileSync("src/lib/rajih/retrieval.ts", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260919091000_rajih_foundation.sql", "utf8");
const authProxy = fs.readFileSync("src/lib/supabase/proxy.ts", "utf8");
const serverClient = fs.readFileSync("src/lib/supabase/server.ts", "utf8");

test("RAJIH route delegates to the bounded agent core", () => {
  assert.match(route, /runRajihAgent/);
  assert.match(agent, /MAX_AGENT_STEPS = 6/);
  assert.match(agent, /callRajihProvider/);
  assert.match(agent, /executeRajihTool/);
  assert.doesNotMatch(route, /chat\/completions/);
});

test("RAJIH requires verified authenticated claims", () => {
  assert.match(route, /auth\.getClaims\(\)/);
  assert.match(route, /status: 401/);
  assert.doesNotMatch(route, /auth\.getSession\(\)/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("RAJIH provider supports OpenAI-compatible Gemini tool calling", () => {
  assert.match(provider, /v1beta\/openai/);
  assert.match(provider, /chat\/completions/);
  assert.match(provider, /tool_choice: "auto"/);
  assert.match(provider, /tool_calls/);
  assert.match(provider, /thought_signature/);
  assert.match(provider, /PROVIDER_UNAUTHORIZED/);
  assert.match(provider, /PROVIDER_RATE_LIMITED/);
  assert.doesNotMatch(provider, /console\.log\(.*apiKey/);
});

test("RAJIH Agent Phase 1 exposes only approved read-only tools", () => {
  for (const toolName of [
    "search_law",
    "find_matter",
    "get_matter_context",
    "get_client_context",
    "get_case_timeline",
  ]) {
    assert.match(tools, new RegExp(toolName));
  }

  assert.doesNotMatch(tools, /\.insert\(/);
  assert.doesNotMatch(tools, /\.update\(/);
  assert.doesNotMatch(tools, /\.upsert\(/);
  assert.doesNotMatch(tools, /\.delete\(/);
  assert.doesNotMatch(tools, /\.or\(.*query/);
  assert.doesNotMatch(tools, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("RAJIH agent policy requires legal retrieval before legal conclusions", () => {
  assert.match(agent, /MUST call search_law first/);
  assert.match(agent, /Never infer inaccessible tenant data/);
  assert.match(agent, /may not modify records/);
  assert.match(agent, /Do not reveal hidden reasoning or chain-of-thought/);
});

test("RAJIH uses metadata-first retrieval for identified laws", () => {
  assert.match(retrieval, /extractLawReference/);
  assert.match(retrieval, /scoreDocument/);
  assert.match(retrieval, /retrieveByMetadata/);
  assert.match(retrieval, /effective_from/);
  assert.match(retrieval, /يعمل به/);
  assert.match(retrieval, /NO_CHUNK_MATCH/);
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
