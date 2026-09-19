import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { abstain, RAJIH_SYSTEM_POLICY, type RajihAnswer, type RajihCitation } from "@/lib/rajih/policy";

type RajihRequest = {
  prompt?: string;
  organizationId?: string;
  matterId?: string;
};

type SourceRow = {
  id: string;
  name: string;
  authority: string;
  source_url: string | null;
};

type KnowledgeDocumentRow = {
  id: string;
  title: string;
  version: string;
  source_id: string;
  source_url: string | null;
  effective_from: string | null;
  effective_to: string | null;
  status: "published";
};

type ChunkRow = {
  id: string;
  document_id: string;
  content: string;
  heading: string | null;
  article_number: string | null;
};

function createSupabaseServerClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Route handlers may not always be able to persist refreshed cookies.
      },
    },
  });
}

async function retrieveApprovedSources(input: RajihRequest): Promise<{ userId: string; citations: RajihCitation[] } | null> {
  const supabase = createSupabaseServerClient(await cookies());
  if (!supabase) return null;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  if (input.matterId) {
    const { data: matter } = await supabase.from("matters").select("id").eq("id", input.matterId).maybeSingle();
    if (!matter) return null;
  }

  const { data: documents, error: documentError } = await supabase
    .from("legal_knowledge_documents")
    .select("id,title,version,source_id,source_url,effective_from,effective_to,status")
    .eq("status", "published")
    .or("effective_from.is.null,effective_from.lte." + new Date().toISOString().slice(0, 10))
    .or("effective_to.is.null,effective_to.gte." + new Date().toISOString().slice(0, 10))
    .limit(50);
  if (documentError || !documents?.length) return { userId, citations: [] };

  const rows = documents as KnowledgeDocumentRow[];
  const keywords = (input.prompt ?? "").split(/\s+/).filter((word) => word.length >= 3).slice(0, 8);
  const searchFilter = keywords.length
    ? keywords.map((word) => `content.ilike.%${word.replace(/[%,]/g, " ")}%`).join(",")
    : undefined;
  const chunkQuery = supabase
    .from("legal_knowledge_chunks")
    .select("id,document_id,content,heading,article_number")
    .in("document_id", rows.map((row) => row.id))
    .limit(8);
  const { data: chunks, error: chunkError } = searchFilter ? await chunkQuery.or(searchFilter) : await chunkQuery;
  if (chunkError || !chunks?.length) return { userId, citations: [] };

  const sourceIds = [...new Set(rows.map((row) => row.source_id))];
  const { data: sourceRows } = await supabase.from("legal_sources").select("id,name,authority,source_url").in("id", sourceIds);
  const sourceMap = new Map((sourceRows as SourceRow[] | null ?? []).map((source) => [source.id, source]));
  const documentMap = new Map(rows.map((document) => [document.id, document]));

  const citations = (chunks as ChunkRow[]).flatMap((chunk) => {
    const document = documentMap.get(chunk.document_id);
    if (!document) return [];
    const source = sourceMap.get(document.source_id);
    return [{
      documentId: document.id,
      title: document.title,
      sourceAuthority: source?.authority ?? "مصدر قانوني معتمد",
      sourceUrl: document.source_url ?? source?.source_url ?? undefined,
      version: document.version,
      effectiveFrom: document.effective_from ?? undefined,
      effectiveTo: document.effective_to ?? undefined,
      excerpt: `${chunk.article_number ? `${chunk.article_number}: ` : ""}${chunk.content.slice(0, 900)}`,
    }];
  });

  if (input.organizationId) {
    await supabase.from("audit_logs").insert({
      organization_id: input.organizationId,
      user_id: userId,
      action: "rajih.retrieval",
      resource_type: input.matterId ? "matter" : "legal_knowledge",
      resource_id: input.matterId ?? null,
      metadata: { source_count: citations.length },
    });
  }
  return { userId, citations };
}

async function callConfiguredModel(prompt: string, sources: RajihCitation[]): Promise<string | null> {
  const baseUrl = process.env.RAJIH_AI_BASE_URL;
  const apiKey = process.env.RAJIH_AI_API_KEY;
  const model = process.env.RAJIH_AI_MODEL;
  if (!baseUrl || !apiKey || !model || sources.length === 0) return null;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: RAJIH_SYSTEM_POLICY },
        { role: "user", content: `Answer only from these approved sources:\n${JSON.stringify(sources)}\n\nQuestion:\n${prompt}` },
      ],
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? null;
}

export async function POST(request: Request) {
  let payload: RajihRequest;
  try {
    payload = (await request.json()) as RajihRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = payload.prompt?.trim();
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  if (prompt.length > 8_000) return NextResponse.json({ error: "prompt is too long" }, { status: 413 });

  const retrieval = await retrieveApprovedSources(payload);
  if (!retrieval?.citations.length) {
    const result: RajihAnswer = abstain([
      "لا توجد حالياً مصادر قانونية منشورة ومصرح بها تطابق السؤال.",
      "تأكد من تسجيل الدخول واعتماد مصادر المعرفة القانونية قبل الاعتماد على النتيجة.",
    ]);
    return NextResponse.json(result);
  }

  const answer = await callConfiguredModel(prompt, retrieval.citations);
  if (!answer) return NextResponse.json(abstain(["تعذر تشغيل مزود النموذج أو التحقق من الإجابة."]));

  return NextResponse.json({
    status: "answered",
    answer,
    citations: retrieval.citations,
    confidence: "medium",
    needsLawyerReview: true,
    missingInformation: [],
  } satisfies RajihAnswer);
}
