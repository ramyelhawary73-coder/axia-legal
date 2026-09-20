"use client";

import { useEffect, useMemo, useState } from "react";
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
  PenTool,
  Upload,
} from "lucide-react";
import type { Client, LegalDocument, Matter } from "@/types/legal";
import { LegalTemplatesLibrary } from "@/components/legal-templates-library";
import { LegalRichTextEditor } from "@/components/legal-rich-text-editor";
import { legalTemplatesCollection } from "@/lib/legal-templates-data";
import { loadPersistentClients } from "@/lib/clients-client";
import { loadMattersWorkspace } from "@/lib/matters-client";
import {
  getDocumentDownloadUrl,
  loadPersistentDocuments,
  uploadPersistentDocument,
} from "@/lib/documents-client";

interface DocumentsViewProps {
  clients?: Client[];
  matters?: Matter[];
  initialTab?: "archive" | "editor" | "templates";
  selectedDocId?: string | null;
  onCloseDocModal?: () => void;
}

export function DocumentsView({
  clients: providedClients,
  matters: providedMatters,
  initialTab = "archive",
  selectedDocId,
  onCloseDocModal,
}: DocumentsViewProps = {}) {
  const [activeTab, setActiveTab] =
    useState<"archive" | "editor" | "templates">(initialTab);
  const [clients, setClients] = useState<Client[]>(providedClients ?? []);
  const [matters, setMatters] = useState<Matter[]>(providedMatters ?? []);
  const [docs, setDocs] = useState<LegalDocument[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [localSelectedDocId, setLocalSelectedDocId] = useState<string | null>(
    null,
  );
  const [editorTargetDraftId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    let cancelled = false;

    void (async () => {
      try {
        const loadedClients =
          providedClients ?? (await loadPersistentClients());
        const matterWorkspace = providedMatters
          ? { matters: providedMatters }
          : await loadMattersWorkspace();
        const loadedMatters = matterWorkspace.matters;

        if (cancelled) return;
        setClients(loadedClients);
        setMatters(loadedMatters);

        const loadedDocs = await loadPersistentDocuments(
          loadedMatters,
          loadedClients,
        );
        if (cancelled) return;
        setDocs(loadedDocs);
        setSyncError(null);
      } catch (error) {
        if (cancelled) return;
        setSyncError(
          error instanceof Error ? error.message : "تعذر تحميل الأرشيف.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [providedClients, providedMatters]);

  const filteredDocs = useMemo(
    () =>
      docs.filter((doc) => {
        const matchesFilter =
          filterType === "all" || doc.type === filterType;
        const matchesSearch =
          doc.title.includes(search) ||
          doc.clientName.includes(search) ||
          Boolean(doc.caseNumber?.includes(search));
        return matchesFilter && matchesSearch;
      }),
    [docs, filterType, search],
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveGeneratedDoc = (newDoc: LegalDocument) => {
    showToast(
      `المسودة "${newDoc.title}" ما زالت محلية. لاعتمادها في الأرشيف ارفع ملفًا نهائيًا من زر «رفع مستند».`,
    );
  };

  const handleDownload = async (doc: LegalDocument) => {
    try {
      const url = await getDocumentDownloadUrl(doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
      setSyncError(null);
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر تنزيل المستند.",
      );
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!uploadFile || isUploading) return;

    setIsUploading(true);
    setSyncError(null);

    try {
      const persisted = await uploadPersistentDocument(
        {
          file: uploadFile,
          title: uploadTitle || undefined,
          matterId: uploadMatterId || undefined,
        },
        matters,
        clients,
      );
      setDocs((current) => [persisted, ...current]);
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadMatterId("");
      showToast("تم رفع المستند وحفظه في الأرشيف الآمن.");
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر رفع المستند.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col space-y-4">
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 rounded-2xl border border-[var(--axia-gold)]/50 bg-[var(--panel)] px-4 py-3 text-xs font-bold shadow-2xl">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {syncError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
          {syncError}
        </div>
      )}

      <div className="flex shrink-0 flex-col justify-between gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold text-[var(--axia-gold-light)]">
            <Scale className="size-4 text-[var(--axia-gold)]" />
            <span>الوثائق والعقود والمحررات القانونية</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {activeTab === "archive"
              ? "الأرشيف القانوني الآمن"
              : activeTab === "editor"
                ? "محرر المسودات القانونية"
                : "مكتبة القوالب والنماذج"}
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {activeTab === "archive"
              ? "ملفات خاصة محفوظة في Supabase Storage بروابط تنزيل مؤقتة"
              : "المسودات والقوالب ما زالت مساحة عمل محلية حتى اعتماد ملف نهائي"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--panel)] p-1">
            {[
              { id: "archive", label: `الأرشيف (${docs.length})`, icon: FileText },
              { id: "editor", label: "محرر المسودات", icon: PenTool },
              {
                id: "templates",
                label: `القوالب (${legalTemplatesCollection.length})`,
                icon: Sparkles,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id as "archive" | "editor" | "templates")
                }
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                  activeTab === tab.id
                    ? "bg-[var(--accent)] text-[var(--text)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "archive" && (
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--axia-gold)] px-3.5 py-2 text-xs font-bold text-black"
            >
              <Upload className="size-3.5" />
              رفع مستند
            </button>
          )}
        </div>
      </div>

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
          <div className="flex shrink-0 flex-wrap items-center gap-3 py-1">
            <div className="relative min-w-[250px] max-w-sm flex-1">
              <Search className="absolute right-2.5 top-2 size-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="بحث باسم المستند، الموكل، رقم القضية..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] py-1.5 pl-3 pr-8 text-xs"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
                className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--panel)] py-1.5 pl-3 pr-8 text-xs"
              >
                <option value="all">كافة المستندات</option>
                <option value="مستند قانوني">مستندات الأرشيف</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2 size-3 text-[var(--text-muted)]" />
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-xs text-[var(--text-muted)]">
              جارٍ تحميل الأرشيف الآمن...
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-right text-[11px]">
                  <thead className="sticky top-0 z-10 bg-[var(--panel)]">
                    <tr className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="px-4 py-2.5 font-medium">المستند</th>
                      <th className="px-4 py-2.5 font-medium">الموكل / القضية</th>
                      <th className="px-4 py-2.5 font-medium">النوع</th>
                      <th className="px-4 py-2.5 font-medium">الحالة</th>
                      <th className="px-4 py-2.5 text-center font-medium">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[var(--accent)]">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setLocalSelectedDocId(doc.id)}
                            className="text-right"
                          >
                            <div className="font-semibold">{doc.title}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              {doc.date}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{doc.clientName}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {doc.caseNumber || "غير مرتبط بقضية"}
                          </div>
                        </td>
                        <td className="px-4 py-3">{doc.type}</td>
                        <td className="px-4 py-3">
                          <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => void handleDownload(doc)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--accent)]"
                          >
                            <Download className="size-3" />
                            تنزيل
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
                          لا توجد مستندات محفوظة في الأرشيف حتى الآن.
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

      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative w-full rounded-t-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl sm:max-w-xl sm:rounded-3xl">
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
              بيانات المستند المحفوظ
            </div>
            <h2 className="border-b border-[var(--border)] pb-4 text-xl font-bold">
              {selectedDoc.title}
            </h2>
            <div className="mt-4 space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 text-xs">
              <div>الموكل: {selectedDoc.clientName}</div>
              <div>القضية: {selectedDoc.caseNumber || "غير مرتبط بقضية"}</div>
              <div>نوع الملف: {selectedDoc.mimeType || "غير مسجل"}</div>
              <div>تاريخ الحفظ: {selectedDoc.date}</div>
              <div>الحجم: {selectedDoc.fileSize}</div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
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
                تنزيل برابط مؤقت
              </button>
            </div>
          </div>
        </div>
      )}

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative w-full rounded-t-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)]"
            >
              <X className="size-4" />
            </button>
            <h2 className="border-b border-[var(--border)] pb-4 text-xl font-bold">
              رفع مستند إلى الأرشيف الخاص
            </h2>
            <form onSubmit={handleUpload} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="mb-1 block text-[var(--text-muted)]">
                  عنوان المستند
                </label>
                <input
                  value={uploadTitle}
                  onChange={(event) => setUploadTitle(event.target.value)}
                  placeholder="اختياري — يستخدم اسم الملف عند تركه فارغًا"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-[var(--text-muted)]">
                  القضية المرتبطة
                </label>
                <select
                  value={uploadMatterId}
                  onChange={(event) => setUploadMatterId(event.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                >
                  <option value="">مستند عام بالمؤسسة</option>
                  {matters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.caseNumber} — {matter.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[var(--text-muted)]">
                  الملف — بحد أقصى 25 MB
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.rtf,.txt,.jpg,.jpeg,.png,.webp"
                  onChange={(event) =>
                    setUploadFile(event.target.files?.[0] || null)
                  }
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                />
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--accent)]/40 p-3 text-[11px] text-[var(--text-muted)]">
                الملفات خاصة وغير عامة. التنزيل يتم عبر رابط مؤقت بعد التحقق من صلاحيات المؤسسة والقضية.
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
                  disabled={!uploadFile || isUploading}
                  className="rounded-md bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? "جارٍ الرفع..." : "رفع وحفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
