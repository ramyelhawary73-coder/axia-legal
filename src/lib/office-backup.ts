// Browser + isolated Node verifier. No credentials, network, environment or persistent storage.
export const OFFICE_TABLES = ["organizations", "organization_members", "profiles", "clients", "matters", "matter_members", "tasks", "hearings", "financial_records", "documents", "matter_parties", "client_powers_of_attorney", "audit_logs", "staff_invitations", "rajih_action_requests", "legal_drafts", "legal_draft_versions"] as const;
export type OfficeTable = typeof OFFICE_TABLES[number];
export type BackupRow = Record<string, unknown>;
export type OfficeSnapshot = { format: "axia-office-snapshot"; version: 1; organizationId: string; capturedAt: string; tables: Record<OfficeTable, BackupRow[]>; storage: { path: string; size: string; expectedHash: string | null }[]; files?: { path: string; size: number; sha256: string; base64: string }[] };
export const MAX_BACKUP_BYTES = 64 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const roles = new Set(["owner", "admin", "lawyer", "staff", "trainee", "viewer"]);
function invalid(): never { throw new Error("النسخة غير مكتملة أو غير صالحة أو تحتوي على علاقات تخص مكتبًا آخر."); }
const idSet = (rows: BackupRow[], key = "id") => new Set(rows.map(row => String(row[key])));
export function validateOfficeSnapshot(value: unknown): asserts value is OfficeSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  const s = value as OfficeSnapshot;
  if (s.format !== "axia-office-snapshot" || s.version !== 1 || !uuid.test(s.organizationId) || !Number.isFinite(Date.parse(s.capturedAt)) || !s.tables || !Array.isArray(s.storage) || s.storage.length > 200 || Object.keys(s.tables).length !== OFFICE_TABLES.length || Object.keys(s.tables).some(t => !OFFICE_TABLES.includes(t as OfficeTable))) invalid();
  let rows = 0;
  for (const table of OFFICE_TABLES) {
    if (!Array.isArray(s.tables[table])) invalid();
    rows += s.tables[table].length;
    const seen = new Set<string>();
    for (const row of s.tables[table]) {
      if (!row || typeof row !== "object" || Array.isArray(row)) invalid();
      if (!["profiles", "organizations", "matter_members"].includes(table) && row.organization_id !== s.organizationId) invalid();
      const key = table === "organization_members" ? String(row.user_id) : table === "matter_members" ? `${row.matter_id}:${row.user_id}` : String(row.id);
      if (seen.has(key)) invalid(); seen.add(key);
      if ("id" in row && (typeof row.id !== "string" || !uuid.test(row.id))) invalid();
      if (table === "staff_invitations" && "token_hash" in row) invalid();
    }
  }
  if (rows > 10000 || s.tables.organizations.length !== 1 || s.tables.organizations[0].id !== s.organizationId) invalid();
  const clients = idSet(s.tables.clients), matters = idSet(s.tables.matters), docs = idSet(s.tables.documents), drafts = idSet(s.tables.legal_drafts), members = idSet(s.tables.organization_members, "user_id");
  for (const row of s.tables.organization_members) if (!uuid.test(String(row.user_id)) || !roles.has(String(row.role))) invalid();
  for (const row of s.tables.profiles) if (!members.has(String(row.id))) invalid();
  for (const row of s.tables.matters) if (!clients.has(String(row.client_id))) invalid();
  for (const row of s.tables.matter_members) if (!matters.has(String(row.matter_id)) || !uuid.test(String(row.user_id))) invalid();
  for (const table of ["tasks", "hearings", "financial_records", "documents", "matter_parties", "legal_drafts"] as const)
    for (const row of s.tables[table]) {
      if (row.matter_id != null && !matters.has(String(row.matter_id))) invalid();
      if (row.client_id != null && !clients.has(String(row.client_id))) invalid();
    }
  for (const row of s.tables.client_powers_of_attorney) if (!clients.has(String(row.client_id)) || (row.document_id != null && !docs.has(String(row.document_id)))) invalid();
  for (const row of s.tables.legal_draft_versions) if (!drafts.has(String(row.draft_id))) invalid();
  let size = 0; const paths = new Set<string>();
  for (const file of s.storage) {
    if (!file || typeof file.path !== "string" || !file.path.startsWith(s.organizationId + "/") || file.path.split("/").length !== 3 || file.path.includes("..") || paths.has(file.path) || !/^[0-9]{1,12}$/.test(file.size)) invalid();
    const folder = file.path.split("/")[1]; if (folder !== "general" && !matters.has(folder)) invalid();
    if (file.expectedHash !== null && !/^[a-f0-9]{64}$/.test(file.expectedHash)) invalid();
    paths.add(file.path); size += Number(file.size);
  }
  if (size > MAX_BACKUP_BYTES) throw new Error("حجم الملفات أكبر من 64 MB؛ يلزم تصدير مجزأ. لم يتم إنشاء نسخة ناقصة.");
  for (const d of s.tables.documents) {
    if (typeof d.storage_path !== "string" || !paths.has(d.storage_path) || d.storage_path.split("/")[1] !== (d.matter_id ?? "general")) invalid();
    const file = s.storage.find(f => f.path === d.storage_path);
    if (!file || file.expectedHash !== d.content_hash) invalid();
  }
}
function bytes64(bytes: Uint8Array) {
  let value = ""; for (let i = 0; i < bytes.length; i += 16384) value += String.fromCharCode(...bytes.subarray(i, i + 16384)); return btoa(value);
}
function from64(value: string) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4) invalid();
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
export async function sha256(bytes: Uint8Array) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource))).map(b => b.toString(16).padStart(2, "0")).join(""); }
export async function completeOfficeSnapshot(snapshot: OfficeSnapshot, download: (path: string) => Promise<Uint8Array>, progress?: (done: number, total: number) => void) {
  validateOfficeSnapshot(snapshot);
  const files: NonNullable<OfficeSnapshot["files"]> = [];
  for (const item of snapshot.storage) {
    const bytes = await download(item.path);
    if (bytes.byteLength !== Number(item.size)) invalid();
    const hash = await sha256(bytes);
    if (item.expectedHash && hash !== item.expectedHash) invalid();
    files.push({ path: item.path, size: bytes.byteLength, sha256: hash, base64: bytes64(bytes) });
    bytes.fill(0); progress?.(files.length, snapshot.storage.length);
  }
  return { ...snapshot, files };
}
export async function verifyOfficeSnapshot(snapshot: OfficeSnapshot) {
  validateOfficeSnapshot(snapshot);
  if (!Array.isArray(snapshot.files) || snapshot.files.length !== snapshot.storage.length) invalid();
  const seen = new Set<string>();
  for (const file of snapshot.files) {
    const expected = snapshot.storage.find(f => f.path === file.path);
    if (!expected || seen.has(file.path)) invalid(); seen.add(file.path);
    const bytes = from64(file.base64);
    if (bytes.length !== Number(expected.size) || bytes.length !== file.size || await sha256(bytes) !== file.sha256 || (expected.expectedHash && expected.expectedHash !== file.sha256)) invalid();
    bytes.fill(0);
  }
  return { officeId: snapshot.organizationId, capturedAt: snapshot.capturedAt, rows: Object.values(snapshot.tables).reduce((n, rows) => n + rows.length, 0), files: snapshot.files.length };
}
async function backupKey(password: string, salt: Uint8Array) {
  if (typeof password !== "string" || password.length < 12 || password.length > 512) throw new Error("استخدم عبارة حماية من 12 حرفًا على الأقل واحتفظ بها بشكل آمن.");
  const bytes = new TextEncoder().encode(password);
  const material = await crypto.subtle.importKey("raw", bytes, "PBKDF2", false, ["deriveKey"]); bytes.fill(0);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: 600000 }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function encryptOfficeSnapshot(snapshot: OfficeSnapshot, password: string) {
  await verifyOfficeSnapshot(snapshot);
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  if (bytes.length > 92 * 1024 * 1024) throw new Error("النسخة أكبر من الحد المدعوم.");
  try {
    const key = await backupKey(password, salt);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode("axia-office-backup:v1") }, key, bytes);
    return JSON.stringify({ format: "axia-encrypted-office", version: 1, kdf: "PBKDF2-SHA256-600000", cipher: "AES-256-GCM", salt: bytes64(salt), iv: bytes64(iv), ciphertext: bytes64(new Uint8Array(encrypted)) });
  } finally { bytes.fill(0); }
}
export async function decryptOfficeSnapshot(encrypted: string, password: string): Promise<OfficeSnapshot> {
  if (encrypted.length > 125 * 1024 * 1024) throw new Error("الملف أكبر من الحد المدعوم.");
  const value = JSON.parse(encrypted);
  if (value.format !== "axia-encrypted-office" || value.version !== 1 || value.kdf !== "PBKDF2-SHA256-600000" || value.cipher !== "AES-256-GCM") invalid();
  const salt = from64(value.salt), iv = from64(value.iv);
  if (salt.length !== 16 || iv.length !== 12) invalid();
  const key = await backupKey(password, salt);
  let bytes;
  try { bytes = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode("axia-office-backup:v1") }, key, from64(value.ciphertext) as BufferSource)); }
  catch { throw new Error("عبارة الحماية غير صحيحة أو الملف اتغير. لم تتم استعادة أي بيانات."); }
  try { const snapshot = JSON.parse(new TextDecoder().decode(bytes)); await verifyOfficeSnapshot(snapshot); return snapshot; }
  finally { bytes.fill(0); }
}
