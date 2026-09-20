import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260920180729_axia_phase3b_document_storage_foundation.sql",
  "utf8",
);
const uploadRoute = fs.readFileSync(
  "src/app/api/documents/upload/route.ts",
  "utf8",
);
const downloadRoute = fs.readFileSync(
  "src/app/api/documents/download/route.ts",
  "utf8",
);
const documentsRoute = fs.readFileSync(
  "src/app/api/documents/route.ts",
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
const page = fs.readFileSync("src/app/page.tsx", "utf8");

test("Phase 3B creates a private constrained legal-documents bucket", () => {
  assert.match(migration, /'legal-documents'/);
  assert.match(migration, /public,\s*file_size_limit/);
  assert.match(migration, /false,\s*26214400/);
  assert.match(migration, /legal_documents_storage_select/);
  assert.match(migration, /legal_documents_storage_insert/);
  assert.doesNotMatch(migration, /for\s+update/i);
  assert.doesNotMatch(migration, /for\s+delete/i);
  assert.doesNotMatch(migration, /service_role/i);
});

test("Phase 3B storage policies bind paths to verified tenant and matter access", () => {
  assert.match(migration, /private\.can_read_legal_storage_object/);
  assert.match(migration, /private\.can_write_legal_storage_object/);
  assert.match(migration, /private\.can_access_matter/);
  assert.match(migration, /private\.can_write_matter/);
  assert.match(
    migration,
    /split_part\(storage_path, '\/'::?text?[,]? 1\)|split_part\(storage_path, '\/', 1\)/,
  );
  assert.match(migration, /grant select, insert on table public\.documents/);
  assert.doesNotMatch(migration, /grant[^;]*update/i);
  assert.doesNotMatch(migration, /grant[^;]*delete/i);
});

test("Document upload uses SSR workspace, private storage, hash, and metadata insert", () => {
  assert.match(uploadRoute, /resolveWorkspace/);
  assert.match(uploadRoute, /workspace\.organizationId/);
  assert.match(uploadRoute, /workspace\.userId/);
  assert.match(uploadRoute, /from\("legal-documents"\)/);
  assert.match(uploadRoute, /\.upload\(/);
  assert.match(uploadRoute, /createHash\("sha256"\)/);
  assert.match(uploadRoute, /from\("documents"\)/);
  assert.match(uploadRoute, /created_by: workspace\.userId/);
  assert.doesNotMatch(uploadRoute, /service_role/i);
  assert.doesNotMatch(uploadRoute, /storage_path:/);
});

test("Document download issues a short-lived signed URL after RLS metadata lookup", () => {
  assert.match(downloadRoute, /resolveWorkspace/);
  assert.match(downloadRoute, /from\("documents"\)/);
  assert.match(downloadRoute, /\.eq\("organization_id", workspace\.organizationId\)/);
  assert.match(downloadRoute, /from\("legal-documents"\)/);
  assert.match(downloadRoute, /createSignedUrl\(String\(document\.storage_path\), 60\)/);
  assert.doesNotMatch(downloadRoute, /service_role/i);
});

test("Documents listing does not expose storage path or content hash", () => {
  assert.doesNotMatch(documentsRoute, /storage_path/);
  assert.doesNotMatch(documentsRoute, /content_hash/);
  assert.match(documentsRoute, /upload: true/);
  assert.match(documentsRoute, /download: true/);
  assert.match(documentsRoute, /update: false/);
  assert.match(documentsRoute, /delete: false/);
});

test("Phase 3B UI modules no longer use mock business data", () => {
  for (const [name, source] of Object.entries({
    documentsView,
    financeView,
    overviewView,
    globalSearch,
  })) {
    assert.doesNotMatch(source, /mock-legal-data/, name);
    assert.doesNotMatch(
      source,
      /mockDocuments|mockFinances|mockMatters|mockClients|mockHearings|mockTasks/,
      name,
    );
  }
});

test("Documents archive performs real upload and signed download without fake archive append", () => {
  assert.match(documentsView, /loadPersistentDocuments/);
  assert.match(documentsView, /uploadPersistentDocument/);
  assert.match(documentsView, /getDocumentDownloadUrl/);
  assert.doesNotMatch(documentsView, /setDocs\(\(prev\) => \[newDoc/);
  assert.match(documentsView, /المسودة.*ما زالت محلية/);
});

test("Finance UI loads and creates persisted records with real client and matter options", () => {
  assert.match(financeView, /loadPersistentFinances/);
  assert.match(financeView, /createPersistentFinanceRecord/);
  assert.match(financeView, /loadPersistentClients/);
  assert.match(financeView, /loadMattersWorkspace/);
  assert.doesNotMatch(financeView, /FIN-\$\{Date\.now/);
  assert.doesNotMatch(financeView, /Math\.random/);
});

test("Overview and global search load real workspace data", () => {
  assert.match(overviewView, /loadPersistentClients/);
  assert.match(overviewView, /loadMattersWorkspace/);
  assert.match(overviewView, /loadPersistentHearings/);
  assert.match(overviewView, /loadTaskWorkspace/);
  assert.match(globalSearch, /loadPersistentClients/);
  assert.match(globalSearch, /loadMattersWorkspace/);
  assert.match(globalSearch, /loadPersistentDocuments/);
});

test("Home page no longer feeds mock data into AppShell search or DocumentsView", () => {
  assert.doesNotMatch(page, /matters=\{mockMatters\}/);
  assert.doesNotMatch(page, /clients=\{mockClients\}/);
  assert.doesNotMatch(page, /documents=\{mockDocuments\}/);
  assert.doesNotMatch(page, /<DocumentsView[\s\S]{0,180}clients=\{mockClients\}/);
});
