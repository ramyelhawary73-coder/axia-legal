"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignRight, 
  AlignCenter, 
  AlignLeft, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Undo2, 
  Redo2, 
  Save, 
  History, 
  FileCheck, 
  Scale, 
  Plus, 
  Trash2, 
  Printer, 
  Copy, 
  Check, 
  RotateCcw, 
  Eye, 
  GitCommit, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  BookMarked,
  X,
  ChevronDown,
  ArrowRight
} from "lucide-react";
import { LegalDraft, DocumentVersion, LegalDraftDocType } from "@/types/legal-editor";
import { Client, Matter, LegalDocument } from "@/types/legal";
import { initialMockLegalDrafts } from "@/lib/mock-legal-drafts";
import { safeLegalHtml } from "@/lib/legal-draft-persistence";
import { PersistentLegalEditor, type DraftBootstrap } from "@/components/persistent-legal-editor";

interface LegalRichTextEditorProps {
  clients: Client[];
  matters?: Matter[];
  initialDraftId?: string;
  onSaveToArchive?: (doc: LegalDocument) => void;
  onCloseEditor?: () => void;
}

const STORAGE_KEY = "axia_legal_drafts_v1";

export function LegalRichTextEditor(props: LegalRichTextEditorProps) {
  const [state, setState] = useState<DraftBootstrap | "loading" | "legacy" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/drafts", { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (data.enabled === false) setState("legacy");
      else if (response.ok && data.enabled === true && Array.isArray(data.drafts)) setState(data);
      else setState("error");
    }).catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  if (state === "loading") return <p role="status">جارٍ تحميل حالة حفظ المسودات…</p>;
  if (state === "legacy") return <LegacyLegalRichTextEditor {...props} />;
  if (state === "error") return <p role="alert">تعذر تحميل مسودات المكتب. لم يتم استبدال أو تعديل المسودات المحلية. راجع الاتصال والصلاحية قبل الكتابة.</p>;
  return <PersistentLegalEditor bootstrap={state} clients={props.clients} matters={props.matters ?? []} onClose={props.onCloseEditor}
    renderEditor={workspace => <LegalDraftWorkspace key={workspace.draft.id + ":" + workspace.editorEpoch} {...workspace} />} />;
}

