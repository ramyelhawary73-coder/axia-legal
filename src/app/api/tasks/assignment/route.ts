import { resolveWorkspace } from "@/lib/api/workspace";
import { apiError, workspaceErrorResponse } from "@/lib/api/errors";
import { isUuid, readJsonObject } from "@/lib/api/validation";
import { canAssignOthers, loadTaskAssignees } from "@/lib/api/task-assignees";
import {
  hasStaffFoundation,
  isSameOrigin,
  staffJson,
} from "@/lib/api/staff-foundation";

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return apiError("FORBIDDEN", "مصدر الطلب غير مسموح.", 403);
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);
  if (!canAssignOthers(workspace.role))
    return apiError("FORBIDDEN", "لا تملك صلاحية إعادة إسناد المهام.", 403);
  if (!(await hasStaffFoundation(workspace)))
    return apiError(
      "QUERY_FAILED",
      "توزيع المهام غير مفعل في هذه البيئة.",
      503,
    );
  const body = await readJsonObject(request);
  if (!isUuid(body?.taskId) || !isUuid(body?.assigneeId))
    return apiError("VALIDATION_ERROR", "بيانات إسناد المهمة غير صالحة.", 400);
  const { data: task, error: taskError } = await workspace.supabase
    .from("tasks")
    .select("id,matter_id")
    .eq("organization_id", workspace.organizationId)
    .eq("id", body.taskId)
    .single();
  if (taskError || !task)
    return apiError("FORBIDDEN", "المهمة غير متاحة.", 403);
  try {
    const options = await loadTaskAssignees(
      workspace,
      task.matter_id ? [task.matter_id] : [],
    );
    const member = options.find((option) => option.id === body.assigneeId);
    if (
      !member ||
      (task.matter_id && !member.matterIds.includes(task.matter_id))
    )
      return apiError(
        "FORBIDDEN",
        "الموظف غير متاح لهذه المهمة أو القضية.",
        403,
      );
    const { data, error } = await workspace.supabase
      .from("tasks")
      .update({ assigned_to: member.id })
      .eq("organization_id", workspace.organizationId)
      .eq("id", task.id)
      .select("id")
      .single();
    if (error || !data)
      return apiError(
        "FORBIDDEN",
        "تعذر حفظ المسؤول. ربما تغيرت عضوية المكتب أو صلاحيات القضية.",
        403,
      );
    return staffJson({
      taskId: task.id,
      assignedToUserId: member.id,
      assignedTo: member.name,
    });
  } catch {
    return apiError("QUERY_FAILED", "تعذر تحميل بيانات المسؤولين.", 502);
  }
}
