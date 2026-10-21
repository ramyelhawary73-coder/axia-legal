import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260921025345_axia_phase3c_profiles_same_org_read.sql",
  "utf8",
);
const consolidationMigration = fs.readFileSync(
  "supabase/migrations/20260921030155_axia_phase3c_profiles_select_consolidation.sql",
  "utf8",
);
const teamApi = fs.readFileSync("src/app/api/team/route.ts", "utf8");
const administrationApi = fs.readFileSync(
  "src/app/api/administration/route.ts",
  "utf8",
);
const teamView = fs.readFileSync(
  "src/components/views/team-view.tsx",
  "utf8",
);
const administrationView = fs.readFileSync(
  "src/components/views/administration-view.tsx",
  "utf8",
);
const reportsView = fs.readFileSync(
  "src/components/views/reports-view.tsx",
  "utf8",
);
const pdfReport = fs.readFileSync(
  "src/components/legal-pdf-report-modal.tsx",
  "utf8",
);
const page = fs.readFileSync("src/components/office-workspace.tsx", "utf8");

test("Phase 3C profile policy adds same-organization SELECT only", () => {
  assert.match(migration, /profiles_select_same_org/);
  assert.match(migration, /for select/i);
  assert.match(migration, /to authenticated/i);
  assert.match(migration, /organization_members/);
  assert.match(migration, /private\.is_organization_member/);
  assert.doesNotMatch(migration, /for update/i);
  assert.doesNotMatch(migration, /for insert/i);
  assert.doesNotMatch(migration, /for delete/i);
});

test("Team API is read-only and explicitly scopes matter assignments to workspace matters", () => {
  assert.match(teamApi, /export async function GET/);
  assert.doesNotMatch(teamApi, /export async function POST/);
  assert.doesNotMatch(teamApi, /export async function PATCH/);
  assert.doesNotMatch(teamApi, /export async function DELETE/);
  assert.match(teamApi, /eq\("organization_id", workspace\.organizationId\)/);
  assert.match(teamApi, /const matterIds = matters\.map/);
  assert.match(teamApi, /\.in\("matter_id", matterIds\)/);
  assert.doesNotMatch(teamApi, /SERVICE_ROLE|service_role/);
});

test("Administration API is read-only and reports the verified workspace role", () => {
  assert.match(administrationApi, /export async function GET/);
  assert.match(administrationApi, /workspace\.role/);
  assert.match(administrationApi, /editableFromThisScreen: false/);
  assert.match(administrationApi, /invitationFlowEnabled: false/);
  assert.doesNotMatch(administrationApi, /export async function POST/);
  assert.doesNotMatch(administrationApi, /export async function PATCH/);
  assert.doesNotMatch(administrationApi, /export async function DELETE/);
  assert.doesNotMatch(administrationApi, /SERVICE_ROLE|service_role/);
});

test("Team UI contains no mock team or fake local member creation", () => {
  assert.match(teamView, /loadPersistentTeam/);
  assert.doesNotMatch(teamView, /mockTeam|mockTasks|mockMatters/);
  assert.doesNotMatch(teamView, /mock-legal-data/);
  assert.doesNotMatch(teamView, /TM-\$\{Date\.now/);
  assert.doesNotMatch(teamView, /handleCreateMember/);
  assert.match(teamApi, /inviteMember: false/);
  assert.match(teamApi, /changeRole: false/);
  assert.match(teamApi, /removeMember: false/);
});

test("Administration UI no longer simulates editable RBAC", () => {
  assert.match(administrationView, /loadAdministrationWorkspace/);
  assert.doesNotMatch(administrationView, /mockMatters|mockTasks/);
  assert.doesNotMatch(administrationView, /mock-legal-data/);
  assert.doesNotMatch(administrationView, /handleTogglePermission/);
  assert.doesNotMatch(administrationView, /setPermissions/);
  assert.doesNotMatch(administrationView, /محاكاة التحكم/);
  assert.match(administrationView, /Supabase RLS/);
  assert.match(administrationView, /غير مسجل/);
});

test("Reports are data-driven and contain no fixed demo KPIs", () => {
  assert.doesNotMatch(reportsView, /mockMatters|mockTasks/);
  assert.doesNotMatch(reportsView, /mock-legal-data/);
  assert.doesNotMatch(reportsView, /٨٨\.٤٪/);
  assert.doesNotMatch(reportsView, /٧\.٢ شهر/);
  assert.doesNotMatch(reportsView, /٧٦٪/);
  assert.doesNotMatch(reportsView, /١٤٢ مذكرة/);
  assert.match(reportsView, /courtDistribution/);
  assert.match(reportsView, /overdueTasks/);
  assert.match(reportsView, /غير مسجل/);
  assert.match(reportsView, /hearings/);
  assert.match(reportsView, /documents/);
});

test("PDF report does not claim unsupported official certification or identity", () => {
  for (const phrase of [
    "تقرير رسمي معتمد",
    "نقابة المحامين",
    "د. رامي الهواري",
    "معتمد - قيد النقض",
    "حجة إجرائية",
    "برج النيل الإداري",
  ]) {
    assert.equal(pdfReport.includes(phrase), false, phrase);
  }

  assert.match(pdfReport, /AXIA Legal ERP/);
  assert.match(pdfReport, /يجب مراجعة المواعيد والبيانات القانونية/);
});

test("Home passes real hearings and documents into Reports and uses read-only Administration", () => {
  assert.match(page, /hearings=\{hearings\}/);
  assert.match(page, /documents=\{documents\}/);
  assert.match(page, /<AdministrationView \/>/);
});


test("Phase 3C consolidates profile SELECT policies without expanding writes", () => {
  assert.match(consolidationMigration, /profiles_select_self_or_same_org/);
  assert.match(consolidationMigration, /drop policy if exists profiles_select_self/);
  assert.match(consolidationMigration, /drop policy if exists profiles_select_same_org/);
  assert.match(consolidationMigration, /for select/i);
  assert.match(consolidationMigration, /\(select auth\.uid\(\)\) = id/);
  assert.match(consolidationMigration, /private\.is_organization_member/);
  assert.doesNotMatch(consolidationMigration, /for update/i);
  assert.doesNotMatch(consolidationMigration, /for insert/i);
  assert.doesNotMatch(consolidationMigration, /for delete/i);
});
