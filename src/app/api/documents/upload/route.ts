import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError, databaseErrorCode, workspaceErrorResponse } from "@/lib/api/errors";
import { isUuid, optionalText } from "@/lib/api/validation";
import { resolveWorkspace } from "@/lib/api/workspace";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
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

function sanitizeFileName(name: string) {
  const normalized = name
    .normalize("NFKC")
    .replace(/[\\/]+/g, "-")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return (normalized || "document").slice(-120);
}

export async function POST(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const form = await request.formData().catch(() => null);
  if (!form) {
    return apiError("VALIDATION_ERROR", "طلب رفع المستند غير صالح.", 400);
  }

  const file = form.get("file");
  const titleRaw = form.get("title");
  const matterIdRaw = form.get("matterId");

  if (!(file instanceof File) || file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return apiError(
      "VALIDATION_ERROR",
      "الملف غير صالح أو يتجاوز الحد الأقصى 25 ميجابايت.",
      400,
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return apiError("VALIDATION_ERROR", "نوع الملف غير مسموح.", 400);
  }

  const title =
    optionalText(typeof titleRaw === "string" ? titleRaw : null, 500) ||
    file.name;

  const matterId =
    matterIdRaw === null || matterIdRaw === ""
      ? null
      : typeof matterIdRaw === "string" && isUuid(matterIdRaw)
        ? matterIdRaw
        : undefined;

  if (matterId === undefined) {
    return apiError("VALIDATION_ERROR", "القضية المرتبطة غير صالحة.", 400);
  }

  if (matterId) {
    const { data: matter } = await workspace.supabase
      .from("matters")
      .select("id")
      .eq("organization_id", workspace.organizationId)
      .eq("id", matterId)
      .maybeSingle();

    if (!matter) {
      return apiError("FORBIDDEN", "القضية غير متاحة لهذا الحساب.", 403);
    }
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(bytes).digest("hex");
  const storagePath = [
    workspace.organizationId,
    matterId || "general",
    `${randomUUID()}-${sanitizeFileName(file.name)}`,
  ].join("/");

  const { error: uploadError } = await workspace.supabase.storage
    .from("legal-documents")
    .upload(storagePath, bytes, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return apiError("FORBIDDEN", "تعذر رفع المستند إلى الأرشيف الآمن.", 403);
  }

  const { data, error } = await workspace.supabase
    .from("documents")
    .insert({
      organization_id: workspace.organizationId,
      matter_id: matterId,
      title,
      storage_path: storagePath,
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
      "تم رفع الملف لكن تعذر تسجيل بياناته في الأرشيف. لا تعاود الرفع قبل المراجعة.",
      code === "CONFLICT" ? 409 : 500,
    );
  }

  return NextResponse.json({
    document: {
      id: String(data.id),
      matterId: data.matter_id ? String(data.matter_id) : null,
      title: String(data.title),
      mimeType: String(data.mime_type),
      createdAt: String(data.created_at),
      fileSize: file.size,
    },
  });
}
