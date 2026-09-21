"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Download,
  FileCheck,
  FileText,
  PenTool,
  Scale,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import type { Client, LegalDocument, Matter } from "@/types/legal";
import { LegalTemplatesLibrary } from "@/components/legal-templates-library";
import { LegalRichTextEditor } from "@/components/legal-rich-text-editor";
import { legalTemplatesCollection } from "@/lib/legal-templates-data";
import {
  getSecureDocumentDownloadUrl,
  loadPersistentDocuments,
  uploadPersistentDocument,
} from "@/lib/documents-client";

interface DocumentsViewProps {
  clients?: Client[];
  matters?: Matter[];
  documents?: LegalDocument[];
  onDocumentsChange?: (documents: LegalDocument[]) => void;
  initialTab?: "archive" | "editor" | "templates";
  selectedDocId?: string | null;
  onCloseDocModal?: () => void;
}

export function DocumentsView({
  clients = [],
  matters = [],
  documents,
  onDocumentsChange,
  initialTab = "archive",
  selectedDocId,
  onCloseDocModal,
}: DocumentsViewProps = {}) {
  const [activeTab, setActiveTab] =
    useState<"archive" | "editor" | "templates">(initialTab);
  const [internalDocs, setInternalDocs] = useState<LegalDocument[]>([]);
  const docs = documents ?? internalDocs;
  const [search, setSearch] = useState("");
  const [localSelectedDocId, setLocalSelectedDocId] =
    useState<string | null>(null);
  const [editorTargetDraftId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(documents === undefined);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadMatterId, setUploadMatterId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const effectiveDocId = selectedDocId ?? localSelectedDocId;
  const selectedDoc = effectiveDocId
    ? docs.find((doc) => doc.id === effectiveDocId) || null
    : null;

  useEffect(() => {
    if (documents !== undefined) return;

    let cancelled = false;
    void loadPersistentDocuments(matters, clients)
      .then((loaded) => {
        if (cancelled) return;
        setInternalDocs(loaded);
        setSyncError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSyncError(
          error instanceof Error ? error.message : "تعذر تحميل المستندات.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clients, documents, matters]);

  const publishDocs = (nextDocs: LegalDocument[]) => {
    if (documents === undefined) {
      setInternalDocs(nextDocs);
    }
    onDocumentsChange?.(nextDocs);
  };

  const handleGeneratedDocument = (newDoc: LegalDocument) => {
    setToastMessage(
      `تم تجهيز "${newDoc.title}" كمسودة. لاعتماده في الأرشيف ارفع الملف النهائي الفعلي.`,
    );
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!uploadFile || !uploadTitle.trim() || isUploading) return;

    setIsUploading(true);
    setSyncError(null);

    try {
      const document = await uploadPersistentDocument(
        {
          file: uploadFile,
          title: uploadTitle.trim(),
          matterId: uploadMatterId || undefined,
        },
        matters,
        clients,
      );

      publishDocs([document, ...docs]);
      setUploadFile(null);
      setUploadTitle("");
      setUploadMatterId("");
      setIsUploadOpen(false);
      setToastMessage(`تم حفظ "${document.title}" في الأرشيف الآمن.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر رفع المستند.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (document: LegalDocument) => {
    try {
      setSyncError(null);
      const url = await getSecureDocumentDownloadUrl(document.id);
      window.location.assign(url);
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر تنزيل المستند.",
      );
    }
  };

  const filteredDocs = useMemo(() => {
    const query = search.trim();
    if (!query) return docs;
    return docs.filter(
      (doc) =>
        doc.title.includes(query) ||
        doc.clientName.includes(query) ||
        doc.caseNumber?.includes(query),
    );
  }, [docs, search]);

  return (
    <div className="flex h-full w-full flex-col space-y-4">
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 rounded-2xl border border-[var(--axia-gold)]/50 bg-[var(--panel)] px-4 py-3 text-xs font-bold text-[var(--text)] shadow-2xl">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex shrink-0 flex-col justify-between gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold text-[var(--axia-gold-light)]">
            <Scale className="size-4 text-[var(--axia-gold)]" />
            <span>الوثائق والعقود والمحررات القانونية</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            {activeTab === "archive"
              ? "الأرشيف القانوني الآمن"
              : activeTab === "editor"
                ? "محرر المسودات القانونية"
                : "مكتبة القوالب القانونية"}
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {activeTab === "archive"
              ? "المستندات المحفوظة فعلياً في Private Supabase Storage"
              : "المسودات والقوالب لا تدخل الأرشيف إلا بعد رفع ملف نهائي فعلي"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--panel)] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("archive")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                activeTab === "archive"
                  ? "bg-[var(--accent)] text-[var(--text)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              الأرشيف ({docs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                activeTab === "editor"
                  ? "bg-[var(--axia-gold)] text-black"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <PenTool className="size-3.5" /> المسودات
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                activeTab === "templates"
                  ? "bg-[var(--accent)] text-[var(--text)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-3.5" /> القوالب
              </span>
            </button>
          </div>

          {activeTab === "archive" && (
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--text)] px-3.5 py-2 text-xs font-bold text-[var(--bg)]"
            >
              <Upload className="size-3.5" />
              رفع مستند
            </button>
          )}
        </div>
      </div>

      {syncError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
          {syncError}
        </div>
      )}

      {activeTab === "editor" ? (
        <LegalRichTextEditor
          clients={clients}
          matters={matters}
          initialDraftId={editorTargetDraftId}
          onSaveToArchive={handleGeneratedDocument}
          onCloseEditor={() => setActiveTab("archive")}
        />
      ) : activeTab === "templates" ? (
        <LegalTemplatesLibrary
          clients={clients}
          matters={matters}
          onSaveDocument={handleGeneratedDocument}
        />
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute right-2.5 top-2 size-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="بحث باسم المستند، الموكل، رقم القضية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] py-1.5 pl-3 pr-8 text-xs"
            />
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-xs text-[var(--text-muted)]">
              جارٍ تحميل الأرشيف الحقيقي...
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-right text-[11px]">
                  <thead className="sticky top-0 bg-[var(--panel)]">
                    <tr className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="px-4 py-2.5 font-medium">المستند</th>
                      <th className="px-4 py-2.5 font-medium">الموكل / القضية</th>
                      <th className="px-4 py-2.5 font-medium">النوع</th>
                      <th className="px-4 py-2.5 font-medium">التاريخ</th>
                      <th className="px-4 py-2.5 text-center font-medium">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[var(--accent)]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 text-[var(--text-muted)]" />
                            <div>
                              <div className="font-semibold text-[var(--text)]">
                                {doc.title}
                              </div>
                              <div className="text-[9px] text-[var(--text-muted)]">
                                {doc.status}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{doc.clientName}</div>
                          <div className="text-[9px] text-[var(--text-muted)]">
                            {doc.caseNumber || "غير مرتبط بقضية"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">
                          {doc.mimeType || doc.type}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">
                          {doc.date}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setLocalSelectedDocId(doc.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs"
                          >
                            <FileCheck className="size-3" />
                            تفاصيل
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredDocs.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-xs text-[var(--text-muted)]"
                        >
                          لا توجد مستندات محفوظة في الأرشيف.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)]"
            >
              <X className="size-4" />
            </button>

            <h2 className="border-b border-[var(--border)] pb-4 text-xl font-bold">
              رفع مستند إلى الأرشيف الآمن
            </h2>

            <form onSubmit={handleUpload} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="mb-1 block text-[var(--text-muted)]">
                  عنوان المستند
                </label>
                <input
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-[var(--text-muted)]">
                  القضية المرتبطة
                </label>
                <select
                  value={uploadMatterId}
                  onChange={(e) => setUploadMatterId(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                >
                  <option value="">مستند عام بالمكتب</option>
                  {matters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.caseNumber} — {matter.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[var(--text-muted)]">
                  الملف
                </label>
                <input
                  required
                  type="file"
                  accept=".pdf,.doc,.docx,.rtf,.txt,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                />
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  الحد الأقصى 25MB. التخزين Private وغير متاح برابط عام.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-md border border-[var(--border)] px-4 py-2"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="rounded-md bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] disabled:opacity-50"
                >
                  {isUploading ? "جارٍ الرفع..." : "رفع وحفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setLocalSelectedDocId(null);
                onCloseDocModal?.();
              }}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)]"
            >
              <X className="size-4" />
            </button>

            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
              <FileCheck className="size-3.5" />
              مستند محفوظ فعلياً
            </div>
            <h2 className="border-b border-[var(--border)] pb-4 text-xl font-bold">
              {selectedDoc.title}
            </h2>

            <div className="mt-4 space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 text-xs">
              <div>الموكل: {selectedDoc.clientName}</div>
              <div>القضية: {selectedDoc.caseNumber || "غير مرتبط بقضية"}</div>
              <div>النوع: {selectedDoc.mimeType || "غير مسجل"}</div>
              <div>التاريخ: {selectedDoc.date}</div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocalSelectedDocId(null);
                  onCloseDocModal?.();
                }}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => void handleDownload(selectedDoc)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--text)] px-4 py-2 text-xs font-medium text-[var(--bg)]"
              >
                <Download className="size-3.5" />
                تنزيل آمن
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div className="hidden">
          <BookOpen />
          <span>{legalTemplatesCollection.length}</span>
        </div>
      )}
    </div>
  );
}
