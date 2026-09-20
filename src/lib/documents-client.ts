import type { Client, LegalDocument, Matter } from "@/types/legal";

type ApiDocument = {
  id: string;
  matterId: string | null;
  title: string;
  mimeType: string;
  createdAt: string;
  fileSize?: number;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "تعذر الاتصال بأرشيف المستندات.");
  }

  return payload as T;
}

function formatFileSize(size?: number) {
  if (!size || size <= 0) return "غير مسجل";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

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
    matterId: document.matterId ?? undefined,
    caseNumber: matter?.caseNumber,
    clientName: client?.name || matter?.clientName || "غير مسجل",
    date: document.createdAt.slice(0, 10),
    fileSize: formatFileSize(document.fileSize),
    status: "محفوظ بالأرشيف",
    mimeType: document.mimeType,
    downloadable: true,
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
  const payload = await readJsonResponse<{ documents: ApiDocument[] }>(response);
  return payload.documents.map((document) =>
    mapDocument(document, matters, clients),
  );
}

export async function uploadPersistentDocument(
  input: {
    file: File;
    title?: string;
    matterId?: string;
  },
  matters: Matter[],
  clients: Client[],
): Promise<LegalDocument> {
  const form = new FormData();
  form.append("file", input.file);
  if (input.title?.trim()) form.append("title", input.title.trim());
  if (input.matterId) form.append("matterId", input.matterId);

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    cache: "no-store",
    body: form,
  });
  const payload = await readJsonResponse<{ document: ApiDocument }>(response);
  return mapDocument(payload.document, matters, clients);
}

export async function getDocumentDownloadUrl(id: string): Promise<string> {
  const response = await fetch(
    `/api/documents/download?id=${encodeURIComponent(id)}`,
    {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    },
  );
  const payload = await readJsonResponse<{ url: string }>(response);
  return payload.url;
}
