import type { SupabaseClient } from "@supabase/supabase-js";
import type { RajihCitation } from "@/lib/rajih/policy";

export type RajihRequest = {
  prompt?: string;
  organizationId?: string;
  matterId?: string;
};

export type RetrievalDiagnosticCode =
  | "NO_DOCUMENTS"
  | "DOCUMENT_QUERY_ERROR"
  | "NO_CHUNK_MATCH"
  | "CHUNK_QUERY_ERROR"
  | "SOURCE_QUERY_ERROR";

export type RetrievalStrategy = "metadata" | "vector" | "lexical";

export type RetrievalOutcome =
  | {
      status: "ok";
      citations: RajihCitation[];
      strategy: RetrievalStrategy;
      documentCount: number;
      chunkCount: number;
    }
  | {
      status: "failed";
      code: RetrievalDiagnosticCode;
      strategy?: RetrievalStrategy;
      documentCount: number;
      chunkCount: number;
    };

type SourceRow = {
  id: string;
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
  is_test_only: boolean;
  status: "published";
};

type ChunkRow = {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  heading: string | null;
  article_number: string | null;
};

type LawReference = {
  number?: string;
  year?: string;
};

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const SEARCH_STOP_WORDS = new Set([
  "ما",
  "هل",
  "هو",
  "هي",
  "فى",
  "في",
  "من",
  "إلى",
  "الى",
  "على",
  "عن",
  "مع",
  "هذا",
  "هذه",
  "ذلك",
  "تلك",
  "رقم",
  "لسنة",
  "سنة",
]);

function toAsciiDigits(value: string) {
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  const easternArabicIndic = "۰۱۲۳۴۵۶۷۸۹";

  return value
    .replace(/[٠-٩]/g, (digit) => String(arabicIndic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicIndic.indexOf(digit)));
}

export function normalizeArabic(value: string) {
  return toAsciiDigits(value)
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/ـ/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractLawReference(prompt: string): LawReference {
  const normalized = normalizeArabic(prompt);
  const match = normalized.match(/(?:رقم\s*)?(\d{1,4})\s*(?:لسنه|سنه)\s*(\d{4})/);

  return {
    number: match?.[1],
    year: match?.[2],
  };
}

function extractSearchTerms(prompt: string) {
  const normalizedStopWords = new Set([...SEARCH_STOP_WORDS].map(normalizeArabic));

  return prompt
    .replace(/[،؛؟?!:()[\]{}"'“”]/g, " ")
    .split(/\s+/)
    .map((term) => term.replace(/[^\p{L}\p{N}-]/gu, "").trim())
    .filter(Boolean)
    .filter((term) => normalizeArabic(term).length >= 3)
    .filter((term) => !normalizedStopWords.has(normalizeArabic(term)))
    .sort((a, b) => b.length - a.length)
    .slice(0, 10);
}

function scoreDocument(document: KnowledgeDocumentRow, prompt: string, reference: LawReference) {
  const haystack = normalizeArabic(`${document.title} ${document.version}`);
  const promptTerms = normalizeArabic(prompt).split(" ").filter((term) => term.length >= 4);
  let score = 0;

  if (reference.number && haystack.includes(reference.number)) score += 6;
  if (reference.year && haystack.includes(reference.year)) score += 6;
  if (reference.number && reference.year && haystack.includes(reference.number) && haystack.includes(reference.year)) {
    score += 8;
  }

  for (const term of promptTerms) {
    if (haystack.includes(term)) score += Math.min(term.length, 8);
  }

  return score;
}

function scoreChunk(chunk: ChunkRow, prompt: string) {
  const normalizedPrompt = normalizeArabic(prompt);
  const normalizedContent = normalizeArabic(`${chunk.heading ?? ""} ${chunk.article_number ?? ""} ${chunk.content}`);
  const terms = normalizeArabic(prompt)
    .split(" ")
    .filter((term) => term.length >= 3 && !SEARCH_STOP_WORDS.has(term));

  let score = 0;
  for (const term of terms) {
    if (normalizedContent.includes(term)) score += Math.min(term.length, 8);
  }

  const asksEffectiveness =
    normalizedPrompt.includes("نافذ") ||
    normalizedPrompt.includes("سريان") ||
    normalizedPrompt.includes("يعمل") ||
    normalizedPrompt.includes("تاريخ");

  if (
    asksEffectiveness &&
    (normalizedContent.includes("يعمل به") ||
      normalizedContent.includes("سريان") ||
      normalizedContent.includes("ينشر هذا القانون") ||
      normalizedContent.includes("اعتبارا من"))
  ) {
    score += 30;
  }

  if (chunk.article_number?.startsWith("تمهيدي")) score += 2;

  return score;
}

function selectBestChunks(chunks: ChunkRow[], prompt: string, fallbackAllowed: boolean) {
  const ranked = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, prompt) }))
    .sort((left, right) => right.score - left.score || left.chunk.chunk_index - right.chunk.chunk_index);

  const matched = ranked.filter((item) => item.score > 0).slice(0, 8).map((item) => item.chunk);
  if (matched.length > 0) return matched;

  return fallbackAllowed ? ranked.slice(0, 8).map((item) => item.chunk) : [];
}

