import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const clientsView = fs.readFileSync(
  "src/components/views/clients-view.tsx",
  "utf8",
);
const mattersView = fs.readFileSync(
  "src/components/views/matters-view.tsx",
  "utf8",
);
const hearingsView = fs.readFileSync(
  "src/components/views/hearings-view.tsx",
  "utf8",
);
const tasksView = fs.readFileSync(
  "src/components/views/tasks-view.tsx",
  "utf8",
);
const clientDashboard = fs.readFileSync(
  "src/components/client-detail-dashboard.tsx",
  "utf8",
);
const clientsClient = fs.readFileSync("src/lib/clients-client.ts", "utf8");
const hearingsClient = fs.readFileSync("src/lib/hearings-client.ts", "utf8");
const mattersClient = fs.readFileSync("src/lib/matters-client.ts", "utf8");

test("Phase 3A removes mock business data from core case workflow views", () => {
  for (const [name, source] of Object.entries({
    clientsView,
    mattersView,
    hearingsView,
    tasksView,
  })) {
    assert.doesNotMatch(source, /mock-legal-data/, name);
    assert.doesNotMatch(source, /mockClients|mockMatters|mockHearings|mockTasks/, name);
  }
});

test("Phase 3A removes hearings tasks and matters LocalStorage business persistence", () => {
  assert.doesNotMatch(hearingsView, /axia_hearings/);
  assert.doesNotMatch(hearingsView, /axia_tasks/);
  assert.doesNotMatch(hearingsView, /axia_matters/);
  assert.doesNotMatch(hearingsView, /localStorage\.setItem\("axia_/);
  assert.doesNotMatch(hearingsView, /localStorage\.getItem\("axia_/);
});

test("Clients UI reads and creates through the real backend", () => {
  assert.match(clientsView, /loadPersistentClients/);
  assert.match(clientsView, /loadMattersWorkspace/);
  assert.match(clientsView, /createPersistentClient/);
  assert.match(clientsView, /createPersistentMatter/);
  assert.match(clientsClient, /fetch\("\/api\/clients"/);
  assert.match(clientsClient, /method: "POST"/);
  assert.doesNotMatch(clientsView, /CLI-\$\{Date\.now/);
  assert.doesNotMatch(clientsView, /info@client\.com/);
  assert.match(clientsView, /غير مسجل/);
});

test("Hearings UI persists create update archive decision and notes", () => {
  assert.match(hearingsView, /loadPersistentHearings/);
  assert.match(hearingsView, /createPersistentHearing/);
  assert.match(hearingsView, /updatePersistentHearing/);
  assert.match(hearingsClient, /fetch\("\/api\/hearings"/);
  assert.match(hearingsClient, /method: "POST"/);
  assert.match(hearingsClient, /method: "PATCH"/);
  assert.doesNotMatch(hearingsView, /HR-\$\{Date\.now/);
  assert.doesNotMatch(hearingsView, /MAT-NEW/);
  assert.doesNotMatch(hearingsView, /2026-09-18/);
});

test("Calendar drag persists hearings and tasks while matters remain action-only", () => {
  assert.match(hearingsView, /if \(item\.type === "matter"\)/);
  assert.match(hearingsView, /type === "hearing"/);
  assert.match(hearingsView, /type === "task"/);
  assert.match(hearingsView, /persistHearingReschedule/);
  assert.match(hearingsView, /persistTaskReschedule/);
  assert.doesNotMatch(
    hearingsView,
    /setMatters\(prev => prev\.map\(m => m\.id === id/,
  );
});

test("Tasks view no longer falls back to mock tasks or mock matters", () => {
  assert.match(tasksView, /useState<LegalTask\[]>\(\[\]\)/);
  assert.doesNotMatch(tasksView, /mockTasks/);
  assert.doesNotMatch(tasksView, /mockMatters/);
  assert.match(tasksView, /taskMatterOptions\.map/);
});

test("Client dashboard does not invent a 100 percent win rate", () => {
  assert.match(clientDashboard, /ratedClosedMatters/);
  assert.match(clientDashboard, /winRate === null \? "غير مسجل"/);
  assert.doesNotMatch(
    clientDashboard,
    /closedMatters\.length > 0 \? Math\.round\(\(winCount \/ closedMatters\.length\) \* 100\) : 100/,
  );
});

test("Matters client supports persistent create and update", () => {
  assert.match(mattersClient, /method: "POST"/);
  assert.match(mattersClient, /updatePersistentMatter/);
  assert.match(mattersClient, /method: "PATCH"/);
});
