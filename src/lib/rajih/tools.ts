import type { SupabaseClient } from "@supabase/supabase-js";
import type { RajihCitation } from "@/lib/rajih/policy";
import { retrieveApprovedSources } from "@/lib/rajih/retrieval";
import type { ProviderToolDefinition } from "@/lib/rajih/provider";

export type RajihToolName =
  | "search_law"
  | "find_matter"
  | "get_matter_context"
  | "get_client_context"
  | "get_case_timeline";

export type ToolExecutionResult = {
  ok: boolean;
  tool: RajihToolName;
  data: unknown;
  citations?: RajihCitation[];
  error?: string;
};

export const RAJIH_TOOL_DEFINITIONS: ProviderToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_law",
      description:
        "Search approved and published legal sources. Use this before making a legal conclusion, citing a statute, or assessing whether a rule is currently in force.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Focused Arabic legal research query, ideally including law number/year or the legal issue.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_matter",
      description:
        "Find an accessible matter by case number or title. RLS limits results to matters the signed-in user may access.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Case number, matter title, or a short identifying phrase.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_matter_context",
      description:
        "Read the basic context for one accessible matter: case number, title, court, category, status, and linked client id.",
      parameters: {
        type: "object",
        properties: {
          matterId: { type: "string", description: "Matter UUID returned by find_matter or supplied by AXIA." },
        },
        required: ["matterId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_client_context",
      description:
        "Read minimal non-secret client context for an accessible client: name, type, and organization relationship.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "Client UUID linked to an accessible matter." },
        },
        required: ["clientId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_case_timeline",
      description:
        "Build the currently available AXIA timeline for an accessible matter from matter timestamps and document metadata. It does not invent hearings or events that are not stored.",
      parameters: {
        type: "object",
        properties: {
          matterId: { type: "string", description: "Matter UUID." },
        },
        required: ["matterId"],
        additionalProperties: false,
      },
    },
  },
];

