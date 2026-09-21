import { NextResponse } from "next/server";
import { apiError, databaseErrorCode, workspaceErrorResponse } from "@/lib/api/errors";
import { readJsonObject } from "@/lib/api/validation";
import { resolveWorkspace } from "@/lib/api/workspace";
import type { LegalTask } from "@/types/legal";

type TaskRow = {
  id: string;
  organization_id: string;
  matter_id: string | null;
  title: string;
  category: string;
  court_or_office: string | null;
  assigned_to: string | null;
  deadline: string;
  priority: "critical" | "urgent" | "normal";
  status: "pending" | "in_progress" | "completed" | "on_hold";
};

type MatterOption = {
  id: string;
  caseNumber: string;
  title: string;
  court?: string;
};

const priorityToDb: Record<LegalTask["priority"], TaskRow["priority"]> = {
  "حرجة للغاية (ميعاد سقوط)": "critical",
  "عاجلة": "urgent",
  "عادية": "normal",
};

const priorityFromDb: Record<TaskRow["priority"], LegalTask["priority"]> = {
  critical: "حرجة للغاية (ميعاد سقوط)",
  urgent: "عاجلة",
  normal: "عادية",
};

const statusToDb: Record<LegalTask["status"], TaskRow["status"]> = {
  "قيد التنفيذ": "in_progress",
  "مكتملة": "completed",
  "معلقة": "on_hold",
};

const statusFromDb: Record<TaskRow["status"], LegalTask["status"]> = {
  pending: "قيد التنفيذ",
  in_progress: "قيد التنفيذ",
  completed: "مكتملة",
  on_hold: "معلقة",
};

function mapTaskRow(
  row: TaskRow,
  matters: MatterOption[],
  currentUserId: string,
  currentUserLabel: string,
): LegalTask {
  const matter = row.matter_id
    ? matters.find((item) => item.id === row.matter_id)
    : undefined;

  return {
    id: row.id,
    title: row.title,
    category: row.category as LegalTask["category"],
    matterId: row.matter_id ?? undefined,
    matterCaseNumber: matter?.caseNumber,
    courtOrBailiffOffice: row.court_or_office ?? matter?.court ?? "غير محدد",
    assignedToUserId: row.assigned_to ?? undefined,
    assignedTo:
      row.assigned_to === currentUserId
        ? currentUserLabel
        : row.assigned_to
          ? "عضو فريق العمل"
          : "غير مسندة",
    deadline: row.deadline,
    priority: priorityFromDb[row.priority],
    status: statusFromDb[row.status],
  };
}

type ResolvedWorkspace = Extract<
  Awaited<ReturnType<typeof resolveWorkspace>>,
  { ok: true }
>;

async function loadMatterOptions(
  supabase: ResolvedWorkspace["supabase"],
  organizationId: string,
): Promise<MatterOption[]> {
  const { data, error } = await supabase
    .from("matters")
    .select("id,case_number,title,court")
    .eq("organization_id", organizationId)
    .order("case_number", { ascending: true });

  if (error) throw new Error("MATTERS_QUERY_FAILED");

  return (data ?? []).map((matter: {
    id: string;
    case_number: string;
    title: string;
    court: string | null;
  }) => ({
    id: String(matter.id),
    caseNumber: String(matter.case_number),
    title: String(matter.title),
    court: matter.court ? String(matter.court) : undefined,
  }));
}

export async function GET(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  try {
    const matters = await loadMatterOptions(
      workspace.supabase,
      workspace.organizationId,
    );

    const { data, error } = await workspace.supabase
      .from("tasks")
      .select(
        "id,organization_id,matter_id,title,category,court_or_office,assigned_to,deadline,priority,status",
      )
      .eq("organization_id", workspace.organizationId)
      .order("deadline", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return apiError("QUERY_FAILED", "تعذر تحميل المهام.", 502);
    }

    return NextResponse.json({
      organizationId: workspace.organizationId,
      userId: workspace.userId,
      assigneeLabel: workspace.userLabel,
      matters,
      tasks: ((data ?? []) as TaskRow[]).map((row) =>
        mapTaskRow(row, matters, workspace.userId, workspace.userLabel),
      ),
    });
  } catch {
    return apiError("QUERY_FAILED", "تعذر تحميل بيانات المهام.", 502);
  }
}

