import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  userId: string,
  assigneeLabel: string,
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
      row.assigned_to === userId
        ? assigneeLabel
        : row.assigned_to
          ? "عضو فريق العمل"
          : "غير مسندة",
    deadline: row.deadline,
    priority: priorityFromDb[row.priority],
    status: statusFromDb[row.status],
  };
}

type WorkspaceError =
  | "SESSION_EXPIRED"
  | "WORKSPACE_UNAVAILABLE"
  | "WORKSPACE_MISSING"
  | "WORKSPACE_AMBIGUOUS";

type WorkspaceContextResult =
  | { ok: false; error: WorkspaceError }
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      userId: string;
      organizationId: string;
      assigneeLabel: string;
    };

async function getWorkspaceContext(): Promise<WorkspaceContextResult> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return { ok: false, error: "SESSION_EXPIRED" };
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(2);

  if (membershipError) {
    return { ok: false, error: "WORKSPACE_UNAVAILABLE" };
  }

  if (!memberships?.length) {
    return { ok: false, error: "WORKSPACE_MISSING" };
  }

  if (memberships.length > 1) {
    return { ok: false, error: "WORKSPACE_AMBIGUOUS" };
  }

  const organizationId = String(memberships[0].organization_id);
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  return {
    ok: true,
    supabase,
    userId,
    organizationId,
    assigneeLabel: profile?.full_name?.trim() || "المستخدم الحالي",
  };
}

function workspaceErrorResponse(code: string) {
  const messages: Record<string, string> = {
    SESSION_EXPIRED: "انتهت جلسة الدخول. سجّل الدخول مرة أخرى.",
    WORKSPACE_UNAVAILABLE: "تعذر تحديد مساحة العمل الحالية.",
    WORKSPACE_MISSING: "لا توجد مؤسسة مرتبطة بهذا الحساب.",
    WORKSPACE_AMBIGUOUS: "الحساب مرتبط بأكثر من مؤسسة. يلزم تحديد مساحة العمل قبل إدارة المهام.",
  };

  return NextResponse.json(
    { error: messages[code] ?? "تعذر تحميل مساحة العمل." },
    { status: code === "SESSION_EXPIRED" ? 401 : 409 },
  );
}

async function loadMatterOptions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("matters")
    .select("id,case_number,title,court")
    .eq("organization_id", organizationId)
    .order("case_number", { ascending: true });

  if (error) throw new Error("MATTERS_QUERY_FAILED");

  return (data ?? []).map((matter) => ({
    id: String(matter.id),
    caseNumber: String(matter.case_number),
    title: String(matter.title),
    court: matter.court ? String(matter.court) : undefined,
  })) satisfies MatterOption[];
}

export async function GET() {
  const workspace = await getWorkspaceContext();
  if (!workspace.ok) return workspaceErrorResponse(workspace.error);

  try {
    const matters = await loadMatterOptions(workspace.supabase, workspace.organizationId);
    const { data, error } = await workspace.supabase
      .from("tasks")
      .select(
        "id,organization_id,matter_id,title,category,court_or_office,assigned_to,deadline,priority,status",
      )
      .eq("organization_id", workspace.organizationId)
      .order("deadline", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "تعذر تحميل المهام." }, { status: 502 });
    }

    const tasks = ((data ?? []) as TaskRow[]).map((row) =>
      mapTaskRow(row, matters, workspace.userId, workspace.assigneeLabel),
    );

    return NextResponse.json({
      organizationId: workspace.organizationId,
      userId: workspace.userId,
      assigneeLabel: workspace.assigneeLabel,
      matters,
      tasks,
    });
  } catch {
    return NextResponse.json({ error: "تعذر تحميل بيانات المهام." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const workspace = await getWorkspaceContext();
  if (!workspace.ok) return workspaceErrorResponse(workspace.error);

  const body = (await request.json().catch(() => null)) as { task?: Partial<LegalTask> } | null;
  const task = body?.task;

  if (
    !task?.title?.trim() ||
    !task.category ||
    !task.deadline ||
    !task.priority ||
    !task.status
  ) {
    return NextResponse.json({ error: "بيانات المهمة غير مكتملة." }, { status: 400 });
  }

  if (!(task.priority in priorityToDb) || !(task.status in statusToDb)) {
    return NextResponse.json({ error: "قيمة حالة أو أولوية المهمة غير صالحة." }, { status: 400 });
  }

  let matchedMatter: MatterOption | undefined;
  try {
    const matters = await loadMatterOptions(workspace.supabase, workspace.organizationId);
    matchedMatter = task.matterId
      ? matters.find((matter) => matter.id === task.matterId)
      : undefined;

    if (task.matterId && !matchedMatter) {
      return NextResponse.json({ error: "القضية المختارة غير متاحة لهذا الحساب." }, { status: 403 });
    }

    const { data, error } = await workspace.supabase
      .from("tasks")
      .insert({
        organization_id: workspace.organizationId,
        matter_id: matchedMatter?.id ?? null,
        title: task.title.trim(),
        category: task.category,
        court_or_office: task.courtOrBailiffOffice?.trim() || matchedMatter?.court || null,
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
      return NextResponse.json({ error: "تعذر حفظ المهمة." }, { status: 403 });
    }

    return NextResponse.json({
      task: mapTaskRow(
        data as TaskRow,
        matters,
        workspace.userId,
        workspace.assigneeLabel,
      ),
    });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ المهمة." }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  const workspace = await getWorkspaceContext();
  if (!workspace.ok) return workspaceErrorResponse(workspace.error);

  const body = (await request.json().catch(() => null)) as {
    taskIds?: string[];
    status?: LegalTask["status"];
  } | null;

  const taskIds = [...new Set((body?.taskIds ?? []).filter(Boolean))];
  const status = body?.status;

  if (!taskIds.length || !status || !(status in statusToDb)) {
    return NextResponse.json({ error: "طلب تحديث المهمة غير صالح." }, { status: 400 });
  }

  const { data, error } = await workspace.supabase
    .from("tasks")
    .update({ status: statusToDb[status] })
    .eq("organization_id", workspace.organizationId)
    .in("id", taskIds)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "تعذر تحديث حالة المهمة." }, { status: 403 });
  }

  if ((data ?? []).length !== taskIds.length) {
    return NextResponse.json(
      { error: "لم يتم تحديث كل المهام المطلوبة بسبب قيود الوصول." },
      { status: 403 },
    );
  }

  return NextResponse.json({ updatedIds: (data ?? []).map((row) => String(row.id)) });
}
