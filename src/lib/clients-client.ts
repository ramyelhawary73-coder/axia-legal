import { readJsonResponse } from "@/lib/api/client-response";
import type { Client } from "@/types/legal";

type ApiClient = {
  id: string;
  name: string;
  type: "company" | "individual";
  nationalIdOrCr: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: "active" | "inactive" | "archived";
};

function mapClient(client: ApiClient): Client {
  return {
    id: client.id,
    name: client.name,
    type: client.type === "company" ? "شركة / مؤسسة" : "فرد / شخص طبيعي",
    nationalIdOrCr: client.nationalIdOrCr || "غير مسجل",
    phone: client.phone || "غير مسجل",
    email: client.email || "غير مسجل",
    poaNumber: "غير مسجل",
    poaOffice: "غير مسجل",
    poaExpiry: "غير مسجل",
    activeMattersCount: 0,
    totalPaid: "غير مسجل",
    balanceDue: "غير مسجل",
    address: client.address || "غير مسجل",
  };
}

export async function loadPersistentClients(): Promise<Client[]> {
  const response = await fetch("/api/clients", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const payload = await readJsonResponse<{ clients: ApiClient[] }>(response, "تعذر الاتصال بخدمة الموكلين.");
  return payload.clients.map(mapClient);
}

export async function createPersistentClient(input: {
  name: string;
  type: Client["type"];
  nationalIdOrCr?: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<Client> {
  const response = await fetch("/api/clients", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      type: input.type === "شركة / مؤسسة" ? "company" : "individual",
      nationalIdOrCr: input.nationalIdOrCr || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
    }),
  });

  const payload = await readJsonResponse<{ client: ApiClient }>(response, "تعذر الاتصال بخدمة الموكلين.");
  return mapClient(payload.client);
}
