import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { resolveWorkspace } from "@/lib/api/workspace";
import { workspaceErrorResponse } from "@/lib/api/errors";
import { platformJson } from "@/lib/api/platform";
import { PLATFORM_UUID } from "@/lib/platform-control";
import { validDraft } from "@/lib/legal-draft-persistence";

const enabled = () => process.env.AXIA_CONTROL_CENTER_ENABLED === "1" && !!getSupabasePublicConfig();
export async function GET(request: Request) {
  if (!enabled()) return platformJson({ enabled: false }, 503);
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);
  const auth = await workspace.supabase.auth.getUser();
  if (auth.error || auth.data.user?.id !== workspace.userId) return platformJson({ error: "انتهت الجلسة." }, 401);
  const params = new URL(request.url).searchParams;
  if ([...params.keys()].some(k => !["history", "before"].includes(k) || params.getAll(k).length !== 1)) return platformJson({ error: "طلب غير صالح." }, 400);
  const historyId = params.get("history");
  if (historyId) {
    const before = params.get("before");
    if (!PLATFORM_UUID.test(historyId) || (before !== null && (!/^\d{1,9}$/.test(before) || Number(before) < 1))) return platformJson({ error: "طلب غير صالح." }, 400);
    let query = workspace.supabase.from("legal_draft_versions").select("id,draft_id,revision,payload,actor_id,archived,created_at").eq("organization_id", workspace.organizationId).eq("draft_id", historyId).order("revision", { ascending: false }).limit(51);
    if (before) query = query.lt("revision", Number(before));
    const history = await query;
    if (history.error) return platformJson({ error: "تعذر تحميل سجل الحفظ." }, 503);
    const rows = history.data ?? [];
    return platformJson({ draftId: historyId, versions: rows.slice(0, 50), nextBefore: rows.length > 50 ? rows[49].revision : null });
  }
  if (params.size) return platformJson({ error: "طلب غير صالح." }, 400);
  const { data, error } = await workspace.supabase.from("legal_drafts").select("id,payload,revision,archived,updated_at,created_at,legacy_id").eq("organization_id", workspace.organizationId).eq("archived", false).order("updated_at", { ascending: false }).limit(101);
  if (error) return platformJson({ error: "الحفظ الدائم غير متاح؛ لا تعِد تحميل المسودات قبل مراجعة الإدارة." }, 503);
  if ((data?.length ?? 0) > 100) return platformJson({ error: "عدد المسودات يتطلب عرضًا مقسمًا؛ لم يتم تحميل قائمة ناقصة." }, 413);
  if (data?.some((row: { payload: unknown }) => !validDraft(row.payload))) return platformJson({ error: "توجد مسودة تحتاج مراجعة تنسيقها. لم يتم تحميل قائمة ناقصة أو استبدال أي بيانات." }, 503);
  return platformJson({ enabled: true, organizationId: workspace.organizationId, userId: workspace.userId, userLabel: workspace.userLabel, drafts: data, canWrite: workspace.role !== "viewer" });
}
export async function POST(request: Request) {
  if (!enabled()) return platformJson({ error: "الحفظ الدائم غير مفعّل." }, 503);
  if (request.headers.get("origin") !== new URL(request.url).origin) return platformJson({ error: "طلب غير مسموح." }, 403);
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > 1100000)) return platformJson({ error: "المسودة أكبر من الحد المدعوم." }, 413);
  if (!request.headers.get("content-type")?.startsWith("application/json") || !request.body) return platformJson({ error: "طلب غير صالح." }, 400);
  const reader = request.body.getReader(); let bytes = 0; const chunks: Uint8Array[] = [];
  try { while (true) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength; if (bytes > 1100000) { await reader.cancel(); return platformJson({ error: "المسودة أكبر من الحد المدعوم." }, 413); } chunks.push(part.value); } } finally { reader.releaseLock(); }
  let body;
  try { body = JSON.parse(await new Blob(chunks as BlobPart[]).text()); } catch { return platformJson({ error: "طلب غير صالح." }, 400); }
  if (!body || typeof body !== "object" || Object.keys(body).some(k => !["officeId", "id", "revision", "draft", "archived", "legacyId"].includes(k)) || typeof body.id !== "string" || !PLATFORM_UUID.test(body.id) || !Number.isInteger(body.revision) || body.revision < 0 || !validDraft(body.draft) || body.draft.id !== body.id || (body.archived !== undefined && typeof body.archived !== "boolean") || (body.legacyId != null && (typeof body.legacyId !== "string" || body.legacyId.length > 120 || !body.legacyId.length))) return platformJson({ error: "بيانات المسودة غير صالحة." }, 400);
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);
  if (body.officeId !== workspace.organizationId) return platformJson({ error: "مساحة العمل اتغيرت؛ راجع المسودة قبل حفظها." }, 409);
  const auth = await workspace.supabase.auth.getUser();
  if (auth.error || auth.data.user?.id !== workspace.userId) return platformJson({ error: "انتهت الجلسة." }, 401);
  const { data, error } = await workspace.supabase.rpc("axia_draft_save", { p_office: workspace.organizationId, p_id: body.id, p_revision: body.revision, p_payload: body.draft, p_archived: body.archived ?? false, p_legacy_id: body.legacyId ?? null });
  if (error) return platformJson({ error: ["40001", "23505"].includes(error.code) ? "تعارض حفظ أو مسودة مستوردة بالفعل. تم الاحتفاظ بتعديلاتك محليًا؛ لا تعِد المحاولة قبل مراجعة نسخة المكتب." : "لم يتم تأكيد الحفظ في المكتب. احتفظ بالمسودة وراجع الصلاحية والاتصال.", code: "DRAFT_SAVE_FAILED" }, ["40001", "23505"].includes(error.code) ? 409 : 403);
  return platformJson({ draft: data });
}
