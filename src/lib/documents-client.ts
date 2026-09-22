import { readJsonResponse } from "@/lib/api/client-response";
import type { Client, LegalDocument, Matter } from "@/types/legal";

type ApiDocument = {
  id: string;
  matterId: string | null;
  title: string;
  mimeType: string;
  createdAt: string;
};

function mapDocument(
  document: ApiDocument,
  matters: Matter[],
  clients: Client[],
): LegalDocument {
  const matter = document.matterId
    ? matters.find((item) => item.id === document.matterId)
    : undefined;
  const client = matter?.clientId
    ? clients.find((item) => item.id === matter.clientId)
    : undefined;

  return {
    id: document.id,
    title: document.title,
    type: "مستند قانوني",
    caseNumber: matter?.caseNumber,
    clientName: client?.name || matter?.clientName || "غير مسجل",
    date: document.createdAt.slice(0, 10),
    fileSize: "غير مسجل",
    status: "نهائي معتمد",
    matterId: document.matterId ?? undefined,
    mimeType: document.mimeType,
  };
}

export async function loadPersistentDocuments(
  matters: Matter[],
  clients: Client[],
): Promise<LegalDocument[]> {
  const response = await fetch("/api/documents", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const payload = await readJsonResponse<{ documents: ApiDocument[] }>(response, "تعذر الاتصال بخدمة المستندات.");
  return payload.documents.map((document) =>
    mapDocument(document, matters, clients),
  );
}

export async function uploadPersistentDocument(
  input: {
    file: File;
    title: string;
    matterId?: string;
  },
  matters: Matter[],
  clients: Client[],
): Promise<LegalDocument> {
  const form = new FormData();
  form.set("file", input.file);
  form.set("title", input.title);
  if (input.matterId) form.set("matterId", input.matterId);

  const response = await fetch("/api/documents", {
    method: "POST",
    cache: "no-store",
    body: form,
  });

  const payload = await readJsonResponse<{ document: ApiDocument }>(response, "تعذر الاتصال بخدمة المستندات.");
  return mapDocument(payload.document, matters, clients);
}

export async function getSecureDocumentDownloadUrl(
  documentId: string,
): Promise<string> {
  const response = await fetch(
    `/api/documents/${encodeURIComponent(documentId)}/download`,
    {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    },
  );

  const payload = await readJsonResponse<{ url: string }>(response, "تعذر الاتصال بخدمة المستندات.");
  return payload.url;
}
