import type { Hearing, Matter } from "@/types/legal";

type ApiHearing = {
  id: string;
  matterId: string;
  hearingDate: string;
  hearingTime: string | null;
  court: string | null;
  circuit: string | null;
  hall: string | null;
  rollNumber: string | null;
  purpose: string | null;
  lastDecision: string | null;
  attendingUserId: string | null;
  status: "scheduled" | "completed" | "postponed" | "cancelled";
  pleadingNotes: string | null;
  isArchived: boolean;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "تعذر الاتصال بخدمة الجلسات.");
  }

  return payload as T;
}

function mapStatus(api: ApiHearing): Hearing["status"] {
  if (api.status === "postponed") return "مؤجلة";
  if (api.status === "completed" || api.status === "cancelled" || api.isArchived) {
    return "منتهية";
  }

  const today = new Date().toISOString().slice(0, 10);
  return api.hearingDate === today ? "اليوم" : "قادمة";
}

function mapHearing(api: ApiHearing, matters: Matter[]): Hearing {
  const matter = matters.find((item) => item.id === api.matterId);
  const roll = Number.parseInt(api.rollNumber || "", 10);

  return {
    id: api.id,
    matterId: api.matterId,
    caseNumber: matter?.caseNumber || "غير مسجل",
    court: api.court || matter?.court || "غير مسجل",
    circuit: api.circuit || matter?.circuit || "غير مسجل",
    hall: api.hall || "غير مسجل",
    rollNumber: Number.isFinite(roll) ? roll : 0,
    hearingDate: api.hearingDate,
    hearingTime: api.hearingTime || "غير مسجل",
    attendingLawyer: "غير مسجل",
    purpose: api.purpose || "غير مسجل",
    lastDecision: api.lastDecision || undefined,
    status: mapStatus(api),
    pleadingNotes: api.pleadingNotes || undefined,
    isArchived: api.isArchived,
  };
}

export async function loadPersistentHearings(matters: Matter[]): Promise<Hearing[]> {
  const response = await fetch("/api/hearings", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const payload = await readJsonResponse<{ hearings: ApiHearing[] }>(response);
  return payload.hearings.map((item) => mapHearing(item, matters));
}

export async function createPersistentHearing(
  input: {
    matterId: string;
    hearingDate: string;
    hearingTime?: string;
    court?: string;
    circuit?: string;
    hall?: string;
    rollNumber?: string;
    purpose?: string;
  },
  matters: Matter[],
): Promise<Hearing> {
  const response = await fetch("/api/hearings", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = await readJsonResponse<{ hearing: ApiHearing }>(response);
  return mapHearing(payload.hearing, matters);
}

export async function updatePersistentHearing(
  id: string,
  updates: {
    hearingDate?: string;
    hearingTime?: string | null;
    court?: string | null;
    circuit?: string | null;
    hall?: string | null;
    rollNumber?: string | null;
    purpose?: string | null;
    lastDecision?: string | null;
    pleadingNotes?: string | null;
    status?: "scheduled" | "completed" | "postponed" | "cancelled";
    isArchived?: boolean;
  },
  matters: Matter[],
): Promise<Hearing> {
  const response = await fetch("/api/hearings", {
    method: "PATCH",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ id, ...updates }),
  });
  const payload = await readJsonResponse<{ hearing: ApiHearing }>(response);
  return mapHearing(payload.hearing, matters);
}
