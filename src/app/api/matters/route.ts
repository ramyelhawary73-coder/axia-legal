import { NextResponse } from "next/server";
import { apiError, databaseErrorCode, workspaceErrorResponse } from "@/lib/api/errors";
import {
  isCurrencyCode,
  isIsoDate,
  isUuid,
  optionalText,
  readJsonObject,
  requiredText,
} from "@/lib/api/validation";
import { resolveWorkspace } from "@/lib/api/workspace";
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
  status: "open" | "closed" | "archived";
  created_at: string;
  case_year: number | null;
  circuit: string | null;
  stage:
    | "active"
    | "reserved_for_judgment"
    | "documents_pending"
    | "judgment_issued"
    | "appeal"
    | "cassation";
  client_role: string | null;
  filing_date: string | null;
  claim_amount: string | number | null;
  currency: string;
  notes: string | null;
  closed_at: string | null;
};

const stageFromDb: Record<MatterRow["stage"], Matter["stage"]> = {
  active: "متداولة",
  reserved_for_judgment: "حجز للحكم",
  documents_pending: "مؤجلة لتقديم مستندات",
  judgment_issued: "محكوم فيها",
  appeal: "طعن بالاستئناف",
  cassation: "طعن بالنقض",
};

const validClientRoles = new Set<Matter["clientRole"]>([
  "مدعي",
  "مدعى عليه",
  "طاعن",
  "مطعون ضده",
  "مستأنف",
  "مستأنف ضده",
  "غير مسجل",
]);

const matterSelect =
  "id,organization_id,client_id,case_number,title,court,category,status,created_at,case_year,circuit,stage,client_role,filing_date,claim_amount,currency,notes,closed_at";

function mapMatter(row: MatterRow, clients: ClientOption[]): Matter {
  const client = clients.find((item) => item.id === row.client_id);
  const clientRole =
    row.client_role && validClientRoles.has(row.client_role as Matter["clientRole"])
      ? (row.client_role as Matter["clientRole"])
      : "غير مسجل";

  return {
    id: row.id,
    caseNumber: row.case_number,
    year: row.case_year ?? new Date(row.created_at).getFullYear(),
    court: (row.court || "غير مسجل") as Matter["court"],
    category: (row.category || undefined) as Matter["category"],
    circuit: row.circuit || "غير مسجل",
    title: row.title,
    clientName: client?.name || "غير مسجل",
    clientId: row.client_id,
    clientRole,
    opponentName: "غير مسجل",
    assignedLawyer: "غير مسجل",
    nextHearingDate: "غير مسجل",
    nextHearingGoal: "غير مسجل",
    stage: stageFromDb[row.stage] ?? "غير مسجل",
    claimAmount:
      row.claim_amount === null
        ? undefined
        : `${String(row.claim_amount)} ${row.currency}`,
    agreedFees: "غير مسجل",
    paidFees: "غير مسجل",
    notes: row.notes ?? undefined,
    status: row.status === "open" ? "مفتوحة" : "مغلقة",
    filingDate: row.filing_date ?? undefined,
  };
}

async function loadClients(
  supabase: Extract<Awaited<ReturnType<typeof resolveWorkspace>>, { ok: true }>["supabase"],
  organizationId: string,
): Promise<ClientOption[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id,name")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) throw new Error("CLIENTS_QUERY_FAILED");

  return (data ?? []).map((client) => ({
    id: String(client.id),
    name: String(client.name),
  }));
}

export async function GET(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  try {
    const [clients, mattersResult] = await Promise.all([
      loadClients(workspace.supabase, workspace.organizationId),
      workspace.supabase
        .from("matters")
        .select(matterSelect)
        .eq("organization_id", workspace.organizationId)
        .order("created_at", { ascending: false }),
    ]);

    if (mattersResult.error) {
      return apiError("QUERY_FAILED", "تعذر تحميل القضايا.", 502);
    }

    return NextResponse.json({
      clients,
      matters: ((mattersResult.data ?? []) as MatterRow[]).map((row) =>
        mapMatter(row, clients),
      ),
    });
  } catch {
    return apiError("QUERY_FAILED", "تعذر تحميل القضايا والموكلين.", 502);
  }
}

