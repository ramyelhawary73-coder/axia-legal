import type { Client, CourtCategory, Matter } from "@/types/legal";

export type MatterCourt = Exclude<CourtCategory, "غير مسجل">;
export type MatterCategory = NonNullable<Matter["category"]>;
export type MatterClientRole = Exclude<Matter["clientRole"], "غير مسجل">;

export type MatterCreateInput = {
  caseNumber: string;
  title: string;
  clientId: string;
  court?: string;
  category?: string;
  caseYear?: number;
  circuit?: string;
  clientRole?: Matter["clientRole"];
  filingDate?: string;
  claimAmount?: number;
  currency?: string;
  notes?: string;
};

type MatterSelectOption<T extends string> = Readonly<{
  value: T;
  label: string;
}>;

export const MATTERS_VIEW_COURT_OPTIONS = [
  { value: "محكمة النقض", label: "محكمة النقض" },
  { value: "المحكمة الاقتصادية", label: "المحكمة الاقتصادية" },
  { value: "مجلس الدولة (القضاء الإداري)", label: "مجلس الدولة" },
  { value: "استئناف عالي", label: "استئناف عالي" },
  { value: "ابتدائية كلي", label: "ابتدائية كلي" },
] as const satisfies readonly MatterSelectOption<MatterCourt>[];

export const CLIENT_DETAIL_COURT_OPTIONS = [
  { value: "محكمة النقض", label: "محكمة النقض" },
  { value: "المحكمة الاقتصادية", label: "المحكمة الاقتصادية" },
  {
    value: "مجلس الدولة (القضاء الإداري)",
    label: "مجلس الدولة (القضاء الإداري)",
  },
  { value: "استئناف عالي", label: "استئناف عالي" },
  { value: "ابتدائية كلي", label: "ابتدائية كلي" },
  { value: "جزئية", label: "جزئية" },
] as const satisfies readonly MatterSelectOption<MatterCourt>[];

export const MATTER_CATEGORY_OPTIONS = [
  { value: "مدني", label: "مدنية" },
  { value: "جنائي", label: "جنائية" },
  { value: "عمالي", label: "عمالية" },
  { value: "تجاري", label: "تجارية" },
  { value: "إداري", label: "إدارية" },
  { value: "أسرة", label: "أسرة" },
] as const satisfies readonly MatterSelectOption<MatterCategory>[];

export const MATTER_CLIENT_ROLE_OPTIONS = [
  { value: "مدعي", label: "مدعي" },
  { value: "مدعى عليه", label: "مدعى عليه" },
  { value: "طاعن", label: "طاعن" },
  { value: "مطعون ضده", label: "مطعون ضده" },
  { value: "مستأنف", label: "مستأنف" },
  { value: "مستأنف ضده", label: "مستأنف ضده" },
] as const satisfies readonly MatterSelectOption<MatterClientRole>[];

function normalizeClientName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar-EG");
}

export function matterBelongsToClient(
  matter: Pick<Matter, "clientId" | "clientName">,
  client: Pick<Client, "id" | "name">,
): boolean {
  const matterClientId = matter.clientId?.trim();

  if (matterClientId) {
    return matterClientId === client.id;
  }

  const matterClientName = normalizeClientName(matter.clientName);
  const clientName = normalizeClientName(client.name);

  if (!matterClientName || !clientName) {
    return false;
  }

  return (
    matterClientName.includes(clientName) ||
    clientName.includes(matterClientName)
  );
}
