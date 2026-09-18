"use client";

import { useState } from "react";
import { 
  BookOpen, 
  Search, 
  Scale, 
  Copy, 
  Check 
} from "lucide-react";
import { mockPrecedents } from "@/lib/mock-legal-data";
import { PrecedentArticle } from "@/types/legal";

export function LibraryView() {
  const [precedents] = useState<PrecedentArticle[]>(mockPrecedents);
  const [search, setSearch] = useState("");
  const [circuitFilter, setCircuitFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = precedents.filter((p) => {
    const matchesSearch =
      p.ruleNumber.includes(search) ||
      p.principle.includes(search) ||
      p.legalArticles.some((a) => a.includes(search));
    const matchesCircuit = circuitFilter === "all" || p.circuit === circuitFilter;
    return matchesSearch && matchesCircuit;
  });

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
            <BookOpen className="size-4" />
            <span>المكتبة القضائية والتشريعات المصرية</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
            موسوعة أحكام النقض والمبادئ القانونية
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            أرشيف مبادئ محكمة النقض المصرية، الهيئة العامة للمواد المدنية والجنائية، والمحكمة الإدارية العليا
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--axia-gold-light)] bg-[var(--axia-gold)]/10 px-3.5 py-1.5 rounded-full border border-[var(--axia-gold-dim)]">
          <Scale className="size-3.5" />
          <span>مفهرس وفقاً لأحدث قرارات دوائر النقض</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute right-3.5 top-3 size-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="ابحث برقم الطعن، نص المبدأ القضائي، مادة القانون (مثال: بطلان التحكيم، مادة ١٨ إيجارات)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] pr-10 pl-4 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={circuitFilter}
            onChange={(e) => setCircuitFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
          >
            <option value="all">كافة الدوائر المتخصصة</option>
            <option value="الدوائر المدنية والتجارية">الدوائر المدنية والتجارية</option>
            <option value="دوائر الإيجارات والعمال">دوائر الإيجارات والعمال</option>
            <option value="الدوائر الجنائية">الدوائر الجنائية</option>
          </select>
        </div>
      </div>

      {/* Precedent Cards */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg transition hover:border-[var(--axia-gold)]/30 hover:bg-[var(--accent-hover)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-[var(--axia-gold-dim)] bg-[var(--axia-gold)]/15 px-2.5 py-1 text-xs font-bold text-[var(--axia-gold-light)]">
                  {item.ruleNumber}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{item.court}</span>
                <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                  {item.circuit}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(item.id, `${item.ruleNumber}\n${item.principle}`)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--accent)] px-2.5 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-hover)] hover:text-[var(--text)]"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>نسخ للمذكرة</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Principle text */}
            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[var(--text)] font-serif">
              &quot;{item.principle}&quot;
            </p>

            {/* Referenced Articles */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
              <span className="text-[11px] text-[var(--text-muted)]">النصوص والمواد المرتبطة:</span>
              {item.legalArticles.map((art, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-[var(--border-strong)] bg-[var(--accent-hover)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text)]"
                >
                  {art}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
