import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Matter } from "@/types/legal";

type ClientOption = {
  id: string;
  name: string;
};

type MatterRow = {
  id: string;
  organization_id: string;
  client_id: string;
  case_number: string;
  title: string;
  court: string | null;
  category: string | null;
  status: string;
  created_at: string;
};

type WorkspaceResult =
  | { ok: false; error: string }
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      organizationId: string;
    };

async function getWorkspace(): Promise<WorkspaceResult> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return { ok: false, error: "انتهت جلسة الدخول. سجّل الدخول مرة أخرى." };
  }

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(2);

  if (error) return { ok: false, error: "تعذر تحديد مساحة العمل." };
  if (!memberships?.length) return { ok: false, error: "لا توجد مؤسسة مرتبطة بالحساب." };
  if (memberships.length > 1) {
    return { ok: false, error: "الحساب مرتبط بأكثر من مؤسسة. يلزم تحديد مساحة العمل أولاً." };
  }

  return {
    ok: true,
    supabase,
    organizationId: String(memberships[0].organization_id),
  };
}

function mapMatter(row: MatterRow, clients: ClientOption[]): Matter {
  const client = clients.find((item) => item.id === row.client_id);

  return {
    id: row.id,
    caseNumber: row.case_number,
    year: new Date(row.created_at).getFullYear(),
    court: (row.court || "غير مسجل") as Matter["court"],
    category: (row.category || undefined) as Matter["category"],
    circuit: "غير مسجل",
    title: row.title,
    clientName: client?.name || "غير مسجل",
    clientId: row.client_id,
    clientRole: "غير مسجل",
    opponentName: "غير مسجل",
    assignedLawyer: "غير مسجل",
    nextHearingDate: "غير مسجل",
    nextHearingGoal: "غير مسجل",
    stage: row.status === "open" ? "متداولة" : "غير مسجل",
    agreedFees: "غير مسجل",
    paidFees: "غير مسجل",
    status: row.status === "open" ? "مفتوحة" : "مغلقة",
  };
}

async function loadClients(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("clients")
    .select("id,name")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) throw new Error("CLIENTS_QUERY_FAILED");

  return (data ?? []).map((client) => ({
    id: String(client.id),
    name: String(client.name),
  })) satisfies ClientOption[];
}

export async function GET() {
  const workspace = await getWorkspace();
  if (!workspace.ok) {
    return NextResponse.json({ error: workspace.error }, { status: 401 });
  }

  try {
    const [clients, mattersResult] = await Promise.all([
      loadClients(workspace.supabase, workspace.organizationId),
      workspace.supabase
        .from("matters")
        .select("id,organization_id,client_id,case_number,title,court,category,status,created_at")
        .eq("organization_id", workspace.organizationId)
        .order("created_at", { ascending: false }),
    ]);

    if (mattersResult.error) {
      return NextResponse.json({ error: "تعذر تحميل القضايا." }, { status: 502 });
    }

    return NextResponse.json({
      clients,
      matters: ((mattersResult.data ?? []) as MatterRow[]).map((row) =>
        mapMatter(row, clients),
      ),
    });
  } catch {
    return NextResponse.json({ error: "تعذر تحميل القضايا والموكلين." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const workspace = await getWorkspace();
  if (!workspace.ok) {
    return NextResponse.json({ error: workspace.error }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    caseNumber?: string;
    title?: string;
    court?: string;
    category?: string;
    clientId?: string;
  } | null;

  if (
    !body?.caseNumber?.trim() ||
    !body.title?.trim() ||
    !body.clientId?.trim()
  ) {
    return NextResponse.json({ error: "رقم القضية والموضوع والموكل مطلوبة." }, { status: 400 });
  }

  try {
    const clients = await loadClients(workspace.supabase, workspace.organizationId);
    const client = clients.find((item) => item.id === body.clientId);

    if (!client) {
      return NextResponse.json({ error: "الموكل المختار غير متاح في هذه المؤسسة." }, { status: 403 });
    }

    const { data, error } = await workspace.supabase
      .from("matters")
      .insert({
        organization_id: workspace.organizationId,
        client_id: client.id,
        case_number: body.caseNumber.trim(),
        title: body.title.trim(),
        court: body.court?.trim() || null,
        category: body.category?.trim() || null,
        status: "open",
      })
      .select("id,organization_id,client_id,case_number,title,court,category,status,created_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "تعذر قيد القضية. تحقق من الصلاحيات والبيانات." }, { status: 403 });
    }

    return NextResponse.json({
      matter: mapMatter(data as MatterRow, clients),
    });
  } catch {
    return NextResponse.json({ error: "تعذر قيد القضية الآن." }, { status: 502 });
  }
}
