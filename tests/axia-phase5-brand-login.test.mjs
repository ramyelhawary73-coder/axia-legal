import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const loginPage = fs.readFileSync("src/app/login/page.tsx", "utf8");
const loginActions = fs.readFileSync("src/app/login/actions.ts", "utf8");
const brandLogo = fs.readFileSync("src/components/axia-brand-logo.tsx", "utf8");
const appIcon = fs.readFileSync("src/app/icon.svg", "utf8");
const appShell = fs.readFileSync("src/components/app-shell.tsx", "utf8");

test("Phase 5 creates reusable AXIA brand logo component and vector app icon", () => {
  assert.match(brandLogo, /export function AxiaBrandLogo/);
  assert.match(brandLogo, /export function AxiaSymbolSvg/);
  assert.match(brandLogo, /mode\?: "mark" \| "lockup" \| "hero"/);
  assert.match(brandLogo, /Egyptian Legal Practice &amp; Intelligence OS/);
  assert.match(appIcon, /<svg/);
  assert.match(appIcon, /axia-icon-gold/);
});

test("Phase 5 login page connects directly to the real Supabase SSR login server action", () => {
  assert.match(loginPage, /import \{ login \} from "@\/app\/login\/actions"/);
  assert.match(loginPage, /<form action=\{login\}/);
  assert.match(loginPage, /name="email"/);
  assert.match(loginPage, /name="password"/);
  assert.match(loginPage, /name="next"/);
  assert.match(loginActions, /supabase\.auth\.signInWithPassword/);
  assert.doesNotMatch(loginPage, /router\.push\(['"]\/dashboard['"]\)/);
});

test("Phase 5 login page surfaces authentication error states and preserves next path", () => {
  assert.match(loginPage, /missing_credentials/);
  assert.match(loginPage, /invalid_credentials/);
  assert.match(loginPage, /sanitizeNextPath/);
  assert.match(loginPage, /role="alert"/);
});

test("Phase 5 login page replaces open public self-registration with controlled office license onboarding", () => {
  assert.match(loginPage, /طلب ترخيص مكتب/);
  assert.match(loginPage, /لا يُتاح التسجيل العشوائي العام/);
  assert.match(loginPage, /organization_id/);
});

test("Phase 5 unifies AXIA brand symbol across login and AppShell", () => {
  assert.match(loginPage, /AxiaBrandLogo/);
  assert.match(appShell, /AxiaSymbolSvg/);
});
