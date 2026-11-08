import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260920180729_axia_phase3b_document_storage_foundation.sql",
  "utf8",
);
const documentsApi = fs.readFileSync(
  "src/app/api/documents/route.ts",
  "utf8",
);
const downloadApi = fs.readFileSync(
  "src/app/api/documents/[id]/download/route.ts",
  "utf8",
);
const documentsView = fs.readFileSync(
  "src/components/views/documents-view.tsx",
  "utf8",
);
const financeView = fs.readFileSync(
  "src/components/views/finance-view.tsx",
  "utf8",
);
const overviewView = fs.readFileSync(
  "src/components/views/overview-view.tsx",
  "utf8",
);
const globalSearch = fs.readFileSync(
  "src/components/global-search-bar.tsx",
  "utf8",
);
const page = fs.readFileSync("src/components/office-workspace.tsx", "utf8");

test("Phase 3B storage bucket is private and limited to insert/select policies", () => {
  assert.match(migration, /'legal-documents'/);
  assert.match(migration, /false,/);
  assert.match(migration, /26214400/);
  assert.match(migration, /legal_documents_storage_select/);
  assert.match(migration, /legal_documents_storage_insert/);
  assert.doesNotMatch(migration, /for\s+update/i);
  assert.doesNotMatch(migration, /for\s+delete/i);
  assert.doesNotMatch(migration, /service_role/i);
});

test("Phase 3B storage path authorization is tenant and matter aware", () => {
  assert.match(migration, /private\.can_read_legal_storage_object/);
  assert.match(migration, /private\.can_write_legal_storage_object/);
  assert.match(migration, /organization_members/);
  assert.match(migration, /private\.can_access_matter/);
  assert.match(migration, /private\.can_write_matter/);
  assert.match(migration, /split_part\(object_name, '\/'/);
});

test("Documents API uploads real files and never exposes storage_path", () => {
  assert.match(documentsApi, /request\.formData\(\)/);
  assert.match(documentsApi, /\.storage/);
  assert.match(documentsApi, /\.upload\(/);
  assert.match(documentsApi, /createHash\("sha256"\)/);
  assert.match(documentsApi, /created_by: workspace\.userId/);
  assert.match(documentsApi, /organization_id: workspace\.organizationId/);
  assert.match(documentsApi, /MAX_FILE_BYTES/);
  assert.doesNotMatch(documentsApi, /service_role/i);
  assert.doesNotMatch(documentsApi, /\.remove\(/);
  assert.match(documentsApi, /storage_path: objectName/);
  assert.doesNotMatch(documentsApi, /storagePath:/);
});

test("Document download uses a short-lived signed URL after RLS metadata lookup", () => {
  assert.match(downloadApi, /from\("documents"\)/);
  assert.match(downloadApi, /createSignedUrl/);
  assert.match(downloadApi, /60/);
  assert.match(downloadApi, /workspace\.organizationId/);
  assert.doesNotMatch(downloadApi, /service_role/i);
});

test("Documents UI uses persistent archive upload/download and no mock documents", () => {
  assert.match(documentsView, /loadPersistentDocuments/);
  assert.match(documentsView, /uploadPersistentDocument/);
  assert.match(documentsView, /getSecureDocumentDownloadUrl/);
  assert.match(documentsView, /type="file"/);
  assert.doesNotMatch(documentsView, /mockDocuments|mockClients|mockMatters/);
  assert.doesNotMatch(documentsView, /mock-legal-data/);
});

test("Finance UI uses real clients matters and financial records", () => {
  assert.match(financeView, /loadPersistentFinance/);
  assert.match(financeView, /createPersistentFinanceRecord/);
  assert.match(financeView, /loadPersistentClients/);
  assert.match(financeView, /loadMattersWorkspace/);
  assert.doesNotMatch(financeView, /mockFinances/);
  assert.doesNotMatch(financeView, /Date\.now\(\).*FIN/);
  assert.doesNotMatch(financeView, /Math\.random/);
});

test("Overview and global search consume shared persistent workspace data", () => {
  assert.doesNotMatch(overviewView, /mockMatters|mockHearings|mockTasks|mockClients/);
  assert.doesNotMatch(globalSearch, /mockMatters|mockClients|mockDocuments/);
  assert.match(globalSearch, /matters = \[\]/);
  assert.match(globalSearch, /clients = \[\]/);
  assert.match(globalSearch, /documents = \[\]/);
  assert.match(page, /loadPersistentClients/);
  assert.match(page, /loadMattersWorkspace/);
  assert.match(page, /loadPersistentHearings/);
  assert.match(page, /loadPersistentDocuments/);
  assert.doesNotMatch(page, /mockMatters|mockClients|mockDocuments/);
});
