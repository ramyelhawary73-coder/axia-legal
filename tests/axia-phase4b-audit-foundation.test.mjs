import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260921105916_axia_phase4b_audit_trail_foundation.sql",
  "utf8",
);

test("Phase 4B-B creates a private database-enforced Core audit trigger", () => {
  assert.match(
    migration,
    /create or replace function private\.audit_core_row\(\)/i,
  );
  assert.match(migration, /language plpgsql/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(
    migration,
    /revoke all on function private\.audit_core_row\(\)[\s\S]*from public, anon, authenticated/i,
  );
});

test("Phase 4B-B audits only approved Core INSERT and UPDATE operations", () => {
  for (const table of [
    "clients",
    "matters",
    "hearings",
    "tasks",
    "financial_records",
  ]) {
    const pattern =
      "create trigger " +
      table +
      "_audit_core\\s+after insert or update on public\\." +
      table;
    assert.match(migration, new RegExp(pattern, "i"));
  }

  assert.match(
    migration,
    /create trigger documents_audit_core\s+after insert on public\.documents/i,
  );
  assert.doesNotMatch(migration, /after\s+delete/i);
  assert.doesNotMatch(
    migration,
    /grant\s+delete\s+on\s+table\s+public\.(clients|matters|hearings|tasks|documents|financial_records)/i,
  );
});

test("Phase 4B-B records stable Core action namespaces", () => {
  for (const action of [
    "client",
    "matter",
    "hearing",
    "task",
    "finance",
    "document",
  ]) {
    assert.match(
      migration,
      new RegExp("when '[^']+' then '" + action + "'|action_prefix :=", "i"),
    );
  }

  assert.match(migration, /action_prefix \|\| '\.created'/);
  assert.match(migration, /action_prefix \|\| '\.updated'/);
});

test("Phase 4B-B stores changed field names instead of full before-after business rows", () => {
  assert.match(migration, /'changed_fields', to_jsonb\(changed_fields\)/);
  assert.match(migration, /old_row := to_jsonb\(old\) - 'updated_at'/);
  assert.match(migration, /new_row := to_jsonb\(new\) - 'updated_at'/);
  assert.match(migration, /cardinality\(changed_fields\) = 0/);

  for (const sensitiveField of [
    "national_id_or_cr",
    "phone",
    "email",
    "pleading_notes",
    "content_hash",
    "storage_path",
  ]) {
    const pattern = "'" + sensitiveField + "'\\s*,\\s*(old_row|new_row)";
    assert.doesNotMatch(migration, new RegExp(pattern, "i"));
  }
});

test("Phase 4B-B prevents authenticated users from inserting Core audit namespaces", () => {
  assert.match(migration, /drop policy if exists audit_logs_insert_self/);
  assert.match(
    migration,
    /create policy audit_logs_insert_rajih_self[\s\S]*action = 'rajih\.agent\.run'/i,
  );
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /private\.is_organization_member\(organization_id\)/i);
  assert.match(migration, /private\.can_access_matter\(resource_id\)/i);

  for (const coreNamespace of [
    "client.",
    "matter.",
    "hearing.",
    "task.",
    "finance.",
    "document.",
  ]) {
    const escaped = coreNamespace.replace(".", "\\.");
    assert.doesNotMatch(
      migration,
      new RegExp("action = '" + escaped, "i"),
    );
  }
});

test("Phase 4B-B limits organization-wide audit reads to owner/admin", () => {
  assert.match(
    migration,
    /private\.has_organization_role\([\s\S]*array\['owner','admin'\]::public\.app_role\[\]/i,
  );
  assert.match(
    migration,
    /user_id = \(select auth\.uid\(\)\)[\s\S]*private\.is_organization_member\(organization_id\)/i,
  );
});

test("Phase 4B-B introduces no Service Role and no paid-environment configuration", () => {
  assert.doesNotMatch(migration, /service[_ -]?role/i);
  assert.doesNotMatch(migration, /NEXT_PUBLIC_SUPABASE/i);
  assert.doesNotMatch(migration, /create\s+database|create\s+project/i);
});
