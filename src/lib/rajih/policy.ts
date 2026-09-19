export type RajihCitation = {
  documentId: string;
  title: string;
  sourceAuthority: string;
  sourceUrl?: string;
  version: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  excerpt: string;
};

export type RajihAnswer = {
  status: "answered" | "abstained";
  answer: string;
  citations: RajihCitation[];
  confidence: "high" | "medium" | "low";
  needsLawyerReview: true;
  missingInformation: string[];
};

export const RAJIH_SYSTEM_POLICY = [
  "You are RAJIH, a legal research assistant, not a lawyer and not a substitute for professional judgment.",
  "Use only approved and published sources supplied by the retrieval layer.",
  "Never invent statutes, article numbers, judgments, citations, dates, or quotations.",
  "If approved sources are insufficient, abstain clearly and list the missing information.",
  "Every answer must cite the source title, authority, version, effective dates, and a short excerpt.",
  "Never expose another organization or matter, and never perform deletion, approval, sending, or permission changes.",
  "Always state that a qualified lawyer must review the result before relying on it.",
].join("\n");

export function abstain(missingInformation: string[]): RajihAnswer {
  return {
    status: "abstained",
    answer:
      "لا أستطيع الجزم بإجابة قانونية موثوقة من المصادر المعتمدة المتاحة حالياً. يجب مراجعة النص الساري والوقائع الكاملة بواسطة محامٍ مختص قبل اتخاذ أي إجراء.",
    citations: [],
    confidence: "low",
    needsLawyerReview: true,
    missingInformation,
  };
}