function parseArguments(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function readString(args: Record<string, unknown>, key: string) {
  const value = args[key];
  return typeof value === "string" ? value.trim() : "";
}

async function searchLaw(
  supabase: SupabaseClient,
  args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  const query = readString(args, "query");
  if (!query) {
    return { ok: false, tool: "search_law", data: null, error: "query is required" };
  }

  const result = await retrieveApprovedSources(supabase, { prompt: query });

  if (result.status === "failed") {
    return {
      ok: false,
      tool: "search_law",
      data: {
        code: result.code,
        strategy: result.strategy,
        documentCount: result.documentCount,
        chunkCount: result.chunkCount,
      },
      error: "Approved legal retrieval did not return usable evidence.",
    };
  }

  const citations = result.citations.slice(0, 8);
  return {
    ok: true,
    tool: "search_law",
    citations,
    data: {
      strategy: result.strategy,
      evidence: citations.map((citation) => ({
        documentId: citation.documentId,
        title: citation.title,
        version: citation.version,
        authority: citation.sourceAuthority,
        effectiveFrom: citation.effectiveFrom ?? null,
        effectiveTo: citation.effectiveTo ?? null,
        excerpt: citation.excerpt,
      })),
    },
  };
}

async function findMatter(
  supabase: SupabaseClient,
  args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  const query = readString(args, "query").replace(/[%,]/g, " ");
  if (!query) {
    return { ok: false, tool: "find_matter", data: null, error: "query is required" };
  }

  const result = await supabase
    .from("matters")
    .select("id,case_number,title,court,category,status,client_id")
    .or(`case_number.ilike.%${query}%,title.ilike.%${query}%`)
    .limit(5);

  if (result.error) {
    return { ok: false, tool: "find_matter", data: null, error: "Matter lookup failed." };
  }

  return {
    ok: true,
    tool: "find_matter",
    data: { matters: result.data ?? [] },
  };
}

async function getMatterContext(
  supabase: SupabaseClient,
  args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  const matterId = readString(args, "matterId");
  if (!matterId) {
    return { ok: false, tool: "get_matter_context", data: null, error: "matterId is required" };
  }

  const result = await supabase
    .from("matters")
    .select("id,organization_id,client_id,case_number,title,court,category,status,created_at,updated_at")
    .eq("id", matterId)
    .maybeSingle();

  if (result.error || !result.data) {
    return {
      ok: false,
      tool: "get_matter_context",
      data: null,
      error: "Matter is unavailable or not authorized.",
    };
  }

  return { ok: true, tool: "get_matter_context", data: result.data };
}

async function getClientContext(
  supabase: SupabaseClient,
  args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  const clientId = readString(args, "clientId");
  if (!clientId) {
    return { ok: false, tool: "get_client_context", data: null, error: "clientId is required" };
  }

  const result = await supabase
    .from("clients")
    .select("id,organization_id,name,type,created_at,updated_at")
    .eq("id", clientId)
    .maybeSingle();

  if (result.error || !result.data) {
    return {
      ok: false,
      tool: "get_client_context",
      data: null,
      error: "Client is unavailable or not authorized.",
    };
  }

  return { ok: true, tool: "get_client_context", data: result.data };
}

async function getCaseTimeline(
  supabase: SupabaseClient,
  args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  const matterId = readString(args, "matterId");
  if (!matterId) {
    return { ok: false, tool: "get_case_timeline", data: null, error: "matterId is required" };
  }

  const [matterResult, documentsResult] = await Promise.all([
    supabase
      .from("matters")
      .select("id,case_number,title,status,created_at,updated_at")
      .eq("id", matterId)
      .maybeSingle(),
    supabase
      .from("documents")
      .select("id,title,mime_type,created_at")
      .eq("matter_id", matterId)
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  if (matterResult.error || !matterResult.data) {
    return {
      ok: false,
      tool: "get_case_timeline",
      data: null,
      error: "Matter is unavailable or not authorized.",
    };
  }

  if (documentsResult.error) {
    return {
      ok: false,
      tool: "get_case_timeline",
      data: null,
      error: "Matter documents could not be read.",
    };
  }

  const events = [
    {
      type: "matter_created",
      at: matterResult.data.created_at,
      label: "إنشاء ملف القضية في AXIA",
    },
    ...(matterResult.data.updated_at && matterResult.data.updated_at !== matterResult.data.created_at
      ? [
          {
            type: "matter_updated",
            at: matterResult.data.updated_at,
            label: "آخر تحديث مسجل لملف القضية",
          },
        ]
      : []),
    ...(documentsResult.data ?? []).map((document) => ({
      type: "document_added",
      at: document.created_at,
      label: `إضافة مستند: ${document.title}`,
      documentId: document.id,
      mimeType: document.mime_type,
    })),
  ].sort((left, right) => String(left.at).localeCompare(String(right.at)));

  return {
    ok: true,
    tool: "get_case_timeline",
    data: {
      matter: {
        id: matterResult.data.id,
        caseNumber: matterResult.data.case_number,
        title: matterResult.data.title,
        status: matterResult.data.status,
      },
      events,
      limitation:
        "هذا الخط الزمني يعكس فقط البيانات والمستندات المخزنة فعلياً في AXIA حالياً، ولا يفترض جلسات أو وقائع غير مسجلة.",
    },
  };
}

export async function executeRajihTool(input: {
  supabase: SupabaseClient;
  name: string;
  rawArguments: string;
}): Promise<ToolExecutionResult> {
  const args = parseArguments(input.rawArguments);

  switch (input.name as RajihToolName) {
    case "search_law":
      return searchLaw(input.supabase, args);
    case "find_matter":
      return findMatter(input.supabase, args);
    case "get_matter_context":
      return getMatterContext(input.supabase, args);
    case "get_client_context":
      return getClientContext(input.supabase, args);
    case "get_case_timeline":
      return getCaseTimeline(input.supabase, args);
    default:
      return {
        ok: false,
        tool: "search_law",
        data: null,
        error: "Unknown or non-approved tool.",
      };
  }
}
