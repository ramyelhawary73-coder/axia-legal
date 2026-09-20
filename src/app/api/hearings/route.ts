import { NextResponse } from "next/server";
import { apiError, databaseErrorCode, workspaceErrorResponse } from "@/lib/api/errors";
import {
  isIsoDate,
  isUuid,
  optionalText,
  readJsonObject,
} from "@/lib/api/validation";
import { resolveWorkspace } from "@/lib/api/workspace";

type HearingRow = {
  id: string;
  matter_id: string;
  hearing_date: string;
  hearing_time: string | null;
  court: string | null;
  circuit: string | null;
  hall: string | null;
  roll_number: string | null;
  purpose: string | null;
  last_decision: string | null;
  attending_user_id: string | null;
  status: "scheduled" | "completed" | "postponed" | "cancelled";
  pleading_notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

const hearingSelect =
  "id,matter_id,hearing_date,hearing_time,court,circuit,hall,roll_number,purpose,last_decision,attending_user_id,status,pleading_notes,is_archived,created_at,updated_at";

function mapHearing(row: HearingRow) {
  return {
    id: row.id,
    matterId: row.matter_id,
    hearingDate: row.hearing_date,
    hearingTime: row.hearing_time,
    court: row.court,
    circuit: row.circuit,
    hall: row.hall,
    rollNumber: row.roll_number,
    purpose: row.purpose,
    lastDecision: row.last_decision,
    attendingUserId: row.attending_user_id,
    status: row.status,
    pleadingNotes: row.pleading_notes,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function canUseMatter(
  workspace: Extract<Awaited<ReturnType<typeof resolveWorkspace>>, { ok: true }>,
  matterId: string,
) {
  const { data } = await workspace.supabase
    .from("matters")
    .select("id")
    .eq("organization_id", workspace.organizationId)
    .eq("id", matterId)
    .maybeSingle();

  return Boolean(data);
}

export async function GET(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const url = new URL(request.url);
  const matterId = url.searchParams.get("matterId");

  if (matterId && !isUuid(matterId)) {
    return apiError("VALIDATION_ERROR", "معرّف القضية غير صالح.", 400);
  }

  let query = workspace.supabase
    .from("hearings")
    .select(hearingSelect)
    .eq("organization_id", workspace.organizationId)
    .order("hearing_date", { ascending: true })
    .order("hearing_time", { ascending: true });

  if (matterId) query = query.eq("matter_id", matterId);

  const { data, error } = await query;
  if (error) return apiError("QUERY_FAILED", "تعذر تحميل الجلسات.", 502);

  return NextResponse.json({
    hearings: ((data ?? []) as HearingRow[]).map(mapHearing),
  });
}

export async function POST(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const body = await readJsonObject(request);
  if (!body) {
    return apiError("VALIDATION_ERROR", "طلب إنشاء الجلسة غير صالح.", 400);
  }

  const matterId = body.matterId;
  const hearingDate = body?.hearingDate;
  const hearingTime = optionalText(body?.hearingTime, 20);
  const court = optionalText(body?.court, 300);
  const circuit = optionalText(body?.circuit, 200);
  const hall = optionalText(body?.hall, 120);
  const rollNumber = optionalText(body?.rollNumber, 120);
  const purpose = optionalText(body?.purpose, 2_000);
  const lastDecision = optionalText(body?.lastDecision, 5_000);
  const pleadingNotes = optionalText(body?.pleadingNotes, 10_000);
  const attendingUserId =
    body?.attendingUserId === undefined || body.attendingUserId === null || body.attendingUserId === ""
      ? null
      : isUuid(body.attendingUserId)
        ? body.attendingUserId
        : undefined;

  if (
    !isUuid(matterId) ||
    !isIsoDate(hearingDate) ||
    hearingTime === undefined ||
    court === undefined ||
    circuit === undefined ||
    hall === undefined ||
    rollNumber === undefined ||
    purpose === undefined ||
    lastDecision === undefined ||
    pleadingNotes === undefined ||
    attendingUserId === undefined
  ) {
    return apiError("VALIDATION_ERROR", "بيانات الجلسة غير صالحة أو غير مكتملة.", 400);
  }

  if (!(await canUseMatter(workspace, matterId))) {
    return apiError("FORBIDDEN", "القضية غير متاحة لهذا الحساب.", 403);
  }

  const { data, error } = await workspace.supabase
    .from("hearings")
    .insert({
      organization_id: workspace.organizationId,
      matter_id: matterId,
      hearing_date: hearingDate,
      hearing_time: hearingTime,
      court,
      circuit,
      hall,
      roll_number: rollNumber,
      purpose,
      last_decision: lastDecision,
      attending_user_id: attendingUserId,
      status: "scheduled",
      pleading_notes: pleadingNotes,
      is_archived: false,
      created_by: workspace.userId,
    })
    .select(hearingSelect)
    .single();

  if (error || !data) {
    return apiError(databaseErrorCode(error), "تعذر حفظ الجلسة.", 403);
  }

  return NextResponse.json({ hearing: mapHearing(data as HearingRow) });
}

export async function PATCH(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const body = await readJsonObject(request);
  if (!body) {
    return apiError("VALIDATION_ERROR", "طلب تحديث الجلسة غير صالح.", 400);
  }

  if (!isUuid(body.id)) {
    return apiError("VALIDATION_ERROR", "معرّف الجلسة غير صالح.", 400);
  }

  const updates: Record<string, string | boolean | null> = {};

  if (body.hearingDate !== undefined) {
    if (!isIsoDate(body.hearingDate)) {
      return apiError("VALIDATION_ERROR", "تاريخ الجلسة غير صالح.", 400);
    }
    updates.hearing_date = body.hearingDate;
  }

  for (const [inputKey, dbKey, max] of [
    ["hearingTime", "hearing_time", 20],
    ["court", "court", 300],
    ["circuit", "circuit", 200],
    ["hall", "hall", 120],
    ["rollNumber", "roll_number", 120],
    ["purpose", "purpose", 2_000],
    ["lastDecision", "last_decision", 5_000],
    ["pleadingNotes", "pleading_notes", 10_000],
  ] as const) {
    if (body[inputKey] !== undefined) {
      const value = optionalText(body[inputKey], max);
      if (value === undefined) {
        return apiError("VALIDATION_ERROR", "بيانات تحديث الجلسة غير صالحة.", 400);
      }
      updates[dbKey] = value;
    }
  }

  if (body.attendingUserId !== undefined) {
    if (body.attendingUserId !== null && !isUuid(body.attendingUserId)) {
      return apiError("VALIDATION_ERROR", "المحامي الحاضر غير صالح.", 400);
    }
    updates.attending_user_id = body.attendingUserId as string | null;
  }

  if (body.status !== undefined) {
    if (!["scheduled", "completed", "postponed", "cancelled"].includes(String(body.status))) {
      return apiError("VALIDATION_ERROR", "حالة الجلسة غير صالحة.", 400);
    }
    updates.status = String(body.status);
  }

  if (body.isArchived !== undefined) {
    if (typeof body.isArchived !== "boolean") {
      return apiError("VALIDATION_ERROR", "قيمة الأرشفة غير صالحة.", 400);
    }
    updates.is_archived = body.isArchived;
  }

  if (Object.keys(updates).length === 0) {
    return apiError("VALIDATION_ERROR", "لا توجد بيانات لتحديثها.", 400);
  }

  const { data, error } = await workspace.supabase
    .from("hearings")
    .update(updates)
    .eq("organization_id", workspace.organizationId)
    .eq("id", body.id)
    .select(hearingSelect)
    .maybeSingle();

  if (error) {
    return apiError(databaseErrorCode(error), "تعذر تحديث الجلسة.", 403);
  }

  if (!data) {
    return apiError("NOT_FOUND", "الجلسة غير موجودة أو غير متاحة.", 404);
  }

  return NextResponse.json({ hearing: mapHearing(data as HearingRow) });
}
