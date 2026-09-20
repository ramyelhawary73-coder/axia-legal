import { NextResponse } from "next/server";
import { apiError, workspaceErrorResponse } from "@/lib/api/errors";
import { isUuid } from "@/lib/api/validation";
import { resolveWorkspace } from "@/lib/api/workspace";

export async function GET(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const id = new URL(request.url).searchParams.get("id");
  if (!isUuid(id)) {
    return apiError("VALIDATION_ERROR", "معرّف المستند غير صالح.", 400);
  }

  const { data: document, error } = await workspace.supabase
    .from("documents")
    .select("id,storage_path")
    .eq("organization_id", workspace.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return apiError("QUERY_FAILED", "تعذر الوصول إلى المستند.", 502);
  }

  if (!document) {
    return apiError("NOT_FOUND", "المستند غير موجود أو غير متاح.", 404);
  }

  const { data, error: signedUrlError } = await workspace.supabase.storage
    .from("legal-documents")
    .createSignedUrl(String(document.storage_path), 60);

  if (signedUrlError || !data?.signedUrl) {
    return apiError("FORBIDDEN", "تعذر إنشاء رابط تنزيل آمن للمستند.", 403);
  }

  return NextResponse.json({
    url: data.signedUrl,
    expiresIn: 60,
  });
}
