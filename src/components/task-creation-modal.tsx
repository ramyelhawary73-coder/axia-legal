"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Plus, 
  X, 
  Mic, 
  CornerDownLeft 
} from "lucide-react";
import { LegalTask } from "@/types/legal";
import type { TaskMatterOption } from "@/lib/tasks-client";
import { 
  getSpeechRecognitionConstructor, 
  IWindowSpeechRecognition, 
  SpeechRecognitionEvent 
} from "@/lib/web-speech-service";

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: LegalTask) => boolean | void | Promise<boolean | void>;
  matterOptions?: TaskMatterOption[];
  assigneeLabel?: string;
  defaultCategory?: LegalTask["category"];
  defaultCaseNumber?: string;
  sourceLabel?: string;
}

export function TaskCreationModal({
  isOpen,
  onClose,
  onCreateTask,
  matterOptions = [],
  assigneeLabel = "المستخدم الحالي",
  defaultCategory = "قلم المحضرين",
  defaultCaseNumber = "",
  sourceLabel,
}: TaskCreationModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<LegalTask["category"]>(defaultCategory);
  const [matterCaseNumber, setMatterCaseNumber] = useState(defaultCaseNumber);
  const [courtOrBailiffOffice, setCourtOrBailiffOffice] = useState("");
  const [deadline, setDeadline] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [priority, setPriority] = useState<LegalTask["priority"]>("عاجلة");
  const [isDictatingTitle, setIsDictatingTitle] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const titleRecognitionRef = useRef<IWindowSpeechRecognition | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus title input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Clean up speech recognition when unmounted or closed
  useEffect(() => {
    return () => {
      if (titleRecognitionRef.current) {
        try {
          titleRecognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleToggleTitleDictation = () => {
    setSpeechError(null);
    if (isDictatingTitle) {
      if (titleRecognitionRef.current) {
        try {
          titleRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsDictatingTitle(false);
      return;
    }

    const SpeechConstructor = getSpeechRecognitionConstructor();
    if (!SpeechConstructor) {
      setSpeechError("الإملاء الصوتي غير مدعوم في هذا المتصفح (يدعم Google Chrome وEdge).");
      return;
    }

    try {
      const recognition = new SpeechConstructor();
      recognition.lang = "ar-EG";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsDictatingTitle(true);
      };

      recognition.onresult = (e: SpeechRecognitionEvent) => {
        const text = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join("");
        if (text) {
          setTitle((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${text}` : text;
          });
        }
      };

      recognition.onerror = () => {
        setIsDictatingTitle(false);
        setSpeechError("تعذر التقاط الصوت، يرجى التأكد من صلاحية الميكروفون.");
      };

      recognition.onend = () => {
        setIsDictatingTitle(false);
      };

      titleRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsDictatingTitle(false);
      setSpeechError("حدث خطأ أثناء تشغيل الميكروفون.");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSaving) return;

    setSaveError(null);
    setIsSaving(true);

    const normalizedCaseNumber = matterCaseNumber.trim();
    const matchedMatter = normalizedCaseNumber
      ? matterOptions.find((matter) => matter.caseNumber.trim() === normalizedCaseNumber)
      : undefined;

    const newTask: LegalTask = {
      id: `pending-${Date.now()}`,
      title: title.trim(),
      category,
      priority,
      matterId: matchedMatter?.id,
      matterCaseNumber: matchedMatter?.caseNumber,
      courtOrBailiffOffice:
        courtOrBailiffOffice.trim() ||
        matchedMatter?.court ||
        "قلم محضرين المحكمة المختصة",
      assignedTo: assigneeLabel,
      deadline,
      status: "قيد التنفيذ",
    };

    try {
      const result = await onCreateTask(newTask);
      if (result === false) {
        setSaveError("تعذر حفظ المهمة. راجع البيانات وحاول مرة أخرى.");
        return;
      }

      setTitle("");
      setMatterCaseNumber("");
      setCourtOrBailiffOffice("");
      onClose();
    } catch {
      setSaveError("تعذر حفظ المهمة. حاول مرة أخرى.");
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut inside modal: Ctrl+Enter or Cmd+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
      onKeyDown={handleKeyDown}
    >
      <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-xl overflow-y-auto rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--axia-gold-dim)] bg-[var(--panel)] p-6 lg:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute left-6 top-6 grid size-8 place-items-center rounded-full bg-[var(--accent)] text-[var(--text-muted)] hover:bg-[var(--accent-hover)] hover:text-[var(--text)] transition"
          title="إغلاق النافذة (Esc)"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
          <div className="grid size-6 place-items-center rounded-lg bg-[var(--axia-gold)]/15 border border-[var(--axia-gold)]/30 text-[var(--axia-gold)]">
            <Plus className="size-3.5" />
          </div>
          <span>إسناد مهمة إجرائية وميعاد قانوني</span>
          {sourceLabel && (
            <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
              {sourceLabel}
            </span>
          )}
          <span className="mr-auto inline-flex items-center gap-1 rounded bg-[var(--accent)] border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
            <kbd>Ctrl+N</kbd>
          </span>
        </div>
        
        <h2 className="mt-2 text-xl font-bold text-[var(--text)]">
          إضافة مهمة إجرائية جديدة
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          أدخل بيانات التكليف والميعاد القانوني لإسنادها لأعضاء المكتب ومتابعة مواعيد السقوط.
        </p>
        
        {speechError && (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-400">
            {speechError}
          </div>
        )}
        {saveError && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Title & Speech Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[var(--text-muted)] font-semibold">
                بيان المهمة والإجراء المطلوب <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleToggleTitleDictation}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition ${
                  isDictatingTitle
                    ? "bg-red-500 text-white border-red-400 animate-pulse shadow-md"
                    : "bg-[var(--accent)] text-[var(--axia-gold)] border-[var(--border)] hover:border-[var(--axia-gold)]"
                }`}
                title="إملاء تفاصيل المهمة صوتياً عبر الذكاء الاصطناعي"
              >
                <Mic className="size-3" />
                <span>{isDictatingTitle ? "جارٍ الاستماع... انقر للإيقاف" : "إملاء صوتي"}</span>
              </button>
            </div>
            <input
              ref={titleInputRef}
              type="text"
              required
              placeholder="مثال: تسليم أصل صحيفة الاستئناف معلنة لقلم كتاب المحكمة"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--axia-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)]"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[var(--text-muted)] mb-1.5 font-semibold">
                التصنيف الإجرائي
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LegalTask["category"])}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
              >
                <option value="قلم المحضرين">قلم المحضرين (إعلانات وتنفيذ)</option>
                <option value="ميعاد طعن قانوني">ميعاد طعن قانوني (سقوط)</option>
                <option value="سداد رسوم">سداد رسوم / أمانة خبير</option>
                <option value="إيداع مذكرات">إيداع مذكرات ومستندات</option>
                <option value="استخراج شهادة">استخراج شهادة / صورة رسمية</option>
                <option value="تنفيذ حكم">تنفيذ أحكام مدنية وتجارية</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-muted)] mb-1.5 font-semibold">
                درجة الأهمية والميعاد
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LegalTask["priority"])}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
              >
                <option value="حرجة للغاية (ميعاد سقوط)">حرجة للغاية (ميعاد سقوط)</option>
                <option value="عاجلة">عاجلة</option>
                <option value="عادية">عادية</option>
              </select>
            </div>
          </div>

          {/* Court / Bailiff & Associated Matter */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[var(--text-muted)] mb-1.5 font-semibold">
                المقر أو المحكمة المعنية <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: قلم محضرين العجوزة"
                value={courtOrBailiffOffice}
                onChange={(e) => setCourtOrBailiffOffice(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--axia-gold)] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[var(--text-muted)] font-semibold">
                  القضية المرتبطة (اختياري)
                </label>
                <span className="text-[10px] text-[var(--text-muted)]">اختر أو اكتب</span>
              </div>
              <input
                type="text"
                list="matters-suggestions"
                placeholder="مثال: ٣٨٢ لسنة ٢٠٢٥ تجاري"
                value={matterCaseNumber}
                onChange={(e) => setMatterCaseNumber(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--axia-gold)] focus:outline-none"
              />
              <datalist id="matters-suggestions">
                {matterOptions.map((matter) => (
                  <option key={matter.id} value={matter.caseNumber}>
                    {matter.title}{matter.court ? ` — ${matter.court}` : ""}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* Deadline & Assignee */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[var(--text-muted)] mb-1.5 font-semibold">
                تاريخ الميعاد الأقصى <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[var(--text-muted)] mb-1.5 font-semibold">
                المحامي / الموظف المكلف
              </label>
              <input
                type="text"
                readOnly
                value={assigneeLabel}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] p-2.5 text-xs text-[var(--text-muted)]"
              />
            </div>
          </div>

          {/* Footer Shortcuts & Actions */}
          <div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1 rounded bg-[var(--accent)] border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px]">
                <kbd>Ctrl+Enter</kbd>
              </span>
              <span>للحفظ المباشر</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 rounded bg-[var(--accent)] border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px]">
                <kbd>Esc</kbd>
              </span>
              <span>للإلغاء</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent-hover)] transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-amber-500 px-5 py-2 text-xs font-extrabold text-black shadow-md hover:brightness-110 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CornerDownLeft className="size-3.5" />
                <span>{isSaving ? "جارٍ الحفظ..." : "حفظ وتكليف المهمة"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
