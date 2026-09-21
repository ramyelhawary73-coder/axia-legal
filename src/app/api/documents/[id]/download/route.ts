import { NextResponse } from "next/server";
import { apiError, workspaceErrorResponse } from "@/lib/api/errors";
import { isUuid } from "@/lib/api/validation";
import { resolveWorkspace } from "@/lib/api/workspace";

const BUCKET = "legal-documents";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const { id } = await context.params;
  if (!isUuid(id)) {
    return apiError("VALIDATION_ERROR", "معرّف المستند غير صالح.", 400);
  }

  const { data: document, error } = await workspace.supabase
    .from("documents")
    .select("id,title,storage_path,mime_type")
    .eq("organization_id", workspace.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return apiError("QUERY_FAILED", "تعذر تحميل بيانات المستند.", 502);
  }

  if (!document) {
    return apiError("NOT_FOUND", "المستند غير موجود أو غير متاح.", 404);
  }

  const { data: signed, error: signedError } = await workspace.supabase.storage
    .from(BUCKET)
    .createSignedUrl(String(document.storage_path), 60, {
      download: String(document.title),
    });

  if (signedError || !signed?.signedUrl) {
    return apiError("FORBIDDEN", "تعذر إنشاء رابط تنزيل آمن للمستند.", 403);
  }

  return NextResponse.json({
    url: signed.signedUrl,
    expiresIn: 60,
    title: document.title,
    mimeType: document.mime_type,
  });
}
