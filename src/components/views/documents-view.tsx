"use client";

import { useState } from "react";
import { 
  FileText, 
  Download, 
  Upload, 
  Search, 
  FileCheck,
  ChevronDown,
  X
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
    <div className="flex flex-col h-full max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border)] shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            الأرشيف القانوني والعقود
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <FileText className="size-3.5" />
            حفظ إلكتروني، مذكرات الدفاع، وأحكام قضائية
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] shadow-sm hover:opacity-90 transition-opacity"
          >
            <Upload className="size-3.5" />
            <span>رفع مستند / عقد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center gap-3 py-3 shrink-0">
        <div className="relative flex-1 min-w-[250px] max-w-sm">
          <Search className="absolute right-2.5 top-1.5 size-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="بحث باسم المستند، الموكل، رقم القضية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          />
        </div>

        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="appearance-none rounded-md border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          >
            <option value="all">كافة المستندات</option>
            <option value="مذكرة دفاع">مذكرات الدفاع</option>
            <option value="صحيفة دعوى">صحف الدعاوى</option>
            <option value="عقد واتفاقية">عقود واتفاقيات</option>
            <option value="حكم قضائي">أحكام قضائية</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-2 size-3 text-[var(--text-muted)] pointer-events-none" />
        </div>
      </div>

      {/* Documents Table */}
      <div className="flex-1 overflow-hidden flex flex-col rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right text-[11px]">
            <thead className="sticky top-0 bg-[var(--panel)] z-10 shadow-[0_1px_0_var(--border)]">
              <tr className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                <th className="px-4 py-2 font-medium w-[30%]">اسم المستند / التاريخ</th>
                <th className="px-4 py-2 font-medium w-[20%]">نوع المستند</th>
                <th className="px-4 py-2 font-medium w-[20%]">الموكل / القضية</th>
                <th className="px-4 py-2 font-medium w-[15%]">الحالة / الحجم</th>
                <th className="px-4 py-2 font-medium w-[15%] text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-[var(--accent)] transition-colors group cursor-default">
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-start gap-2.5">
                      <div className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)]">
                        <FileText className="size-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text)] text-xs mb-0.5 line-clamp-1" title={doc.title}>{doc.title}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{doc.date}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--text)] font-medium">
                    {doc.type}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-[var(--text)] mb-0.5">{doc.clientName}</div>
                    {doc.caseNumber && (
                      <div className="text-[10px] text-[var(--text-muted)]">{doc.caseNumber}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="mb-1.5">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-medium border ${
                        doc.status === "نهائي معتمد"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : doc.status === "موقع رسمياً"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">{doc.fileSize}</div>
                  </td>
                  <td className="px-4 py-3 align-top text-center">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[var(--text)] hover:bg-[var(--accent)] transition-colors opacity-0 group-hover:opacity-100 mx-auto"
                    >
                      <Download className="size-3.5" />
                      <span>معاينة</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)] text-xs">
                    لا يوجد مستندات مطابقة للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] bg-[var(--bg)]/30 px-4 py-2 text-[10px] text-[var(--text-muted)]">
          إجمالي المستندات: {filteredDocs.length}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--accent)] backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel-glass)] backdrop-blur-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              <FileCheck className="size-3.5" />
              <span>معاينة الوثيقة المعتمدة</span>
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text)] border-b border-[var(--border)] pb-4">{selectedDoc.title}</h2>
            <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>الموكل: {selectedDoc.clientName}</span>
              <span>التاريخ: {selectedDoc.date}</span>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-xs text-[var(--text)] leading-relaxed font-mono overflow-y-auto max-h-[40vh] shadow-inner">
              <p className="font-bold text-center mb-6 text-sm">
                باسم الشعب — محكمة استئناف عالي القاهرة
              </p>
              <p className="text-justify leading-loose">
                بناءً على طلب الموكل المقيد برقم {selectedDoc.caseNumber || "عقد رسمي موثق"}، وبصفتنا وكلاء عنه بموجب التوكيل الرسمي المودع بملف الدعوى، نتشرف بعرض دفاعنا الماثل تأسيساً على القواعد القانونية والمبادئ المستقرة لمحكمة النقض المصرية...
              </p>
              <div className="mt-8 border-t border-[var(--border)] border-dashed pt-4 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <div>الحالة: <span className="font-semibold text-[var(--text)]">{selectedDoc.status}</span></div>
                <div>الحجم: {selectedDoc.fileSize}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
              <button
                onClick={() => setSelectedDoc(null)}
                className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2 font-medium text-[var(--text)] hover:bg-[var(--accent)] transition-colors text-xs"
              >
                إغلاق
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="rounded-md bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] hover:opacity-90 transition-opacity text-xs inline-flex items-center gap-1.5"
              >
                <Download className="size-3.5" />
                تنزيل الملف (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
