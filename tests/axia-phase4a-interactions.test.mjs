import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260921072601_axia_phase4a_core_update_grants.sql",
  "utf8",
);
const actionMenu = fs.readFileSync(
  "src/components/action-context-menu.tsx",
  "utf8",
);
const hearingsView = fs.readFileSync(
  "src/components/views/hearings-view.tsx",
  "utf8",
);
const mattersView = fs.readFileSync(
  "src/components/views/matters-view.tsx",
  "utf8",
);
const tasksView = fs.readFileSync(
  "src/components/views/tasks-view.tsx",
  "utf8",
);
const clientsView = fs.readFileSync(
  "src/components/views/clients-view.tsx",
  "utf8",
);

const apiFiles = [
  "src/app/api/clients/route.ts",
  "src/app/api/matters/route.ts",
  "src/app/api/hearings/route.ts",
  "src/app/api/tasks/route.ts",
  "src/app/api/finance/route.ts",
].map((path) => [path, fs.readFileSync(path, "utf8")]);

test("Phase 4A grants UPDATE only to PATCH-backed core resources", () => {
  for (const table of [
    "public.clients",
    "public.matters",
    "public.hearings",
    "public.tasks",
    "public.financial_records",
  ]) {
    assert.match(migration, new RegExp(table.replace(".", "\\.")));
  }

  assert.match(migration, /grant update on table/i);
  assert.match(migration, /to authenticated/i);
  assert.doesNotMatch(migration, /grant\s+delete/i);
  assert.doesNotMatch(migration, /public\.documents/);
});

test("PATCH-backed resources remain RLS/API updates with no DELETE endpoint", () => {
  for (const [path, source] of apiFiles) {
    assert.match(source, /export async function PATCH/, path);
    assert.doesNotMatch(source, /export async function DELETE/, path);
  }
});

test("Unified action menu supports desktop context click, long press and kebab trigger", () => {
  assert.match(actionMenu, /onContextMenu/);
  assert.match(actionMenu, /onPointerDown/);
  assert.match(actionMenu, /LONG_PRESS_MS = 550/);
  assert.match(actionMenu, /triggerButton/);
  assert.match(actionMenu, /MoreVertical/);
  assert.match(actionMenu, /createPortal/);
});

test("Hearing reschedule is persisted, read back and rolled back on failure", () => {
  assert.match(hearingsView, /persistHearingReschedule/);
  assert.match(hearingsView, /await updatePersistentHearing/);
  assert.match(hearingsView, /await loadPersistentHearings\(matters\)/);
  assert.match(hearingsView, /confirmed\.hearingDate !== targetDateStr/);
  assert.match(
    hearingsView,
    /فشل حفظ إعادة الجدولة وتمت إعادة الجلسة لموعدها السابق/,
  );
  assert.match(
    hearingsView,
    /item\.type === "hearing"[\s\S]{0,120}reschedulingHearingId !== item\.id/,
  );
});

test("Context actions are wired to hearings, matters, tasks and clients", () => {
  for (const source of [hearingsView, mattersView, tasksView, clientsView]) {
    assert.match(source, /useActionContextMenu/);
    assert.match(source, /\.bind\(/);
    assert.match(source, /triggerButton/);
  }

  assert.match(hearingsView, /إعادة جدولة الجلسة/);
  assert.match(hearingsView, /مسح ملاحظات الجلسة/);
  assert.match(mattersView, /فتح ملف القضية/);
  assert.match(mattersView, /مسح ملاحظات القضية/);
  assert.match(tasksView, /تحديد كمكتملة/);
  assert.match(clientsView, /فتح لوحة الموكل/);
});

test("Phase 4A context actions do not introduce record deletion", () => {
  assert.doesNotMatch(
    hearingsView,
    /getHearingActions[\s\S]{0,2200}id:\s*"delete"/,
  );
  assert.doesNotMatch(
    mattersView,
    /getMatterActions[\s\S]{0,2600}id:\s*"delete"/,
  );
  assert.doesNotMatch(
    clientsView,
    /getClientActions[\s\S]{0,1800}id:\s*"delete"/,
  );
  assert.doesNotMatch(
    tasksView,
    /getTaskActions[\s\S]{0,1600}id:\s*"delete"/,
  );
});
