import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const domain = fs.readFileSync("src/lib/matters-domain.ts", "utf8");
const mattersClient = fs.readFileSync("src/lib/matters-client.ts", "utf8");
const mattersView = fs.readFileSync("src/components/views/matters-view.tsx", "utf8");
const clientsView = fs.readFileSync("src/components/views/clients-view.tsx", "utf8");
const clientDetail = fs.readFileSync("src/components/client-detail-dashboard.tsx", "utf8");

test("Cleanup Batch 2 introduces one named MatterCreateInput contract", () => {
  assert.match(domain, /export type MatterCreateInput = \{/);
  for (const required of ["caseNumber: string", "title: string", "clientId: string"]) {
    assert.ok(domain.includes(required), required);
  }

  for (const optional of [
    "court?: string",
    "category?: string",
    "caseYear?: number",
    "circuit?: string",
    'clientRole?: Matter["clientRole"]',
    "filingDate?: string",
    "claimAmount?: number",
    "currency?: string",
    "notes?: string",
  ]) {
    assert.ok(domain.includes(optional), optional);
  }

  assert.match(mattersClient, /input: MatterCreateInput/);
  assert.doesNotMatch(
    mattersClient,
    /createPersistentMatter\(input: \{[\s\S]*?caseNumber: string;/,
  );
});

test("Client dashboard create flow no longer fabricates a persisted Matter", () => {
  assert.doesNotMatch(clientDetail, /MAT-\$\{Date\.now\(\)\}/);
  assert.doesNotMatch(clientDetail, /const newMatter: Matter = \{/);
  assert.match(
    clientDetail,
    /const input: Omit<MatterCreateInput, "clientId"> = \{/,
  );

  const inputBlock =
    clientDetail.match(
      /const input: Omit<MatterCreateInput, "clientId"> = \{([\s\S]*?)\n    \};/,
    )?.[1] ?? "";

  assert.match(inputBlock, /caseNumber: newCaseNumber/);
  assert.match(inputBlock, /title: newTitle/);
  assert.match(inputBlock, /court: newCourt/);
  assert.match(inputBlock, /caseYear: new Date\(\)\.getFullYear\(\)/);
  assert.match(inputBlock, /circuit: newCircuit \|\| "الدائرة المختصة"/);
  assert.match(inputBlock, /clientRole: newClientRole/);
  assert.match(inputBlock, /filingDate: new Date\(\)\.toISOString\(\)\.split\("T"\)\[0\]/);

  for (const forbidden of [
    "notes:",
    "opponentName:",
    "assignedLawyer:",
    "nextHearingDate:",
    "nextHearingGoal:",
    "agreedFees:",
    "paidFees:",
    "status:",
    "stage:",
  ]) {
    assert.ok(!inputBlock.includes(forbidden), forbidden + " must not be fabricated");
  }
});

test("ClientsView injects the selected persisted client id and does not add notes", () => {
  const callback =
    clientsView.match(
      /onAddNewMatter=\{async \(input: Omit<MatterCreateInput, "clientId">\) => \{([\s\S]*?)\n        \}\}/,
    )?.[1] ?? "";

  assert.match(callback, /createPersistentMatter\(\{\s*\.\.\.input,\s*clientId: selectedClient\.id,/);
  assert.doesNotMatch(callback, /notes\s*:/);
});

test("Client to Matter association is ID-first with legacy name fallback only without an ID", () => {
  assert.match(domain, /const matterClientId = matter\.clientId\?\.trim\(\);/);
  assert.match(
    domain,
    /if \(matterClientId\) \{\s*return matterClientId === client\.id;\s*\}/,
  );
  assert.match(domain, /matterClientName\.includes\(clientName\)/);
  assert.match(domain, /clientName\.includes\(matterClientName\)/);

  assert.match(
    clientsView,
    /matters\.filter\(\(m\) => matterBelongsToClient\(m, client\)\)/,
  );
  assert.match(
    clientDetail,
    /matters\.filter\(\(matter\) => matterBelongsToClient\(matter, client\)\)/,
  );

  assert.doesNotMatch(clientsView, /return matchId \|\| matchName/);
  assert.doesNotMatch(clientDetail, /return matchId \|\| matchName/);
});

test("Cleanup Batch 2 preserves current visible court, category, and client-role option sets", () => {
  const mattersCourts = [
    "محكمة النقض",
    "المحكمة الاقتصادية",
    "مجلس الدولة (القضاء الإداري)",
    "استئناف عالي",
    "ابتدائية كلي",
  ];
  const clientCourts = [...mattersCourts, "جزئية"];
  const categories = ["مدني", "جنائي", "عمالي", "تجاري", "إداري", "أسرة"];
  const roles = ["مدعي", "مدعى عليه", "طاعن", "مطعون ضده", "مستأنف", "مستأنف ضده"];

  const blockValues = (name) => {
    const block =
      domain.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const`))?.[1] ?? "";
    return [...block.matchAll(/value: "([^"]+)"/g)].map((match) => match[1]);
  };

  assert.deepEqual(blockValues("MATTERS_VIEW_COURT_OPTIONS"), mattersCourts);
  assert.deepEqual(blockValues("CLIENT_DETAIL_COURT_OPTIONS"), clientCourts);
  assert.deepEqual(blockValues("CLIENT_DETAIL_FILTER_COURT_OPTIONS"), clientCourts);
  assert.deepEqual(blockValues("MATTER_CATEGORY_OPTIONS"), categories);
  assert.deepEqual(blockValues("MATTER_CLIENT_ROLE_OPTIONS"), roles);

  assert.match(mattersView, /MATTERS_VIEW_COURT_OPTIONS\.map/);
  assert.match(mattersView, /MATTER_CATEGORY_OPTIONS\.map/);
  assert.match(clientDetail, /CLIENT_DETAIL_COURT_OPTIONS\.map/);
  assert.match(clientDetail, /CLIENT_DETAIL_FILTER_COURT_OPTIONS\.map/);
  assert.match(clientDetail, /MATTER_CLIENT_ROLE_OPTIONS\.map/);
});
