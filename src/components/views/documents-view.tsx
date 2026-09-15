"use client";

import { useState } from "react";
import { 
  FileText, 
  Download, 
  Upload, 
  Search, 
  FileCheck
} from "lucide-react";
import { mockDocuments } from "@/lib/mock-legal-data";
import { LegalDocument } from "@/types/legal";

export function DocumentsView() {
  const [docs, setDocs] = useState<LegalDocument[]>(mockDocuments);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);

  const filteredDocs = docs.filter((doc) => {
    const matchesFilter = filterType === "all" || doc.type === filterType;
    const matchesSearch =
      doc.title.includes(search) ||
      doc.clientName.includes(search) ||
      (doc.caseNumber && doc.caseNumber.includes(search));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <FileText className="size-4" />
            <span>المستندات والعقود ومذكرات الدفاع</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            الأرشيف القانوني والعقود وصحف الدعاوى
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            حفظ إلكتروني موثق، تدقيق بنود العقود والاتفاقيات، ومراجعة صياغة المذكرات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const newDoc: LegalDocument = {
                id: `DOC-${Date.now()}`,
                title: "مذكرة دفاع في دعوى التعويض المدني (جلسة ٢٠٢٦/١٠/١)",
                type: "مذكرة دفاع",
                caseNumber: "٨١٩ لسنة ٢٠٢٤ مدني مستأنف",
                clientName: "الدكتور شريف عزت القاضي",
                date: "2026-09-15",
                fileSize: "1.5 MB (PDF)",
                status: "نهائي معتمد",
              };
              setDocs([newDoc, ...docs]);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110"
          >
            <Upload className="size-4" />
            <span>رفع مستند / عقد جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#0d1726] p-4 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute right-3.5 top-3 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث في المستندات، اسم العقد، الموكل، أو رقم القضية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/25 pr-10 pl-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
          >
            <option value="all">كافة أنواع الوثائق</option>
            <option value="مذكرة دفاع">مذكرات الدفاع</option>
            <option value="صحيفة دعوى">صحف الدعاوى والطعون</option>
            <option value="عقد واتفاقية">عقود واتفاقيات</option>
            <option value="حكم قضائي">أحكام قضائية وتقارير خبراء</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="rounded-2xl border border-white/10 bg-[#0d1726] p-5 shadow-lg hover:border-cyan-400/40 hover:bg-[#111e33] transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                  <FileText className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                      {doc.type}
                    </span>
                    <span className="text-[11px] text-slate-400">{doc.date}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-white leading-snug">
                    {doc.title}
                  </h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-300">
                    <p>الموكل: <strong className="text-white">{doc.clientName}</strong></p>
                    {doc.caseNumber && (
                      <p className="text-[11px] text-[var(--axia-gold-light)] font-medium">
                        القضية: {doc.caseNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold shrink-0 ${
                doc.status === "نهائي معتمد"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : doc.status === "موقع رسمياً"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                {doc.status}
              </span>
            </div>

            <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">{doc.fileSize}</span>
              <button
                onClick={() => setSelectedDoc(doc)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 hover:bg-cyan-500 hover:text-slate-950 transition font-semibold"
              >
                <Download className="size-3.5" />
                <span>معاينة وتحميل</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-cyan-400/30 bg-[#0d1726] p-6 lg:p-8 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <FileCheck className="size-4" />
              <span>معاينة الوثيقة القانونية المعتمدة</span>
            </div>
            
            <h2 className="mt-2 text-xl font-bold text-white">{selectedDoc.title}</h2>
            <p className="mt-1 text-xs text-slate-400">{selectedDoc.clientName} · {selectedDoc.date}</p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5 text-xs text-slate-300 leading-relaxed font-mono">
              <p className="font-bold text-center text-white mb-3 text-sm">
                باسم الشعب — محكمة استئناف عالي القاهرة
              </p>
              <p>
                بناءً على طلب الموكل المقيد برقم {selectedDoc.caseNumber || "عقد رسمي موثق"}، وبصفتنا وكلاء عنه بموجب التوكيل الرسمي المودع بملف الدعوى، نتشرف بعرض دفاعنا الماثل تأسيساً على القواعد القانونية والمبادئ المستقرة لمحكمة النقض المصرية...
              </p>
              <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-slate-400">
                الحالة: <span className="text-emerald-300 font-semibold">{selectedDoc.status}</span> · الحجم: {selectedDoc.fileSize}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedDoc(null)}
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                إغلاق المعاينة
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950 hover:brightness-110"
              >
                تنزيل الملف (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
