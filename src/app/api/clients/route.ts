import { NextResponse } from "next/server";
import { apiError, databaseErrorCode, workspaceErrorResponse } from "@/lib/api/errors";
import {
  isUuid,
  optionalText,
  readJsonObject,
  requiredText,
} from "@/lib/api/validation";
import { resolveWorkspace } from "@/lib/api/workspace";

type ClientRow = {
  id: string;
  name: string;
  type: "company" | "individual";
  national_id_or_cr: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
};

const clientSelect =
  "id,name,type,national_id_or_cr,phone,email,address,notes,status,created_at,updated_at";

function mapClient(row: ClientRow) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    nationalIdOrCr: row.national_id_or_cr,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const { data, error } = await workspace.supabase
    .from("clients")
    .select(clientSelect)
    .eq("organization_id", workspace.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return apiError("QUERY_FAILED", "تعذر تحميل الموكلين.", 502);
  }

  return NextResponse.json({
    clients: ((data ?? []) as ClientRow[]).map(mapClient),
  });
}

export async function POST(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const body = await readJsonObject(request);
  const name = requiredText(body?.name, 300);
  const type = body?.type;
  const nationalIdOrCr = optionalText(body?.nationalIdOrCr, 120);
  const phone = optionalText(body?.phone, 80);
  const email = optionalText(body?.email, 320);
  const address = optionalText(body?.address, 1_000);
  const notes = optionalText(body?.notes, 5_000);

  if (
    !name ||
    !["company", "individual"].includes(String(type)) ||
    nationalIdOrCr === undefined ||
    phone === undefined ||
    email === undefined ||
    address === undefined ||
    notes === undefined
  ) {
    return apiError("VALIDATION_ERROR", "بيانات الموكل غير صالحة أو غير مكتملة.", 400);
  }

  const { data, error } = await workspace.supabase
    .from("clients")
    .insert({
      organization_id: workspace.organizationId,
      name,
      type,
      national_id_or_cr: nationalIdOrCr,
      phone,
      email,
      address,
      notes,
      status: "active",
      created_by: workspace.userId,
    })
    .select(clientSelect)
    .single();

  if (error || !data) {
    const code = databaseErrorCode(error);
    return apiError(code, "تعذر حفظ بيانات الموكل.", code === "CONFLICT" ? 409 : 403);
  }

  return NextResponse.json({ client: mapClient(data as ClientRow) });
}

export async function PATCH(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const body = await readJsonObject(request);
  if (!isUuid(body?.id)) {
    return apiError("VALIDATION_ERROR", "معرّف الموكل غير صالح.", 400);
  }

  const updates: Record<string, string | null> = {};

  if (body.name !== undefined) {
    const value = requiredText(body.name, 300);
    if (!value) return apiError("VALIDATION_ERROR", "اسم الموكل غير صالح.", 400);
    updates.name = value;
  }

  if (body.type !== undefined) {
    if (!["company", "individual"].includes(String(body.type))) {
      return apiError("VALIDATION_ERROR", "نوع الموكل غير صالح.", 400);
    }
    updates.type = String(body.type);
  }

  for (const [inputKey, dbKey, max] of [
    ["nationalIdOrCr", "national_id_or_cr", 120],
    ["phone", "phone", 80],
    ["email", "email", 320],
    ["address", "address", 1_000],
    ["notes", "notes", 5_000],
  ] as const) {
    if (body[inputKey] !== undefined) {
      const value = optionalText(body[inputKey], max);
      if (value === undefined) {
        return apiError("VALIDATION_ERROR", "بيانات تحديث الموكل غير صالحة.", 400);
      }
      updates[dbKey] = value;
    }
  }

  if (body.status !== undefined) {
    if (!["active", "inactive", "archived"].includes(String(body.status))) {
      return apiError("VALIDATION_ERROR", "حالة الموكل غير صالحة.", 400);
    }
    updates.status = String(body.status);
  }

  if (Object.keys(updates).length === 0) {
    return apiError("VALIDATION_ERROR", "لا توجد بيانات لتحديثها.", 400);
  }

  const { data, error } = await workspace.supabase
    .from("clients")
    .update(updates)
    .eq("organization_id", workspace.organizationId)
    .eq("id", body.id)
    .select(clientSelect)
    .maybeSingle();

  if (error) {
    return apiError(databaseErrorCode(error), "تعذر تحديث بيانات الموكل.", 403);
  }

  if (!data) {
    return apiError("NOT_FOUND", "الموكل غير موجود أو غير متاح.", 404);
  }

  return NextResponse.json({ client: mapClient(data as ClientRow) });
}
