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

function mapProviderFailure(httpStatus: number, safeMessage?: string): ProviderFailure {
  if (httpStatus === 401 || httpStatus === 403) {
    return { status: "failed", code: "PROVIDER_UNAUTHORIZED", httpStatus, safeMessage };
  }

  if (httpStatus === 429) {
    return { status: "failed", code: "PROVIDER_RATE_LIMITED", httpStatus, safeMessage };
  }

  if (httpStatus >= 400 && httpStatus < 500) {
    return { status: "failed", code: "PROVIDER_BAD_REQUEST", httpStatus, safeMessage };
  }

  return { status: "failed", code: "PROVIDER_UNAVAILABLE", httpStatus, safeMessage };
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

export function getProviderConfigSummary() {
  const baseUrl = process.env.RAJIH_AI_BASE_URL?.trim();
  const model = process.env.RAJIH_AI_MODEL?.trim();
  const apiKeyPresent = Boolean(process.env.RAJIH_AI_API_KEY?.trim());

  return {
    configured: Boolean(baseUrl && model && apiKeyPresent),
    model: model || undefined,
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
}): Promise<ProviderResult> {
  const configuredUrl = process.env.RAJIH_AI_BASE_URL?.trim();
  const apiKey = process.env.RAJIH_AI_API_KEY?.trim();
  const model = process.env.RAJIH_AI_MODEL?.trim();

  if (!configuredUrl || !apiKey || !model) {
    return { status: "failed", code: "PROVIDER_NOT_CONFIGURED" };
  }

  const baseUrl = normalizeOpenAIBaseUrl(configuredUrl);
  const endpoint = `${baseUrl}/chat/completions`;

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
      return mapProviderFailure(response.status, readSafeProviderMessage(payload));
    }

    const rawMessage = payload?.choices?.[0]?.message;
    if (!rawMessage) {
      return { status: "failed", code: "PROVIDER_INVALID_RESPONSE" };
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
      return { status: "failed", code: "PROVIDER_INVALID_RESPONSE" };
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
    return { status: "failed", code: "PROVIDER_UNAVAILABLE" };
  }
}
