import { PLATFORM_UUID } from "@/lib/platform-control";

export const CONTROL_DATASETS = ["clients", "matters", "tasks", "hearings", "financial_records", "documents", "legal_drafts"] as const;
export type ControlDataset = typeof CONTROL_DATASETS[number];
export type ControlOffice = { id: string; name: string; slug: string; createdAt: string; status: string; plan: string; expiresAt: string | null; revision: number };
export type OfficeControl = { status: "active" | "suspended"; plan: string; expires_at: string | null; seat_limit: number; storage_limit_mb: number; rajih_enabled: boolean; revision: number };
export type OfficeOverview = { office: { id: string; name: string; slug: string }; control: OfficeControl | null; members: number; clients: number; matters: number; drafts: number; storageBytes: number };
export type ControlMember = { id: string; email: string; name: string | null; role: string; blocked: boolean; protected: boolean };
export type ControlPage<T> = { items: T[]; nextCursor: string | null };
export type ControlAction = "capabilities" | "list" | "overview" | "members" | "configure" | "create" | "member" | "support" | "end_support" | "records" | "export" | "file" | "audit";
const shapes: Record<ControlAction, readonly string[]> = {
  capabilities: [], list: ["limit", "after"], overview: [], members: ["limit", "after"], audit: ["limit", "after"],
  configure: ["revision", "status", "plan", "expiresAt", "seatLimit", "storageLimitMb", "rajihEnabled", "reason"],
  create: ["name", "slug", "ownerEmail", "reason"], member: ["userId", "role", "blocked", "reason"],
  support: ["reason"], end_support: [], records: ["dataset", "limit", "after"], export: ["reason"], file: ["path"],
};
export function parseControlRequest(value: Record<string, unknown>) {
  if (Object.keys(value).some(k => !["action", "officeId", "input"].includes(k)) || typeof value.action !== "string" || !Object.hasOwn(shapes, value.action)) return null;
  const action = value.action as ControlAction;
  const officeId = value.officeId ?? null;
  if (officeId !== null && (typeof officeId !== "string" || !PLATFORM_UUID.test(officeId))) return null;
  if (!["capabilities", "list", "audit", "create"].includes(action) && !officeId) return null;
  const input = value.input ?? {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const args = input as Record<string, unknown>;
  if (Object.keys(args).some(k => !shapes[action].includes(k))) return null;
  if (["configure", "create", "member", "support", "export"].includes(action) && (typeof args.reason !== "string" || args.reason.trim().length < 8 || args.reason.length > 500)) return null;
  if (args.limit !== undefined && (!Number.isInteger(args.limit) || Number(args.limit) < 1 || Number(args.limit) > 50)) return null;
  if (args.after !== undefined && args.after !== null && (typeof args.after !== "string" || !PLATFORM_UUID.test(args.after))) return null;
  if (action === "records" && !CONTROL_DATASETS.includes(args.dataset as ControlDataset)) return null;
  if (action === "configure" && (!Number.isInteger(args.revision) || Number(args.revision) < 0 || !["active", "suspended"].includes(String(args.status)) || typeof args.plan !== "string" || !args.plan.trim() || args.plan.length > 80 || !Number.isInteger(args.seatLimit) || Number(args.seatLimit) < 1 || Number(args.seatLimit) > 10000 || !Number.isInteger(args.storageLimitMb) || Number(args.storageLimitMb) < 1 || Number(args.storageLimitMb) > 1048576 || typeof args.rajihEnabled !== "boolean" || (args.expiresAt !== null && (typeof args.expiresAt !== "string" || !Number.isFinite(Date.parse(args.expiresAt)))))) return null;
  if (action === "member" && (typeof args.userId !== "string" || !PLATFORM_UUID.test(args.userId) || !["owner", "admin", "lawyer", "staff", "trainee", "viewer"].includes(String(args.role)) || typeof args.blocked !== "boolean")) return null;
  if (action === "create" && (typeof args.name !== "string" || args.name.trim().length < 2 || args.name.length > 120 || typeof args.slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(args.slug) || args.slug.length < 2 || args.slug.length > 64 || typeof args.ownerEmail !== "string" || args.ownerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.ownerEmail))) return null;
  if (action === "file" && (typeof args.path !== "string" || args.path.length > 500 || !args.path.startsWith(`${officeId}/`) || args.path.split("/").length !== 3 || args.path.includes(".."))) return null;
  return { action, officeId: officeId as string | null, input: args };
}
