import { NextResponse } from "next/server";
import { apiError, workspaceErrorResponse } from "@/lib/api/errors";
import { resolveWorkspace, type WorkspaceRole } from "@/lib/api/workspace";

type MemberRow = {
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type MatterMemberRow = {
  matter_id: string;
  user_id: string;
  access_level: string;
};

type MatterRow = {
  id: string;
  case_number: string;
  title: string;
  court: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  assigned_to: string | null;
  matter_id: string | null;
  deadline: string;
  priority: string;
  status: string;
  court_or_office: string | null;
};

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

  const { data: membersData, error: membersError } = await workspace.supabase
    .from("organization_members")
    .select("user_id,role,created_at")
    .eq("organization_id", workspace.organizationId)
    .order("created_at", { ascending: true });

  if (membersError) {
    return apiError("QUERY_FAILED", "تعذر تحميل أعضاء المؤسسة.", 502);
  }

  const members = (membersData ?? []) as MemberRow[];
  const userIds = members.map((member) => member.user_id);

  const [profilesResult, mattersResult, tasksResult] = await Promise.all([
    userIds.length
      ? workspace.supabase
          .from("profiles")
          .select("id,full_name")
          .in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    workspace.supabase
      .from("matters")
      .select("id,case_number,title,court")
      .eq("organization_id", workspace.organizationId),
    workspace.supabase
      .from("tasks")
      .select(
        "id,title,assigned_to,matter_id,deadline,priority,status,court_or_office",
      )
      .eq("organization_id", workspace.organizationId)
      .order("deadline", { ascending: true }),
  ]);

  if (profilesResult.error || mattersResult.error || tasksResult.error) {
    return apiError("QUERY_FAILED", "تعذر تحميل بيانات فريق العمل.", 502);
  }

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const matters = (mattersResult.data ?? []) as MatterRow[];
  const tasks = (tasksResult.data ?? []) as TaskRow[];
  const matterIds = matters.map((matter) => matter.id);

  const matterMembersResult = matterIds.length
    ? await workspace.supabase
        .from("matter_members")
        .select("matter_id,user_id,access_level")
        .in("matter_id", matterIds)
    : { data: [], error: null };

  if (matterMembersResult.error) {
    return apiError("QUERY_FAILED", "تعذر تحميل تكليفات القضايا.", 502);
  }

  const matterMembers =
    (matterMembersResult.data ?? []) as MatterMemberRow[];

  const profileByUser = new Map(
    profiles.map((profile) => [profile.id, profile.full_name?.trim() || null]),
  );
  const matterById = new Map(matters.map((matter) => [matter.id, matter]));

  return NextResponse.json({
    members: members.map((member) => {
      const assignedMatters = matterMembers
        .filter((assignment) => assignment.user_id === member.user_id)
        .map((assignment) => {
          const matter = matterById.get(assignment.matter_id);
          return matter
            ? {
                id: matter.id,
                caseNumber: matter.case_number,
                title: matter.title,
                court: matter.court || "غير مسجل",
                accessLevel: assignment.access_level,
              }
            : null;
        })
        .filter(Boolean);

      const assignedTasks = tasks
        .filter((task) => task.assigned_to === member.user_id)
        .map((task) => ({
          id: task.id,
          title: task.title,
          matterId: task.matter_id,
          deadline: task.deadline,
          priority: task.priority,
          status: task.status,
          courtOrOffice: task.court_or_office || "غير مسجل",
        }));

      return {
        id: member.user_id,
        name: profileByUser.get(member.user_id) || "غير مسجل",
        role: member.role,
        roleLabel: roleLabels[member.role],
        joinedAt: member.created_at,
        assignedMatters,
        assignedTasks,
      };
    }),
    capabilities: {
      inviteMember: false,
      changeRole: false,
      removeMember: false,
    },
  });
}
