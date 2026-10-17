import type { WorkspaceContext, WorkspaceRole } from "@/lib/api/workspace";
import type { TaskAssigneeOption } from "@/lib/tasks-client";
import { hasStaffFoundation } from "@/lib/api/staff-foundation";

export const canAssignOthers = (role: WorkspaceRole) =>
  ["owner", "admin", "lawyer"].includes(role);

export async function loadTaskAssignees(
  workspace: Extract<WorkspaceContext, { ok: true }>,
  matterIds: string[],
): Promise<TaskAssigneeOption[]> {
  const self = { id: workspace.userId, name: workspace.userLabel, matterIds };
  if (
    !canAssignOthers(workspace.role) ||
    !(await hasStaffFoundation(workspace))
  )
    return [self];
  const { data: members, error } = await workspace.supabase
    .from("organization_members")
    .select("user_id,role")
    .eq("organization_id", workspace.organizationId);
  if (error) throw new Error("ASSIGNEES_UNAVAILABLE");
  const rows = (members ?? []) as { user_id: string; role: WorkspaceRole }[];
  const ids = rows
    .filter((row) => row.role !== "viewer")
    .map((row) => row.user_id);
  const { data: profiles, error: profileError } = await workspace.supabase
    .from("profiles")
    .select("id,full_name")
    .in("id", ids);
  if (profileError) throw new Error("ASSIGNEES_UNAVAILABLE");
  const acl = matterIds.length
    ? await workspace.supabase
        .from("matter_members")
        .select("matter_id,user_id")
        .in("matter_id", matterIds)
    : { data: [], error: null };
  if (acl.error) throw new Error("ASSIGNEES_UNAVAILABLE");
  const names = new Map<string, string>(
    ((profiles ?? []) as { id: string; full_name: string | null }[]).map(
      (row) => [row.id, row.full_name?.trim() || "عضو فريق العمل"],
    ),
  );
  return [
    self,
    ...rows
      .filter(
        (row) => row.role !== "viewer" && row.user_id !== workspace.userId,
      )
      .map((row) => ({
        id: row.user_id,
        name: names.get(row.user_id) ?? "عضو فريق العمل",
        matterIds: canAssignOthers(row.role)
          ? matterIds
          : ((acl.data ?? []) as { matter_id: string; user_id: string }[])
              .filter((item) => item.user_id === row.user_id)
              .map((item) => item.matter_id),
      })),
  ];
}
