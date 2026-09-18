import { Client } from "./legal";

export type TemplateCategory =
  | "إنذارات ومحاضر"
  | "عقود واتفاقيات"
  | "لوائح وصحف دعاوى"
  | "مذكرات دفاع وإقرارات"
  | "توكيلات وخدمات مهنية";

export interface TemplateVariable {
  key: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  type?: "text" | "number" | "date" | "textarea";
  source?: "client" | "matter" | "system" | "custom";
  clientFieldMap?: keyof Client;
  description?: string;
}

export interface LegalTemplate {
  id: string;
  title: string;
  subtitle: string;
  category: TemplateCategory;
  applicableClientTypes: "الكل" | "شركة / مؤسسة" | "فرد / شخص طبيعي";
  governingLaw: string;
  description: string;
  badge?: string;
  clausesCount: number;
  variables: TemplateVariable[];
  templateBody: string;
}

export interface GeneratedLegalDocument {
  id: string;
  templateId: string;
  templateTitle: string;
  category: TemplateCategory;
  clientId: string;
  clientName: string;
  matterId?: string;
  caseNumber?: string;
  values: Record<string, string>;
  renderedContent: string;
  generatedAt: string;
  status: "مسودة قيد المراجعة" | "نهائي معتمد" | "موقع رسمياً";
}
