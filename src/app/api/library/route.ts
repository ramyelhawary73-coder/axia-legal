import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/lib/api/workspace";
import { apiError, workspaceErrorResponse } from "@/lib/api/errors";

type LibraryRow = {
  id: string; title: string; version: string; source_url: string | null;
  court: string | null; legal_area: string | null;
  publication_date: string | null; reviewed_at: string;
};

function safeSourceUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const workspace = await resolveWorkspace(request);
  if (!workspace.ok) return workspaceErrorResponse(workspace.code);

  const result = await workspace.supabase
    .from("legal_knowledge_documents")
    .select("id,title,version,source_url,court,legal_area,publication_date,reviewed_at")
    .eq("status", "published")
    .eq("is_test_only", false)
    .not("reviewed_at", "is", null)
    .not("reviewed_by", "is", null)
    .order("reviewed_at", { ascending: false })
    .limit(101);

  if (result.error) return apiError("QUERY_FAILED", "تعذر تحميل المكتبة القانونية.", 502);

  return NextResponse.json({
    documents: ((result.data ?? []) as LibraryRow[]).slice(0, 100).map((row) => ({
      id: row.id,
      title: row.title,
      version: row.version,
      sourceUrl: safeSourceUrl(row.source_url),
      court: row.court,
      legalArea: row.legal_area,
      publicationDate: row.publication_date,
      reviewedAt: row.reviewed_at,
    })),
    truncated: (result.data?.length ?? 0) > 100,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
