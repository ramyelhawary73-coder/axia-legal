"use client";

import { useState } from "react";
import { 
  FileText, 
  Download, 
  Search, 
  FileCheck, 
  ChevronDown, 
  X,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Scale
} from "lucide-react";
import { mockDocuments, mockClients, mockMatters } from "@/lib/mock-legal-data";
import { LegalDocument, Client, Matter } from "@/types/legal";
import { LegalTemplatesLibrary } from "@/components/legal-templates-library";
import { legalTemplatesCollection } from "@/lib/legal-templates-data";

interface DocumentsViewProps {
  clients?: Client[];
  matters?: Matter[];
  initialTab?: "archive" | "templates";
}

export function DocumentsView({
  clients = mockClients,
  matters = mockMatters,
  initialTab = "archive",
}: DocumentsViewProps = {}) {
  const [activeTab, setActiveTab] = useState<"archive" | "templates">(initialTab);
  const [docs, setDocs] = useState<LegalDocument[]>(mockDocuments);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveGeneratedDoc = (newDoc: LegalDocument) => {
    setDocs((prev) => [newDoc, ...prev]);
    setToastMessage(`تم حفظ "${newDoc.title}" بنجاح في الأرشيف ومستندات الموكل.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredDocs = docs.filter((doc) => {
    const matchesFilter = filterType === "all" || doc.type === filterType;
    const matchesSearch =
      doc.title.includes(search) ||
      doc.clientName.includes(search) ||
      (doc.caseNumber && doc.caseNumber.includes(search));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full max-w-[1400px] mx-auto space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 rounded-2xl border border-[var(--axia-gold)]/50 bg-[var(--panel)] px-4 py-3 shadow-2xl text-xs font-bold text-[var(--text)] animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border)] shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--axia-gold-light)] mb-1">
            <Scale className="size-4 text-[var(--axia-gold)]" />
            <span>الوثائق والعقود والمحررات القانونية</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            {activeTab === "archive" ? "الأرشيف القانوني والعقود المعتمدة" : "مكتبة القوالب والنماذج القانونية الرسمية"}
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <FileText className="size-3.5" />
            {activeTab === "archive" 
              ? "حفظ إلكتروني، مذكرات الدفاع، صحف الدعاوى، والأحكام القضائية المعتمدة"
              : "قوالب رسمية معتمدة وفقاً للقانون المصري، قابلة للتعبئة التلقائية ببيانات الموكلين"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Top Switcher */}
          <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--panel)] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("archive")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "archive"
                  ? "bg-[var(--accent)] text-[var(--text)] shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <FileText className="size-3.5" />
              <span>الأرشيف والمستندات ({docs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "templates"
                  ? "bg-[var(--axia-gold)] text-black shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Sparkles className="size-3.5" />
              <span>مكتبة القوالب ({legalTemplatesCollection.length})</span>
            </button>
          </div>

          {activeTab === "archive" ? (
            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--axia-gold)] px-3.5 py-2 text-xs font-bold text-black shadow-md hover:bg-[var(--axia-gold-light)] transition"
            >
              <Sparkles className="size-3.5" />
              <span>صياغة وثيقة من قالب</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab("archive")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--accent)] px-3.5 py-2 text-xs font-bold text-[var(--text)] hover:bg-[var(--accent-hover)] transition"
            >
              <FileText className="size-3.5" />
              <span>العودة للأرشيف</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Rendering based on activeTab */}
      {activeTab === "templates" ? (
        <LegalTemplatesLibrary
          clients={clients}
          matters={matters}
          onSaveDocument={handleSaveGeneratedDoc}
        />
      ) : (
        <>
          {/* Filter and Search */}
          <div className="flex flex-wrap items-center gap-3 py-1 shrink-0">
            <div className="relative flex-1 min-w-[250px] max-w-sm">
              <Search className="absolute right-2.5 top-2 size-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="بحث باسم المستند، الموكل، رقم القضية..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)]"
              />
            </div>

            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)]"
              >
                <option value="all">كافة المستندات</option>
                <option value="إنذار رسمي">إنذارات رسمية</option>
                <option value="مذكرة دفاع">مذكرات الدفاع</option>
                <option value="صحيفة دعوى">صحف الدعاوى</option>
                <option value="عقد واتفاقية">عقود واتفاقيات</option>
                <option value="حكم قضائي">أحكام قضائية</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2 size-3 text-[var(--text-muted)] pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className="mr-auto inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--axia-gold-light)] hover:underline"
            >
              <BookOpen className="size-3.5" />
              <span>استعراض مكتبة النماذج والقوالب القانونية ({legalTemplatesCollection.length} قوالب)</span>
            </button>
          </div>

          {/* Documents Table */}
          <div className="flex-1 overflow-hidden flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-right text-[11px]">
                <thead className="sticky top-0 bg-[var(--panel)] z-10 shadow-[0_1px_0_var(--border)]">
                  <tr className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-2.5 font-medium w-[30%]">اسم المستند / التاريخ</th>
                    <th className="px-4 py-2.5 font-medium w-[20%]">نوع المستند</th>
                    <th className="px-4 py-2.5 font-medium w-[20%]">الموكل / القضية</th>
                    <th className="px-4 py-2.5 font-medium w-[15%]">الحالة / الحجم</th>
                    <th className="px-4 py-2.5 font-medium w-[15%] text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[var(--accent)] transition-colors group cursor-default">
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)]">
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
                          type="button"
                          onClick={() => setSelectedDoc(doc)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-[var(--text)] hover:bg-[var(--accent)] transition-colors opacity-0 group-hover:opacity-100 mx-auto text-xs"
                        >
                          <Download className="size-3" />
                          <span>معاينة</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)] text-xs">
                        لا توجد مستندات مطابقة للبحث.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--border)] bg-[var(--bg)]/30 px-4 py-2 text-[10px] text-[var(--text-muted)] flex justify-between">
              <span>إجمالي المستندات: {filteredDocs.length}</span>
              <span>يمكنك إنشاء وثيقة جديدة عبر التوجه لـ &quot;مكتبة القوالب&quot; بأعلى الشاشة.</span>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)] uppercase tracking-wider mb-2">
              <FileCheck className="size-3.5 text-[var(--axia-gold)]" />
              <span>معاينة الوثيقة المعتمدة بالأرشيف</span>
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text)] border-b border-[var(--border)] pb-4">{selectedDoc.title}</h2>
            <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>الموكل: <strong className="text-[var(--text)]">{selectedDoc.clientName}</strong></span>
              <span>التاريخ: {selectedDoc.date}</span>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 text-xs text-[var(--text)] leading-relaxed font-mono overflow-y-auto max-h-[40vh] shadow-inner">
              <p className="font-bold text-center mb-6 text-sm text-[var(--text)]">
                جمهورية مصر العربية — محكمة استئناف عالي القاهرة
              </p>
              <p className="text-justify leading-loose">
                بناءً على طلب الموكل ({selectedDoc.clientName})، المقيد برقم {selectedDoc.caseNumber || "توثيق رسمي"}، وبصفتنا وكلاء عنه بموجب التوكيل الرسمي المودع بملف التداعي، نتشرف بعرض دفاعنا الماثل تأسيساً على القواعد القانونية والمبادئ المستقرة لمحكمة النقض المصرية والقانون المدني وقانون المرافعات...
              </p>
              <div className="mt-8 border-t border-[var(--border)] border-dashed pt-4 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <div>الحالة: <span className="font-semibold text-[var(--text)]">{selectedDoc.status}</span></div>
                <div>الحجم: {selectedDoc.fileSize}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2 font-medium text-[var(--text)] hover:bg-[var(--accent)] transition-colors text-xs"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="rounded-xl bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] hover:opacity-90 transition-opacity text-xs inline-flex items-center gap-1.5"
              >
                <Download className="size-3.5" />
                <span>تنزيل الملف (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

