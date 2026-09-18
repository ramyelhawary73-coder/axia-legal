export interface DocumentVersion {
  id: string;
  versionNumber: string; // e.g. "v1.0", "v1.1", "v1.2"
  timestamp: string; // Formatted date string
  authorName: string;
  note: string;
  contentHtml: string;
  wordCount: number;
  characterCount: number;
  isMilestone?: boolean;
}

export type LegalDraftDocType =
  | "مذكرة دفاع"
  | "صحيفة دعوى"
  | "عقد واتفاقية"
  | "إنذار رسمي"
  | "طعن بالنقض"
  | "محرر قانوني عام";

export interface LegalDraft {
  id: string;
  title: string;
  docType: LegalDraftDocType;
  caseNumber?: string;
  clientName: string;
  clientId?: string;
  matterId?: string;
  contentHtml: string;
  createdAt: string;
  updatedAt: string;
  currentVersionNumber: string;
  versions: DocumentVersion[];
  autoSavedAt?: string;
  status: "مسودة قيد التحرير" | "مراجعة الشركاء" | "جاهزة للاعتماد";
}
