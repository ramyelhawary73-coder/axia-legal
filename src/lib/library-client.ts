import { readJsonResponse } from "@/lib/api/client-response";

export type PublishedLegalDocument = {
  id: string;
  title: string;
  version: string;
  sourceUrl: string | null;
  court: string | null;
  legalArea: string | null;
  publicationDate: string | null;
  reviewedAt: string;
};

export type LegalLibrary = { documents: PublishedLegalDocument[]; truncated: boolean };

export async function loadPublishedLegalLibrary(): Promise<LegalLibrary> {
  const response = await fetch("/api/library", { cache: "no-store", headers: { Accept: "application/json" } });
  return readJsonResponse<LegalLibrary>(response, "تعذر تحميل المكتبة القانونية.");
}