export async function POST(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const body = await readJsonObject(request);
  const caseNumber = requiredText(body?.caseNumber, 200);
  const title = requiredText(body?.title, 500);
  const clientId = body?.clientId;
  const court = optionalText(body?.court, 300);
  const category = optionalText(body?.category, 120);
  const circuit = optionalText(body?.circuit, 200);
  const clientRole = optionalText(body?.clientRole, 120);
  const notes = optionalText(body?.notes, 5_000);
  const filingDate =
    body?.filingDate === undefined || body.filingDate === null || body.filingDate === ""
      ? null
      : isIsoDate(body.filingDate)
        ? body.filingDate
        : undefined;
  const caseYear =
    body?.caseYear === undefined || body.caseYear === null || body.caseYear === ""
      ? null
      : typeof body.caseYear === "number" &&
          Number.isInteger(body.caseYear) &&
          body.caseYear >= 1900 &&
          body.caseYear <= 2200
        ? body.caseYear
        : undefined;
  const currency =
    body?.currency === undefined
      ? "EGP"
      : isCurrencyCode(body.currency)
        ? body.currency
        : null;
  const claimAmount =
    body?.claimAmount === undefined || body.claimAmount === null || body.claimAmount === ""
      ? null
      : typeof body.claimAmount === "number" && body.claimAmount >= 0
        ? body.claimAmount
        : undefined;

  if (
    !caseNumber ||
    !title ||
    !isUuid(clientId) ||
    court === undefined ||
    category === undefined ||
    circuit === undefined ||
    clientRole === undefined ||
    notes === undefined ||
    filingDate === undefined ||
    caseYear === undefined ||
    !currency ||
    claimAmount === undefined
  ) {
    return apiError("VALIDATION_ERROR", "بيانات القضية غير صالحة أو غير مكتملة.", 400);
  }

  try {
    const clients = await loadClients(workspace.supabase, workspace.organizationId);
    const client = clients.find((item) => item.id === clientId);

    if (!client) {
      return apiError(
        "FORBIDDEN",
        "الموكل المختار غير متاح في مساحة العمل الحالية.",
        403,
      );
    }

    const { data, error } = await workspace.supabase
      .from("matters")
      .insert({
        organization_id: workspace.organizationId,
        client_id: client.id,
        case_number: caseNumber,
        title,
        court,
        category,
        case_year: caseYear,
        circuit,
        client_role: clientRole,
        filing_date: filingDate,
        claim_amount: claimAmount,
        currency,
        notes,
        status: "open",
        stage: "active",
        created_by: workspace.userId,
      })
      .select(matterSelect)
      .single();

    if (error || !data) {
      const code = databaseErrorCode(error);
      const status = code === "CONFLICT" ? 409 : 403;
      return apiError(
        code,
        code === "CONFLICT"
          ? "رقم القضية مستخدم بالفعل داخل هذه المؤسسة."
          : "تعذر قيد القضية. تحقق من الصلاحيات والبيانات.",
        status,
      );
    }

    return NextResponse.json({
      matter: mapMatter(data as MatterRow, clients),
    });
  } catch {
    return apiError("QUERY_FAILED", "تعذر قيد القضية الآن.", 502);
  }
}

