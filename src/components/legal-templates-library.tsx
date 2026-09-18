"use client";

import { useState, useMemo } from "react";
import { 
  FileText, 
  Search, 
  Scale, 
  UserCheck, 
  Sparkles, 
  BookOpen, 
  Eye
} from "lucide-react";
import { LegalTemplate, TemplateCategory } from "@/types/legal-template";
import { Client, Matter, LegalDocument } from "@/types/legal";
import { legalTemplatesCollection } from "@/lib/legal-templates-data";
import { LegalTemplateGeneratorModal } from "@/components/legal-template-generator-modal";

interface LegalTemplatesLibraryProps {
  clients: Client[];
  matters: Matter[];
  preSelectedClientId?: string;
  onSaveDocument?: (doc: LegalDocument) => void;
  onOpenGeneratedDocument?: (doc: LegalDocument) => void;
}

const CATEGORIES: { id: "all" | TemplateCategory; label: string }[] = [
  { id: "all", label: "كافة النماذج المعتمدة" },
  { id: "إنذارات ومحاضر", label: "إنذارات ومحاضر رسمية" },
  { id: "عقود واتفاقيات", label: "عقود واتفاقيات بيع وشراكة" },
  { id: "لوائح وصحف دعاوى", label: "صحف ولوائح الدعاوى" },
  { id: "مذكرات دفاع وإقرارات", label: "مذكرات دفاع ومخالصات" },
  { id: "توكيلات وخدمات مهنية", label: "عقود أتعاب واستشارات" },
];

export function LegalTemplatesLibrary({
  clients,
  matters,
  preSelectedClientId,
  onSaveDocument,
}: LegalTemplatesLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | TemplateCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeClientId, setActiveClientId] = useState<string>(
    preSelectedClientId || clients[0]?.id || ""
  );
  const [selectedTemplateForGen, setSelectedTemplateForGen] = useState<LegalTemplate | null>(null);

  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === activeClientId) || clients[0] || null;
  }, [clients, activeClientId]);

  const filteredTemplates = useMemo(() => {
    return legalTemplatesCollection.filter((tmpl) => {
      const matchesCategory = selectedCategory === "all" || tmpl.category === selectedCategory;
      const matchesSearch =
        tmpl.title.includes(searchQuery) ||
        tmpl.subtitle.includes(searchQuery) ||
        tmpl.description.includes(searchQuery) ||
        tmpl.governingLaw.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Client Quick Bar */}
      <div className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--panel)] via-[var(--accent)]/40 to-[var(--panel)] p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--axia-gold-light)]">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--axia-gold)]/15 border border-[var(--axia-gold)]/30 px-3 py-1">
                <BookOpen className="size-3.5 text-[var(--axia-gold)]" />
                <span>مكتبة القوالب والنماذج الرسمية</span>
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="text-[var(--text-muted)]">معتمدة وفقاً للتشريع وقضاء النقض المصري</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
              صياغة الوثائق والعقود القانونية بنقرة واحدة
            </h2>

            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
              اختر أي قالب قانوني معتمد، وسيقوم النظام بتعبئة كامل بيانات الموكل الرسمية (الاسم، السجل التجاري/الرقم القومي، التوكيل الموثق، والعنوان المختار) تلقائياً مع ربط القضية والأطراف المقابلة.
            </p>
          </div>

          {/* Quick Active Client Selector */}
          <div className="rounded-2xl border border-[var(--axia-gold)]/40 bg-[var(--bg)]/90 p-4 shadow-md min-w-[280px] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[var(--axia-gold-light)]">
                <UserCheck className="size-4 text-[var(--axia-gold)]" />
                <span>الموكل المختار للتعبئة:</span>
              </span>
              {activeClient && (
                <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                  {activeClient.type}
                </span>
              )}
            </div>

            <select
              value={activeClientId}
              onChange={(e) => setActiveClientId(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {activeClient && (
              <div className="text-[11px] text-[var(--text-muted)] space-y-1 pt-1 border-t border-[var(--border)]">
                <div className="flex justify-between">
                  <span>إثبات الهوية:</span>
                  <span className="font-mono text-[var(--text)]">{activeClient.nationalIdOrCr}</span>
                </div>
                <div className="flex justify-between">
                  <span>سند التوكيل:</span>
                  <span className="truncate max-w-[150px] text-[var(--axia-gold-light)]">{activeClient.poaNumber}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Categories Bar & Search */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                  isSelected
                    ? "bg-[var(--axia-gold)] text-black shadow-md"
                    : "bg-[var(--panel)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px] max-w-sm">
          <Search className="absolute right-3 top-2.5 size-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="بحث بالقالب، المادة القانونية، أو الموضوع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] pr-9 pl-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:outline-none"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => {
          return (
            <div
              key={template.id}
              className="flex flex-col justify-between rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 transition-all duration-200 hover:border-[var(--axia-gold)]/70 hover:shadow-lg group"
            >
              <div className="space-y-3.5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-lg bg-[var(--accent)] px-2.5 py-1 text-[10px] font-bold text-[var(--axia-gold-light)]">
                      {template.category}
                    </span>
                    {template.badge && (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                        {template.badge}
                      </span>
                    )}
                  </div>

                  <span className="rounded-md bg-[var(--bg)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
                    {template.clausesCount} بنود
                  </span>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--axia-gold)] transition-colors leading-snug">
                    {template.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                    {template.subtitle}
                  </p>
                </div>

                {/* Governing Law */}
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                  <Scale className="size-3.5 shrink-0 text-[var(--axia-gold)]" />
                  <span className="truncate">{template.governingLaw}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3 bg-[var(--bg)]/50 p-2.5 rounded-xl border border-[var(--border)]">
                  {template.description}
                </p>

                {/* Auto-fill indicator */}
                <div className="flex flex-wrap items-center gap-1 pt-1 text-[10px] text-[var(--text-muted)]">
                  <span className="font-semibold text-[var(--axia-gold-light)]">الحقول التلقائية:</span>
                  <span className="rounded bg-[var(--accent)] px-1.5 py-0.5">اسم الموكل</span>
                  <span className="rounded bg-[var(--accent)] px-1.5 py-0.5">الرقم القومي / س.ت</span>
                  <span className="rounded bg-[var(--accent)] px-1.5 py-0.5">التوكيل والمقر</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateForGen(template)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-amber-500 px-3.5 py-2 text-xs font-bold text-black shadow-sm hover:brightness-110 transition"
                >
                  <Sparkles className="size-3.5" />
                  <span>تعبئة وتوليد الوثيقة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplateForGen(template)}
                  className="grid size-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--axia-gold)] transition"
                  title="معاينة النموذج"
                >
                  <Eye className="size-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-[var(--border)] bg-[var(--panel)]/40 p-12 text-center text-[var(--text-muted)]">
            <FileText className="mx-auto size-10 opacity-30 mb-2" />
            <p className="text-sm font-semibold">لا توجد قوالب مطابقة لمعايير البحث</p>
            <p className="text-xs mt-1">جرب البحث بكلمات أخرى أو اختر &quot;كافة النماذج المعتمدة&quot;.</p>
          </div>
        )}
      </div>

      {/* Generator Modal */}
      {selectedTemplateForGen && (
        <LegalTemplateGeneratorModal
          isOpen={true}
          onClose={() => setSelectedTemplateForGen(null)}
          template={selectedTemplateForGen}
          clients={clients}
          matters={matters}
          preSelectedClientId={activeClientId}
          onSaveDocument={(newDoc) => {
            if (onSaveDocument) {
              onSaveDocument(newDoc);
            }
          }}
        />
      )}
    </div>
  );
}
