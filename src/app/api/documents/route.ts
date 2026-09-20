import { NextResponse } from "next/server";
import { apiError, workspaceErrorResponse } from "@/lib/api/errors";
import { isUuid } from "@/lib/api/validation";
import { resolveWorkspace } from "@/lib/api/workspace";

type DocumentRow = {
  id: string;
  matter_id: string | null;
  title: string;
  mime_type: string;
  created_at: string;
};

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
      upload: false,
      update: false,
      delete: false,
    },
  });
}
