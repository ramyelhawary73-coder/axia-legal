import assert from "node:assert/strict";
import fs from "node:fs/promises";

// A successful Next.js build can contain only /404 when a native Android app/
// shadows src/app/. Verify the actual compiled web entry points before deploy.
const required = [
  "/page",
  "/login/page",
  "/invitations/accept/page",
  "/auth/confirm/route",
  "/api/staff-registration/route",
  "/api/staff-invitations/route",
  "/api/staff-invitations/accept/route",
  "/api/tasks/route",
  "/api/tasks/assignment/route",
  "/api/library/route",
  "/platform/page",
  "/api/platform/context/route",
  "/api/platform/offices/route",
  "/api/platform/audit/route",
  "/api/platform/mfa/route",
];
const manifest = JSON.parse(
  await fs.readFile(".next/server/app-paths-manifest.json", "utf8"),
);
const missing = required.filter((route) => !Object.hasOwn(manifest, route));
assert.equal(
  missing.length,
  0,
  `Web build is missing routes: ${missing.join(", ")}. Keep native Android files outside the root app/ directory.`,
);
console.log(`PASS web build contains all ${required.length} required routes`);