async function retrieveByMetadata(
  supabase: SupabaseClient,
  documents: KnowledgeDocumentRow[],
  prompt: string,
): Promise<{ chunks: ChunkRow[]; matchedDocuments: KnowledgeDocumentRow[] } | null> {
  const reference = extractLawReference(prompt);
  const scored = documents
    .map((document) => ({ document, score: scoreDocument(document, prompt, reference) }))
    .sort((left, right) => right.score - left.score);

  const strongestScore = scored[0]?.score ?? 0;
  if (strongestScore < 8) return null;

  const matchedDocuments = scored
    .filter((item) => item.score >= Math.max(8, strongestScore - 4))
    .slice(0, 3)
    .map((item) => item.document);

  const result = await supabase
    .from("legal_knowledge_chunks")
    .select("id,document_id,chunk_index,content,heading,article_number")
    .in("document_id", matchedDocuments.map((document) => document.id))
    .order("chunk_index", { ascending: true })
    .limit(120);

  if (result.error) throw result.error;

  const chunks = selectBestChunks((result.data ?? []) as ChunkRow[], prompt, true);
  return { chunks, matchedDocuments };
}

async function retrieveByVector(
  supabase: SupabaseClient,
  prompt: string,
): Promise<ChunkRow[] | null> {
  const embeddingModel = process.env.RAJIH_EMBEDDING_MODEL;
  const baseUrl = process.env.RAJIH_AI_BASE_URL;
  const apiKey = process.env.RAJIH_AI_API_KEY;

  if (!embeddingModel || !baseUrl || !apiKey) return null;

  try {
    const embeddingResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: embeddingModel, input: prompt }),
      cache: "no-store",
    });

    if (!embeddingResponse.ok) return null;

    const embeddingData = (await embeddingResponse.json()) as { data?: Array<{ embedding?: number[] }> };
    const vector = embeddingData.data?.[0]?.embedding;
    if (vector?.length !== 1536) return null;

    const result = await supabase.rpc("match_legal_knowledge_chunks", {
      query_embedding: vector,
      match_threshold: 0.55,
      match_count: 8,
    });

    if (result.error || !result.data?.length) return null;

    return (result.data as Array<Omit<ChunkRow, "chunk_index">>).map((chunk, index) => ({
      ...chunk,
      chunk_index: index,
    }));
  } catch {
    return null;
  }
}

async function retrieveLexically(
  supabase: SupabaseClient,
  documents: KnowledgeDocumentRow[],
  prompt: string,
) {
  const terms = extractSearchTerms(prompt);
  if (terms.length === 0) return { chunks: [] as ChunkRow[], error: null };

  const filter = terms.map((term) => `content.ilike.%${term.replace(/[%,.]/g, " ")}%`).join(",");
  const result = await supabase
    .from("legal_knowledge_chunks")
    .select("id,document_id,chunk_index,content,heading,article_number")
    .in("document_id", documents.map((document) => document.id))
    .or(filter)
    .limit(40);

  if (result.error) return { chunks: [] as ChunkRow[], error: result.error };

  return {
    chunks: selectBestChunks((result.data ?? []) as ChunkRow[], prompt, false),
    error: null,
  };
}

