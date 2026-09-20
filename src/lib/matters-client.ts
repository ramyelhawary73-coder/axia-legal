import type { Matter } from "@/types/legal";

export type MatterClientOption = {
  id: string;
  name: string;
};

export type MattersWorkspace = {
  matters: Matter[];
  clients: MatterClientOption[];
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "تعذر الاتصال بخدمة القضايا.");
  }

  return payload as T;
}

export async function loadMattersWorkspace(): Promise<MattersWorkspace> {
  const response = await fetch("/api/matters", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  return readJsonResponse<MattersWorkspace>(response);
}

export async function createPersistentMatter(input: {
  caseNumber: string;
  title: string;
  court?: string;
  category?: string;
  clientId: string;
  caseYear?: number;
  circuit?: string;
  clientRole?: Matter["clientRole"];
  filingDate?: string;
  claimAmount?: number;
  currency?: string;
  notes?: string;
}): Promise<Matter> {
  const response = await fetch("/api/matters", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await readJsonResponse<{ matter: Matter }>(response);
  return payload.matter;
}


export async function updatePersistentMatter(
  id: string,
  updates: {
    clientId?: string;
    caseNumber?: string;
    title?: string;
    court?: string | null;
    category?: string | null;
    caseYear?: number | null;
    circuit?: string | null;
    clientRole?: Matter["clientRole"] | null;
    filingDate?: string | null;
    claimAmount?: number | null;
    currency?: string;
    notes?: string | null;
    status?: "open" | "closed" | "archived";
    stage?:
      | "active"
      | "reserved_for_judgment"
      | "documents_pending"
      | "judgment_issued"
      | "appeal"
      | "cassation";
  },
): Promise<Matter> {
  const response = await fetch("/api/matters", {
    method: "PATCH",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ id, ...updates }),
  });

  const payload = await readJsonResponse<{ matter: Matter }>(response);
  return payload.matter;
}
