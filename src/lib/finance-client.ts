import type { Client, FinancialRecord, Matter } from "@/types/legal";

type ApiFinancialRecord = {
  id: string;
  clientId: string | null;
  matterId: string | null;
  recordType:
    | "fee_payment"
    | "expert_deposit"
    | "court_fee"
    | "administrative_expense"
    | "success_fee"
    | "other";
  direction: "income" | "expense";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "cancelled";
  dueDate: string | null;
  occurredAt: string | null;
  receiptNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "تعذر الاتصال بالخدمة المالية.");
  }

  return payload as T;
}

const typeFromApi: Record<ApiFinancialRecord["recordType"], FinancialRecord["type"]> = {
  fee_payment: "دفعة أتعاب",
  expert_deposit: "أمانة خبير",
  court_fee: "رسوم قضائية",
  administrative_expense: "مصروفات إدارية",
  success_fee: "أتعاب نجاح مؤخرة",
  other: "مصروفات إدارية",
};

const typeToApi: Record<FinancialRecord["type"], ApiFinancialRecord["recordType"]> = {
  "دفعة أتعاب": "fee_payment",
  "أمانة خبير": "expert_deposit",
  "رسوم قضائية": "court_fee",
  "مصروفات إدارية": "administrative_expense",
  "أتعاب نجاح مؤخرة": "success_fee",
};

function mapStatus(
  record: ApiFinancialRecord,
): FinancialRecord["status"] {
  if (record.status === "pending") return "مستحقة";
  if (record.direction === "expense") return "مسددة للمحكمة";
  return "محصلة";
}

function mapFinancial(
  record: ApiFinancialRecord,
  clients: Client[],
  matters: Matter[],
): FinancialRecord {
  const client = record.clientId
    ? clients.find((item) => item.id === record.clientId)
    : undefined;
  const matter = record.matterId
    ? matters.find((item) => item.id === record.matterId)
    : undefined;

  return {
    id: record.id,
    clientId: record.clientId ?? undefined,
    matterId: record.matterId ?? undefined,
    clientName: client?.name || matter?.clientName || "غير مسجل",
    matterCaseNumber: matter?.caseNumber || "عام بالمكتب",
    type: typeFromApi[record.recordType],
    amount: record.amount,
    currency: record.currency,
    direction: record.direction,
    date:
      record.occurredAt?.slice(0, 10) ||
      record.dueDate ||
      record.createdAt.slice(0, 10),
    status: mapStatus(record),
    receiptNumber: record.receiptNumber || "غير مسجل",
  };
}

export async function loadPersistentFinance(
  clients: Client[],
  matters: Matter[],
): Promise<FinancialRecord[]> {
  const response = await fetch("/api/finance", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const payload = await readJsonResponse<{ records: ApiFinancialRecord[] }>(response);
  return payload.records.map((record) => mapFinancial(record, clients, matters));
}

export async function createPersistentFinanceRecord(
  input: {
    clientId?: string;
    matterId?: string;
    type: FinancialRecord["type"];
    amount: number;
    status: FinancialRecord["status"];
    receiptNumber?: string;
  },
  clients: Client[],
  matters: Matter[],
): Promise<FinancialRecord> {
  const direction =
    input.type === "دفعة أتعاب" || input.type === "أتعاب نجاح مؤخرة"
      ? "income"
      : "expense";

  const apiStatus = input.status === "مستحقة" ? "pending" : "completed";

  const response = await fetch("/api/finance", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      clientId: input.clientId || null,
      matterId: input.matterId || null,
      recordType: typeToApi[input.type],
      direction,
      amount: input.amount,
      currency: "EGP",
      status: apiStatus,
      occurredAt: apiStatus === "completed" ? new Date().toISOString() : null,
      dueDate: apiStatus === "pending" ? new Date().toISOString().slice(0, 10) : null,
      receiptNumber: input.receiptNumber || null,
    }),
  });

  const payload = await readJsonResponse<{ record: ApiFinancialRecord }>(response);
  return mapFinancial(payload.record, clients, matters);
}
