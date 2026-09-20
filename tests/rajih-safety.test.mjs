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
const actionLayerMigration = fs.readFileSync(
  "supabase/migrations/20260920114631_rajih_action_layer_phase2a_foundation.sql",
  "utf8",
);
const actionLayerIndexesMigration = fs.readFileSync(
  "supabase/migrations/20260920114940_rajih_action_layer_phase2a_indexes.sql",
  "utf8",
);
const authProxy = fs.readFileSync("src/lib/supabase/proxy.ts", "utf8");
const serverClient = fs.readFileSync("src/lib/supabase/server.ts", "utf8");
const homePage = fs.readFileSync("src/app/page.tsx", "utf8");
const tasksClient = fs.readFileSync("src/lib/tasks-client.ts", "utf8");
const tasksRoute = fs.readFileSync("src/app/api/tasks/route.ts", "utf8");
const taskModal = fs.readFileSync("src/components/task-creation-modal.tsx", "utf8");
const tasksView = fs.readFileSync("src/components/views/tasks-view.tsx", "utf8");

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
  assert.match(provider, /MAX_PROVIDER_ATTEMPTS = 3/);
  assert.match(provider, /RETRYABLE_STATUS_CODES/);
  assert.match(provider, /retry-after/);
  assert.doesNotMatch(provider, /console\.log\(.*apiKey/);
});

test("RAJIH uses stable model failover only for transient provider failures", () => {
  assert.match(provider, /gemini-3\.8-flash/);
  assert.match(provider, /gemini-3\.7-flash/);
  assert.match(provider, /gemini-3\.6-flash/);
  assert.match(provider, /getProviderModelCandidates/);
  assert.match(provider, /isProviderFailoverEligible/);
  assert.match(agent, /runSingleModelAgent/);
  assert.match(agent, /attemptedModels/);
  assert.match(agent, /for \(const model of modelCandidates\)/);
  assert.match(agent, /isProviderFailoverEligible/);
});

test("RAJIH public response hides developer and provider internals", () => {
  assert.doesNotMatch(route, /agentTrace:/);
  assert.doesNotMatch(route, /diagnostics:/);
  assert.match(route, /return NextResponse\.json\(result\.answer\)/);
  assert.match(agent, /Never mention model names, providers, APIs, tools/);
  assert.match(agent, /الخلاصة القانونية/);
  assert.match(agent, /الأساس القانوني/);
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


test("RAJIH Action Layer Phase 2A creates tenant-safe persistent tasks", () => {
  assert.match(actionLayerMigration, /create table public\.tasks/);
  assert.match(actionLayerMigration, /organization_id uuid not null/);
  assert.match(actionLayerMigration, /matter_id uuid null references public\.matters/);
  assert.match(actionLayerMigration, /alter table public\.tasks enable row level security/);
  assert.match(actionLayerMigration, /tasks_select_authorized/);
  assert.match(actionLayerMigration, /tasks_insert_authorized/);
  assert.match(actionLayerMigration, /tasks_update_authorized/);
  assert.match(actionLayerMigration, /private\.has_organization_role/);
  assert.match(actionLayerMigration, /created_by = \(select auth\.uid\(\)\)/);
  assert.doesNotMatch(actionLayerMigration, /grant delete/i);
  assert.doesNotMatch(actionLayerMigration, /for delete/i);
});

test("RAJIH action requests remain proposal-only in Phase 2A.1", () => {
  const start = actionLayerMigration.indexOf("create table public.rajih_action_requests");
  const end = actionLayerMigration.indexOf("drop policy if exists rajih_audit_select");
  const actionRequestsSection = actionLayerMigration.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(actionRequestsSection, /action_type in \('create_task', 'update_task_status'\)/);
  assert.match(actionRequestsSection, /status = 'proposed'/);
  assert.match(actionRequestsSection, /grant select, insert on table public\.rajih_action_requests to authenticated/);
  assert.doesNotMatch(actionRequestsSection, /grant update/i);
  assert.doesNotMatch(actionRequestsSection, /for update/i);
  assert.doesNotMatch(actionRequestsSection, /for delete/i);
});

test("RAJIH audit foundation is append-only for authenticated users", () => {
  assert.match(actionLayerMigration, /revoke all on table public\.audit_logs from anon, authenticated/);
  assert.match(actionLayerMigration, /grant select, insert on table public\.audit_logs to authenticated/);
  assert.match(actionLayerMigration, /audit_logs_insert_self/);
  assert.match(actionLayerMigration, /user_id = \(select auth\.uid\(\)\)/);
  assert.doesNotMatch(actionLayerMigration, /grant update[^\n]*audit_logs/i);
  assert.doesNotMatch(actionLayerMigration, /grant delete[^\n]*audit_logs/i);
  assert.doesNotMatch(actionLayerMigration, /SUPABASE_SERVICE_ROLE_KEY/);
});


test("RAJIH Action Layer Phase 2A indexes new foreign-key access paths", () => {
  assert.match(actionLayerIndexesMigration, /tasks_created_by_idx/);
  assert.match(actionLayerIndexesMigration, /tasks\(created_by\)/);
  assert.match(actionLayerIndexesMigration, /rajih_action_requests_approved_by_idx/);
  assert.match(actionLayerIndexesMigration, /rajih_action_requests\(approved_by\)/);
});


test("Phase 2A.2 loads and persists tasks through the SSR-authenticated API", () => {
  assert.match(homePage, /loadTaskWorkspace/);
  assert.match(homePage, /createPersistentTask/);
  assert.match(homePage, /updatePersistentTaskStatus/);
  assert.match(homePage, /useState<LegalTask\[]>\(\[\]\)/);
  assert.doesNotMatch(homePage, /mockTasks/);

  assert.match(tasksClient, /fetch\("\/api\/tasks"/);
  assert.doesNotMatch(tasksClient, /getSupabaseBrowserClient/);
  assert.doesNotMatch(tasksClient, /\.delete\(/);

  assert.match(tasksRoute, /createClient/);
  assert.match(tasksRoute, /auth\.getClaims\(\)/);
  assert.match(tasksRoute, /from\("tasks"\)/);
  assert.match(tasksRoute, /\.insert\(/);
  assert.match(tasksRoute, /\.update\(/);
  assert.match(tasksRoute, /\.select\("id"\)/);
  assert.doesNotMatch(tasksRoute, /\.delete\(/);
  assert.doesNotMatch(tasksRoute, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("Phase 2A.2 task creation uses accessible real matters and current user assignment", () => {
  assert.doesNotMatch(taskModal, /mockMatters/);
  assert.match(taskModal, /matterOptions/);
  assert.match(taskModal, /matchedMatter/);
  assert.match(taskModal, /اختر قضية من القضايا المتاحة/);
  assert.match(taskModal, /assigneeLabel/);
  assert.match(tasksRoute, /assigned_to: workspace\.userId/);
  assert.match(tasksRoute, /created_by: workspace\.userId/);
});

test("Phase 2A.2 keeps task deletion disabled for persistent task data", () => {
  assert.match(tasksView, /const deletionEnabled/);
  assert.match(tasksView, /deletionEnabled && isDeleteConfirmOpen/);
  assert.doesNotMatch(homePage, /handleDeleteTask/);
  assert.doesNotMatch(homePage, /handleBulkDeleteTasks/);
});
