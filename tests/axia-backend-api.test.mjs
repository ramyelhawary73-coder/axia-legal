import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workspace = fs.readFileSync("src/lib/api/workspace.ts", "utf8");
const errors = fs.readFileSync("src/lib/api/errors.ts", "utf8");
const validation = fs.readFileSync("src/lib/api/validation.ts", "utf8");

const routes = {
  clients: fs.readFileSync("src/app/api/clients/route.ts", "utf8"),
  matters: fs.readFileSync("src/app/api/matters/route.ts", "utf8"),
  hearings: fs.readFileSync("src/app/api/hearings/route.ts", "utf8"),
  tasks: fs.readFileSync("src/app/api/tasks/route.ts", "utf8"),
  finance: fs.readFileSync("src/app/api/finance/route.ts", "utf8"),
  documents: fs.readFileSync("src/app/api/documents/route.ts", "utf8"),
};

test("Unified API resolves authenticated tenant workspace once", () => {
  assert.match(workspace, /createClient/);
  assert.match(workspace, /auth\.getClaims\(\)/);
  assert.match(workspace, /from\("organization_members"\)/);
  assert.match(workspace, /x-axia-organization-id/);
  assert.match(workspace, /WORKSPACE_AMBIGUOUS/);
  assert.match(workspace, /WORKSPACE_FORBIDDEN/);
  assert.doesNotMatch(workspace, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("Unified API exposes safe stable error codes without database internals", () => {
  assert.match(errors, /SESSION_EXPIRED/);
  assert.match(errors, /VALIDATION_ERROR/);
  assert.match(errors, /CONFLICT/);
  assert.match(errors, /INVALID_REFERENCE/);
  assert.match(errors, /QUERY_FAILED/);
  assert.match(errors, /workspaceErrorResponse/);
  assert.doesNotMatch(errors, /error\.message/);
  assert.doesNotMatch(errors, /error\.details/);
});

test("Core business routes all use the shared workspace and no service role", () => {
  for (const [name, route] of Object.entries(routes)) {
    assert.match(route, /resolveWorkspace/, name);
    assert.match(route, /workspaceErrorResponse/, name);
    assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/, name);
    assert.doesNotMatch(route, /service_role/i, name);
    assert.doesNotMatch(route, /\.delete\(/, name);
  }
});

test("Write routes derive organization and creator from the verified workspace", () => {
  for (const name of ["clients", "matters", "hearings", "tasks", "finance"]) {
    const route = routes[name];
    assert.match(route, /organization_id: workspace\.organizationId/, name);
    assert.match(route, /created_by: workspace\.userId/, name);
  }
});

test("Matters API fixes the created_by RLS contract and supports safe updates", () => {
  assert.match(routes.matters, /created_by: workspace\.userId/);
  assert.match(routes.matters, /export async function PATCH/);
  assert.match(routes.matters, /\.eq\("organization_id", workspace\.organizationId\)/);
  assert.match(routes.matters, /databaseErrorCode/);
});

test("Documents API remains read-only and does not expose storage internals", () => {
  assert.match(routes.documents, /export async function GET/);
  assert.doesNotMatch(routes.documents, /export async function POST/);
  assert.doesNotMatch(routes.documents, /export async function PATCH/);
  assert.doesNotMatch(routes.documents, /storage_path/);
  assert.doesNotMatch(routes.documents, /content_hash/);
  assert.match(routes.documents, /upload: false/);
  assert.match(routes.documents, /delete: false/);
});

test("Shared validation bounds user-controlled API inputs", () => {
  assert.match(validation, /requiredText/);
  assert.match(validation, /optionalText/);
  assert.match(validation, /isUuid/);
  assert.match(validation, /isIsoDate/);
  assert.match(validation, /isCurrencyCode/);
  assert.match(validation, /readJsonObject/);
});


test("Write routes never trust organization id from request bodies", () => {
  for (const name of ["clients", "matters", "hearings", "tasks", "finance"]) {
    const route = routes[name];
    assert.doesNotMatch(route, /body\.organizationId/, name);
    assert.doesNotMatch(route, /body\.organization_id/, name);
  }
});