export async function retrieveApprovedSources(
  supabase: SupabaseClient,
  input: RajihRequest,
): Promise<RetrievalOutcome> {
  if (input.matterId) {
    const matterResult = await supabase.from("matters").select("id").eq("id", input.matterId).maybeSingle();
    if (matterResult.error || !matterResult.data) {
      return {
        status: "failed",
        code: "NO_CHUNK_MATCH",
        documentCount: 0,
        chunkCount: 0,
      };
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const documentResult = await supabase
    .from("legal_knowledge_documents")
    .select("id,title,version,source_id,source_url,effective_from,effective_to,is_test_only,status")
    .eq("status", "published")
    .eq("is_test_only", false)
    .or(`effective_to.is.null,effective_to.gte.${today}`)
    .limit(100);

  if (documentResult.error) {
    return {
      status: "failed",
      code: "DOCUMENT_QUERY_ERROR",
      documentCount: 0,
      chunkCount: 0,
    };
  }

  const documents = (documentResult.data ?? []) as KnowledgeDocumentRow[];
  if (documents.length === 0) {
    return {
      status: "failed",
      code: "NO_DOCUMENTS",
      documentCount: 0,
      chunkCount: 0,
    };
  }

  let chunks: ChunkRow[] = [];
  let strategy: RetrievalStrategy = "lexical";

  try {
    const metadataResult = await retrieveByMetadata(supabase, documents, input.prompt ?? "");
    if (metadataResult?.chunks.length) {
      chunks = metadataResult.chunks;
      strategy = "metadata";
    }
  } catch {
    return {
      status: "failed",
      code: "CHUNK_QUERY_ERROR",
      strategy: "metadata",
      documentCount: documents.length,
      chunkCount: 0,
    };
  }

  if (chunks.length === 0) {
    const vectorChunks = await retrieveByVector(supabase, input.prompt ?? "");
    if (vectorChunks?.length) {
      chunks = vectorChunks;
      strategy = "vector";
    }
  }

  if (chunks.length === 0) {
    const lexicalResult = await retrieveLexically(supabase, documents, input.prompt ?? "");
    if (lexicalResult.error) {
      return {
        status: "failed",
        code: "CHUNK_QUERY_ERROR",
        strategy: "lexical",
        documentCount: documents.length,
        chunkCount: 0,
      };
    }

    chunks = lexicalResult.chunks;
    strategy = "lexical";
  }

  if (chunks.length === 0) {
    return {
      status: "failed",
      code: "NO_CHUNK_MATCH",
      strategy,
      documentCount: documents.length,
      chunkCount: 0,
    };
  }

  const sourceIds = [...new Set(documents.map((document) => document.source_id))];
  const sourceResult = await supabase
    .from("legal_sources")
    .select("id,authority,source_url")
    .in("id", sourceIds);

  if (sourceResult.error) {
    return {
      status: "failed",
      code: "SOURCE_QUERY_ERROR",
      strategy,
      documentCount: documents.length,
      chunkCount: chunks.length,
    };
  }

  const sourceMap = new Map(
    ((sourceResult.data ?? []) as SourceRow[]).map((source) => [source.id, source]),
  );
  const documentMap = new Map(documents.map((document) => [document.id, document]));

  const citations = chunks.flatMap((chunk) => {
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
      excerpt: `${
        document.effective_from && document.effective_from > today
          ? `تنبيه: هذا النص منشور لكنه لا يبدأ السريان قبل ${document.effective_from}. `
          : ""
      }${chunk.article_number ? `${chunk.article_number}: ` : ""}${chunk.content.slice(0, 900)}`,
    }];
  });

  if (citations.length === 0) {
    return {
      status: "failed",
      code: "NO_CHUNK_MATCH",
      strategy,
      documentCount: documents.length,
      chunkCount: chunks.length,
    };
  }

  return {
    status: "ok",
    citations,
    strategy,
    documentCount: documents.length,
    chunkCount: chunks.length,
  };
}
