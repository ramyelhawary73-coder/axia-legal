import { NextResponse } from "next/server";
import { abstain, RAJIH_SYSTEM_POLICY, type RajihAnswer, type RajihCitation } from "@/lib/rajih/policy";
import {
  retrieveApprovedSources,
  type RajihRequest,
  type RetrievalDiagnosticCode,
  type RetrievalStrategy,
} from "@/lib/rajih/retrieval";
import { createClient } from "@/lib/supabase/server";

type RuntimeDiagnostics = {
  code: RetrievalDiagnosticCode | "MODEL_NOT_CONFIGURED" | "MODEL_PROVIDER_ERROR";
  strategy?: RetrievalStrategy;
  documentCount?: number;
  chunkCount?: number;
  runtimeProjectRef?: string;
};

type ModelOutcome =
  | { status: "ok"; answer: string }
  | { status: "failed"; code: "MODEL_NOT_CONFIGURED" | "MODEL_PROVIDER_ERROR" };

function getRuntimeProjectRef() {
  if (process.env.VERCEL_ENV === "production") return undefined;

  try {
    const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    const [projectRef] = hostname.split(".");
    return projectRef || undefined;
  } catch {
    return undefined;
  }
}

function diagnosticsFor(
  code: RuntimeDiagnostics["code"],
  input?: {
    strategy?: RetrievalStrategy;
    documentCount?: number;
    chunkCount?: number;
  },
): RuntimeDiagnostics {
  return {
    code,
    strategy: input?.strategy,
    documentCount: input?.documentCount,
    chunkCount: input?.chunkCount,
    runtimeProjectRef: getRuntimeProjectRef(),
  };
}

async function callConfiguredModel(prompt: string, sources: RajihCitation[]): Promise<ModelOutcome> {
  const baseUrl = process.env.RAJIH_AI_BASE_URL;
  const apiKey = process.env.RAJIH_AI_API_KEY;
  const model = process.env.RAJIH_AI_MODEL;

  if (!baseUrl || !apiKey || !model || sources.length === 0) {
    return { status: "failed", code: "MODEL_NOT_CONFIGURED" };
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: RAJIH_SYSTEM_POLICY },
          {
            role: "user",
            content: `Answer only from these approved sources. Distinguish publication from legal effectiveness: if effectiveFrom is later than today (${new Date().toISOString().slice(0, 10)}), state clearly that the text is published but not yet in force and do not present it as currently applicable. Include article numbers only when present in the source excerpts.\n${JSON.stringify(sources)}\n\nQuestion:\n${prompt}`,
          },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { status: "failed", code: "MODEL_PROVIDER_ERROR" };
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return { status: "failed", code: "MODEL_PROVIDER_ERROR" };
    }

    return { status: "ok", answer };
  } catch {
    return { status: "failed", code: "MODEL_PROVIDER_ERROR" };
  }
}

function retrievalFailureResponse(
  code: RetrievalDiagnosticCode,
  diagnostics: RuntimeDiagnostics,
) {
  if (code === "NO_DOCUMENTS") {
    return NextResponse.json(
      {
        error:
          "بيئة التشغيل الحالية لا ترى أي مصدر قانوني منشور. هذه مشكلة ربط أو صلاحية وصول وليست إجابة قانونية بعدم وجود النص.",
        diagnostics,
      },
      { status: 503 },
    );
  }

  if (code === "DOCUMENT_QUERY_ERROR" || code === "CHUNK_QUERY_ERROR" || code === "SOURCE_QUERY_ERROR") {
    return NextResponse.json(
      {
        error:
          "تعذر الوصول إلى فهرس المعرفة القانونية بصورة موثوقة. لم يتم إنشاء إجابة بديلة أو غير موثقة.",
        diagnostics,
      },
      { status: 502 },
    );
  }

  const result: RajihAnswer = abstain([
    "تم الوصول إلى فهرس المصادر المنشورة، لكن لم يتم العثور على مقطع قانوني مطابق بدرجة كافية لهذا السؤال.",
    "أعد صياغة السؤال أو حدّد رقم القانون أو المادة إن كان معروفاً.",
  ]);

  return NextResponse.json({ ...result, diagnostics });
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

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json(
      {
        error: "إعدادات Supabase العامة اللازمة لراجح غير متاحة في بيئة التشغيل.",
        diagnostics: diagnosticsFor("DOCUMENT_QUERY_ERROR"),
      },
      { status: 503 },
    );
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") {
    return NextResponse.json(
      { error: "جلسة الدخول غير صالحة أو منتهية. سجّل الدخول مرة أخرى ثم أعد المحاولة." },
      { status: 401 },
    );
  }

  const retrieval = await retrieveApprovedSources(supabase, { ...payload, prompt });

  if (retrieval.status === "failed") {
    const diagnostics = diagnosticsFor(retrieval.code, {
      strategy: retrieval.strategy,
      documentCount: retrieval.documentCount,
      chunkCount: retrieval.chunkCount,
    });

    console.warn("[RAJIH retrieval failed]", {
      code: diagnostics.code,
      strategy: diagnostics.strategy,
      documentCount: diagnostics.documentCount,
      chunkCount: diagnostics.chunkCount,
      runtimeProjectRef: diagnostics.runtimeProjectRef,
    });

    return retrievalFailureResponse(retrieval.code, diagnostics);
  }

  console.info("[RAJIH retrieval ok]", {
    strategy: retrieval.strategy,
    documentCount: retrieval.documentCount,
    chunkCount: retrieval.chunkCount,
    runtimeProjectRef: getRuntimeProjectRef(),
  });

  if (payload.organizationId) {
    await supabase.from("audit_logs").insert({
      organization_id: payload.organizationId,
      user_id: userId,
      action: "rajih.retrieval",
      resource_type: payload.matterId ? "matter" : "legal_knowledge",
      resource_id: payload.matterId ?? null,
      metadata: {
        source_count: retrieval.citations.length,
        retrieval_strategy: retrieval.strategy,
      },
    });
  }

  const modelResult = await callConfiguredModel(prompt, retrieval.citations);

  if (modelResult.status === "failed") {
    const diagnostics = diagnosticsFor(modelResult.code, {
      strategy: retrieval.strategy,
      documentCount: retrieval.documentCount,
      chunkCount: retrieval.chunkCount,
    });

    console.warn("[RAJIH model unavailable]", {
      code: diagnostics.code,
      strategy: diagnostics.strategy,
      documentCount: diagnostics.documentCount,
      chunkCount: diagnostics.chunkCount,
    });

    return NextResponse.json(
      {
        status: "abstained",
        answer:
          "تم العثور على المصدر القانوني المطابق والاستشهادات، لكن تعذر تشغيل مزود التحليل الآن. لم يتم إنشاء تحليل بديل غير موثق.",
        citations: retrieval.citations,
        confidence: "low",
        needsLawyerReview: true,
        missingInformation: ["تشغيل مزود النموذج والتحقق من الإجابة."],
        diagnostics,
      } satisfies RajihAnswer & { diagnostics: RuntimeDiagnostics },
      { status: 502 },
    );
  }

  return NextResponse.json({
    status: "answered",
    answer: modelResult.answer,
    citations: retrieval.citations,
    confidence: "medium",
    needsLawyerReview: true,
    missingInformation: [],
  } satisfies RajihAnswer);
}
