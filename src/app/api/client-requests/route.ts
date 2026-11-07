import { resolveWorkspace } from "@/lib/api/workspace";
import { workspaceErrorResponse } from "@/lib/api/errors";
import { platformJson as json } from "@/lib/api/platform";
import { readPlatformBody } from "@/lib/platform-control";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { CLIENT_REQUEST_FIELDS, isRequestId, isRequestStatus, requestInput, type ClientRequest, type ClientRequestEvent } from "@/lib/client-requests";

type Profile = { id: string; full_name: string | null };
type AuditRow = Omit<ClientRequestEvent, "actor"> & { user_id: string | null };

const PAGE_SIZE = 25;
const editors = ["owner", "admin", "lawyer"];
const invalid = () => json({ error: "بيانات الطلب غير صالحة." }, 400);
const unavailable = () => json({ error: "تعذر تحميل الطلبات أو تأكيد الحفظ. راجع الاتصال ثم حدّث القائمة." }, 503);
const off = () => json({ enabled: false, code: "CLIENT_REQUESTS_DISABLED" }, 503);
const enabled = () => process.env.AXIA_CLIENT_REQUESTS_ENABLED === "1";
const forbidden = () => json({ error: "الإجراء غير متاح لحسابك." }, 403);

async function context(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);
  const fresh = await workspace.supabase.auth.getUser();
  if (fresh.error || fresh.data.user?.id !== workspace.userId || fresh.data.user.is_anonymous) {
    return json({ error: "انتهت الجلسة. سجّل الدخول مرة أخرى." }, 401);
  }
  return workspace;
}

export async function GET(request: Request) {
  if (!enabled()) return off();
  if (!getSupabasePublicConfig()) return unavailable();
  const params = new URL(request.url).searchParams;
  const history = params.get("history");
  const page = params.get("page") ?? "0";
  const archived = params.get("archived") ?? "0";
  const status = params.get("status");
  if ([...params.keys()].some(key => !["history", "page", "archived", "status"].includes(key) || params.getAll(key).length !== 1)
    || !/^\d{1,4}$/.test(page) || Number(page) > 400 || !["0", "1"].includes(archived)
    || (status !== null && !isRequestStatus(status))
    || (history !== null && (!isRequestId(history) || params.has("archived") || params.has("status")))) return invalid();
  const workspace = await context(request);
  if (workspace instanceof Response) return workspace;
  const { supabase, organizationId, role } = workspace;
  const canWrite = editors.includes(role);
  const offset = Number(page) * PAGE_SIZE;
  if (history !== null) {
    const requestRow = await supabase.from("client_requests").select("id").eq("organization_id", organizationId).eq("id", history).maybeSingle();
    if (requestRow.error) return unavailable();
    if (!requestRow.data) return json({ error: "الطلب غير متاح." }, 404);
    const { data, error } = await supabase.from("audit_logs").select("id,action,created_at,user_id,metadata")
      .eq("organization_id", organizationId).eq("resource_type", "client_request").eq("resource_id", history)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + PAGE_SIZE);
    if (error) return unavailable();
    const rows = (data ?? []) as AuditRow[];
    const actors = [...new Set(rows.flatMap(row => typeof row.user_id === "string" ? [row.user_id] : []))];
    const names = actors.length ? await supabase.from("profiles").select("id,full_name").in("id", actors) : { data: [], error: null };
    if (names.error) return unavailable();
    const labels = new Map(((names.data ?? []) as Profile[]).map(row => [row.id, row.full_name]));
    return json({ events: rows.slice(0, PAGE_SIZE).map(({ user_id, ...row }) => ({
      ...row, actor: user_id ? labels.get(user_id) ?? "عضو بالمكتب" : null,
    })), hasMore: rows.length > PAGE_SIZE && Number(page) < 400 });
  }
  let query = supabase.from("client_requests").select(CLIENT_REQUEST_FIELDS).eq("organization_id", organizationId).eq("archived", archived === "1");
  if (status) query = query.eq("status", status);
  const [list, members] = await Promise.all([
    query.order("updated_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + PAGE_SIZE),
    canWrite ? supabase.from("organization_members").select("user_id").eq("organization_id", organizationId).in("role", [...editors, "staff"]).order("user_id").limit(500)
      : { data: [], error: null },
  ]);
  if (list.error || members.error) return unavailable();
  const rows = (list.data ?? []) as ClientRequest[];
  const memberIds = ((members.data ?? []) as { user_id: string }[]).map(row => row.user_id);
  const profiles = memberIds.length ? await supabase.from("profiles").select("id,full_name").in("id", memberIds) : { data: [], error: null };
  if (profiles.error) return unavailable();
  const labels = new Map(((profiles.data ?? []) as Profile[]).map(row => [row.id, row.full_name]));
  return json({
    enabled: true, officeId: organizationId, canWrite,
    rows: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE && Number(page) < 400,
    assignees: memberIds.map(id => ({ id, name: labels.get(id) || "عضو بالمكتب" })),
  });
}

export async function POST(request: Request) {
  if (!enabled()) return off();
  if (!getSupabasePublicConfig()) return unavailable();
  if (request.headers.get("origin") !== new URL(request.url).origin) return forbidden();
  const body = await readPlatformBody(request);
  if (!body || !isRequestId(body.officeId) || typeof body.action !== "string" || !["create", "update", "archive", "restore"].includes(body.action)) return invalid();
  const action = body.action;
  const editing = action === "create" || action === "update";
  const allowed = ["action", "officeId", ...(action === "create" ? [] : ["id", "revision"]), ...(editing ? ["input"] : [])];
  if (Object.keys(body).some(key => !allowed.includes(key))) return invalid();
  const input = editing ? requestInput(body.input) : null;
  if ((editing && !input) || (action !== "create" && (!isRequestId(body.id) || !Number.isInteger(body.revision) || Number(body.revision) < 1 || Number(body.revision) > 2147483647))) return invalid();
  const workspace = await context(request);
  if (workspace instanceof Response) return workspace;
  const { supabase, organizationId, role } = workspace;
  if (!editors.includes(role)) return forbidden();
  if (body.officeId !== organizationId) return json({ error: "مساحة العمل اتغيّرت؛ راجع الطلب قبل الحفظ." }, 409);
  const table = supabase.from("client_requests");
  const result = action === "create"
    ? await table.insert({ ...input, organization_id: organizationId }).select(CLIENT_REQUEST_FIELDS).single()
    : await table.update(input ?? { archived: action === "archive" })
      .eq("organization_id", organizationId).eq("id", body.id).eq("revision", body.revision)
      .eq("archived", action === "restore").select(CLIENT_REQUEST_FIELDS).maybeSingle();
  if (result.error?.code === "42501") return forbidden();
  if (result.error?.code === "23503") return json({ error: "الموكل أو القضية أو العضو لا يطابق المكتب والطلب." }, 400);
  if (result.error?.code === "23514") return invalid();
  if (result.error) return unavailable();
  if (!result.data) return json({ error: "الطلب اتغيّر أو لم يعد متاحًا. حدّث القائمة وراجع النسخة الحالية." }, 409);
  return json({ row: result.data }, action === "create" ? 201 : 200);
}
