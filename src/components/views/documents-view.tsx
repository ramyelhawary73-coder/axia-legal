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
  Scale,
  Edit3,
  PenTool
} from "lucide-react";
import { mockDocuments, mockClients, mockMatters } from "@/lib/mock-legal-data";
import { LegalDocument, Client, Matter } from "@/types/legal";
import { LegalTemplatesLibrary } from "@/components/legal-templates-library";
import { LegalRichTextEditor } from "@/components/legal-rich-text-editor";
import { legalTemplatesCollection } from "@/lib/legal-templates-data";

interface DocumentsViewProps {
  clients?: Client[];
  matters?: Matter[];
  initialTab?: "archive" | "editor" | "templates";
  selectedDocId?: string | null;
  onCloseDocModal?: () => void;
}

export function DocumentsView({
  clients = mockClients,
  matters = mockMatters,
  initialTab = "archive",
  selectedDocId,
  onCloseDocModal,
}: DocumentsViewProps = {}) {
  const [activeTab, setActiveTab] = useState<"archive" | "editor" | "templates">(initialTab);
  const [docs, setDocs] = useState<LegalDocument[]>(mockDocuments);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [localSelectedDocId, setLocalSelectedDocId] = useState<string | null>(null);
  const [editorTargetDraftId] = useState<string | undefined>(undefined);
  const effectiveDocId = selectedDocId ?? localSelectedDocId;
  const selectedDoc = effectiveDocId ? docs.find((d) => d.id === effectiveDocId) || null : null;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveGeneratedDoc = (newDoc: LegalDocument) => {
    setDocs((prev) => [newDoc, ...prev]);
    setToastMessage(`تم حفظ "${newDoc.title}" بنجاح في الأرشيف ومستندات الموكل.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenDocInEditor = (doc: LegalDocument) => {
    setActiveTab("editor");
    setLocalSelectedDocId(null);
    onCloseDocModal?.();
    setToastMessage(`تم فتح "${doc.title}" في محرر المسودات القانونية.`);
    setTimeout(() => setToastMessage(null), 3000);
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
    <div className="flex flex-col h-full w-full space-y-4">
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
            {activeTab === "archive" 
              ? "الأرشيف القانوني والعقود المعتمدة" 
              : activeTab === "editor"
              ? "محرر المسودات القانونية الذكي"
              : "مكتبة القوالب والنماذج القانونية الرسمية"}
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <FileText className="size-3.5" />
            {activeTab === "archive" 
              ? "حفظ إلكتروني، مذكرات الدفاع، صحف الدعاوى، والأحكام القضائية المعتمدة"
              : activeTab === "editor"
              ? "تحرير غني متقدم مع حفظ تلقائي وسجل إصدارات تاريخية لضبط صياغة المذكرات والعقود"
              : "قوالب رسمية معتمدة وفقاً للقانون المصري، قابلة للتعبئة التلقائية ببيانات الموكلين"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Top Switcher (3 Tabs) */}
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
              <span>الأرشيف ({docs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "editor"
                  ? "bg-[var(--axia-gold)] text-black shadow-xs font-extrabold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <PenTool className="size-3.5" />
              <span>محرر المسودات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "templates"
                  ? "bg-[var(--accent)] text-[var(--text)] shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Sparkles className="size-3.5" />
              <span>القوالب ({legalTemplatesCollection.length})</span>
            </button>
          </div>

          {/* Quick Primary Actions */}
          {activeTab !== "editor" && (
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--axia-gold)] px-3.5 py-2 text-xs font-bold text-black shadow-md hover:bg-[var(--axia-gold-light)] transition"
            >
              <Edit3 className="size-3.5" />
              <span>تحرير مسودة جديدة</span>
            </button>
          )}

          {activeTab === "editor" && (
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
      {activeTab === "editor" ? (
        <LegalRichTextEditor
          clients={clients}
          matters={matters}
          initialDraftId={editorTargetDraftId}
          onSaveToArchive={handleSaveGeneratedDoc}
          onCloseEditor={() => setActiveTab("archive")}
        />
      ) : activeTab === "templates" ? (
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

            <div className="mr-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("editor")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--axia-gold)] hover:underline"
              >
                <PenTool className="size-3.5" />
                <span>فتح محرر المسودات وسجل الإصدارات</span>
              </button>

              <span className="text-[var(--border-strong)]">|</span>

              <button
                type="button"
                onClick={() => setActiveTab("templates")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--axia-gold-light)] hover:underline"
              >
                <BookOpen className="size-3.5" />
                <span>مكتبة النماذج ({legalTemplatesCollection.length} قالب)</span>
              </button>
            </div>
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
                        <div className="inline-flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setLocalSelectedDocId(doc.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[var(--text)] hover:bg-[var(--accent)] transition-colors text-xs"
                            title="معاينة المستند"
                          >
                            <Download className="size-3" />
                            <span>معاينة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDocInEditor(doc)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--axia-gold)]/40 bg-[var(--axia-gold-dim)] px-2 py-1 text-[var(--axia-gold)] hover:bg-[var(--axia-gold)] hover:text-black transition-colors text-xs font-bold"
                            title="فتح في محرر المسودات"
                          >
                            <Edit3 className="size-3" />
                            <span>تحرير</span>
                          </button>
                        </div>
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
            <div className="border-t border-[var(--border)] bg-[var(--bg)]/30 px-4 py-2 text-[10px] text-[var(--text-muted)] flex justify-between items-center">
              <span>إجمالي المستندات بالأرشيف: {filteredDocs.length}</span>
              <span>يمكنك إنشاء مسودة جديدة حرة أو الاعتماد على قوالب العقود الرسمية.</span>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-2xl overflow-y-auto rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              type="button"
              onClick={() => {
                setLocalSelectedDocId(null);
                onCloseDocModal?.();
              }}
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

            <div className="mt-6 flex flex-wrap justify-between items-center gap-2 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => handleOpenDocInEditor(selectedDoc)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--axia-gold)] bg-[var(--axia-gold-dim)] px-4 py-2 font-bold text-[var(--axia-gold)] hover:bg-[var(--axia-gold)] hover:text-black transition-colors text-xs"
              >
                <Edit3 className="size-3.5" />
                <span>فتح وتعديل في محرر المسودات الذكي</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLocalSelectedDocId(null);
                    onCloseDocModal?.();
                  }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2 font-medium text-[var(--text)] hover:bg-[var(--accent)] transition-colors text-xs"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocalSelectedDocId(null);
                    onCloseDocModal?.();
                  }}
                  className="rounded-xl bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] hover:opacity-90 transition-opacity text-xs inline-flex items-center gap-1.5"
                >
                  <Download className="size-3.5" />
                  <span>تنزيل الملف (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
