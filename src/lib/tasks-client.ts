import type { LegalTask } from "@/types/legal";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type TaskMatterOption = {
  id: string;
  caseNumber: string;
  title: string;
  court?: string;
};

export type TaskWorkspace = {
  organizationId: string;
  userId: string;
  assigneeLabel: string;
  matters: TaskMatterOption[];
  tasks: LegalTask[];
};

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
  matters: TaskMatterOption[],
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

async function resolveCurrentWorkspace() {
  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("انتهت جلسة الدخول. سجّل الدخول مرة أخرى.");
  }

  const userId = userData.user.id;
  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (membershipError) {
    throw new Error("تعذر تحديد مساحة العمل الحالية.");
  }

  const organizationId = memberships?.[0]?.organization_id;
  if (!organizationId) {
    throw new Error("لا توجد مؤسسة مرتبطة بهذا الحساب.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  return {
    supabase,
    userId,
    organizationId: String(organizationId),
    assigneeLabel: profile?.full_name?.trim() || "المستخدم الحالي",
  };
}

export async function loadTaskWorkspace(): Promise<TaskWorkspace> {
  const { supabase, userId, organizationId, assigneeLabel } =
    await resolveCurrentWorkspace();

  const [mattersResult, tasksResult] = await Promise.all([
    supabase
      .from("matters")
      .select("id,case_number,title,court")
      .eq("organization_id", organizationId)
      .order("case_number", { ascending: true }),
    supabase
      .from("tasks")
      .select(
        "id,organization_id,matter_id,title,category,court_or_office,assigned_to,deadline,priority,status",
      )
      .eq("organization_id", organizationId)
      .order("deadline", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  if (mattersResult.error) {
    throw new Error("تعذر تحميل القضايا المتاحة للمهام.");
  }

  if (tasksResult.error) {
    throw new Error("تعذر تحميل المهام من قاعدة البيانات.");
  }

  const matters: TaskMatterOption[] = (mattersResult.data ?? []).map((matter) => ({
    id: String(matter.id),
    caseNumber: String(matter.case_number),
    title: String(matter.title),
    court: matter.court ? String(matter.court) : undefined,
  }));

  const tasks = ((tasksResult.data ?? []) as TaskRow[]).map((row) =>
    mapTaskRow(row, matters, userId, assigneeLabel),
  );

  return { organizationId, userId, assigneeLabel, matters, tasks };
}

export async function createPersistentTask(
  task: LegalTask,
  workspace: Pick<TaskWorkspace, "organizationId" | "userId" | "assigneeLabel" | "matters">,
): Promise<LegalTask> {
  const supabase = getSupabaseBrowserClient();

  const matchedMatter =
    task.matterId
      ? workspace.matters.find((matter) => matter.id === task.matterId)
      : task.matterCaseNumber
        ? workspace.matters.find(
            (matter) => matter.caseNumber.trim() === task.matterCaseNumber?.trim(),
          )
        : undefined;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      organization_id: workspace.organizationId,
      matter_id: matchedMatter?.id ?? null,
      title: task.title.trim(),
      category: task.category,
      court_or_office: task.courtOrBailiffOffice.trim() || null,
      assigned_to: task.assignedToUserId ?? workspace.userId,
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
    throw new Error("تعذر حفظ المهمة. تحقق من الصلاحيات والبيانات ثم أعد المحاولة.");
  }

  return mapTaskRow(
    data as TaskRow,
    workspace.matters,
    workspace.userId,
    workspace.assigneeLabel,
  );
}

export async function updatePersistentTaskStatus(
  taskIds: string[],
  status: LegalTask["status"],
): Promise<void> {
  if (taskIds.length === 0) return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: statusToDb[status] })
    .in("id", taskIds);

  if (error) {
    throw new Error("تعذر تحديث حالة المهمة.");
  }
}
