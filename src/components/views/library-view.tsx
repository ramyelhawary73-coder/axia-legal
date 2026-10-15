"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, Search } from "lucide-react";
import { loadPublishedLegalLibrary, type LegalLibrary } from "@/lib/library-client";

export function LibraryView() {
  const [library, setLibrary] = useState<LegalLibrary | null>(null);
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void loadPublishedLegalLibrary().then((data) => {
      if (!cancelled) { setLibrary(data); setError(null); }
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "تعذر تحميل المكتبة.");
    });
    return () => { cancelled = true; };
  }, [attempt]);

  const areas = useMemo(() => [...new Set((library?.documents ?? []).map((item) => item.legalArea).filter((value): value is string => Boolean(value)))], [library]);
  const filtered = (library?.documents ?? []).filter((item) => {
    const text = [item.title, item.version, item.court, item.legalArea].join(" ").toLowerCase();
    return (area === "all" || item.legalArea === area) && text.includes(search.trim().toLowerCase());
  });

  return (
    <div className="space-y-6 p-6 sm:p-8 lg:p-10">
      <div className="border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-2 text-[var(--axia-gold-light)]"><BookOpen className="size-5" /><span>المكتبة القانونية</span></div>
        <h1 className="mt-2 text-2xl font-bold">المصادر المنشورة والمراجَعة</h1>
        <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">اعرض بيانات المصادر المحفوظة وافتح أصلها للمراجعة. النشر لا يغني عن التحقق من النص الكامل وتاريخ سريانه قبل الاستناد إليه.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="relative sm:col-span-2">
          <span className="sr-only">البحث في المصادر المنشورة</span>
          <Search className="absolute right-3 top-3.5 size-4 text-[var(--text-muted)]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالعنوان أو المحكمة أو المجال القانوني" className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] py-3 pl-3 pr-10 text-[var(--text)]" />
        </label>
        <select aria-label="المجال القانوني" value={area} onChange={(event) => setArea(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 text-[var(--text)]">
          <option value="all">كل المجالات</option>
          {areas.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      {error ? <div role="alert" className="rounded-xl border border-red-500/30 p-4 text-sm"><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2">إعادة المحاولة</button></div>
        : !library ? <p role="status">جارٍ تحميل المصادر المنشورة...</p>
        : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--text-muted)]">{library.documents.length ? "لا توجد مصادر تطابق البحث الحالي." : "لا توجد مصادر منشورة ومراجَعة متاحة حاليًا."}</div>
        : <div className="grid gap-4 xl:grid-cols-2">{filtered.map((item) => <article key={item.id} className="min-w-0 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="break-words text-base font-bold">{item.title}</h2>
          <p className="text-sm text-[var(--text-muted)]">{[item.version, item.court, item.legalArea].filter(Boolean).join(" · ")}</p>
          <p className="text-xs text-[var(--text-muted)]">مراجعة مسجلة: {item.reviewedAt.slice(0, 10)}{item.publicationDate ? ` · نشر: ${item.publicationDate}` : ""}</p>
          {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--axia-gold-light)]"><ExternalLink className="size-4" />فتح المصدر</a> : <p className="text-xs text-[var(--text-muted)]">رابط المصدر غير متاح.</p>}
        </article>)}</div>}
      {library?.truncated && <p className="text-xs text-[var(--text-muted)]">يُعرض أحدث ١٠٠ مصدر مراجَع فقط.</p>}
    </div>
  );
}
