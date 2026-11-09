import type { LegalDraft } from "@/types/legal-editor";

const types = ["مذكرة دفاع", "صحيفة دعوى", "عقد واتفاقية", "إنذار رسمي", "طعن بالنقض", "محرر قانوني عام"];
const states = ["مسودة قيد التحرير", "مراجعة الشركاء", "جاهزة للاعتماد"];
export type StoredDraft = { id: string; payload: LegalDraft; revision: number; archived: boolean; updated_at: string; created_at: string; legacy_id?: string | null };
export function validDraft(value: unknown): value is LegalDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const d = value as LegalDraft;
  return typeof d.id === "string" && d.id.length > 0 && d.id.length <= 120 && typeof d.title === "string" && d.title.trim().length > 0 && d.title.length <= 300 && typeof d.contentHtml === "string" && typeof d.clientName === "string" && types.includes(d.docType) && states.includes(d.status) && Array.isArray(d.versions) && d.versions.length <= 200 && d.versions.every(v => v && typeof v.id === "string" && typeof v.contentHtml === "string" && typeof v.versionNumber === "string" && typeof v.timestamp === "string" && typeof v.authorName === "string" && typeof v.note === "string" && Number.isFinite(v.wordCount) && Number.isFinite(v.characterCount)) && JSON.stringify(d).length <= 700000;
}

// HTML is stored as data. Every DOM sink uses this allowlist, including old versions.
// No URL/image/SVG/form/style element, event handler, link, id or executable attribute survives.
export function safeLegalHtml(html: string): string {
  if (typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const allowed = new Set(["P", "DIV", "SPAN", "BR", "HR", "H1", "H2", "H3", "H4", "STRONG", "B", "EM", "I", "U", "S", "STRIKE", "BLOCKQUOTE", "UL", "OL", "LI", "TABLE", "THEAD", "TBODY", "TR", "TD", "TH", "SUB", "SUP", "FONT"]);
  const discard = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "TEMPLATE", "IMG", "LINK", "META", "BASE", "FORM", "INPUT", "BUTTON"]);
  const clean = (parent: Element) => {
    for (const element of Array.from(parent.children)) {
      if (discard.has(element.tagName)) { element.remove(); continue; }
      clean(element);
      if (!allowed.has(element.tagName)) { element.replaceWith(...Array.from(element.childNodes)); continue; }
      const style = element instanceof HTMLElement ? element.style : null;
      const align = style?.textAlign;
      const weight = style?.fontWeight;
      for (const attr of Array.from(element.attributes)) element.removeAttribute(attr.name);
      if (element instanceof HTMLElement) {
        if (["right", "left", "center", "justify"].includes(align ?? "")) element.style.textAlign = align!;
        if (["bold", "700"].includes(weight ?? "")) element.style.fontWeight = "bold";
      }
    }
  };
  clean(doc.body);
  return doc.body.innerHTML;
}
