import { NextResponse } from "next/server";
import { runRajihAgent } from "@/lib/rajih/agent";
import { createClient } from "@/lib/supabase/server";

type RajihRequest = {
  prompt?: string;
  organizationId?: string;
  matterId?: string;
};

function previewOnlyDiagnostics(value: Record<string, unknown>) {
  return process.env.VERCEL_ENV === "production" ? undefined : value;
}

export async function POST(request: Request) {
  let payload: RajihRequest;
  try {
    payload = (await request.json()) as RajihRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = payload.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  if (prompt.length > 8_000) {
    return NextResponse.json({ error: "prompt is too long" }, { status: 413 });
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json(
      {
        error: "إعدادات Supabase العامة اللازمة لراجح غير متاحة في بيئة التشغيل.",
      },
      { status: 503 },
    );
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return NextResponse.json(
      {
        error: "جلسة الدخول غير صالحة أو منتهية. سجّل الدخول مرة أخرى ثم أعد المحاولة.",
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
            ? "راجح جمع أدلة قانونية موثقة، لكن تعذر إكمال دورة التحليل الآلي بأمان. لم يتم إنشاء استنتاج بديل غير موثق."
            : "تعذر على راجح إكمال دورة البحث والتحليل بأمان. لم يتم إنشاء إجابة بديلة غير موثقة.",
        citations: result.citations,
        confidence: "low",
        needsLawyerReview: true,
        missingInformation: ["إكمال دورة Agent والتحقق من مزود النموذج."],
        agentTrace: result.trace,
        diagnostics: previewOnlyDiagnostics({
          code: result.code,
          provider: result.provider,
          attemptedModels: result.attemptedModels,
          failedModel: result.failedModel,
          httpStatus: result.httpStatus,
          safeMessage: result.safeMessage,
        }),
      },
      { status: providerFailure ? 502 : 503 },
    );
  }

  return NextResponse.json({
    ...result.answer,
    agentTrace: result.trace,
    model: result.model,
    attemptedModels: result.attemptedModels,
  });
}
