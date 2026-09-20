import { NextResponse } from "next/server";
import { runRajihAgent } from "@/lib/rajih/agent";
import { createClient } from "@/lib/supabase/server";

type RajihRequest = {
  prompt?: string;
  organizationId?: string;
  matterId?: string;
};

export async function POST(request: Request) {
  let payload: RajihRequest;
  try {
    payload = (await request.json()) as RajihRequest;
  } catch {
    return NextResponse.json({ error: "تعذر قراءة الطلب." }, { status: 400 });
  }

  const prompt = payload.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "اكتب سؤالك القانوني أولاً." }, { status: 400 });
  }

  if (prompt.length > 8_000) {
    return NextResponse.json({ error: "السؤال أطول من الحد المسموح به." }, { status: 413 });
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json(
      {
        error: "خدمة راجح غير متاحة مؤقتاً. أعد المحاولة بعد قليل.",
      },
      { status: 503 },
    );
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return NextResponse.json(
      {
        error: "انتهت جلسة الدخول. سجّل الدخول مرة أخرى ثم أعد المحاولة.",
      },
      { status: 401 },
    );
  }

  const result = await runRajihAgent({
    supabase,
    prompt,
    matterId: payload.matterId,
    organizationId: payload.organizationId,
  });

  if (payload.organizationId) {
    await supabase.from("audit_logs").insert({
      organization_id: payload.organizationId,
      user_id: userId,
      action: "rajih.agent.run",
      resource_type: payload.matterId ? "matter" : "legal_research",
      resource_id: payload.matterId ?? null,
      metadata: {
        status: result.status,
        trace: result.trace,
        citation_count:
          result.status === "ok"
            ? result.answer.citations.length
            : result.citations.length,
        attempted_models: result.attemptedModels,
        selected_model: result.status === "ok" ? result.model : null,
      },
    });
  }

  if (result.status === "failed") {
    console.warn("[RAJIH agent failed]", {
      code: result.code,
      trace: result.trace,
      provider: result.provider,
      attemptedModels: result.attemptedModels,
      failedModel: result.failedModel,
      httpStatus: result.httpStatus,
      safeMessage: result.safeMessage,
      citationCount: result.citations.length,
    });

    const providerFailure =
      result.code.startsWith("PROVIDER_") &&
      result.code !== "PROVIDER_NOT_CONFIGURED";

    return NextResponse.json(
      {
        status: "abstained",
        answer:
          result.citations.length > 0
            ? "تم العثور على مصادر قانونية مرتبطة بسؤالك، لكن تعذر استكمال التحليل الآن. أعد المحاولة بعد قليل، ولن أعرض استنتاجاً قانونياً غير مكتمل."
            : "تعذر استكمال البحث القانوني الآن. أعد المحاولة بعد قليل، أو حدّد رقم القانون أو القضية أو المادة إن أمكن.",
        citations: result.citations,
        confidence: "low",
        needsLawyerReview: true,
        missingInformation: [],
      },
      { status: providerFailure ? 502 : 503 },
    );
  }

  return NextResponse.json(result.answer);
}
