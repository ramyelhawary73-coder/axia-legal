import type { SupabaseClient } from "@supabase/supabase-js";
import type { RajihAnswer, RajihCitation } from "@/lib/rajih/policy";
import { RAJIH_SYSTEM_POLICY } from "@/lib/rajih/policy";
import {
  callRajihProvider,
  getProviderConfigSummary,
  getProviderModelCandidates,
  isProviderFailoverEligible,
  type ProviderFailure,
  type ProviderMessage,
} from "@/lib/rajih/provider";
import {
  executeRajihTool,
  RAJIH_TOOL_DEFINITIONS,
} from "@/lib/rajih/tools";

const MAX_AGENT_STEPS = 6;

export type AgentTraceStep = {
  step: number;
  tool: string;
  ok: boolean;
};

export type RajihAgentSuccess = {
  status: "ok";
  answer: RajihAnswer;
  trace: AgentTraceStep[];
  model: string;
  attemptedModels: string[];
};

export type RajihAgentFailure = {
  status: "failed";
  code:
    | ProviderFailure["code"]
    | "AGENT_MAX_STEPS"
    | "AGENT_NO_FINAL_ANSWER";
  trace: AgentTraceStep[];
  provider: ReturnType<typeof getProviderConfigSummary>;
  attemptedModels: string[];
  failedModel?: string;
  httpStatus?: number;
  safeMessage?: string;
  citations: RajihCitation[];
};

export type RajihAgentResult = RajihAgentSuccess | RajihAgentFailure;

type SingleModelResult =
  | {
      status: "ok";
      answer: RajihAnswer;
      trace: AgentTraceStep[];
      model: string;
    }
  | {
      status: "failed";
      code: RajihAgentFailure["code"];
      trace: AgentTraceStep[];
      failedModel: string;
      httpStatus?: number;
      safeMessage?: string;
      citations: RajihCitation[];
    };

function agentSystemPrompt() {
  return [
    RAJIH_SYSTEM_POLICY,
    "",
    "You are operating as the RAJIH legal agent inside AXIA Legal.",
    "You have read-only tools. Use them to gather evidence before answering.",
    "For any legal conclusion, statute interpretation, procedural assessment, defense theory, or statement about what law applies, you MUST call search_law first.",
    "When the user refers to a case but does not provide a matter UUID, use find_matter first. If several matters match, ask the user to identify the correct one rather than guessing.",
    "Use get_matter_context and get_client_context only for records the tools return. Never infer inaccessible tenant data.",
    "Use get_case_timeline only as a record of facts stored in AXIA. Never invent hearings, filings, dates, evidence, or procedural events.",
    "You may analyze and draft, but you may not modify records, send messages, file documents, approve actions, change permissions, or make irreversible decisions.",
    "Do not reveal hidden reasoning or chain-of-thought. The trace may contain tool names and success/failure only.",
    "When sources conflict or facts are incomplete, identify the gap explicitly.",
    "Final answers must distinguish: known case facts, legal sources, analysis/inference, and missing information.",
    "If a legal source has an effective date later than today, state clearly that it is published but not yet in force.",
    "Always remind the user that a qualified lawyer must review the result before relying on it.",
  ].join("\n");
}

