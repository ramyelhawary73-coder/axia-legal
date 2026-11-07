export const REQUEST_STATUSES = {
  new: "جديد",
  in_progress: "قيد المتابعة",
  waiting: "في انتظار رد",
  closed: "مغلق",
} as const;
export type RequestStatus = keyof typeof REQUEST_STATUSES;
export type ClientRequestInput = {
  title: string;
  summary: string;
  client_id: string;
  matter_id: string | null;
  assigned_to: string | null;
  status: RequestStatus;
  follow_up_on: string | null;
};
export type ClientRequest = ClientRequestInput & {
  id: string;
  archived: boolean;
  revision: number;
  created_at: string;
  updated_at: string;
};
export type ClientRequestEvent = {
  id: string;
  action: string;
  created_at: string;
  actor: string | null;
  metadata: { revision: number; changed_fields: string[] };
};
export type RequestAssignee = { id: string; name: string };
export const CLIENT_REQUEST_FIELDS = "id,client_id,matter_id,assigned_to,title,summary,status,follow_up_on,archived,revision,created_at,updated_at";

export const isRequestStatus = (value: unknown): value is RequestStatus =>
  typeof value === "string" && Object.hasOwn(REQUEST_STATUSES, value);

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isRequestId = (value: unknown): value is string => typeof value === "string" && uuid.test(value);
const optionalId = (value: unknown): value is string | null => value === null || isRequestId(value);
const inputFields = ["title", "summary", "client_id", "matter_id", "assigned_to", "status", "follow_up_on"];

function isFollowUp(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string" || !/^(20\d{2}|2100)-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function requestInput(value: unknown): ClientRequestInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(key => !inputFields.includes(key))) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.title !== "string" || row.title.trim().length < 2 || row.title.length > 140
    || typeof row.summary !== "string" || row.summary.length > 600
    || !isRequestId(row.client_id) || !optionalId(row.matter_id) || !optionalId(row.assigned_to)
    || !isRequestStatus(row.status) || !isFollowUp(row.follow_up_on)) return null;
  return {
    title: row.title.trim(), summary: row.summary.trim(), client_id: row.client_id, matter_id: row.matter_id,
    assigned_to: row.assigned_to, status: row.status, follow_up_on: row.follow_up_on,
  };
}
