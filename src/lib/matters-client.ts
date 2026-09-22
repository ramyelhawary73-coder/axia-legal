import { readJsonResponse } from "@/lib/api/client-response";
import type { Matter } from "@/types/legal";

export type MatterClientOption = {
  id: string;
  name: string;
};

export type MattersWorkspace = {
  matters: Matter[];
  clients: MatterClientOption[];
};

export async function loadMattersWorkspace(): Promise<MattersWorkspace> {
  const response = await fetch("/api/matters", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  return readJsonResponse<MattersWorkspace>(response, "تعذر الاتصال بخدمة القضايا.");
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

  const payload = await readJsonResponse<{ matter: Matter }>(response, "تعذر الاتصال بخدمة القضايا.");
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

  const payload = await readJsonResponse<{ matter: Matter }>(response, "تعذر الاتصال بخدمة القضايا.");
  return payload.matter;
}
