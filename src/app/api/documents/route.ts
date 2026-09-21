import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  apiError,
  databaseErrorCode,
  workspaceErrorResponse,
} from "@/lib/api/errors";
import { isUuid } from "@/lib/api/validation";
import { resolveWorkspace } from "@/lib/api/workspace";

const BUCKET = "legal-documents";
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type DocumentRow = {
  id: string;
  matter_id: string | null;
  title: string;
  mime_type: string;
  created_at: string;
};

function safeExtension(fileName: string) {
  const raw = fileName.includes(".") ? fileName.split(".").pop() : "";
  const extension = raw?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  return extension ? `.${extension.slice(0, 12)}` : "";
}

function validTitle(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > 500) return null;
  return normalized;
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
    .from("documents")
    .select("id,matter_id,title,mime_type,created_at")
    .eq("organization_id", workspace.organizationId)
    .order("created_at", { ascending: false });

  if (matterId) query = query.eq("matter_id", matterId);

  const { data, error } = await query;
  if (error) {
    return apiError("QUERY_FAILED", "تعذر تحميل المستندات.", 502);
  }

  return NextResponse.json({
    documents: ((data ?? []) as DocumentRow[]).map((row) => ({
      id: row.id,
      matterId: row.matter_id,
      title: row.title,
      mimeType: row.mime_type,
      createdAt: row.created_at,
    })),
    capabilities: {
      upload: true,
      update: false,
      delete: false,
    },
  });
}

export async function POST(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const form = await request.formData().catch(() => null);
  if (!form) {
    return apiError("VALIDATION_ERROR", "طلب رفع المستند غير صالح.", 400);
  }

  const file = form.get("file");
  const title = validTitle(form.get("title"));
  const rawMatterId = form.get("matterId");
  const matterId =
    typeof rawMatterId === "string" && rawMatterId.trim()
      ? rawMatterId.trim()
      : null;

  if (!(file instanceof File) || !title) {
    return apiError("VALIDATION_ERROR", "اختر ملفاً صحيحاً واكتب عنوان المستند.", 400);
  }

  if (matterId && !isUuid(matterId)) {
    return apiError("VALIDATION_ERROR", "القضية المرتبطة غير صالحة.", 400);
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return apiError("VALIDATION_ERROR", "نوع الملف غير مسموح به.", 400);
  }

  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    return apiError("VALIDATION_ERROR", "حجم الملف يجب ألا يتجاوز 25 ميجابايت.", 400);
  }

  if (matterId) {
    const { data: matter, error: matterError } = await workspace.supabase
      .from("matters")
      .select("id")
      .eq("organization_id", workspace.organizationId)
      .eq("id", matterId)
      .maybeSingle();

    if (matterError) {
      return apiError("QUERY_FAILED", "تعذر التحقق من القضية المرتبطة.", 502);
    }

    if (!matter) {
      return apiError("FORBIDDEN", "القضية المرتبطة غير متاحة لهذا الحساب.", 403);
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const hash = createHash("sha256").update(bytes).digest("hex");
  const objectName = `${workspace.organizationId}/${matterId ?? "general"}/${randomUUID()}${safeExtension(file.name)}`;

  const { error: uploadError } = await workspace.supabase.storage
    .from(BUCKET)
    .upload(objectName, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return apiError("FORBIDDEN", "تعذر رفع الملف. تحقق من صلاحية الوصول للقضية.", 403);
  }

  const { data, error } = await workspace.supabase
    .from("documents")
    .insert({
      organization_id: workspace.organizationId,
      matter_id: matterId,
      title,
      storage_path: objectName,
      mime_type: file.type,
      content_hash: hash,
      created_by: workspace.userId,
    })
    .select("id,matter_id,title,mime_type,created_at")
    .single();

  if (error || !data) {
    const code = databaseErrorCode(error);
    return apiError(
      code,
      "تم رفع الملف لكن تعذر تسجيل بياناته. لا تحاول إعادة الرفع قبل المراجعة.",
      code === "CONFLICT" ? 409 : 500,
    );
  }

  const row = data as DocumentRow;
  return NextResponse.json({
    document: {
      id: row.id,
      matterId: row.matter_id,
      title: row.title,
      mimeType: row.mime_type,
      createdAt: row.created_at,
    },
  });
}
