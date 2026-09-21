import { NextResponse } from "next/server";
import { apiError, workspaceErrorResponse } from "@/lib/api/errors";
import { resolveWorkspace, type WorkspaceRole } from "@/lib/api/workspace";

const roleLabels: Record<WorkspaceRole, string> = {
  owner: "مالك المؤسسة",
  admin: "مدير",
  lawyer: "محام",
  staff: "موظف",
  trainee: "متدرب",
  viewer: "قارئ",
};

export async function GET(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const [organizationResult, membersResult] = await Promise.all([
    workspace.supabase
      .from("organizations")
      .select("id,name,slug,created_at")
      .eq("id", workspace.organizationId)
      .maybeSingle(),
    workspace.supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", workspace.organizationId),
  ]);

  if (organizationResult.error || membersResult.error) {
    return apiError("QUERY_FAILED", "تعذر تحميل بيانات الإدارة.", 502);
  }

  if (!organizationResult.data) {
    return apiError("NOT_FOUND", "المؤسسة غير موجودة أو غير متاحة.", 404);
  }

  const roleCounts = {
    owner: 0,
    admin: 0,
    lawyer: 0,
    staff: 0,
    trainee: 0,
    viewer: 0,
  } satisfies Record<WorkspaceRole, number>;

  for (const member of membersResult.data ?? []) {
    const role = member.role as WorkspaceRole;
    if (role in roleCounts) roleCounts[role] += 1;
  }

  return NextResponse.json({
    organization: {
      name: organizationResult.data.name,
      slug: organizationResult.data.slug,
      createdAt: organizationResult.data.created_at,
    },
    currentUser: {
      label: workspace.userLabel,
      role: workspace.role,
      roleLabel: roleLabels[workspace.role],
    },
    membersCount: (membersResult.data ?? []).length,
    roleCounts,
    security: {
      enforcedBy: "Supabase RLS",
      editableFromThisScreen: false,
      invitationFlowEnabled: false,
    },
  });
}
