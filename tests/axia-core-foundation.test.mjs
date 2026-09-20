import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migrationA = fs.readFileSync(
  "supabase/migrations/20260920162356_axia_core_data_foundation_v1_a.sql",
  "utf8",
);
const migrationB = fs.readFileSync(
  "supabase/migrations/20260920162442_axia_core_data_foundation_v1_b.sql",
  "utf8",
);
const migrationC = fs.readFileSync(
  "supabase/migrations/20260920162616_axia_core_data_foundation_v1_c.sql",
  "utf8",
);

test("AXIA Core Foundation A creates the approved legal ERP schema", () => {
  assert.match(migrationA, /alter table public\.clients/);
  assert.match(migrationA, /add column address text/);
  assert.match(migrationA, /add column status text not null default 'active'/);
  assert.match(migrationA, /alter table public\.matters/);
  assert.match(migrationA, /add column case_year integer/);
  assert.match(migrationA, /add column stage text not null default 'active'/);

  for (const table of [
    "client_powers_of_attorney",
    "matter_parties",
    "hearings",
    "financial_records",
  ]) {
    assert.match(migrationA, new RegExp(`create table public\\.${table}`));
    assert.match(
      migrationA,
      new RegExp(`alter table public\\.${table} enable row level security`),
    );
  }

  assert.doesNotMatch(migrationA, /drop table/i);
  assert.doesNotMatch(migrationA, /truncate/i);
  assert.doesNotMatch(migrationA, /service_role/i);
});

test("AXIA Core Foundation B enforces tenant-safe composite relationships", () => {
  for (const constraint of [
    "matters_client_tenant_fkey",
    "tasks_matter_tenant_fkey",
    "documents_matter_tenant_fkey",
    "rajih_action_requests_matter_tenant_fkey",
    "client_poa_client_tenant_fkey",
    "client_poa_document_tenant_fkey",
    "matter_parties_matter_tenant_fkey",
    "hearings_matter_tenant_fkey",
    "financial_records_client_tenant_fkey",
    "financial_records_matter_tenant_fkey",
  ]) {
    assert.match(migrationB, new RegExp(constraint));
  }

  assert.match(migrationB, /clients_set_updated_at/);
  assert.match(migrationB, /matters_set_updated_at/);
  assert.match(migrationB, /hearings_set_updated_at/);
  assert.match(migrationB, /financial_records_set_updated_at/);
  assert.doesNotMatch(migrationB, /service_role/i);
});

test("AXIA Core Foundation C moves matter access helpers out of public RPC surface", () => {
  assert.match(migrationC, /private\.can_access_matter/);
  assert.match(migrationC, /private\.can_write_matter/);
  assert.match(migrationC, /drop function public\.rajih_can_access_matter\(uuid\)/);
  assert.match(migrationC, /revoke all on function private\.can_access_matter/);
  assert.match(migrationC, /grant execute on function private\.can_access_matter\(uuid\) to authenticated/);
  assert.doesNotMatch(migrationC, /create or replace function public\.rajih_can_access_matter/);
});

test("AXIA Core Foundation C keeps financial records owner/admin only", () => {
  assert.match(migrationC, /financial_records_select_authorized/);
  assert.match(migrationC, /financial_records_insert_authorized/);
  assert.match(migrationC, /financial_records_update_authorized/);
  assert.match(migrationC, /array\['owner','admin'\]::public\.app_role\[\]/);
});

test("AXIA Core Foundation C applies least-privilege grants with no delete", () => {
  for (const table of [
    "clients",
    "client_powers_of_attorney",
    "matters",
    "matter_members",
    "documents",
    "matter_parties",
    "hearings",
    "financial_records",
  ]) {
    assert.match(
      migrationC,
      new RegExp(`revoke all on table public\\.${table} from anon, authenticated`),
    );
  }

  assert.doesNotMatch(migrationC, /grant\s+delete/i);
  assert.doesNotMatch(migrationC, /for\s+delete/i);
  assert.doesNotMatch(migrationC, /service_role/i);
});

test("AXIA Core Foundation C preserves the approved role matrix", () => {
  assert.match(
    migrationC,
    /array\['owner','admin','lawyer','staff'\]::public\.app_role\[\]/,
  );
  assert.match(
    migrationC,
    /array\['owner','admin','lawyer'\]::public\.app_role\[\]/,
  );
  assert.match(migrationC, /private\.can_write_matter\(matter_id\)/);
  assert.match(migrationC, /grant select on table public\.documents to authenticated/);
});
