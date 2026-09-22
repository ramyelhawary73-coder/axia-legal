import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const helper = fs.readFileSync("src/lib/api/client-response.ts", "utf8");

const clientModules = [
  ["src/lib/clients-client.ts", "تعذر الاتصال بخدمة الموكلين."],
  ["src/lib/matters-client.ts", "تعذر الاتصال بخدمة القضايا."],
  ["src/lib/hearings-client.ts", "تعذر الاتصال بخدمة الجلسات."],
  ["src/lib/tasks-client.ts", "تعذر الاتصال بخدمة المهام."],
  ["src/lib/finance-client.ts", "تعذر الاتصال بالخدمة المالية."],
  ["src/lib/documents-client.ts", "تعذر الاتصال بخدمة المستندات."],
  ["src/lib/team-client.ts", "تعذر تحميل بيانات فريق العمل."],
  ["src/lib/administration-client.ts", "تعذر تحميل بيانات الإدارة."],
].map(([path, fallback]) => [path, fallback, fs.readFileSync(path, "utf8")]);

test("Cleanup Batch 1 centralizes browser JSON response parsing", () => {
  assert.match(helper, /export async function readJsonResponse<T>/);
  assert.match(helper, /response\.json\(\)\.catch\(\(\) => null\)/);
  assert.match(helper, /if \(!response\.ok\)/);
  assert.match(helper, /payload\?\.error \|\| fallbackMessage/);
});

test("All audited browser clients use the shared response helper", () => {
  for (const [path, fallback, source] of clientModules) {
    assert.match(
      source,
      /import \{ readJsonResponse \} from "@\/lib\/api\/client-response";/,
      path,
    );
    assert.doesNotMatch(source, /async function readJsonResponse<T>/, path);
    assert.ok(source.includes(fallback), path + " must preserve its fallback message");
  }
});

test("Cleanup Batch 1 keeps the eight client API endpoints and methods in place", () => {
  const expected = new Map([
    ["src/lib/clients-client.ts", ["/api/clients", "GET", "POST"]],
    ["src/lib/matters-client.ts", ["/api/matters", "GET", "POST", "PATCH"]],
    ["src/lib/hearings-client.ts", ["/api/hearings", "GET", "POST", "PATCH"]],
    ["src/lib/tasks-client.ts", ["/api/tasks", "GET", "POST", "PATCH"]],
    ["src/lib/finance-client.ts", ["/api/finance", "GET", "POST"]],
    ["src/lib/documents-client.ts", ["/api/documents", "GET", "POST"]],
    ["src/lib/team-client.ts", ["/api/team", "GET"]],
    ["src/lib/administration-client.ts", ["/api/administration", "GET"]],
  ]);

  for (const [path, , source] of clientModules) {
    for (const token of expected.get(path) ?? []) {
      assert.ok(source.includes(token), path + " must retain " + token);
    }
  }
});
