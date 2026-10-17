import { NextResponse } from "next/server";
import type { WorkspaceContext } from "@/lib/api/workspace";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export const staffJson = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export function isSameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
export async function hasStaffFoundation(
  workspace: Extract<WorkspaceContext, { ok: true }>,
) {
  if (!getSupabasePublicConfig()) return false;
  const { data, error } = await workspace.supabase.rpc(
    "axia_staff_capabilities",
    {
      p_organization_id: workspace.organizationId,
    },
  );
  return !error && data?.version === 1;
}
export function staffRpcError(
  error: { code?: string; message?: string } | null,
) {
  if (error?.message === "STAFF_RATE_LIMIT")
    return staffJson(
      {
        error: "تم بلوغ حد الطلبات. انتظر ثم أعد المحاولة.",
        code: "RATE_LIMIT",
      },
      429,
    );
  if (error?.code === "23505")
    return staffJson(
      {
        error: "هذا البريد عضو بالفعل أو له دعوة معلقة. راجع قائمة الدعوات.",
        code: "CONFLICT",
      },
      409,
    );
  if (error?.message === "STAFF_WORKSPACE_CONFLICT")
    return staffJson(
      {
        error: "هذا الحساب مرتبط بمكتب آخر. يلزم مراجعة الإدارة قبل الانضمام.",
        code: "WORKSPACE_CONFLICT",
      },
      409,
    );
  if (error?.message === "STAFF_VERIFIED_EMAIL_REQUIRED")
    return staffJson(
      { error: "أكد بريد الحساب الإلكتروني أولًا.", code: "EMAIL_UNCONFIRMED" },
      403,
    );
  if (error?.code === "PGRST202" || error?.code === "42883")
    return staffJson(
      {
        error: "دعوات الموظفين غير مفعلة في هذه البيئة بعد.",
        code: "FEATURE_UNAVAILABLE",
      },
      503,
    );
  return staffJson(
    {
      error: "تعذر تنفيذ الطلب. تحقق من صلاحيتك والبريد وحالة الدعوة.",
      code: "INVITATION_UNAVAILABLE",
    },
    403,
  );
}