function dedupeCitations(citations: RajihCitation[]) {
  const seen = new Set<string>();

  return citations.filter((citation) => {
    const key = [
      citation.documentId,
      citation.version,
      citation.excerpt.slice(0, 120),
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function safeToolPayload(value: unknown) {
  try {
    const json = JSON.stringify(value);
    return json.length <= 12_000 ? json : `${json.slice(0, 12_000)}…`;
  } catch {
    return JSON.stringify({ ok: false, error: "Tool result could not be serialized." });
  }
}

async function runSingleModelAgent(input: {
  supabase: SupabaseClient;
  prompt: string;
  matterId?: string;
  organizationId?: string;
  model: string;
}): Promise<SingleModelResult> {
  const messages: ProviderMessage[] = [
    { role: "system", content: agentSystemPrompt() },
    {
      role: "user",
      content: [
        input.prompt,
        "",
        input.matterId ? `AXIA matter context id: ${input.matterId}` : null,
        input.organizationId ? `AXIA organization context id: ${input.organizationId}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  const trace: AgentTraceStep[] = [];
  const collectedCitations: RajihCitation[] = [];

  for (let step = 1; step <= MAX_AGENT_STEPS; step += 1) {
    const providerResult = await callRajihProvider({
      messages,
      tools: RAJIH_TOOL_DEFINITIONS,
      model: input.model,
    });

    if (providerResult.status === "failed") {
      return {
        status: "failed",
        code: providerResult.code,
        trace,
        failedModel: providerResult.model ?? input.model,
        httpStatus: providerResult.httpStatus,
        safeMessage: providerResult.safeMessage,
        citations: dedupeCitations(collectedCitations),
      };
    }

    const assistantMessage = providerResult.message;
    const toolCalls = assistantMessage.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const finalText = assistantMessage.content?.trim();

      if (!finalText) {
        return {
          status: "failed",
          code: "AGENT_NO_FINAL_ANSWER",
          trace,
          failedModel: input.model,
          citations: dedupeCitations(collectedCitations),
        };
      }

      const citations = dedupeCitations(collectedCitations);

      return {
        status: "ok",
        model: providerResult.model,
        trace,
        answer: {
          status: "answered",
          answer: finalText,
          citations,
          confidence: citations.length > 0 ? "medium" : "low",
          needsLawyerReview: true,
          missingInformation: [],
        },
      };
    }

    messages.push(assistantMessage);

    for (const toolCall of toolCalls) {
      const result = await executeRajihTool({
        supabase: input.supabase,
        name: toolCall.function.name,
        rawArguments: toolCall.function.arguments,
      });

      trace.push({
        step,
        tool: result.tool,
        ok: result.ok,
      });

      if (result.citations?.length) {
        collectedCitations.push(...result.citations);
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: safeToolPayload({
          ok: result.ok,
          data: result.data,
          error: result.error,
        }),
      });
    }
  }

  return {
    status: "failed",
    code: "AGENT_MAX_STEPS",
    trace,
    failedModel: input.model,
    citations: dedupeCitations(collectedCitations),
  };
}

export async function runRajihAgent(input: {
  supabase: SupabaseClient;
  prompt: string;
  matterId?: string;
  organizationId?: string;
}): Promise<RajihAgentResult> {
  const modelCandidates = getProviderModelCandidates();
  const attemptedModels: string[] = [];
  const collectedFailureCitations: RajihCitation[] = [];
  let lastFailure: Extract<SingleModelResult, { status: "failed" }> | null = null;

  if (modelCandidates.length === 0) {
    return {
      status: "failed",
      code: "PROVIDER_NOT_CONFIGURED",
      trace: [],
      provider: getProviderConfigSummary(),
      attemptedModels,
      citations: [],
    };
  }

  for (const model of modelCandidates) {
    attemptedModels.push(model);

    const attempt = await runSingleModelAgent({
      ...input,
      model,
    });

    if (attempt.status === "ok") {
      return {
        ...attempt,
        attemptedModels,
      };
    }

    lastFailure = attempt;
    collectedFailureCitations.push(...attempt.citations);

    const providerFailure: ProviderFailure = {
      status: "failed",
      model: attempt.failedModel,
      code:
        attempt.code.startsWith("PROVIDER_")
          ? (attempt.code as ProviderFailure["code"])
          : "PROVIDER_INVALID_RESPONSE",
      httpStatus: attempt.httpStatus,
      safeMessage: attempt.safeMessage,
    };

    if (
      !attempt.code.startsWith("PROVIDER_") ||
      !isProviderFailoverEligible(providerFailure)
    ) {
      break;
    }
  }

  return {
    status: "failed",
    code: lastFailure?.code ?? "PROVIDER_UNAVAILABLE",
    trace: lastFailure?.trace ?? [],
    provider: getProviderConfigSummary(),
    attemptedModels,
    failedModel: lastFailure?.failedModel,
    httpStatus: lastFailure?.httpStatus,
    safeMessage: lastFailure?.safeMessage,
    citations: dedupeCitations(collectedFailureCitations),
  };
}
