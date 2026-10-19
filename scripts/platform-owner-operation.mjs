import fs from "node:fs/promises";

// Pure rendering only: no network, database URL, credential lookup or CLI executor.
// This module is not imported by the application. Only a separately authorized
// database operator can execute the SQL, which also verifies current_user/claims.
export async function renderPlatformOwnerOperation({ userId, expectedEmail, action }) {
  if (typeof userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) throw new Error("Invalid operator target UUID");
  if (typeof expectedEmail !== "string" || expectedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(expectedEmail) || /[\u0000-\u001f\u007f]/.test(expectedEmail)) throw new Error("Invalid operator identity check");
  if (!["bootstrap", "revoke", "restore"].includes(action)) throw new Error("Invalid operator action");
  const sql = await fs.readFile(new URL("./sql/platform-owner-operation.sql", import.meta.url), "utf8");
  const quoteContent = value => value.replaceAll("\\", "\\\\").replaceAll("'", "''");
  return sql.replaceAll("__AXIA_TARGET_UUID__", quoteContent(userId))
    .replaceAll("__AXIA_EXPECTED_EMAIL__", quoteContent(expectedEmail))
    .replaceAll("__AXIA_OPERATION__", action);
}
