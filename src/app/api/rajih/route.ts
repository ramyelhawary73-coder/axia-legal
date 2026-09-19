import { NextResponse } from "next/server";
import { abstain, RAJIH_SYSTEM_POLICY, type RajihAnswer, type RajihCitation } from "@/lib/rajih/policy";

type RajihRequest = {
  prompt?: string;
  organizationId?: string;
  matterId?: string;
};

type RetrievedSource = RajihCitation & { approved: boolean };

async function retrieveApprovedSources(): Promise<RetrievedSource[]> {
  // Deliberately fail closed until Supabase Auth, RLS, and the approved knowledge
  // ingestion pipeline are configured. Never search public or unscoped content.
  return [];
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

  const sources = (await retrieveApprovedSources()).filter((source) => source.approved);
  if (sources.length === 0) {
    const result: RajihAnswer = abstain([
      "لا توجد حالياً قاعدة معرفة قانونية منشورة ومصرح بها لهذا الطلب.",
      "يلزم تحديد المؤسسة والقضية عند طلب البحث في ملف قضية.",
    ]);
    return NextResponse.json(result);
  }

  const answer = await callConfiguredModel(prompt, sources);
  if (!answer) return NextResponse.json(abstain(["تعذر تشغيل مزود النموذج أو التحقق من الإجابة."]));

  return NextResponse.json({
    status: "answered",
    answer,
    citations: sources,
    confidence: "medium",
    needsLawyerReview: true,
    missingInformation: [],
  } satisfies RajihAnswer);
}
