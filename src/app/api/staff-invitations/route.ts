import { resolveWorkspace } from "@/lib/api/workspace";
import { workspaceErrorResponse } from "@/lib/api/errors";
import { isUuid, readJsonObject } from "@/lib/api/validation";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { canInviteRole, normalizeStaffEmail } from "@/lib/staff-invitations";
import {
  hasStaffFoundation,
  isSameOrigin,
  staffJson,
  staffRpcError,
} from "@/lib/api/staff-foundation";

export async function GET(request: Request) {
  if (!getSupabasePublicConfig())
    return staffJson({
      enabled: false,
      canManage: false,
      canInviteAdmin: false,
      invitations: [],
    });
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);
  const enabled = await hasStaffFoundation(workspace);
  const canManage =
    enabled && (workspace.role === "owner" || workspace.role === "admin");
  if (!canManage)
    return staffJson({
      enabled,
      canManage: false,
      canInviteAdmin: false,
      invitations: [],
    });
  const { data, error } = await workspace.supabase
    .from("staff_invitations")
    .select("id,email_normalized,role,status,expires_at,created_at")
    .eq("organization_id", workspace.organizationId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return staffRpcError(error);
  return staffJson({
    enabled,
    canManage,
    canInviteAdmin: workspace.role === "owner",
    invitations: data ?? [],
  });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return staffJson(
      { error: "مصدر الطلب غير مسموح.", code: "FORBIDDEN" },
      403,
    );
  if (!getSupabasePublicConfig()) return staffRpcError({ code: "PGRST202" });
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);
  if (workspace.role !== "owner" && workspace.role !== "admin")
    return staffJson(
      { error: "إدارة الدعوات متاحة لإدارة المكتب فقط.", code: "FORBIDDEN" },
      403,
    );
  const body = await readJsonObject(request);
  const action = body?.action;
  const email = normalizeStaffEmail(body?.email);
  if (
    (action === "create" &&
      (!email || !canInviteRole(workspace.role, body?.role))) ||
    ((action === "rotate" || action === "revoke") &&
      !isUuid(body?.invitationId)) ||
    !["create", "rotate", "revoke"].includes(String(action))
  ) {
    return staffJson(
      { error: "بيانات الدعوة أو الدور غير صالحة.", code: "VALIDATION_ERROR" },
      400,
    );
  }
  const { data, error } = await workspace.supabase.rpc("axia_staff_manage", {
    p_organization_id: workspace.organizationId,
    p_action: action,
    p_email: action === "create" ? email : null,
    p_role: action === "create" ? body?.role : null,
    p_invitation_id: action === "create" ? null : body?.invitationId,
  });
  if (error || !data) return staffRpcError(error);
  return staffJson({
    id: data.id,
    expiresAt: data.expiresAt,
    delivery: "not_sent",
    invitationPath: data.token
      ? `/invitations/accept#token=${data.token}`
      : null,
  });
}