export async function POST(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const body = await readJsonObject(request);
  const task =
    body?.task && typeof body.task === "object" && !Array.isArray(body.task)
      ? (body.task as Partial<LegalTask>)
      : null;

  if (
    !task?.title?.trim() ||
    !task.category ||
    !task.deadline ||
    !task.priority ||
    !task.status
  ) {
    return apiError("VALIDATION_ERROR", "بيانات المهمة غير مكتملة.", 400);
  }

  if (!(task.priority in priorityToDb) || !(task.status in statusToDb)) {
    return apiError(
      "VALIDATION_ERROR",
      "قيمة حالة أو أولوية المهمة غير صالحة.",
      400,
    );
  }

  try {
    const matters = await loadMatterOptions(
      workspace.supabase,
      workspace.organizationId,
    );
    const matchedMatter = task.matterId
      ? matters.find((matter) => matter.id === task.matterId)
      : undefined;

    if (task.matterId && !matchedMatter) {
      return apiError(
        "FORBIDDEN",
        "القضية المختارة غير متاحة لهذا الحساب.",
        403,
      );
    }

    const { data, error } = await workspace.supabase
      .from("tasks")
      .insert({
        organization_id: workspace.organizationId,
        matter_id: matchedMatter?.id ?? null,
        title: task.title.trim(),
        category: task.category,
        court_or_office:
          task.courtOrBailiffOffice?.trim() || matchedMatter?.court || null,
        assigned_to: workspace.userId,
        deadline: task.deadline,
        priority: priorityToDb[task.priority],
        status: statusToDb[task.status],
        created_by: workspace.userId,
      })
      .select(
        "id,organization_id,matter_id,title,category,court_or_office,assigned_to,deadline,priority,status",
      )
      .single();

    if (error || !data) {
      const code = databaseErrorCode(error);
      const status = code === "CONFLICT" ? 409 : 403;
      return apiError(code, "تعذر حفظ المهمة.", status);
    }

    return NextResponse.json({
      task: mapTaskRow(
        data as TaskRow,
        matters,
        workspace.userId,
        workspace.userLabel,
      ),
    });
  } catch {
    return apiError("QUERY_FAILED", "تعذر حفظ المهمة.", 502);
  }
}

export async function PATCH(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const body = await readJsonObject(request);
  const rawIds = Array.isArray(body?.taskIds) ? body.taskIds : [];
  const taskIds = [
    ...new Set(rawIds.filter((value): value is string => typeof value === "string")),
  ];
  const status =
    typeof body?.status === "string"
      ? (body.status as LegalTask["status"])
      : undefined;

  if (!taskIds.length || !status || !(status in statusToDb)) {
    return apiError("VALIDATION_ERROR", "طلب تحديث المهمة غير صالح.", 400);
  }

  const { data, error } = await workspace.supabase
    .from("tasks")
    .update({ status: statusToDb[status] })
    .eq("organization_id", workspace.organizationId)
    .in("id", taskIds)
    .select("id");

  if (error) {
    return apiError(
      databaseErrorCode(error),
      "تعذر تحديث حالة المهمة.",
      403,
    );
  }

  if ((data ?? []).length !== taskIds.length) {
    return apiError(
      "FORBIDDEN",
      "لم يتم تحديث كل المهام المطلوبة بسبب قيود الوصول.",
      403,
    );
  }

  return NextResponse.json({
    updatedIds: (data ?? []).map((row) => String(row.id)),
  });
}
