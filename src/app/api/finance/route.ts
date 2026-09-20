import { NextResponse } from "next/server";
import { apiError, databaseErrorCode, workspaceErrorResponse } from "@/lib/api/errors";
import {
  isCurrencyCode,
  isIsoDate,
  isUuid,
  optionalText,
  readJsonObject,
} from "@/lib/api/validation";
import { resolveWorkspace } from "@/lib/api/workspace";

type FinancialRow = {
  id: string;
  client_id: string | null;
  matter_id: string | null;
  record_type:
    | "fee_payment"
    | "expert_deposit"
    | "court_fee"
    | "administrative_expense"
    | "success_fee"
    | "other";
  direction: "income" | "expense";
  amount: string | number;
  currency: string;
  status: "pending" | "completed" | "cancelled";
  due_date: string | null;
  occurred_at: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const financialSelect =
  "id,client_id,matter_id,record_type,direction,amount,currency,status,due_date,occurred_at,receipt_number,notes,created_at,updated_at";

const recordTypes = new Set([
  "fee_payment",
  "expert_deposit",
  "court_fee",
  "administrative_expense",
  "success_fee",
  "other",
]);

function mapFinancial(row: FinancialRow) {
  return {
    id: row.id,
    clientId: row.client_id,
    matterId: row.matter_id,
    recordType: row.record_type,
    direction: row.direction,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    dueDate: row.due_date,
    occurredAt: row.occurred_at,
    receiptNumber: row.receipt_number,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isIsoDateTime(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export async function GET(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const url = new URL(request.url);
  const matterId = url.searchParams.get("matterId");
  const clientId = url.searchParams.get("clientId");

  if ((matterId && !isUuid(matterId)) || (clientId && !isUuid(clientId))) {
    return apiError("VALIDATION_ERROR", "مرشح السجل المالي غير صالح.", 400);
  }

  let query = workspace.supabase
    .from("financial_records")
    .select(financialSelect)
    .eq("organization_id", workspace.organizationId)
    .order("created_at", { ascending: false });

  if (matterId) query = query.eq("matter_id", matterId);
  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) return apiError("QUERY_FAILED", "تعذر تحميل السجلات المالية.", 502);

  return NextResponse.json({
    records: ((data ?? []) as FinancialRow[]).map(mapFinancial),
  });
}

export async function POST(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const body = await readJsonObject(request);
  if (!body) {
    return apiError("VALIDATION_ERROR", "طلب إنشاء السجل المالي غير صالح.", 400);
  }

  const clientId =
    body?.clientId === undefined || body.clientId === null || body.clientId === ""
      ? null
      : isUuid(body.clientId)
        ? body.clientId
        : undefined;
  const matterId =
    body?.matterId === undefined || body.matterId === null || body.matterId === ""
      ? null
      : isUuid(body.matterId)
        ? body.matterId
        : undefined;
  const recordType = body?.recordType;
  const direction = body?.direction;
  const amount = body?.amount;
  const currency = body?.currency === undefined ? "EGP" : body.currency;
  const status = body?.status === undefined ? "pending" : body.status;
  const dueDate =
    body?.dueDate === undefined || body.dueDate === null || body.dueDate === ""
      ? null
      : isIsoDate(body.dueDate)
        ? body.dueDate
        : undefined;
  const occurredAt =
    body?.occurredAt === undefined || body.occurredAt === null || body.occurredAt === ""
      ? null
      : isIsoDateTime(body.occurredAt)
        ? body.occurredAt
        : undefined;
  const receiptNumber = optionalText(body?.receiptNumber, 200);
  const notes = optionalText(body?.notes, 5_000);

  if (
    clientId === undefined ||
    matterId === undefined ||
    !recordTypes.has(String(recordType)) ||
    !["income", "expense"].includes(String(direction)) ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !isCurrencyCode(currency) ||
    !["pending", "completed", "cancelled"].includes(String(status)) ||
    dueDate === undefined ||
    occurredAt === undefined ||
    receiptNumber === undefined ||
    notes === undefined
  ) {
    return apiError("VALIDATION_ERROR", "بيانات السجل المالي غير صالحة أو غير مكتملة.", 400);
  }

  const { data, error } = await workspace.supabase
    .from("financial_records")
    .insert({
      organization_id: workspace.organizationId,
      client_id: clientId,
      matter_id: matterId,
      record_type: String(recordType),
      direction: String(direction),
      amount,
      currency,
      status: String(status),
      due_date: dueDate,
      occurred_at: occurredAt,
      receipt_number: receiptNumber,
      notes,
      created_by: workspace.userId,
    })
    .select(financialSelect)
    .single();

  if (error || !data) {
    return apiError(databaseErrorCode(error), "تعذر حفظ السجل المالي.", 403);
  }

  return NextResponse.json({ record: mapFinancial(data as FinancialRow) });
}

export async function PATCH(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const body = await readJsonObject(request);
  if (!body) {
    return apiError("VALIDATION_ERROR", "طلب تحديث السجل المالي غير صالح.", 400);
  }

  if (!isUuid(body.id)) {
    return apiError("VALIDATION_ERROR", "معرّف السجل المالي غير صالح.", 400);
  }

  const updates: Record<string, string | number | null> = {};

  if (body.clientId !== undefined) {
    if (body.clientId !== null && !isUuid(body.clientId)) {
      return apiError("VALIDATION_ERROR", "الموكل المرتبط غير صالح.", 400);
    }
    updates.client_id = body.clientId as string | null;
  }

  if (body.matterId !== undefined) {
    if (body.matterId !== null && !isUuid(body.matterId)) {
      return apiError("VALIDATION_ERROR", "القضية المرتبطة غير صالحة.", 400);
    }
    updates.matter_id = body.matterId as string | null;
  }

  if (body.recordType !== undefined) {
    if (!recordTypes.has(String(body.recordType))) {
      return apiError("VALIDATION_ERROR", "نوع السجل المالي غير صالح.", 400);
    }
    updates.record_type = String(body.recordType);
  }

  if (body.direction !== undefined) {
    if (!["income", "expense"].includes(String(body.direction))) {
      return apiError("VALIDATION_ERROR", "اتجاه الحركة المالية غير صالح.", 400);
    }
    updates.direction = String(body.direction);
  }

  if (body.amount !== undefined) {
    if (
      typeof body.amount !== "number" ||
      !Number.isFinite(body.amount) ||
      body.amount <= 0
    ) {
      return apiError("VALIDATION_ERROR", "المبلغ غير صالح.", 400);
    }
    updates.amount = body.amount;
  }

  if (body.currency !== undefined) {
    if (!isCurrencyCode(body.currency)) {
      return apiError("VALIDATION_ERROR", "رمز العملة غير صالح.", 400);
    }
    updates.currency = body.currency;
  }

  if (body.status !== undefined) {
    if (!["pending", "completed", "cancelled"].includes(String(body.status))) {
      return apiError("VALIDATION_ERROR", "حالة السجل المالي غير صالحة.", 400);
    }
    updates.status = String(body.status);
  }

  if (body.dueDate !== undefined) {
    if (body.dueDate !== null && !isIsoDate(body.dueDate)) {
      return apiError("VALIDATION_ERROR", "تاريخ الاستحقاق غير صالح.", 400);
    }
    updates.due_date = body.dueDate as string | null;
  }

  if (body.occurredAt !== undefined) {
    if (body.occurredAt !== null && !isIsoDateTime(body.occurredAt)) {
      return apiError("VALIDATION_ERROR", "تاريخ الحركة المالية غير صالح.", 400);
    }
    updates.occurred_at = body.occurredAt as string | null;
  }

  for (const [inputKey, dbKey, max] of [
    ["receiptNumber", "receipt_number", 200],
    ["notes", "notes", 5_000],
  ] as const) {
    if (body[inputKey] !== undefined) {
      const value = optionalText(body[inputKey], max);
      if (value === undefined) {
        return apiError("VALIDATION_ERROR", "بيانات تحديث السجل المالي غير صالحة.", 400);
      }
      updates[dbKey] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return apiError("VALIDATION_ERROR", "لا توجد بيانات لتحديثها.", 400);
  }

  const { data, error } = await workspace.supabase
    .from("financial_records")
    .update(updates)
    .eq("organization_id", workspace.organizationId)
    .eq("id", body.id)
    .select(financialSelect)
    .maybeSingle();

  if (error) {
    return apiError(databaseErrorCode(error), "تعذر تحديث السجل المالي.", 403);
  }

  if (!data) {
    return apiError("NOT_FOUND", "السجل المالي غير موجود أو غير متاح.", 404);
  }

  return NextResponse.json({ record: mapFinancial(data as FinancialRow) });
}