export async function PATCH(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const body = await readJsonObject(request);
  const matterId = body?.id;
  if (!isUuid(matterId)) {
    return apiError("VALIDATION_ERROR", "معرّف القضية غير صالح.", 400);
  }

  const updates: Record<string, string | number | null> = {};

  if (body.caseNumber !== undefined) {
    const value = requiredText(body.caseNumber, 200);
    if (!value) return apiError("VALIDATION_ERROR", "رقم القضية غير صالح.", 400);
    updates.case_number = value;
  }
  if (body.title !== undefined) {
    const value = requiredText(body.title, 500);
    if (!value) return apiError("VALIDATION_ERROR", "موضوع القضية غير صالح.", 400);
    updates.title = value;
  }
  for (const [inputKey, dbKey, max] of [
    ["court", "court", 300],
    ["category", "category", 120],
    ["circuit", "circuit", 200],
    ["clientRole", "client_role", 120],
    ["notes", "notes", 5_000],
  ] as const) {
    if (body[inputKey] !== undefined) {
      const value = optionalText(body[inputKey], max);
      if (value === undefined) {
        return apiError("VALIDATION_ERROR", "بيانات تحديث القضية غير صالحة.", 400);
      }
      updates[dbKey] = value;
    }
  }

  if (body.clientId !== undefined) {
    if (!isUuid(body.clientId)) {
      return apiError("VALIDATION_ERROR", "الموكل المختار غير صالح.", 400);
    }
    const { data: client } = await workspace.supabase
      .from("clients")
      .select("id")
      .eq("organization_id", workspace.organizationId)
      .eq("id", body.clientId)
      .maybeSingle();
    if (!client) {
      return apiError("FORBIDDEN", "الموكل المختار غير متاح.", 403);
    }
    updates.client_id = body.clientId;
  }

  if (body.status !== undefined) {
    if (!["open", "closed", "archived"].includes(String(body.status))) {
      return apiError("VALIDATION_ERROR", "حالة القضية غير صالحة.", 400);
    }
    updates.status = String(body.status);
    updates.closed_at = body.status === "closed" ? new Date().toISOString() : null;
  }

  if (body.stage !== undefined) {
    const stages = [
      "active",
      "reserved_for_judgment",
      "documents_pending",
      "judgment_issued",
      "appeal",
      "cassation",
    ];
    if (!stages.includes(String(body.stage))) {
      return apiError("VALIDATION_ERROR", "مرحلة القضية غير صالحة.", 400);
    }
    updates.stage = String(body.stage);
  }

  if (body.caseYear !== undefined) {
    if (
      body.caseYear !== null &&
      (typeof body.caseYear !== "number" ||
        !Number.isInteger(body.caseYear) ||
        body.caseYear < 1900 ||
        body.caseYear > 2200)
    ) {
      return apiError("VALIDATION_ERROR", "سنة القضية غير صالحة.", 400);
    }
    updates.case_year = body.caseYear as number | null;
  }

  if (body.filingDate !== undefined) {
    if (body.filingDate !== null && !isIsoDate(body.filingDate)) {
      return apiError("VALIDATION_ERROR", "تاريخ القيد غير صالح.", 400);
    }
    updates.filing_date = body.filingDate as string | null;
  }

  if (body.currency !== undefined) {
    if (!isCurrencyCode(body.currency)) {
      return apiError("VALIDATION_ERROR", "رمز العملة غير صالح.", 400);
    }
    updates.currency = body.currency;
  }

  if (body.claimAmount !== undefined) {
    if (
      body.claimAmount !== null &&
      (typeof body.claimAmount !== "number" || body.claimAmount < 0)
    ) {
      return apiError("VALIDATION_ERROR", "قيمة المطالبة غير صالحة.", 400);
    }
    updates.claim_amount = body.claimAmount as number | null;
  }

  if (Object.keys(updates).length === 0) {
    return apiError("VALIDATION_ERROR", "لا توجد بيانات لتحديثها.", 400);
  }

  const { data, error } = await workspace.supabase
    .from("matters")
    .update(updates)
    .eq("organization_id", workspace.organizationId)
    .eq("id", matterId)
    .select(matterSelect)
    .maybeSingle();

  if (error) {
    const code = databaseErrorCode(error);
    return apiError(
      code,
      code === "CONFLICT" ? "رقم القضية مستخدم بالفعل." : "تعذر تحديث القضية.",
      code === "CONFLICT" ? 409 : 403,
    );
  }

  if (!data) {
    return apiError("NOT_FOUND", "القضية غير موجودة أو غير متاحة.", 404);
  }

  const clients = await loadClients(workspace.supabase, workspace.organizationId);
  return NextResponse.json({ matter: mapMatter(data as MatterRow, clients) });
}
