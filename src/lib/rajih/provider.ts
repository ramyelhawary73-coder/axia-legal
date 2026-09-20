export type ProviderRole = "system" | "user" | "assistant" | "tool";

export type ProviderToolCall = {
  id: string;
  type: "function";
  extra_content?: {
    google?: {
      thought_signature?: string;
    };
  };
  function: {
    name: string;
    arguments: string;
  };
};

export type ProviderMessage = {
  role: ProviderRole;
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ProviderToolCall[];
};

export type ProviderToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ProviderSuccess = {
  status: "ok";
  message: ProviderMessage;
  model: string;
};

export type ProviderFailure = {
  status: "failed";
  model?: string;
  code:
    | "PROVIDER_NOT_CONFIGURED"
    | "PROVIDER_UNAUTHORIZED"
    | "PROVIDER_RATE_LIMITED"
    | "PROVIDER_BAD_REQUEST"
    | "PROVIDER_UNAVAILABLE"
    | "PROVIDER_INVALID_RESPONSE";
  httpStatus?: number;
  safeMessage?: string;
};

export type ProviderResult = ProviderSuccess | ProviderFailure;

const MAX_PROVIDER_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const GEMINI_MODEL_FAILOVER_CHAIN = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
] as const;

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryDelayMilliseconds(attempt: number, retryAfter: string | null) {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, 8_000);
    }
  }

  return Math.min(750 * 2 ** Math.max(0, attempt - 1), 4_000);
}

function normalizeOpenAIBaseUrl(configuredUrl: string) {
  let base = configuredUrl.trim().replace(/\/+$/, "");

  if (base.endsWith("/chat/completions")) {
    base = base.slice(0, -"/chat/completions".length);
  }

  if (base.endsWith("/v1beta/openai")) {
    return base;
  }

  if (base.endsWith("/v1beta")) {
    return `${base}/openai`;
  }

  if (base === "https://generativelanguage.googleapis.com") {
    return `${base}/v1beta/openai`;
  }

  return base;
}

function mapProviderFailure(
  model: string,
  httpStatus: number,
  safeMessage?: string,
): ProviderFailure {
  if (httpStatus === 401 || httpStatus === 403) {
    return { status: "failed", model, code: "PROVIDER_UNAUTHORIZED", httpStatus, safeMessage };
  }

  if (httpStatus === 429) {
    return { status: "failed", model, code: "PROVIDER_RATE_LIMITED", httpStatus, safeMessage };
  }

  if (httpStatus >= 400 && httpStatus < 500) {
    return { status: "failed", model, code: "PROVIDER_BAD_REQUEST", httpStatus, safeMessage };
  }

  return { status: "failed", model, code: "PROVIDER_UNAVAILABLE", httpStatus, safeMessage };
}

function readSafeProviderMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;

  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return undefined;

  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message.slice(0, 240) : undefined;
}

function isToolCall(value: unknown): value is ProviderToolCall {
  if (!value || typeof value !== "object") return false;

  const candidate = value as {
    id?: unknown;
    type?: unknown;
    function?: { name?: unknown; arguments?: unknown };
  };

  return (
    typeof candidate.id === "string" &&
    candidate.type === "function" &&
    typeof candidate.function?.name === "string" &&
    typeof candidate.function?.arguments === "string"
  );
}

export function getProviderModelCandidates() {
  const baseUrl = process.env.RAJIH_AI_BASE_URL?.trim();
  const primaryModel = process.env.RAJIH_AI_MODEL?.trim();

  if (!primaryModel) return [];

  const isGeminiOpenAICompatible = Boolean(
    baseUrl?.includes("generativelanguage.googleapis.com"),
  );

  if (!isGeminiOpenAICompatible) return [primaryModel];

  const primaryIndex = GEMINI_MODEL_FAILOVER_CHAIN.indexOf(
    primaryModel as (typeof GEMINI_MODEL_FAILOVER_CHAIN)[number],
  );

  if (primaryIndex < 0) return [primaryModel];

  return [...GEMINI_MODEL_FAILOVER_CHAIN.slice(primaryIndex)];
}

export function isProviderFailoverEligible(failure: ProviderFailure) {
  return (
    failure.code === "PROVIDER_UNAVAILABLE" ||
    failure.code === "PROVIDER_RATE_LIMITED"
  );
}

export function getProviderConfigSummary() {
  const baseUrl = process.env.RAJIH_AI_BASE_URL?.trim();
  const modelCandidates = getProviderModelCandidates();
  const primaryModel = modelCandidates[0];
  const apiKeyPresent = Boolean(process.env.RAJIH_AI_API_KEY?.trim());

  return {
    configured: Boolean(baseUrl && primaryModel && apiKeyPresent),
    model: primaryModel || undefined,
    fallbackModels: modelCandidates.slice(1),
    baseUrlKind: baseUrl
      ? baseUrl.includes("generativelanguage.googleapis.com")
        ? "gemini-openai-compatible"
        : "custom-openai-compatible"
      : undefined,
  };
}

export async function callRajihProvider(input: {
  messages: ProviderMessage[];
  tools?: ProviderToolDefinition[];
  model?: string;
}): Promise<ProviderResult> {
  const configuredUrl = process.env.RAJIH_AI_BASE_URL?.trim();
  const apiKey = process.env.RAJIH_AI_API_KEY?.trim();
  const configuredModel = process.env.RAJIH_AI_MODEL?.trim();
  const model = input.model?.trim() || configuredModel;

  if (!configuredUrl || !apiKey || !model) {
    return { status: "failed", model, code: "PROVIDER_NOT_CONFIGURED" };
  }

  const baseUrl = normalizeOpenAIBaseUrl(configuredUrl);
  const endpoint = `${baseUrl}/chat/completions`;

  for (let attempt = 1; attempt <= MAX_PROVIDER_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          messages: input.messages,
          ...(input.tools?.length
            ? {
                tools: input.tools,
                tool_choice: "auto",
              }
            : {}),
        }),
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            choices?: Array<{
              message?: {
                role?: unknown;
                content?: unknown;
                tool_calls?: unknown;
              };
            }>;
          }
        | null;

      if (!response.ok) {
        const safeMessage = readSafeProviderMessage(payload);

        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < MAX_PROVIDER_ATTEMPTS) {
          await wait(retryDelayMilliseconds(attempt, response.headers.get("retry-after")));
          continue;
        }

        return mapProviderFailure(model, response.status, safeMessage);
      }

      const rawMessage = payload?.choices?.[0]?.message;
      if (!rawMessage) {
        return { status: "failed", model, code: "PROVIDER_INVALID_RESPONSE" };
      }

      const toolCalls = Array.isArray(rawMessage.tool_calls)
        ? rawMessage.tool_calls.filter(isToolCall)
        : undefined;

      const content =
        typeof rawMessage.content === "string"
          ? rawMessage.content
          : rawMessage.content == null
            ? null
            : String(rawMessage.content);

      if (!content && !toolCalls?.length) {
        return { status: "failed", model, code: "PROVIDER_INVALID_RESPONSE" };
      }

      return {
        status: "ok",
        model,
        message: {
          role: "assistant",
          content,
          ...(toolCalls?.length ? { tool_calls: toolCalls } : {}),
        },
      };
    } catch {
      if (attempt < MAX_PROVIDER_ATTEMPTS) {
        await wait(retryDelayMilliseconds(attempt, null));
        continue;
      }

      return { status: "failed", model, code: "PROVIDER_UNAVAILABLE" };
    }
  }

  return { status: "failed", model, code: "PROVIDER_UNAVAILABLE" };
}