function LegacyLegalRichTextEditor({
  clients,
  initialDraftId,
  onSaveToArchive,
  onCloseEditor,
}: LegalRichTextEditorProps) {
  // Load drafts from localStorage or fallback to initial mocks
  const [drafts, setDrafts] = useState<LegalDraft[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.error("Failed to load drafts from storage", err);
      }
    }
    return initialMockLegalDrafts;
  });

  const [activeDraftId, setActiveDraftId] = useState<string>(() => {
    if (initialDraftId && drafts.some((d) => d.id === initialDraftId)) {
      return initialDraftId;
    }
    return drafts[0]?.id || "DRAFT-2026-001";
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Save all drafts to localStorage whenever drafts array updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch (err) {
      console.error("Failed to save drafts to localStorage", err);
    }
  }, [drafts]);

  const activeDraft = useMemo(() => {
    return drafts.find((d) => d.id === activeDraftId) || drafts[0] || initialMockLegalDrafts[0];
  }, [drafts, activeDraftId]);

  // Update a draft's fields
  const handleUpdateDraft = useCallback((updatedFields: Partial<LegalDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id === activeDraftId) {
          return {
            ...d,
            ...updatedFields,
          };
        }
        return d;
      })
    );
  }, [activeDraftId]);

  // Add new version snapshot
  const handleAddVersion = useCallback((newVer: DocumentVersion) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id === activeDraftId) {
          return {
            ...d,
            currentVersionNumber: newVer.versionNumber,
            versions: [newVer, ...(d.versions || [])],
          };
        }
        return d;
      })
    );
    showToast(`تم حفظ الإصدار ${newVer.versionNumber} في سجل المراجعات.`);
  }, [activeDraftId, showToast]);

  // Restore previous version
  const handleRestoreVersion = useCallback((version: DocumentVersion, currentHtml: string, currentWords: number, currentChars: number) => {
    const timeNow = Date.now();
    const autoBackupVersion: DocumentVersion = {
      id: `VER-AUTO-${timeNow}`,
      versionNumber: `${activeDraft.currentVersionNumber}-احتياطي`,
      timestamp: new Date().toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      authorName: "النظام (نسخة أمان قبل الاستعادة)",
      note: `نسخة تلقائية قبل استعادة الإصدار ${version.versionNumber}`,
      contentHtml: currentHtml,
      wordCount: currentWords,
      characterCount: currentChars,
    };

    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id === activeDraftId) {
          return {
            ...d,
            contentHtml: version.contentHtml,
            currentVersionNumber: `${version.versionNumber} (مستعاد)`,
            versions: [autoBackupVersion, ...(d.versions || [])],
            updatedAt: new Date().toISOString(),
          };
        }
        return d;
      })
    );
    showToast(`تمت استعادة محتوى الإصدار (${version.versionNumber}) بنجاح.`);
  }, [activeDraft.currentVersionNumber, activeDraftId, showToast]);

  // Create brand new blank draft
  const handleCreateNewBlankDraft = () => {
    const timeNow = Date.now();
    const newId = `DRAFT-${timeNow}`;
    const newDraft: LegalDraft = {
      id: newId,
      title: "مسودة محررة جديدة — بدون عنوان",
      docType: "مذكرة دفاع",
      clientName: clients[0]?.name || "موكل جديد",
      caseNumber: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentVersionNumber: "v1.0",
      status: "مسودة قيد التحرير",
      contentHtml: `
<h1 style="text-align: center;"><strong>محكمة ............................................</strong></h1>
<p style="text-align: center;"><strong>مذكرة دفاع / صحيفة دعوى</strong></p>
<hr />
<p><strong>بناءً على طلب السيد:</strong> ..............................................................<br />
<strong>ضــــــــــــــــــــــــد:</strong> ..............................................................</p>
<h3><strong>الوقائع والطلبات:</strong></h3>
<p>نبدأ بعرض وقائع النزاع وتأصيله القانوني...</p>
      `.trim(),
      versions: [
        {
          id: `VER-${timeNow}`,
          versionNumber: "v1.0",
          timestamp: new Date().toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          authorName: "د. رامي الهواري (محام بالنقض)",
          note: "إنشاء المسودة الأولية",
          contentHtml: "<p>إنشاء المسودة الأولية</p>",
          wordCount: 20,
          characterCount: 120,
          isMilestone: true,
        },
      ],
    };

    setDrafts((prev) => [newDraft, ...prev]);
    setActiveDraftId(newId);
    showToast("تم إنشاء مسودة قانونية جديدة بنجاح.");
  };

  // Delete current draft
  const handleDeleteDraft = () => {
    if (drafts.length <= 1) {
      alert("لا يمكن حذف المسودة الوحيدة المتبقية.");
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف مسودة "${activeDraft.title}" نهائياً؟`)) {
      return;
    }

    const remaining = drafts.filter((d) => d.id !== activeDraft.id);
    setDrafts(remaining);
    setActiveDraftId(remaining[0].id);
    showToast("تم حذف المسودة بنجاح.");
  };

  // Commit and approve to main official Archive
  const handleCommitToArchive = (title: string, docType: LegalDraftDocType, caseNum: string, client: string, words: number) => {
    const timeNow = Date.now();
    const approvedDoc: LegalDocument = {
      id: `DOC-ARCH-${timeNow}`,
      title: title || activeDraft.title,
      type: docType === "طعن بالنقض" || docType === "محرر قانوني عام" ? "مذكرة دفاع" : docType,
      caseNumber: caseNum || "توثيق رسمي",
      clientName: client || "موكل مكتب أكسيا",
      date: new Date().toISOString().split("T")[0],
      fileSize: `${(words * 0.01 + 0.8).toFixed(1)} MB (معتمد رقمياً)`,
      status: "نهائي معتمد",
    };

    if (onSaveToArchive) {
      onSaveToArchive(approvedDoc);
    }
    showToast(`تم اعتماد الوثيقة وحفظها رسمياً في أرشيف المكتب.`);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 rounded-2xl border border-[var(--axia-gold)]/50 bg-[var(--panel)] px-4 py-3 shadow-2xl text-xs font-bold text-[var(--text)] animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Draft Switcher & Top Utility Bar */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 shadow-sm shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {onCloseEditor && (
              <button
                type="button"
                onClick={onCloseEditor}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--accent)] px-2.5 py-1.5 text-xs font-bold text-[var(--text)] hover:bg-[var(--accent-hover)] transition"
                title="الرجوع للأرشيف"
              >
                <ArrowRight className="size-3.5" />
                <span>الأرشيف</span>
              </button>
            )}

            <div className="relative">
              <select
                value={activeDraftId}
                onChange={(e) => setActiveDraftId(e.target.value)}
                className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] pr-8 pl-3 py-1.5 text-xs font-bold text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none max-w-[280px] sm:max-w-xs truncate"
              >
                {drafts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.currentVersionNumber})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 size-3 text-[var(--text-muted)] pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={handleCreateNewBlankDraft}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-bold text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] transition shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>مسودة جديدة</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteDraft}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-500 transition"
              title="حذف هذه المسودة"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Editor Core Workspace Component with key={activeDraft.id} to cleanly remount state */}
      <LegalDraftWorkspace
        key={activeDraft.id}
        draft={activeDraft}
        onUpdateDraft={handleUpdateDraft}
        onAddVersion={handleAddVersion}
        onRestoreVersion={handleRestoreVersion}
        onCommitToArchive={handleCommitToArchive}
        showToast={showToast}
      />
    </div>
  );
}

interface LegalDraftWorkspaceProps {
  draft: LegalDraft;
  onUpdateDraft: (updated: Partial<LegalDraft>) => void;
  onAddVersion: (newVer: DocumentVersion) => void;
  onRestoreVersion: (version: DocumentVersion, currentHtml: string, currentWords: number, currentChars: number) => void;
  onCommitToArchive: (title: string, docType: LegalDraftDocType, caseNum: string, client: string, words: number) => void;
  showToast: (msg: string) => void;
  persistenceState?: string;
  authorLabel?: string;
}

function LegalDraftWorkspace({
  draft,
  onUpdateDraft,
  onAddVersion,
  onRestoreVersion,
  onCommitToArchive,
  showToast,
  persistenceState,
  authorLabel,
}: LegalDraftWorkspaceProps) {
  const [editorHtml, setEditorHtml] = useState<string>(draft.contentHtml || "");
  const [draftTitle, setDraftTitle] = useState<string>(draft.title || "");
  const [docType, setDocType] = useState<LegalDraftDocType>(draft.docType || "مذكرة دفاع");
  const [clientName, setClientName] = useState<string>(draft.clientName || "");
  const [caseNumber, setCaseNumber] = useState<string>(draft.caseNumber || "");
  const [status, setStatus] = useState<LegalDraft["status"]>(draft.status || "مسودة قيد التحرير");

  // Auto-save & sync states
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    return new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  });

  // Version history states
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<DocumentVersion | null>(null);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionNote, setNewVersionNote] = useState("");
  const [newVersionAuthor, setNewVersionAuthor] = useState(authorLabel ?? "المحرر الحالي");
  const [isMilestoneCheck, setIsMilestoneCheck] = useState(false);

  // Editor UI state
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialMountRef = useRef(true);
  const persistent = !!persistenceState;

  // Synchronize HTML to editable div on first mount
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== draft.contentHtml) {
      editorRef.current.innerHTML = safeLegalHtml(draft.contentHtml || "");
    }
  }, [draft.contentHtml]);

  // Word & Character count calculation
  const { wordCount, characterCount, estimatedReadingTime } = useMemo(() => {
    if (typeof window === "undefined") return { wordCount: 0, characterCount: 0, estimatedReadingTime: 1 };
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = safeLegalHtml(editorHtml);
    const text = tempDiv.textContent || tempDiv.innerText || "";
    const cleanText = text.trim();
    const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const chars = cleanText.length;
    const readMinutes = Math.max(1, Math.ceil(words / 130));
    return { wordCount: words, characterCount: chars, estimatedReadingTime: readMinutes };
  }, [editorHtml]);

  // Manual save trigger
  const triggerManualSave = useCallback(() => {
    setSaveStatus("saving");
    const now = new Date();
    const timeStr = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    onUpdateDraft({
      title: draftTitle,
      contentHtml: editorHtml,
      docType,
      clientName,
      caseNumber,
      status,
      updatedAt: now.toISOString(),
      autoSavedAt: timeStr,
    });

    setSaveStatus("saved");
    setLastSavedTime(timeStr);
    showToast(persistenceState ? "تم تجهيز التعديلات للحفظ في المكتب؛ راجع حالة تأكيد الحفظ." : "تم حفظ المسودة محليًا في هذا المتصفح.");
  }, [draftTitle, editorHtml, docType, clientName, caseNumber, status, onUpdateDraft, showToast, persistenceState]);

  // Durable mode marks edits immediately; the parent serializes server saves.
  // Legacy mode retains its existing local debounce.
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    setSaveStatus("unsaved");
    if (persistent) {
      onUpdateDraft({ title: draftTitle, contentHtml: editorHtml, docType, clientName, caseNumber, status, updatedAt: new Date().toISOString() });
      return;
    }
    const timer = setTimeout(() => {
      setSaveStatus("saving");
      const now = new Date();
      const timeStr = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      onUpdateDraft({
        title: draftTitle,
        contentHtml: editorHtml,
        docType,
        clientName,
        caseNumber,
        status,
        updatedAt: now.toISOString(),
        autoSavedAt: timeStr,
      });

      setSaveStatus("saved");
      setLastSavedTime(timeStr);
    }, 1200);

    return () => clearTimeout(timer);
  }, [editorHtml, draftTitle, docType, clientName, caseNumber, status, onUpdateDraft, persistent]);

  // Keyboard shortcut for manual save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        triggerManualSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerManualSave]);

  // Formatting commands
  const applyCommand = (command: string, value: string | undefined = undefined) => {
    if (typeof document !== "undefined") {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        setEditorHtml(editorRef.current.innerHTML);
      }
    }
  };

  // Custom Legal Block Inserts
  const insertLegalBlock = (type: "precedent" | "clause" | "caption" | "signatures") => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let blockHtml = "";
    switch (type) {
      case "precedent":
        blockHtml = `
<div class="legal-precedent-box" style="border: 1px dashed #c89b3c; padding: 14px; margin: 16px 0; border-radius: 8px; background-color: rgba(200, 155, 60, 0.04);">
  <strong style="color: #c89b3c;">مبدأ قضائي مستقر — محكمة النقض المصرية:</strong>
  <p style="margin-top: 6px; font-style: italic; line-height: 1.8;">"اكتب هنا نص المبدأ القانوني الصادر عن محكمة النقض الدائرة المدنية أو الجنائية..."</p>
  <span style="font-size: 11px; opacity: 0.8; display: block; margin-top: 4px;">(الطعن رقم .... لسنة .... ق — جلسة ..../..../....)</span>
</div><p><br></p>`;
        break;
      case "clause":
        blockHtml = `
<div class="legal-clause-box" style="border-right: 4px solid #c89b3c; padding: 12px 16px; margin: 16px 0; background-color: rgba(200, 155, 60, 0.08); border-radius: 8px;">
  <strong style="color: #c89b3c;">البند (.....): [عنوان البند / الدفع القانوني]</strong>
  <p style="margin-top: 6px; line-height: 1.8;">اتفق الطرفان / يدفع الحاضر عن المدعى عليه بـ ..............................................................</p>
</div><p><br></p>`;
        break;
      case "caption":
        blockHtml = `
<div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid rgba(0,0,0,0.1); padding-bottom: 12px;">
  <h2 style="margin: 0; font-size: 18px;"><strong>جمهورية مصر العربية — وزارة العدل</strong></h2>
  <h3 style="margin: 4px 0 0 0; font-size: 16px;"><strong>محكمة ................................... — الدائرة (.....)</strong></h3>
</div><p><br></p>`;
        break;
      case "signatures":
        blockHtml = `
<table style="width: 100%; margin-top: 32px; border-collapse: collapse;">
  <tr>
    <td style="width: 50%; text-align: center;"><strong>الطرف الأول / وكيل المدعي</strong><br /><br />..................................................</td>
    <td style="width: 50%; text-align: center;"><strong>الطرف الثاني / وكيل المدعى عليه</strong><br /><br />..................................................</td>
  </tr>
</table><p><br></p>`;
        break;
    }

    applyCommand("insertHTML", blockHtml);
  };

  // Create new version snapshot handler
  const handleCreateSnapshot = () => {
    if (!newVersionNote.trim()) return;

    const timeNow = Date.now();
    const currentVersions = draft.versions || [];
    const nextMinorNumber = currentVersions.length + 1;
    const nextVerTag = isMilestoneCheck ? `v${Math.floor(nextMinorNumber / 2) + 1}.0` : `v1.${nextMinorNumber}`;

    const newVersion: DocumentVersion = {
      id: `VER-${timeNow}`,
      versionNumber: nextVerTag,
      timestamp: new Date().toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      authorName: newVersionAuthor,
      note: newVersionNote.trim(),
      contentHtml: editorHtml,
      wordCount,
      characterCount,
      isMilestone: isMilestoneCheck,
    };

    onAddVersion(newVersion);
    setIsNewVersionModalOpen(false);
    setNewVersionNote("");
    setIsMilestoneCheck(false);
  };

  // Restore snapshot handler
  const handleRestoreSnapshot = (ver: DocumentVersion) => {
    if (!confirm(`هل أنت متأكد من استعادة الإصدار (${ver.versionNumber})؟ سيتم إنشاء نسخة احتياطية من التعديلات الحالية تلقائياً.`)) {
      return;
    }

    onRestoreVersion(ver, editorHtml, wordCount, characterCount);
    setEditorHtml(ver.contentHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = safeLegalHtml(ver.contentHtml);
    }
    setPreviewVersion(null);
    setCompareVersion(null);
    setIsHistoryDrawerOpen(false);
  };

  // Copy plain text
  const handleCopy = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("تم نسخ نص المسودة إلى الحافظة.");
    }
  };

  return (
    <div className={`flex flex-col flex-1 space-y-3 ${isFullscreen ? "fixed inset-0 z-50 bg-[var(--bg)] p-4 overflow-y-auto" : ""}`}>
      {/* Workspace Header Panel */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3.5 shadow-sm shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left Metadata Form Fields */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as LegalDraftDocType)}
                className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] pr-7 pl-3 py-1.5 text-xs font-medium text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
              >
                <option value="مذكرة دفاع">مذكرة دفاع</option>
                <option value="صحيفة دعوى">صحيفة دعوى</option>
                <option value="عقد واتفاقية">عقد واتفاقية</option>
                <option value="إنذار رسمي">إنذار رسمي</option>
                <option value="طعن بالنقض">طعن بالنقض</option>
                <option value="محرر قانوني عام">محرر قانوني عام</option>
              </select>
              <Scale className="absolute right-2 top-2 size-3 text-[var(--text-muted)] pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LegalDraft["status"])}
                className={`appearance-none rounded-xl border px-3 py-1.5 text-[11px] font-bold pr-7 focus:outline-none ${
                  status === "جاهزة للاعتماد"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : status === "مراجعة الشركاء"
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                }`}
              >
                <option value="مسودة قيد التحرير">مسودة قيد التحرير</option>
                <option value="مراجعة الشركاء">مراجعة الشركاء</option>
                <option value="جاهزة للاعتماد">جاهزة للاعتماد</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2 size-3 text-[var(--text-muted)] pointer-events-none" />
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Save Live Status Indicator */}
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-[11px] text-[var(--text-muted)]">
              {persistenceState ? <span>{persistenceState}</span> : saveStatus === "saving" ? (
                <>
                  <div className="size-2 rounded-full bg-blue-500 animate-ping" />
                  <span className="text-blue-500 font-medium">جارِ الحفظ التلقائي...</span>
                </>
              ) : saveStatus === "unsaved" ? (
                <>
                  <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-500 font-medium">تعديلات غير محفوظة</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  <span>محفوظ تلقائياً ({lastSavedTime})</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={triggerManualSave}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-bold text-[var(--text)] hover:bg-[var(--accent)] transition shadow-xs"
              title="حفظ فوري (Ctrl+S)"
            >
              <Save className="size-3.5 text-[var(--axia-gold)]" />
              <span>حفظ (Ctrl+S)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                isHistoryDrawerOpen
                  ? "border-[var(--axia-gold)] bg-[var(--axia-gold-dim)] text-[var(--axia-gold)]"
                  : "border-[var(--border)] bg-[var(--panel)] text-[var(--text)] hover:border-[var(--axia-gold)]"
              }`}
            >
              <History className="size-3.5 text-[var(--axia-gold)]" />
              <span>سجل الإصدارات ({draft.versions?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => onCommitToArchive(draftTitle, docType, caseNumber, clientName, wordCount)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--axia-gold)] px-3.5 py-1.5 text-xs font-bold text-black shadow-sm hover:bg-[var(--axia-gold-light)] transition"
            >
              <FileCheck className="size-3.5" />
              <span>اعتماد بالأرشيف</span>
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-2 pt-2.5 border-t border-[var(--border)]">
          <div className="md:col-span-6">
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="عنوان المسودة القضائية أو التعاقدية..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm font-bold text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="اسم الموكل..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <input
              type="text"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="رقم القضية / التوثيق..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Editor & Side Drawer Container */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        <div className="flex-1 flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-sm overflow-hidden">
          {/* Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--border)] bg-[var(--bg)]/50 text-xs">
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 border-l border-[var(--border)] pl-1 ml-1">
              <button
                type="button"
                onClick={() => applyCommand("undo")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition"
                title="تراجع (Ctrl+Z)"
              >
                <Undo2 className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyCommand("redo")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition"
                title="إعادة (Ctrl+Y)"
              >
                <Redo2 className="size-3.5" />
              </button>
            </div>

            {/* Block Headings */}
            <div className="flex items-center gap-1 border-l border-[var(--border)] pl-1 ml-1">
              <button
                type="button"
                onClick={() => applyCommand("formatBlock", "<h1>")}
                className="px-2 py-1 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] font-bold text-[11px] transition"
                title="عنوان رئيسي (ديباجة)"
              >
                ع١
              </button>
              <button
                type="button"
                onClick={() => applyCommand("formatBlock", "<h2>")}
                className="px-2 py-1 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] font-semibold text-[11px] transition"
                title="عنوان فرعي (بند / دفع)"
              >
                ع٢
              </button>
              <button
                type="button"
                onClick={() => applyCommand("formatBlock", "<h3>")}
                className="px-2 py-1 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] text-[11px] transition"
                title="عنوان طلب"
              >
                ع٣
              </button>
              <button
                type="button"
                onClick={() => applyCommand("formatBlock", "<p>")}
                className="px-2 py-1 rounded-lg hover:bg-[var(--accent)] text-[var(--text-muted)] text-[11px] transition"
                title="فقرة عادية"
              >
                فقرة
              </button>
            </div>

            {/* Text Styling */}
            <div className="flex items-center gap-0.5 border-l border-[var(--border)] pl-1 ml-1">
              <button
                type="button"
                onClick={() => applyCommand("bold")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition font-bold"
                title="عريض (Ctrl+B)"
              >
                <Bold className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyCommand("italic")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition italic"
                title="مائل (Ctrl+I)"
              >
                <Italic className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyCommand("underline")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition underline"
                title="تسطير (Ctrl+U)"
              >
                <Underline className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyCommand("strikeThrough")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text-muted)] transition"
                title="يتوسطه خط"
              >
                <Strikethrough className="size-3.5" />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5 border-l border-[var(--border)] pl-1 ml-1">
              <button
                type="button"
                onClick={() => applyCommand("justifyRight")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition"
                title="محاذاة لليمين"
              >
                <AlignRight className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyCommand("justifyCenter")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition"
                title="توسيط"
              >
                <AlignCenter className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyCommand("justifyLeft")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition"
                title="محاذاة لليسار"
              >
                <AlignLeft className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyCommand("justifyFull")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition"
                title="ضبط وتنسيق متوازي"
              >
                <AlignJustify className="size-3.5" />
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-0.5 border-l border-[var(--border)] pl-1 ml-1">
              <button
                type="button"
                onClick={() => applyCommand("insertUnorderedList")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition"
                title="قائمة نقطية"
              >
                <List className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyCommand("insertOrderedList")}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition"
                title="قائمة رقمية لبنود العقد"
              >
                <ListOrdered className="size-3.5" />
              </button>
            </div>

            {/* Legal Snippet Inserts */}
            <div className="flex items-center gap-1 border-l border-[var(--border)] pl-1 ml-1">
              <button
                type="button"
                onClick={() => insertLegalBlock("clause")}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] hover:border-[var(--axia-gold)] text-[var(--text)] text-[10px] font-bold transition"
                title="إدراج بند تعاقدي أو دفع قانوني مميز"
              >
                <BookMarked className="size-3 text-[var(--axia-gold)]" />
                <span>بند ملزم</span>
              </button>
              <button
                type="button"
                onClick={() => insertLegalBlock("precedent")}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] hover:border-[var(--axia-gold)] text-[var(--text)] text-[10px] font-bold transition"
                title="إدراج مبدأ قضائي لمحكمة النقض"
              >
                <Scale className="size-3 text-[var(--axia-gold)]" />
                <span>مبدأ نقض</span>
              </button>
              <button
                type="button"
                onClick={() => insertLegalBlock("caption")}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] hover:border-[var(--axia-gold)] text-[var(--text)] text-[10px] font-bold transition"
                title="إدراج ديباجة محكمة رسمية"
              >
                <span>ديباجة</span>
              </button>
              <button
                type="button"
                onClick={() => insertLegalBlock("signatures")}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] hover:border-[var(--axia-gold)] text-[var(--text)] text-[10px] font-bold transition"
                title="إدراج توقيعات الأطراف"
              >
                <span>توقيعات</span>
              </button>
            </div>

            {/* Tools Right */}
            <div className="mr-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFontSize(fontSize === "sm" ? "base" : fontSize === "base" ? "lg" : "sm")}
                className="px-2 py-1 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] text-[10px] font-mono transition"
                title="حجم خط المحرر"
              >
                خط: {fontSize === "sm" ? "صغير" : fontSize === "base" ? "متوسط" : "كبير"}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition"
                title="نسخ النص"
              >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition"
                title="طباعة المسودة"
              >
                <Printer className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--text)] transition"
                title="ملء الشاشة"
              >
                {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Editable Document Surface */}
          <div className="flex-1 overflow-y-auto bg-[var(--bg)]/40 p-4 sm:p-8 flex justify-center custom-scrollbar">
            <div
              className={`w-full max-w-3xl bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-md min-h-[650px] p-8 sm:p-12 transition-all outline-none text-[var(--text)] leading-relaxed font-sans ${
                fontSize === "sm" ? "text-sm" : fontSize === "lg" ? "text-lg" : "text-base"
              }`}
              style={{ direction: "rtl", minHeight: "100%" }}
            >
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  setEditorHtml(e.currentTarget.innerHTML);
                }}
                className="outline-none min-h-[500px] prose prose-invert max-w-none focus:outline-none"
              />
            </div>
          </div>

          {/* Metrics Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-t border-[var(--border)] bg-[var(--panel)] text-[11px] text-[var(--text-muted)] shrink-0">
            <div className="flex items-center gap-4">
              <span>الإصدار: <strong className="text-[var(--text)]">{draft.currentVersionNumber}</strong></span>
              <span>الكلمات: <strong className="text-[var(--text)]">{wordCount}</strong></span>
              <span>الحروف: <strong className="text-[var(--text)]">{characterCount}</strong></span>
              <span>زمن التلاوة: <strong className="text-[var(--text)]">~{estimatedReadingTime} دقيقة</strong></span>
            </div>

            <button
              type="button"
              onClick={() => setIsNewVersionModalOpen(true)}
              className="inline-flex items-center gap-1 text-[var(--axia-gold)] hover:underline font-bold"
            >
              <GitCommit className="size-3.5" />
              <span>تسجيل نقطة تفتيش جديدة</span>
            </button>
          </div>
        </div>

        {/* Version History Drawer */}
        {isHistoryDrawerOpen && (
          <div className="w-80 md:w-96 flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-lg overflow-hidden shrink-0 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-3.5 border-b border-[var(--border)] bg-[var(--bg)]/40">
              <div className="flex items-center gap-2">
                <History className="size-4 text-[var(--axia-gold)]" />
                <h3 className="text-xs font-bold text-[var(--text)]">سجل إصدارات المسودة</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsNewVersionModalOpen(true)}
                  className="p-1 rounded-lg hover:bg-[var(--accent)] text-[var(--axia-gold)] transition"
                  title="إنشاء إصدار جديد"
                >
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-[var(--accent)] text-[var(--text-muted)] transition"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              {draft.versions && draft.versions.length > 0 ? (
                draft.versions.map((ver) => {
                  const isCurrent = ver.versionNumber === draft.currentVersionNumber;
                  return (
                    <div
                      key={ver.id}
                      className={`rounded-xl border p-3 text-xs transition-all ${
                        isCurrent
                          ? "border-[var(--axia-gold)] bg-[var(--axia-gold-dim)]/50 shadow-xs"
                          : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[var(--text)]">{ver.versionNumber}</span>
                          {ver.isMilestone && (
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              إصدار معتمد
                            </span>
                          )}
                          {isCurrent && (
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                              النشط حالياً
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)]">{ver.timestamp}</span>
                      </div>

                      <p className="text-[11px] text-[var(--text)] mb-2 font-medium line-clamp-2">
                        {ver.note || "حفظ تلقائي للإصدار"}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-2">
                        <span>المحرر: {ver.authorName}</span>
                        <span>{ver.wordCount} كلمة</span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border)]">
                        <button
                          type="button"
                          onClick={() => setPreviewVersion(ver)}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[10px] font-semibold text-[var(--text)] hover:bg-[var(--accent)] transition"
                        >
                          <Eye className="size-3" />
                          <span>معاينة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompareVersion(ver)}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[10px] font-semibold text-[var(--text)] hover:bg-[var(--accent)] transition"
                        >
                          <Scale className="size-3 text-[var(--axia-gold)]" />
                          <span>مقارنة الفروق</span>
                        </button>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRestoreSnapshot(ver)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[10px] font-semibold text-rose-500 hover:bg-rose-500/10 transition"
                            title="استعادة هذا الإصدار"
                          >
                            <RotateCcw className="size-3" />
                            <span>استعادة</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                  لا توجد إصدارات مسجلة بعد.
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[var(--border)] bg-[var(--bg)]/40">
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--axia-gold)] px-3 py-2 text-xs font-bold text-black shadow-sm hover:bg-[var(--axia-gold-light)] transition"
              >
                <GitCommit className="size-3.5" />
                <span>حفظ نقطة مراجعة جديدة</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Version Snapshot Modal */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-md overflow-y-auto rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              type="button"
              onClick={() => setIsNewVersionModalOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] transition"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-[var(--axia-gold)] mb-1">
              <GitCommit className="size-4" />
              <span>نقطة تفتيش وإصدار قانوني جديد</span>
            </div>

            <h3 className="text-lg font-bold text-[var(--text)] mb-3">
              تسجيل إصدار لمسودة &quot;{draftTitle}&quot;
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                  ملاحظات المراجعة / التعديلات المنجزة *
                </label>
                <textarea
                  rows={3}
                  value={newVersionNote}
                  onChange={(e) => setNewVersionNote(e.target.value)}
                  placeholder="مثال: إضافة الدفع بسقوط الحق بالتقادم، وتعديل صياغة الشرط الجزائي..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                  المحامي المسؤول عن هذا الإصدار
                </label>
                <select
                  value={newVersionAuthor}
                  onChange={(e) => setNewVersionAuthor(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                >
                  <option value="د. رامي الهواري (محام بالنقض)">د. رامي الهواري (محام بالنقض)</option>
                  <option value="أ. طارق الشريف (استئناف)">أ. طارق الشريف (استئناف)</option>
                  <option value="أ. فاطمة عمر (مستشار عقود)">أ. فاطمة عمر (مستشار عقود)</option>
                  <option value="أ. أحمد عبد العزيز (محام بالنقض)">أ. أحمد عبد العزيز (محام بالنقض)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="milestoneCheck"
                  checked={isMilestoneCheck}
                  onChange={(e) => setIsMilestoneCheck(e.target.checked)}
                  className="size-4 rounded border-[var(--border)] accent-[var(--axia-gold)]"
                />
                <label htmlFor="milestoneCheck" className="text-xs font-medium text-[var(--text)] cursor-pointer">
                  تمييز كإصدار رئيسي معتمد (Milestone Version)
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(false)}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--accent)] transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateSnapshot}
                disabled={!newVersionNote.trim()}
                className="rounded-xl bg-[var(--axia-gold)] px-4 py-2 text-xs font-bold text-black hover:bg-[var(--axia-gold-light)] transition disabled:opacity-50"
              >
                تسجيل وحفظ الإصدار
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Version Preview Modal */}
      {previewVersion && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-3xl flex flex-col rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setPreviewVersion(null)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] transition"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-[var(--axia-gold)] mb-1">
              <Eye className="size-4" />
              <span>معاينة إصدار محفوظ — {previewVersion.versionNumber}</span>
            </div>

            <h3 className="text-lg font-bold text-[var(--text)] pb-2 border-b border-[var(--border)]">
              {draftTitle}
            </h3>

            <div className="my-2 flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)]">
              <div>المحرر: <strong className="text-[var(--text)]">{previewVersion.authorName}</strong></div>
              <div>التاريخ: <strong className="text-[var(--text)]">{previewVersion.timestamp}</strong></div>
              <div>الكلمات: <strong className="text-[var(--text)]">{previewVersion.wordCount}</strong></div>
              <div className="w-full mt-1.5 text-[11px] text-[var(--text)] font-medium">
                ملاحظات: {previewVersion.note}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)]/50 text-xs leading-relaxed font-sans custom-scrollbar" style={{ direction: "rtl" }}>
              <div
                dangerouslySetInnerHTML={{ __html: safeLegalHtml(previewVersion.contentHtml) }}
                className="prose prose-invert max-w-none"
              />
            </div>

            <div className="mt-4 flex justify-between items-center border-t border-[var(--border)] pt-4">
              <span className="text-[11px] text-[var(--text-muted)]">
                هذه المعاينة للقراءة فقط. يمكنك استعادة هذا الإصدار بالكامل لاستئناف العمل عليه.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewVersion(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--accent)] transition"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => handleRestoreSnapshot(previewVersion)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 px-4 py-2 text-xs font-bold hover:bg-rose-500/20 transition"
                >
                  <RotateCcw className="size-3.5" />
                  <span>استعادة هذا الإصدار</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Diff / Compare Modal */}
      {compareVersion && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-5xl flex flex-col rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setCompareVersion(null)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] transition"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-[var(--axia-gold)] mb-1">
              <Scale className="size-4" />
              <span>مقارنة الفروق بين المسودة الحالية والإصدار ({compareVersion.versionNumber})</span>
            </div>

            <h3 className="text-base font-bold text-[var(--text)] pb-2 border-b border-[var(--border)]">
              {draftTitle}
            </h3>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 my-4 overflow-hidden">
              <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg)]/40 p-4 overflow-hidden">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
                  <span className="text-xs font-bold text-amber-500">
                    الإصدار السابق: {compareVersion.versionNumber} ({compareVersion.timestamp})
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">{compareVersion.wordCount} كلمة</span>
                </div>
                <div
                  className="flex-1 overflow-y-auto p-4 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs leading-relaxed custom-scrollbar"
                  style={{ direction: "rtl" }}
                  dangerouslySetInnerHTML={{ __html: safeLegalHtml(compareVersion.contentHtml) }}
                />
              </div>

              <div className="flex flex-col rounded-2xl border border-[var(--axia-gold)] bg-[var(--axia-gold-dim)]/20 p-4 overflow-hidden">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--axia-gold)]/30">
                  <span className="text-xs font-bold text-[var(--axia-gold)]">
                    المسودة الحالية قيد التحرير ({draft.currentVersionNumber})
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">{wordCount} كلمة</span>
                </div>
                <div
                  className="flex-1 overflow-y-auto p-4 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs leading-relaxed custom-scrollbar"
                  style={{ direction: "rtl" }}
                  dangerouslySetInnerHTML={{ __html: safeLegalHtml(editorHtml) }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-[var(--border)] pt-4">
              <span className="text-[11px] text-[var(--text-muted)]">
                فرق الكلمات: {wordCount - compareVersion.wordCount >= 0 ? `+${wordCount - compareVersion.wordCount}` : wordCount - compareVersion.wordCount} كلمة
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCompareVersion(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--accent)] transition"
                >
                  إغلاق المقارنة
                </button>
                <button
                  type="button"
                  onClick={() => handleRestoreSnapshot(compareVersion)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 px-4 py-2 text-xs font-bold hover:bg-rose-500/20 transition"
                >
                  <RotateCcw className="size-3.5" />
                  <span>استعادة هذا الإصدار السابق</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
