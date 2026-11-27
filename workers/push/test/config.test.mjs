import test from "node:test";
import assert from "node:assert/strict";
import { readConfig } from "../run.mjs";
test("disabled worker requires no keys and cannot connect", () => assert.equal(readConfig({}), null));
const env = { AXIA_PUSH_ENABLED: "1", AXIA_PUSH_SCOPE: "axia-push-preview-v1", AXIA_PUSH_DEPLOYMENT_MODE: "preview",
  AXIA_PUSH_ORIGIN: "https://fixture-git-push-branch.vercel.app",
  AXIA_PUSH_DISPATCH_DATABASE_URL: "postgresql://axia_push_preview_worker:fixture@db.aaaaaaaaaaaaaaaaaaaa.supabase.co/push_fixture",
  AXIA_PUSH_DB_HOST: "db.aaaaaaaaaaaaaaaaaaaa.supabase.co", AXIA_PUSH_DB_NAME: "push_fixture",
  AXIA_PUSH_EXPECTED_SUPABASE_REF: "aaaaaaaaaaaaaaaaaaaa", AXIA_PUSH_SUBSCRIPTION_KEY_V1: "A".repeat(43), AXIA_PUSH_VAPID_PUBLIC_KEY: "A".repeat(87),
  AXIA_PUSH_VAPID_PRIVATE_KEY: "A".repeat(43), AXIA_PUSH_VAPID_SUBJECT: "https://example.invalid/push-contact" };
test("worker configuration is Preview-only and bound to an explicitly approved database", () => {
  assert.equal(readConfig(env).origin, env.AXIA_PUSH_ORIGIN);
  for (const [key, value] of [["AXIA_PUSH_DEPLOYMENT_MODE","production"],["AXIA_PUSH_SCOPE","production"],
    ["AXIA_PUSH_ORIGIN","https://axia-legal-psi.vercel.app"],["AXIA_PUSH_ORIGIN","https://fixture-git-main-a.vercel.app"],
    ["AXIA_PUSH_ORIGIN","https://fixture-git-push-branch.vercel.app/path"],["AXIA_PUSH_DB_HOST","different.example.invalid"],
    ["AXIA_PUSH_DISPATCH_DATABASE_URL","postgresql://postgres:fixture@db.aaaaaaaaaaaaaaaaaaaa.supabase.co/push_fixture"],
    ["AXIA_PUSH_DISPATCH_DATABASE_URL",env.AXIA_PUSH_DISPATCH_DATABASE_URL+"?sslmode=no-verify"],
    ["AXIA_PUSH_VAPID_SUBJECT","http://example.invalid"]]) {
    assert.throws(() => readConfig({ ...env, [key]: value }), key);
  }
});
