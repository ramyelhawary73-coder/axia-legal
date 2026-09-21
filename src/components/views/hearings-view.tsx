/* eslint-disable react-hooks/preserve-manual-memoization */
"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Gavel, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Building2,
  X,
  Search,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  CheckSquare,
  Sparkles,
  Info,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Archive,
  Printer,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Hearing, LegalTask, Matter } from "@/types/legal";
import { exportElementToPdf, generateReportRef } from "@/lib/pdf-export-service";
import {
  createPersistentHearing,
  loadPersistentHearings,
  updatePersistentHearing,
} from "@/lib/hearings-client";
import {
  loadMattersWorkspace,
  updatePersistentMatter,
} from "@/lib/matters-client";
import {
  loadTaskWorkspace,
  updatePersistentTaskStatus,
} from "@/lib/tasks-client";
import {
  useActionContextMenu,
  type ActionContextMenuItem,
} from "@/components/action-context-menu";

// Arabic Days and Months
const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const AXIA_CALENDAR_DRAG_TYPE = "application/x-axia-calendar-hearing";

// Helper to extract YYYY-MM-DD from various date string formats
const getDateOnly = (dateStr: string): string => {
  if (!dateStr) return "";
  if (dateStr.includes("T")) return dateStr.split("T")[0];
  return dateStr.trim();
};

// Check if a string represents a valid ISO date YYYY-MM-DD
const isValidDateStr = (str: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
};

// Helper to format Date object into YYYY-MM-DD
const formatDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function CourtLocationBadge({ courtName, compact = false }: { courtName: string; compact?: boolean }) {
  const [data, setData] = useState<{ duration: string; distance: string; source: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courtName) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    fetch(`/api/maps/travel-time?court=${encodeURIComponent(courtName)}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
      })
      .catch(err => {
        console.error("Failed to load travel time", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courtName]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(courtName)}`;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[9px]">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--axia-gold)] hover:underline font-bold shrink-0"
          title="عرض الموقع"
        >
          📍 الخريطة
        </a>
        {loading ? (
          <span className="opacity-50 animate-pulse">جاري الحساب...</span>
        ) : data ? (
          <span className="text-[var(--text-muted)] truncate" title={`المسافة: ${data.distance}`}>
            🚗 {data.duration}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2 text-[11px] leading-relaxed">
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[var(--axia-gold)] hover:underline font-bold"
        title="عرض الموقع على خرائط جوجل"
      >
        <span>📍 الموقع على الخريطة</span>
      </a>
      
      {loading ? (
        <span className="text-[10px] text-[var(--text-muted)] animate-pulse">حساب وقت التنقل...</span>
      ) : data ? (
        <span 
          className="inline-flex items-center gap-1 bg-[var(--accent)] px-2 py-0.5 rounded-md text-[var(--text-muted)] border border-[var(--border)]"
          title={`التقدير من: ${data.source}`}
        >
          <span>🚗 {data.duration} ({data.distance})</span>
          <span className="text-[9px] opacity-60">من المقر بالمعادي</span>
        </span>
      ) : null}
    </div>
  );
}

function PleadingNotesEditor({ 
  initialNotes = "", 
  onSave 
}: { 
  initialNotes?: string; 
  onSave: (notes: string) => void | Promise<void>; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setNotes(initialNotes));
  }, [initialNotes]);

  const handleChange = (val: string) => {
    setNotes(val);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-3 border-t border-[var(--border)]/40 pt-2.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--axia-gold)] transition-colors focus:outline-none"
      >
        <span className="text-xs">📝</span>
        <span>{isOpen ? "إخفاء مذكرات المرافعة والملاحظات" : "مذكرات المرافعة والملاحظات العاجلة للجلسة"}</span>
        {notes && !isOpen && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--axia-gold)] animate-ping" />
        )}
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 space-y-1.5"
        >
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={() => {
                void handleSave();
              }}
              placeholder="اكتب هنا دفوعك القانونية، طلباتك بالجلسة، أو ملاحظاتك العاجلة للمرافعة..."
              className="w-full text-xs bg-[var(--accent)] text-[var(--text)] border border-[var(--border)] rounded-xl p-3 min-h-[75px] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)] leading-relaxed resize-y custom-scrollbar"
            />
            {isSaving && (
              <span className="absolute bottom-2 left-3 text-[9px] text-[var(--axia-gold)] animate-pulse font-medium">
                جاري حفظ ملاحظات الجلسة...
              </span>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
            <span>✨</span>
            <span>تُحفظ ملاحظات المرافعة في سجل الجلسة الحقيقي عند الخروج من حقل الكتابة.</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}

export function HearingsView({
  isFocusMode = false,
  onToggleFocusMode,
  onHearingsChanged,
  onOpenMatter,
  onOpenTasks,
}: {
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onHearingsChanged?: () => void | Promise<void>;
  onOpenMatter?: (matterId: string) => void;
  onOpenTasks?: () => void;
} = {}) {
  // Master states for persisted business data
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [tasks, setTasks] = useState<LegalTask[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSavingHearing, setIsSavingHearing] = useState(false);
  const [reschedulingHearingId, setReschedulingHearingId] = useState<string | null>(null);
  const [rescheduleModalHearingId, setRescheduleModalHearingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const hearingActionMenu = useActionContextMenu();

  useEffect(() => {
    if (typeof window === "undefined") return;

    Promise.resolve().then(() => setIsOnline(navigator.onLine));
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([loadMattersWorkspace(), loadTaskWorkspace()])
      .then(async ([matterWorkspace, taskWorkspace]) => {
        if (cancelled) return;
        setMatters(matterWorkspace.matters);
        setTasks(taskWorkspace.tasks);

        const persistedHearings = await loadPersistentHearings(
          matterWorkspace.matters,
        );
        if (cancelled) return;
        setHearings(persistedHearings);
        setSyncError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSyncError(
          error instanceof Error ? error.message : "تعذر تحميل بيانات الجلسات.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdateHearingNotes = async (hearingId: string, notes: string) => {
    try {
      const updated = await updatePersistentHearing(
        hearingId,
        { pleadingNotes: notes || null },
        matters,
      );
      setHearings((current) =>
        current.map((hearing) => (hearing.id === hearingId ? updated : hearing)),
      );
      setSyncError(null);
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر حفظ ملاحظات الجلسة.",
      );
    }
  };

  // Layout & Filtering states
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [subTab, setSubTab] = useState<"active" | "archived">("active");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");
  const [activeTab, setActiveTab] = useState<"all" | "today" | "upcoming">("all");
  const [isNewHearingOpen, setIsNewHearingOpen] = useState(false);

  // Calendar filter toggles
  const [showHearings, setShowHearings] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showMatters, setShowMatters] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Base calendar date follows the real current day.
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(() => new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; date: string; type: string } | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Generate Month dates (42 grid cells)
  const monthDates = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday, 6 is Saturday
    
    const gridStart = new Date(year, month, 1 - startDayOfWeek);
    const dates: Date[] = [];
    const curr = new Date(gridStart);
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }, [currentCalendarDate]);

  // Generate Week dates (7 grid cells)
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentCalendarDate);
    startOfWeek.setDate(currentCalendarDate.getDate() - currentCalendarDate.getDay());
    
    const dates: Date[] = [];
    const curr = new Date(startOfWeek);
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }, [currentCalendarDate]);

  const [reportCode, setReportCode] = useState(() => generateReportRef("AX-REP"));

  // New hearing states
  const [newMatterId, setNewMatterId] = useState("");
  const [newCourt, setNewCourt] = useState("دار القضاء العالي - محكمة النقض");
  const [newCircuit, setNewCircuit] = useState("الدائرة المدنية والتجارية");
  const [newHall, setNewHall] = useState("قاعة ٤");
  const [newRoll, setNewRoll] = useState(12);
  const [newDate, setNewDate] = useState(() => formatDateStr(new Date()));
  const [newTime, setNewTime] = useState("10:00");
  const [newPurpose, setNewPurpose] = useState("المرافعة وتقديم المستندات");
  const [decisionNotes, setDecisionNotes] = useState<{ [id: string]: string }>({});

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Filter hearings for print based on calendar view
  const printHearings = useMemo(() => {
    return hearings.filter((h) => {
      if (h.isArchived) return false;
      
      if (calendarView === "month") {
        const parts = h.hearingDate.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          return y === currentCalendarDate.getFullYear() && m === currentCalendarDate.getMonth();
        }
      } else if (calendarView === "week") {
        const parts = h.hearingDate.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          const hDate = new Date(y, m, d);
          hDate.setHours(0,0,0,0);
          return weekDates.some((wDate) => {
            const copy = new Date(wDate);
            copy.setHours(0,0,0,0);
            return copy.getTime() === hDate.getTime();
          });
        }
      } else if (calendarView === "day") {
        const parts = h.hearingDate.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          const hDate = new Date(y, m, d);
          hDate.setHours(0,0,0,0);
          const aDate = new Date(currentCalendarDate);
          aDate.setHours(0,0,0,0);
          return hDate.getTime() === aDate.getTime();
        }
      }
      return false;
    }).sort((a, b) => {
      const dateDiff = a.hearingDate.localeCompare(b.hearingDate);
      if (dateDiff !== 0) return dateDiff;
      return a.hearingTime.localeCompare(b.hearingTime);
    });
  }, [hearings, calendarView, currentCalendarDate, weekDates]);

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    // Refresh the unique report tracking code for each generated report
    setReportCode(generateReportRef("AX-REP"));
    triggerToast("جاري إعداد وتحضير تقرير رول الجلسات المعتمد...", "الآن", "document");

    setTimeout(async () => {
      const element = document.getElementById("printable-court-report");
      if (element) {
        const success = await exportElementToPdf(element, {
          filename: `جدول_جلسات_أكسيا_${calendarView}_${currentCalendarDate.getFullYear()}.pdf`,
          quality: 1.0,
          scale: 2.2
        });
        if (success) {
          triggerToast("تم تصدير جدول الجلسات بنجاح كتقرير PDF معتمد جاهز للمحكمة", "الآن", "document");
        } else {
          triggerToast("فشل تصدير التقرير، يرجى المحاولة لاحقاً", "الآن", "task");
        }
      } else {
        triggerToast("تعذر العثور على حاوية تقرير الطباعة", "الآن", "task");
      }
      setIsGeneratingPDF(false);
    }, 600);
  };

  // Trigger custom animated notification
  const triggerToast = (message: string, date: string, type: string) => {
    setToast({ message, date, type });
    setTimeout(() => setToast(null), 4000);
  };

  const persistHearingReschedule = async (
    hearingId: string,
    targetDateStr: string,
  ): Promise<boolean> => {
    const original = hearings.find((item) => item.id === hearingId);
    if (!original || !isValidDateStr(targetDateStr)) return false;
    if (original.hearingDate === targetDateStr) return true;

    setReschedulingHearingId(hearingId);
    setSyncError(null);

    // Optimistic move for immediate feedback. Any API/read-back failure rolls back.
    setHearings((current) =>
      current.map((item) =>
        item.id === hearingId ? { ...item, hearingDate: targetDateStr } : item,
      ),
    );

    try {
      await updatePersistentHearing(
        hearingId,
        { hearingDate: targetDateStr },
        matters,
      );

      const refreshed = await loadPersistentHearings(matters);
      const confirmed = refreshed.find((item) => item.id === hearingId);
      if (!confirmed || confirmed.hearingDate !== targetDateStr) {
        throw new Error("لم يتم تأكيد التاريخ الجديد من قاعدة البيانات.");
      }

      setHearings(refreshed);
      await onHearingsChanged?.();
      triggerToast(
        "تمت إعادة جدولة الجلسة وتأكيد الحفظ من قاعدة البيانات",
        targetDateStr,
        "hearing",
      );
      return true;
    } catch (error) {
      setHearings((current) =>
        current.map((item) => (item.id === hearingId ? original : item)),
      );
      const message =
        error instanceof Error ? error.message : "تعذر إعادة جدولة الجلسة.";
      setSyncError(message);
      triggerToast(
        "فشل حفظ إعادة الجدولة وتمت إعادة الجلسة لموعدها السابق",
        original.hearingDate,
        "hearing",
      );
      return false;
    } finally {
      setReschedulingHearingId(null);
    }
  };

  const handleToggleArchive = async (hearingId: string) => {
    const hearing = hearings.find((item) => item.id === hearingId);
    if (!hearing) return;

    const nextArchived = !hearing.isArchived;

    try {
      const updated = await updatePersistentHearing(
        hearingId,
        {
          isArchived: nextArchived,
          status: nextArchived ? "completed" : "scheduled",
        },
        matters,
      );
      setHearings((current) =>
        current.map((item) => (item.id === hearingId ? updated : item)),
      );
      await onHearingsChanged?.();
      setSyncError(null);
      triggerToast(
        nextArchived
          ? "تم نقل الجلسة للأرشيف وحفظ التغيير"
          : "تم استعادة الجلسة للرول النشط",
        hearing.hearingDate,
        "hearing",
      );
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر تحديث حالة الجلسة.",
      );
    }
  };

  const openRescheduleDialog = (hearing: Hearing) => {
    setRescheduleModalHearingId(hearing.id);
    setRescheduleDate(hearing.hearingDate);
  };

  const getHearingActions = (hearing: Hearing): ActionContextMenuItem[] => {
    const actions: ActionContextMenuItem[] = [
      {
        id: "reschedule",
        label: "إعادة جدولة الجلسة",
        onSelect: () => openRescheduleDialog(hearing),
      },
      {
        id: hearing.isArchived ? "restore" : "archive",
        label: hearing.isArchived ? "استعادة الجلسة" : "أرشفة الجلسة",
        onSelect: () => handleToggleArchive(hearing.id),
      },
    ];

    if (hearing.pleadingNotes) {
      actions.push({
        id: "clear-note",
        label: "مسح ملاحظات الجلسة",
        tone: "danger",
        onSelect: async () => {
          const confirmed = window.confirm(
            "هل تريد مسح ملاحظات هذه الجلسة؟ لن يتم حذف الجلسة نفسها.",
          );
          if (!confirmed) return;
          await handleUpdateHearingNotes(hearing.id, "");
          triggerToast("تم مسح ملاحظات الجلسة", hearing.hearingDate, "hearing");
        },
      });
    }

    return actions;
  };

  type CalendarActionItem = {
    id: string;
    title: string;
    type: "hearing" | "task" | "matter";
    original: Hearing | LegalTask | Matter;
  };

  const handleCalendarTaskStatus = async (task: LegalTask) => {
    const nextStatus: LegalTask["status"] =
      task.status === "مكتملة" ? "قيد التنفيذ" : "مكتملة";
    try {
      await updatePersistentTaskStatus([task.id], nextStatus);
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, status: nextStatus } : item,
        ),
      );
      setSyncError(null);
      triggerToast(
        nextStatus === "مكتملة"
          ? "تم إكمال المهمة وحفظ التغيير"
          : "تمت إعادة فتح المهمة وحفظ التغيير",
        getDateOnly(task.deadline),
        "task",
      );
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر تحديث حالة المهمة.",
      );
    }
  };

  const handleCalendarMatterStatus = async (matter: Matter) => {
    const nextStatus = matter.status === "مفتوحة" ? "closed" : "open";
    try {
      const updated = await updatePersistentMatter(matter.id, {
        status: nextStatus,
      });
      setMatters((current) =>
        current.map((item) => (item.id === matter.id ? updated : item)),
      );
      setSyncError(null);
      triggerToast(
        nextStatus === "closed"
          ? "تم إغلاق القضية وحفظ التغيير"
          : "تمت إعادة فتح القضية وحفظ التغيير",
        formatDateStr(new Date()),
        "matter",
      );
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر تحديث حالة القضية.",
      );
    }
  };

  const getCalendarItemActions = (
    item: CalendarActionItem,
  ): ActionContextMenuItem[] => {
    if (item.type === "hearing") {
      return getHearingActions(item.original as Hearing);
    }

    if (item.type === "task") {
      const task = item.original as LegalTask;
      return [
        {
          id: "open-task-module",
          label: "فتح قسم المهام",
          onSelect: () => onOpenTasks?.(),
        },
        {
          id: task.status === "مكتملة" ? "reopen-task" : "complete-task",
          label:
            task.status === "مكتملة"
              ? "إعادة فتح المهمة"
              : "تحديد المهمة كمكتملة",
          onSelect: () => handleCalendarTaskStatus(task),
        },
      ];
    }

    const matter = item.original as Matter;
    return [
      {
        id: "open-matter",
        label: "فتح ملف القضية",
        onSelect: () => onOpenMatter?.(matter.id),
      },
      {
        id: matter.status === "مفتوحة" ? "close-matter" : "reopen-matter",
        label:
          matter.status === "مفتوحة"
            ? "إغلاق القضية"
            : "إعادة فتح القضية",
        onSelect: () => handleCalendarMatterStatus(matter),
      },
    ];
  };

  const getCalendarItemMenuLabel = (item: CalendarActionItem) => {
    if (item.type === "hearing") return `الجلسة ${item.title}`;
    if (item.type === "task") return `المهمة ${item.title}`;
    return `القضية ${item.title}`;
  };

  // iCal parsing and export helpers
  const parseTimeTo24h = (timeStr: string): { hours: number; minutes: number } => {
    let hours = 9;
    let minutes = 0;
    try {
      const cleaned = timeStr.replace(/[^0-9:\sصبمap]/gi, "").trim();
      const parts = cleaned.split(":");
      if (parts.length >= 1) {
        hours = parseInt(parts[0], 10);
      }
      if (parts.length >= 2) {
        minutes = parseInt(parts[1], 10);
      }
      const isPM = timeStr.includes("م") || timeStr.toLowerCase().includes("pm");
      const isAM = timeStr.includes("ص") || timeStr.toLowerCase().includes("am");
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    } catch {
      // Fallback
    }
    return { hours, minutes };
  };

  const formatICalDate = (dateStr: string, timeStr?: string): string => {
    const dateOnly = getDateOnly(dateStr);
    if (!isValidDateStr(dateOnly)) return "";
    const parts = dateOnly.split("-");
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    
    if (timeStr && timeStr !== "طوال اليوم") {
      const { hours, minutes } = parseTimeTo24h(timeStr);
      const hh = String(hours).padStart(2, "0");
      const mm = String(minutes).padStart(2, "0");
      return `${year}${month}${day}T${hh}${mm}00`;
    }
    return `${year}${month}${day}`;
  };

  const handleExportICS = () => {
    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AXIA Legal Applet//AR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ].join("\r\n") + "\r\n";

    unifiedCalendarItems.forEach((item) => {
      const isAllDay = item.time === "طوال اليوم" || !item.time;
      const startStr = formatICalDate(item.date, item.time);
      
      let endStr = "";
      if (isAllDay) {
        const d = new Date(item.date);
        d.setDate(d.getDate() + 1);
        const nextDayStr = formatDateStr(d).replace(/-/g, "");
        endStr = nextDayStr;
      } else {
        const parts = getDateOnly(item.date).split("-");
        const { hours, minutes } = parseTimeTo24h(item.time);
        const endHours = (hours + 1) % 24;
        const eh = String(endHours).padStart(2, "0");
        const em = String(minutes).padStart(2, "0");
        endStr = `${parts[0]}${parts[1]}${parts[2]}T${eh}${em}00`;
      }

      icsContent += [
        "BEGIN:VEVENT",
        `UID:${item.type}-${item.id}@axia.legal`,
        `DTSTAMP:${formatDateStr(new Date()).replace(/-/g, "")}T000000Z`,
        isAllDay ? `DTSTART;VALUE=DATE:${startStr}` : `DTSTART:${startStr}`,
        isAllDay ? `DTEND;VALUE=DATE:${endStr}` : `DTEND:${endStr}`,
        `SUMMARY:${item.title}`,
        `DESCRIPTION:${item.sub}`,
        `LOCATION:${item.sub}`,
        "END:VEVENT"
      ].join("\r\n") + "\r\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `axia_agenda_${formatDateStr(new Date())}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerToast("تم إنشاء وتصدير ملف التقومة بنجاح", formatDateStr(new Date()), "matter");
  };

  // Drag & Drop persists hearing rescheduling only.
  const handleDragStart = (
    e: React.DragEvent,
    item: { id: string; type: "hearing" | "task" | "matter" },
  ) => {
    if (item.type !== "hearing") {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData(AXIA_CALENDAR_DRAG_TYPE, JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
  };

  const hasAxiaCalendarDrag = (e: React.DragEvent) =>
    Array.from(e.dataTransfer.types).includes(AXIA_CALENDAR_DRAG_TYPE);

  const handleDragOver = (e: React.DragEvent) => {
    if (!hasAxiaCalendarDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, targetDateStr: string) => {
    if (!hasAxiaCalendarDrag(e)) return;
    e.preventDefault();
    setDragOverDate(targetDateStr);
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    if (!hasAxiaCalendarDrag(e)) return;

    e.preventDefault();
    setDragOverDate(null);

    try {
      const dataStr = e.dataTransfer.getData(AXIA_CALENDAR_DRAG_TYPE);
      if (!dataStr) return;

      const payload = JSON.parse(dataStr) as {
        id?: unknown;
        type?: unknown;
      };
      const { id, type } = payload;

      if (typeof id !== "string") {
        setSyncError("معرّف الجلسة في عملية السحب غير صالح.");
        return;
      }

      if (type !== "hearing") {
        setSyncError("عنصر السحب غير صالح لإعادة جدولة جلسة.");
        return;
      }

      await persistHearingReschedule(id, targetDateStr);
    } catch {
      setSyncError("تعذر قراءة بيانات سحب الجلسة. حاول السحب من بطاقة الجلسة نفسها.");
    }
  };

  const handleAddDecision = async (id: string, decision: string) => {
    if (!decision.trim()) return;

    try {
      const updated = await updatePersistentHearing(
        id,
        { lastDecision: decision.trim(), status: "completed", isArchived: true },
        matters,
      );
      setHearings((current) =>
        current.map((hearing) => (hearing.id === id ? updated : hearing)),
      );
      await onHearingsChanged?.();
      setDecisionNotes((current) => ({ ...current, [id]: "" }));
      setSyncError(null);
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر حفظ قرار الجلسة.",
      );
    }
  };

  const handleCreateHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatterId || !newDate || isSavingHearing) return;

    const selectedMatter = matters.find((matter) => matter.id === newMatterId);
    if (!selectedMatter) {
      setSyncError("اختر قضية حقيقية محفوظة قبل إضافة الجلسة.");
      return;
    }

    setIsSavingHearing(true);
    setSyncError(null);

    try {
      const hearing = await createPersistentHearing(
        {
          matterId: selectedMatter.id,
          hearingDate: newDate,
          hearingTime: newTime || undefined,
          court: newCourt || selectedMatter.court,
          circuit: newCircuit || selectedMatter.circuit,
          hall: newHall || undefined,
          rollNumber: String(newRoll),
          purpose: newPurpose || undefined,
        },
        matters,
      );

      setHearings((current) => [hearing, ...current]);
      await onHearingsChanged?.();
      setIsNewHearingOpen(false);
      setNewMatterId("");
      triggerToast("تم إدراج الجلسة وحفظها في قاعدة البيانات", newDate, "hearing");
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر حفظ الجلسة.",
      );
    } finally {
      setIsSavingHearing(false);
    }
  };

  // Map unified events for Calendar consumption
  const unifiedCalendarItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      sub: string;
      time: string;
      date: string;
      type: "hearing" | "task" | "matter";
      priority: string;
      original: Hearing | LegalTask | Matter;
    }> = [];

    if (subTab === "archived") {
      if (showHearings) {
        hearings.forEach((h) => {
          if (h.isArchived) {
            const d = getDateOnly(h.hearingDate);
            if (isValidDateStr(d)) {
              items.push({
                id: h.id,
                title: h.caseNumber,
                sub: h.court,
                time: h.hearingTime,
                date: d,
                type: "hearing",
                priority: "عادية",
                original: h,
              });
            }
          }
        });
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return items.filter((item) =>
          item.title.toLowerCase().includes(q) ||
          item.sub.toLowerCase().includes(q)
        );
      }
      return items;
    }

    if (showHearings) {
      hearings.forEach(h => {
        if (h.isArchived) return; // Do not show archived in active calendar

        const d = getDateOnly(h.hearingDate);
        if (isValidDateStr(d)) {
          items.push({
            id: h.id,
            title: h.caseNumber,
            sub: h.court,
            time: h.hearingTime,
            date: d,
            type: "hearing",
            priority: "عادية",
            original: h
          });
        }
      });
    }

    if (showTasks) {
      tasks.forEach(t => {
        const d = getDateOnly(t.deadline);
        if (isValidDateStr(d)) {
          items.push({
            id: t.id,
            title: t.title,
            sub: t.category,
            time: "طوال اليوم",
            date: d,
            type: "task",
            priority: t.priority,
            original: t
          });
        }
      });
    }

    if (showMatters) {
      matters.forEach(m => {
        const d = getDateOnly(m.nextHearingDate);
        if (isValidDateStr(d)) {
          items.push({
            id: m.id,
            title: `جلسة قريبة: ${m.caseNumber}`,
            sub: m.title,
            time: "جلسة قضائية",
            date: d,
            type: "matter",
            priority: "عادية",
            original: m
          });
        }
      });
    }

    // Apply global text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return items.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.sub.toLowerCase().includes(q)
      );
    }

    return items;
  }, [hearings, tasks, matters, showHearings, showTasks, showMatters, searchQuery, subTab]);

  // Classic List filter calculation
  const filteredListHearings = useMemo(() => {
    return hearings.filter((h) => {
      const shouldShow = subTab === "active" ? !h.isArchived : h.isArchived;
      if (!shouldShow) return false;

      if (activeTab === "today") return h.status === "اليوم";
      if (activeTab === "upcoming") return h.status === "قادمة";
      return true;
    });
  }, [hearings, activeTab, subTab]);

  // Handle navigation prev/next
  const handleCalendarNavigate = (direction: "prev" | "next") => {
    const nextDate = new Date(currentCalendarDate);
    const offset = direction === "prev" ? -1 : 1;
    
    if (calendarView === "month") {
      nextDate.setMonth(nextDate.getMonth() + offset);
    } else if (calendarView === "week") {
      nextDate.setDate(nextDate.getDate() + (offset * 7));
    } else {
      nextDate.setDate(nextDate.getDate() + offset);
    }
    setCurrentCalendarDate(nextDate);
  };

  // Quick reset to the actual current date.
  const handleResetToToday = () => {
    setCurrentCalendarDate(new Date());
  };

  // Helper to extract items scheduled on a specific day
  const getDayItems = (dateStr: string) => {
    return unifiedCalendarItems.filter(item => item.date === dateStr);
  };

  return (
    <div className="space-y-6 w-full text-right" dir="rtl">
      
      {/* Floating Dynamic Rescheduling Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-3.5 rounded-2xl border border-[var(--axia-gold)]/30 bg-[var(--panel)] p-4.5 shadow-2xl max-w-sm"
          >
            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === "hearing" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
              toast.type === "task" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" :
              "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}>
              {toast.type === "hearing" ? <Gavel className="size-5" /> :
               toast.type === "task" ? <CheckSquare className="size-5" /> :
               <Briefcase className="size-5" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">{toast.message}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">التاريخ الجديد: <span className="font-mono">{toast.date}</span></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {syncError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
          {syncError}
        </div>
      )}
      {isDataLoading && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-xs text-[var(--text-muted)]">
          جارٍ تحميل القضايا والجلسات والمهام المحفوظة...
        </div>
      )}

      {/* Main App Title Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3.5 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
            <CalendarIcon className="size-6 text-[var(--axia-gold)] shrink-0" />
            أجندة المحاكم والجدولة التفاعلية
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-[var(--axia-gold)]" />
            تنظيم ذكي وجدولة المواعيد والجلسات بالسحب والإفلات التفاعلي
          </p>
        </div>

        {/* View Switches (Calendar vs List) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-[var(--accent)]/40 p-1 border border-[var(--border)]">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "calendar"
                  ? "bg-[var(--panel)] text-[var(--axia-gold)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <CalendarIcon className="size-3.5" />
              التقويم التفاعلي
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-[var(--panel)] text-[var(--axia-gold)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <List className="size-3.5" />
              رول الجلسات الكلاسيكي
            </button>
          </div>

          {/* Active / Archive Switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-[var(--accent)]/40 p-1 border border-[var(--border)]">
            <button
              onClick={() => setSubTab("active")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === "active"
                  ? "bg-[var(--panel)] text-[var(--axia-gold)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <CalendarIcon className="size-3.5" />
              <span>الرول النشط</span>
            </button>
            <button
              onClick={() => setSubTab("archived")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === "archived"
                  ? "bg-[var(--panel)] text-[var(--axia-gold)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Archive className="size-3.5" />
              <span>الجلسات المنتهية</span>
              {hearings.filter((h) => h.isArchived).length > 0 && (
                <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-500 font-bold font-mono">
                  {hearings.filter((h) => h.isArchived).length}
                </span>
              )}
            </button>
          </div>

          {/* Offline/Online Cache Indicator Badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold shadow-sm transition-all ${
            isOnline 
              ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" 
              : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span>{isOnline ? "متصل بقاعدة البيانات" : "غير متصل — لن يتم حفظ تعديلات جديدة"}</span>
          </div>

          {/* Focus Mode Toggle Button */}
          {onToggleFocusMode && (
            <button
              onClick={onToggleFocusMode}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold shadow-sm transition-all ${
                isFocusMode
                  ? "bg-[var(--axia-gold)]/10 text-[var(--axia-gold-light)] border-[var(--axia-gold)]/30"
                  : "border-[var(--border)] bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--accent)]"
              }`}
              title={isFocusMode ? "الخروج من وضع التركيز" : "تفعيل وضع التركيز لتوسيع التقويم"}
            >
              {isFocusMode ? (
                <>
                  <EyeOff className="size-3.5 text-[var(--axia-gold)]" />
                  <span>إلغاء وضع التركيز</span>
                </>
              ) : (
                <>
                  <Eye className="size-3.5" />
                  <span>وضع التركيز (كامل الشاشة)</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/20 disabled:opacity-50 transition cursor-pointer"
            title="تحميل وتصدير جدول الجلسات بصيغة PDF معتمدة للمثول أمام المحكمة"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="size-3.5 animate-spin text-rose-500" />
                <span>جاري توليد الـ PDF...</span>
              </>
            ) : (
              <>
                <Printer className="size-3.5 text-rose-500" />
                <span>تصدير تقرير الجلسات (PDF)</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-xs font-bold text-[var(--text)] shadow-sm hover:bg-[var(--accent)] transition"
          >
            <RefreshCw className="size-3.5 text-[var(--axia-gold)]" />
            <span>مزامنة التقويم</span>
          </button>

          <button
            onClick={() => setIsNewHearingOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--text)] px-4 py-2 text-xs font-bold text-[var(--bg)] shadow-md hover:opacity-90 transition"
          >
            <Plus className="size-4" />
            <span>إدراج جلسة بالرول</span>
          </button>
        </div>
      </div>

      {/* RENDER MODE A: INTERACTIVE CALENDAR */}
      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* Right Sidebar: Control Deck & Drag Sources */}
          <div className={`xl:col-span-1 space-y-5 flex flex-col ${isFocusMode ? "hidden" : ""}`}>
            
            {/* Legend & Filter Switches */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] pb-2.5">
                تصفية جدول المواعيد
              </h3>
              
              <div className="space-y-3 text-xs">
                {/* Hearings Toggle */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-amber-500" />
                    <span className="font-medium text-[var(--text)] group-hover:text-[var(--axia-gold)] transition">جلسات المحاكم</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showHearings} 
                    onChange={(e) => setShowHearings(e.target.checked)} 
                    className="rounded border-[var(--border)] bg-[var(--bg)] text-[var(--gold)] focus:ring-[var(--gold)] size-4"
                  />
                </label>

                {/* Tasks Toggle */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-teal-500" />
                    <span className="font-medium text-[var(--text)] group-hover:text-[var(--axia-gold)] transition">المهام الإدارية</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showTasks} 
                    onChange={(e) => setShowTasks(e.target.checked)} 
                    className="rounded border-[var(--border)] bg-[var(--bg)] text-[var(--gold)] focus:ring-[var(--gold)] size-4"
                  />
                </label>

                {/* Matters Toggle */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-blue-500" />
                    <span className="font-medium text-[var(--text)] group-hover:text-[var(--axia-gold)] transition">جلسات قضايا قريبة</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showMatters} 
                    onChange={(e) => setShowMatters(e.target.checked)} 
                    className="rounded border-[var(--border)] bg-[var(--bg)] text-[var(--gold)] focus:ring-[var(--gold)] size-4"
                  />
                </label>
              </div>

              {/* Instant Search Bar */}
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 size-3.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="بحث فوري في المواعيد..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pr-9 pl-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute left-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Draggable Pending Events Drawer */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="size-3.5 text-[var(--axia-gold)]" />
                  إعادة جدولة الجلسات
                </h3>
                <span className="text-[10px] bg-[var(--accent)] px-2 py-0.5 rounded-md text-[var(--text-muted)]">
                  الجلسات فقط
                </span>
              </div>

              <div className="text-[11px] text-[var(--text-muted)] leading-relaxed flex items-start gap-1.5 bg-[var(--accent)]/30 p-2.5 rounded-xl border border-[var(--border)]">
                <Info className="size-4 text-[var(--axia-gold)] shrink-0 mt-0.5" />
                <span>يمكنك سحب بطاقة الجلسة فقط وإفلاتها على يوم جديد؛ المهام والقضايا تُعدّل من وحداتها الأصلية لضمان الحفظ الحقيقي.</span>
              </div>

              {/* Sidebar List of Draggable Items */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                {unifiedCalendarItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                    <AlertCircle className="size-8 mx-auto mb-2 text-[var(--text-muted)]/50" />
                    لا توجد مواعيد تطابق الفلتر أو البحث
                  </div>
                ) : (
                  unifiedCalendarItems.slice(0, 7).map((item) => (
                    <div
                      key={item.id}
                      {...hearingActionMenu.bind(
                        getCalendarItemActions(item),
                        getCalendarItemMenuLabel(item),
                      )}
                      draggable={
                        item.type === "hearing" &&
                        reschedulingHearingId !== item.id
                      }
                      onDragStart={(e) => handleDragStart(e, { id: item.id, type: item.type })}
                      className={`p-3 rounded-xl border text-right hover:border-[var(--axia-gold)]/40 hover:bg-[var(--accent)]/50 transition-all shadow-sm flex flex-col gap-1.5 ${
                        item.type === "hearing"
                          ? "cursor-grab active:cursor-grabbing"
                          : "cursor-default"
                      } ${
                        item.type === "hearing" ? "border-amber-500/15 bg-amber-500/[0.02]" :
                        item.type === "task" ? "border-teal-500/15 bg-teal-500/[0.02]" :
                        "border-blue-500/15 bg-blue-500/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {hearingActionMenu.triggerButton(
                            getCalendarItemActions(item),
                            getCalendarItemMenuLabel(item),
                            "bg-[var(--panel)]/80",
                          )}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          item.type === "hearing" ? "bg-amber-500/10 text-amber-400" :
                          item.type === "task" ? "bg-teal-500/10 text-teal-400" :
                          "bg-blue-500/10 text-blue-400"
                        }`}>
                          {item.type === "hearing" ? "جلسة" :
                           item.type === "task" ? "مهمة إدارية" :
                           "قضية"}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-[var(--text-muted)]">{item.date}</span>
                      </div>
                      
                      <p className="text-xs font-semibold text-[var(--text)] line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      
                      <span className="text-[10px] text-[var(--text-muted)] truncate block">
                        {item.sub}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Left Grid: The Interactive Calendar */}
          <div className={`${isFocusMode ? "xl:col-span-4" : "xl:col-span-3"} space-y-5`}>
            
            {/* Calendar Controls & Quick Range Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--panel)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              
              {/* Previous / Next buttons & Month display */}
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-[var(--border)] p-1 bg-[var(--bg)]/50">
                  <button 
                    onClick={() => handleCalendarNavigate("prev")}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)] transition"
                    title="السابق"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                  <button 
                    onClick={handleResetToToday}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent)] transition"
                    title="العودة لليوم"
                  >
                    اليوم
                  </button>
                  <button 
                    onClick={() => handleCalendarNavigate("next")}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)] transition"
                    title="التالي"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                </div>

                <div className="text-base font-bold text-[var(--text)] mr-2">
                  {ARABIC_MONTHS[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
                </div>
              </div>

              {/* View switches (Month, Week, Day) */}
              <div className="flex items-center gap-1 rounded-xl bg-[var(--accent)]/40 p-1 border border-[var(--border)]">
                <button
                  onClick={() => setCalendarView("month")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    calendarView === "month"
                      ? "bg-[var(--panel)] text-[var(--axia-gold)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  شهري
                </button>
                <button
                  onClick={() => setCalendarView("week")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    calendarView === "week"
                      ? "bg-[var(--panel)] text-[var(--axia-gold)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  أسبوعي
                </button>
                <button
                  onClick={() => setCalendarView("day")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    calendarView === "day"
                      ? "bg-[var(--panel)] text-[var(--axia-gold)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  يومي
                </button>
              </div>
            </div>

            {/* Calendar Sheets */}
            <AnimatePresence mode="wait">
              
              {/* MONTH SHEET VIEW */}
              {calendarView === "month" && (
                <motion.div
                  key="month-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden shadow-md"
                >
                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg)]/45 text-center py-2.5 font-bold text-xs text-[var(--text-muted)]">
                    {ARABIC_DAYS.map((day, idx) => (
                      <div key={idx}>{day}</div>
                    ))}
                  </div>

                  {/* 42 Month Days Grid */}
                  <div className="grid grid-cols-7 border-b border-[var(--border)]">
                    {monthDates.map((date, index) => {
                      const dateStr = formatDateStr(date);
                      const isCurrentMonth = date.getMonth() === currentCalendarDate.getMonth();
                      const isToday = dateStr === formatDateStr(new Date());
                      const dayItems = getDayItems(dateStr);
                      const isDraggedOver = dragOverDate === dateStr;

                      return (
                        <div
                          key={index}
                          onDragOver={handleDragOver}
                          onDragEnter={(e) => handleDragEnter(e, dateStr)}
                          onDragLeave={() => setDragOverDate(null)}
                          onDrop={(e) => handleDrop(e, dateStr)}
                          className={`min-h-[110px] p-2 border-l border-b border-[var(--border)] transition-all flex flex-col gap-1 text-right relative overflow-y-auto custom-scrollbar ${
                            isCurrentMonth ? "bg-[var(--panel)]" : "bg-[var(--bg)]/10 text-[var(--text-muted)]/50"
                          } ${isDraggedOver ? "bg-[var(--gold)]/10 scale-[0.99] ring-2 ring-dashed ring-[var(--axia-gold)]/50" : ""} ${
                            index % 7 === 6 ? "border-l-0" : ""
                          }`}
                        >
                          {/* Day Number Header */}
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[11px] font-bold ${
                              isToday 
                                ? "size-6 rounded-full bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] text-white font-mono flex items-center justify-center shadow-md shadow-[var(--gold)]/20" 
                                : isCurrentMonth ? "text-[var(--text)]" : "text-[var(--text-muted)]/60"
                            }`}>
                              {date.getDate()}
                            </span>
                            {isToday && (
                              <span className="text-[8px] font-extrabold text-[var(--axia-gold)] tracking-wider">اليوم</span>
                            )}
                          </div>

                          {/* Day Items List */}
                          <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                            {dayItems.map((item) => (
                              <div
                                key={item.id}
                                {...hearingActionMenu.bind(
                                  getCalendarItemActions(item),
                                  getCalendarItemMenuLabel(item),
                                )}
                                draggable={
                                  item.type === "hearing" &&
                                  reschedulingHearingId !== item.id
                                }
                                onDragStart={(e) => handleDragStart(e, { id: item.id, type: item.type })}
                                title={`${item.title} \n (${item.sub})`}
                                className={`text-[9px] py-1 px-1.5 rounded-lg border font-medium transition-all hover:brightness-110 flex items-center gap-1.5 truncate ${
                                  item.type === "hearing"
                                    ? "cursor-grab active:cursor-grabbing"
                                    : "cursor-default"
                                } ${
                                  item.type === "hearing" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                  item.type === "task" ? (item.priority === "حرجة للغاية (ميعاد سقوط)" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-teal-500/10 text-teal-400 border-teal-500/20") :
                                  "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                }`}
                              >
                                {item.type === "hearing" ? <Gavel className="size-2.5 shrink-0" /> :
                                 item.type === "task" ? <CheckSquare className="size-2.5 shrink-0" /> :
                                 <Briefcase className="size-2.5 shrink-0" />}
                                <span className="truncate flex-1">{item.title}</span>
                                {hearingActionMenu.triggerButton(
                                  getCalendarItemActions(item),
                                  getCalendarItemMenuLabel(item),
                                  "size-5 shrink-0 bg-[var(--panel)]/70",
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* WEEK SHEET VIEW */}
              {calendarView === "week" && (
                <motion.div
                  key="week-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden shadow-md grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[var(--border)]"
                >
                  {weekDates.map((date, idx) => {
                    const dateStr = formatDateStr(date);
                    const isToday = dateStr === formatDateStr(new Date());
                    const dayItems = getDayItems(dateStr);
                    const isDraggedOver = dragOverDate === dateStr;

                    return (
                      <div
                        key={idx}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, dateStr)}
                        onDragLeave={() => setDragOverDate(null)}
                        onDrop={(e) => handleDrop(e, dateStr)}
                        className={`p-4 min-h-[300px] flex flex-col gap-3 transition-all ${
                          isToday ? "bg-[var(--gold)]/[0.02]" : "bg-transparent"
                        } ${isDraggedOver ? "bg-[var(--gold)]/10 ring-2 ring-dashed ring-[var(--axia-gold)]" : ""}`}
                      >
                        {/* Column Header */}
                        <div className="border-b border-[var(--border)] pb-2.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--text)]">
                            {ARABIC_DAYS[date.getDay()]}
                          </span>
                          <span className={`text-xs font-mono font-bold ${
                            isToday 
                              ? "px-2 py-0.5 rounded-full bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] text-white"
                              : "text-[var(--text-muted)]"
                          }`}>
                            {date.getDate()}/{date.getMonth() + 1}
                          </span>
                        </div>

                        {/* List items column */}
                        <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                          {dayItems.length === 0 ? (
                            <div className="h-full flex items-center justify-center py-10 border border-dashed border-[var(--border)]/60 rounded-xl text-[10px] text-[var(--text-muted)] text-center px-2">
                              لا توجد مواعيد مقررة
                            </div>
                          ) : (
                            dayItems.map((item) => (
                              <div
                                key={item.id}
                                {...hearingActionMenu.bind(
                                  getCalendarItemActions(item),
                                  getCalendarItemMenuLabel(item),
                                )}
                                draggable={
                                  item.type === "hearing" &&
                                  reschedulingHearingId !== item.id
                                }
                                onDragStart={(e) => handleDragStart(e, { id: item.id, type: item.type })}
                                className={`p-2.5 rounded-xl border text-right hover:brightness-105 transition flex flex-col gap-1 shadow-sm ${
                                  item.type === "hearing"
                                    ? "cursor-grab active:cursor-grabbing"
                                    : "cursor-default"
                                } ${
                                  item.type === "hearing" ? "border-amber-500/15 bg-amber-500/10 text-amber-400" :
                                  item.type === "task" ? (item.priority === "حرجة للغاية (ميعاد سقوط)" ? "border-red-500/15 bg-red-500/10 text-red-400" : "border-teal-500/15 bg-teal-500/10 text-teal-400") :
                                  "border-blue-500/15 bg-blue-500/10 text-blue-400"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 text-[9px] font-bold">
                                  {item.type === "hearing" ? <Gavel className="size-3" /> :
                                   item.type === "task" ? <CheckSquare className="size-3" /> :
                                   <Briefcase className="size-3" />}
                                  <span>
                                    {item.type === "hearing" ? "جلسة رول" :
                                     item.type === "task" ? "مهمة عمل" :
                                     "مراجعة دعوى"}
                                  </span>
                                </div>
                                <div className="flex items-start justify-between gap-1">
                                  <h4 className="text-xs font-bold leading-snug line-clamp-2 flex-1">
                                    {item.title}
                                  </h4>
                                  {hearingActionMenu.triggerButton(
                                    getCalendarItemActions(item),
                                    getCalendarItemMenuLabel(item),
                                    "size-6 shrink-0 bg-[var(--panel)]/70",
                                  )}
                                </div>
                                <span className="text-[10px] opacity-80 block truncate">
                                  {item.sub}
                                </span>
                                {(item.type === "hearing" || item.type === "matter") && (
                                  <div className="mt-1">
                                    <CourtLocationBadge courtName={item.sub} compact />
                                  </div>
                                )}
                                {item.time && (
                                  <span className="text-[9px] font-mono flex items-center gap-1 opacity-70 mt-1">
                                    <Clock className="size-2.5" />
                                    {item.time}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* DAY SHEET VIEW */}
              {calendarView === "day" && (
                <motion.div
                  key="day-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-md space-y-6"
                >
                  {/* Selected Day details */}
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                        {ARABIC_DAYS[currentCalendarDate.getDay()]}، {currentCalendarDate.getDate()} {ARABIC_MONTHS[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">جدول المواعيد والمهام الإجرائية المحددة لهذا اليوم</p>
                    </div>
                    {formatDateStr(currentCalendarDate) === formatDateStr(new Date()) && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">اليوم</span>
                    )}
                  </div>

                  {/* Day Events Column */}
                  <div className="space-y-3">
                    {getDayItems(formatDateStr(currentCalendarDate)).length === 0 ? (
                      <div className="text-center py-16 text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl">
                        <AlertCircle className="size-10 mx-auto mb-3 text-[var(--text-muted)]/40" />
                        <p className="text-sm font-semibold">لا توجد جلسات أو مهام مجدولة في هذا اليوم</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">يمكنك سحب وإفلات العناصر هنا لإدراجها في هذا اليوم</p>
                      </div>
                    ) : (
                      getDayItems(formatDateStr(currentCalendarDate)).map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                            item.type === "hearing" ? "border-amber-500/15 bg-amber-500/[0.02]" :
                            item.type === "task" ? (item.priority === "حرجة للغاية (ميعاد سقوط)" ? "border-red-500/15 bg-red-500/[0.02]" : "border-teal-500/15 bg-teal-500/[0.02]") :
                            "border-blue-500/15 bg-blue-500/[0.02]"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 border ${
                              item.type === "hearing" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              item.type === "task" ? (item.priority === "حرجة للغاية (ميعاد سقوط)" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-teal-500/10 text-teal-400 border-teal-500/20") :
                              "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}>
                              {item.type === "hearing" ? <Gavel className="size-5" /> :
                               item.type === "task" ? <CheckSquare className="size-5" /> :
                               <Briefcase className="size-5" />}
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  item.type === "hearing" ? "bg-amber-500/10 text-amber-400" :
                                  item.type === "task" ? "bg-teal-500/10 text-teal-400" :
                                  "bg-blue-500/10 text-blue-400"
                                }`}>
                                  {item.type === "hearing" ? "جلسة قضائية" :
                                   item.type === "task" ? "مهمة إدارية" :
                                   "قضية"}
                                </span>
                                {item.priority && item.priority !== "عادية" && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/20">
                                    {item.priority}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-[var(--text)]">{item.title}</h4>
                              <p className="text-xs text-[var(--text-muted)]">{item.sub}</p>
                              {(item.type === "hearing" || item.type === "matter") && (
                                <div className="mt-1">
                                  <CourtLocationBadge courtName={item.sub} />
                                </div>
                              )}
                              {item.type === "hearing" && (
                                <div className="mt-1">
                                  <PleadingNotesEditor
                                    initialNotes={(item.original as Hearing).pleadingNotes}
                                    onSave={(notes) => handleUpdateHearingNotes(item.id, notes)}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] border-t md:border-t-0 pt-3 md:pt-0 border-[var(--border)] shrink-0">
                            {item.type === "hearing" && (
                              <button
                                onClick={() => handleToggleArchive(item.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                                  (item.original as Hearing).isArchived
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                                }`}
                              >
                                {(item.original as Hearing).isArchived ? (
                                  <>
                                    <RefreshCw className="size-3" />
                                    <span>استعادة</span>
                                  </>
                                ) : (
                                  <>
                                    <Archive className="size-3" />
                                    <span>أرشفة</span>
                                  </>
                                )}
                              </button>
                            )}
                            <span className="flex items-center gap-1 bg-[var(--accent)] px-3 py-1.5 rounded-xl font-medium text-[var(--text)]">
                              <Clock className="size-3.5 text-[var(--axia-gold)]" />
                              {item.time}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* RENDER MODE B: CLASSIC LIST VIEW */
        <div className="space-y-6">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 border-b border-[var(--border)] pb-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "all"
                  ? "border-[var(--gold)] text-[var(--gold)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              كافة الجلسات
              <span className="ml-1.5 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[9px] text-[var(--text)]">
                {hearings.filter((h) => subTab === "active" ? !h.isArchived : h.isArchived).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("today")}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "today"
                  ? "border-[var(--text)] text-[var(--text)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <span className={`size-1.5 rounded-full ${activeTab === 'today' ? 'bg-red-500 animate-pulse' : 'bg-transparent'}`} />
              جلسات اليوم
              <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[9px] ${
                activeTab === "today" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--accent)] text-[var(--text)]"
              }`}>
                {hearings.filter((h) => (subTab === "active" ? !h.isArchived : h.isArchived) && h.status === "اليوم").length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "upcoming"
                  ? "border-[var(--gold)] text-[var(--gold)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              الجلسات القادمة
              <span className="ml-1.5 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[9px] text-[var(--text)]">
                {hearings.filter((h) => (subTab === "active" ? !h.isArchived : h.isArchived) && h.status === "قادمة").length}
              </span>
            </button>
          </div>

          {/* Hearings List */}
          <div className="space-y-3">
            {filteredListHearings.map((hearing) => {
              const isToday = hearing.status === "اليوم";
              return (
                <div
                  key={hearing.id}
                  className={`rounded-2xl border transition-all ${
                    hearing.isArchived
                      ? "border-[var(--border)] bg-[var(--panel)]/40 opacity-80 shadow-sm"
                      : isToday
                        ? "border-[var(--gold)]/40 bg-[var(--gold)]/5 shadow-sm"
                        : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-strong)] shadow-sm"
                  }`}
                >
                  <div className="p-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isToday ? "bg-[var(--gold)] text-[var(--bg)]" : "bg-[var(--accent)] text-[var(--text-muted)]"
                        }`}>
                          {isToday ? "اليوم" : hearing.hearingDate}
                        </span>
                        <span className="text-xs font-bold text-[var(--text)]">
                          {hearing.caseNumber}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] border-r border-[var(--border)] pr-2 mr-1">
                          رول #{hearing.rollNumber}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 border-r border-[var(--border)] pr-2 mr-1">
                          <Clock className="size-3" />
                          {hearing.hearingTime}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                        <Building2 className="size-4 text-[var(--text-muted)]" />
                        <span>{hearing.court}</span>
                        <span className="text-xs font-normal text-[var(--text-muted)]">({hearing.circuit})</span>
                      </div>
                      <div className="mt-1">
                        <CourtLocationBadge courtName={hearing.court} />
                      </div>

                      <p className="text-xs text-[var(--text-muted)] leading-relaxed flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]"></span>
                        <span className="font-medium text-[var(--text)]">المطلوب:</span> {hearing.purpose}
                      </p>
                    </div>

                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 lg:gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-[var(--text-muted)] block mb-0.5">المحامي المكلف</span>
                        <div className="flex items-center gap-1.5 bg-[var(--accent)] px-2 py-1 rounded-md">
                          <div className="size-4 rounded-full bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] flex items-center justify-center text-[8px] font-bold text-white">
                            {hearing.attendingLawyer.charAt(0)}
                          </div>
                          <strong className="text-[var(--text)] text-xs font-medium">{hearing.attendingLawyer}</strong>
                        </div>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        القاعة: <strong className="text-[var(--text)]">{hearing.hall}</strong>
                      </div>
                      <button
                        onClick={() => handleToggleArchive(hearing.id)}
                        className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                          hearing.isArchived
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                        }`}
                      >
                        {hearing.isArchived ? (
                          <>
                            <RefreshCw className="size-3.5" />
                            <span>استعادة للرول النشط</span>
                          </>
                        ) : (
                          <>
                            <Archive className="size-3.5" />
                            <span>نقل للأرشيف المنتهي</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Court Decision Row */}
                  <div className="border-t border-[var(--border)] bg-[var(--bg)]/30 px-4 py-2.5 rounded-b-xl">
                    {hearing.lastDecision ? (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-medium text-[var(--text)]">قرار المحكمة:</span>
                        <span className="text-[var(--text-muted)]">{hearing.lastDecision}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 max-w-2xl">
                        <input
                          type="text"
                          placeholder="تدوين قرار الجلسة (تأجيل / حجز للحكم / ندب خبير)..."
                          value={decisionNotes[hearing.id] || ""}
                          onChange={(e) =>
                            setDecisionNotes({
                              ...decisionNotes,
                              [hearing.id]: e.target.value,
                            })
                          }
                          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                        />
                        <button
                          onClick={() => {
                            if (decisionNotes[hearing.id]) {
                              handleAddDecision(hearing.id, decisionNotes[hearing.id]);
                            }
                          }}
                          className="rounded-md bg-[var(--text)] px-3 py-1.5 text-[11px] font-medium text-[var(--bg)] hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                          اعتماد
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pleading Notes Section */}
                  <div className="px-4 pb-3 border-t border-[var(--border)]/40 bg-[var(--bg)]/10 rounded-b-2xl">
                    <PleadingNotesEditor
                      initialNotes={hearing.pleadingNotes}
                      onSave={(notes) => handleUpdateHearingNotes(hearing.id, notes)}
                    />
                  </div>
                </div>
              );
            })}
            {filteredListHearings.length === 0 && (
              <div className="text-center py-20 bg-[var(--panel)] border border-dashed border-[var(--border)] rounded-2xl">
                <AlertCircle className="size-10 mx-auto mb-3 text-[var(--text-muted)]/40" />
                <p className="text-sm font-semibold text-[var(--text)]">
                  {subTab === "archived" 
                    ? "لا توجد جلسات مؤرشفة حالياً في رول الجلسات المنتهية" 
                    : "لا توجد جلسات نشطة مطابقة لهذا التصنيف"}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {subTab === "archived" 
                    ? "سيتم أرشفة أي جلسة يمر تاريخها تلقائياً أو يمكنك أرشفتها يدوياً" 
                    : "يمكنك إضافة جلسة جديدة للرول باستخدام الزر المخصص بالتقويم"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Hearing Modal */}
      {isNewHearingOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-lg overflow-y-auto rounded-t-[28px] sm:rounded-2xl border-t sm:border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => setIsNewHearingOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              <Plus className="size-4 text-[var(--text)]" />
              <span>جدولة جلسة</span>
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text)] border-b border-[var(--border)] pb-4">إضافة جلسة للرول</h2>
            
            <form onSubmit={handleCreateHearing} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">القضية المرتبطة</label>
                <select
                  required
                  value={newMatterId}
                  onChange={(e) => {
                    const matterId = e.target.value;
                    setNewMatterId(matterId);
                    const selected = matters.find((matter) => matter.id === matterId);
                    if (selected) {
                      setNewCourt(selected.court === "غير مسجل" ? "" : selected.court);
                      setNewCircuit(selected.circuit === "غير مسجل" ? "" : selected.circuit);
                    }
                  }}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                >
                  <option value="">
                    {matters.length ? "اختر قضية محفوظة..." : "لا توجد قضايا محفوظة"}
                  </option>
                  {matters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.caseNumber} — {matter.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">المحكمة ومقرها</label>
                  <input
                    type="text"
                    required
                    value={newCourt}
                    onChange={(e) => setNewCourt(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">الدائرة القضائية</label>
                  <input
                    type="text"
                    value={newCircuit}
                    onChange={(e) => setNewCircuit(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">القاعة</label>
                  <input
                    type="text"
                    value={newHall}
                    onChange={(e) => setNewHall(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">رقم الرول</label>
                  <input
                    type="number"
                    value={newRoll}
                    onChange={(e) => setNewRoll(Number(e.target.value))}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">توقيت الانعقاد</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">تاريخ الجلسة</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">المحامي المكلف بالحضور</label>
                  <input
                    type="text"
                    readOnly
                    value="غير مسجل"
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--accent)] px-3 py-2 text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">المطلوب بالجلسة</label>
                <textarea
                  rows={2}
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] resize-none"
                />
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewHearingOpen(false)}
                  className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2 font-medium text-[var(--text)] hover:bg-[var(--accent)] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingHearing || matters.length === 0}
                  className="rounded-md bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingHearing ? "جارٍ الحفظ..." : "حفظ الجلسة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Sync & Export Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-xl overflow-y-auto rounded-t-[28px] sm:rounded-2xl border-t sm:border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => setIsSyncModalOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              <RefreshCw className="size-4 text-[var(--axia-gold)] animate-spin-slow" />
              <span>مزامنة التقويم الشخصي</span>
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text)] border-b border-[var(--border)] pb-4">مزامنة الأجندة مع تقويم Google أو Outlook</h2>

            <div className="mt-5 space-y-5 text-right">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                قم بتصدير وتنزيل ملف التقويم التفاعلي بصيغة <strong className="font-mono text-[var(--text)]">iCal (.ics)</strong> القياسية لتتمكن من دمج ومزامنة كافة جلسات المحاكم، قضاياك الحالية، ومهامك القانونية مباشرة داخل تطبيق تقويم Google أو Outlook أو Apple على هاتفك وحاسوبك.
              </p>

              {/* Central CTA Download Button */}
              <div className="bg-[var(--accent)]/40 border border-[var(--border)] p-6 rounded-2xl text-center space-y-4">
                <div className="size-14 rounded-full bg-[var(--axia-gold)]/10 text-[var(--axia-gold)] flex items-center justify-center mx-auto border border-[var(--axia-gold)]/20 shadow-md">
                  <CalendarIcon className="size-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[var(--text)]">ملف التقويم القياسي الشامل</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">يحتوي على {unifiedCalendarItems.length} موعداً نشطاً وجلسة مجدولة حالياً</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleExportICS();
                    setIsSyncModalOpen(false);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--gold-light)] to-[var(--gold)] px-6 py-3 text-xs font-bold text-white shadow-lg hover:opacity-95 transition cursor-pointer"
                >
                  <RefreshCw className="size-4 shrink-0" />
                  تحميل ملف التقويم التفاعلي (.ics)
                </button>
              </div>

              {/* Instructions Guides Section */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5 pb-2 border-b border-[var(--border)]">
                  <Info className="size-4 text-[var(--axia-gold)]" />
                  خطوات الاستيراد والمزامنة السريعة:
                </h4>

                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  {/* Google Calendar Instructions */}
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 space-y-2">
                    <strong className="text-amber-400 block text-xs border-b border-[var(--border)] pb-1.5 mb-1.5">📅 تقويم Google:</strong>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[var(--text-muted)]">
                      <li>افتح <span className="text-[var(--text)]">Google Calendar</span> على الحاسوب.</li>
                      <li>اضغط على أيقونة الترس <span className="text-[var(--text)]">(الإعدادات)</span> في الأعلى.</li>
                      <li>من القائمة اليمنى اختر <span className="text-[var(--text)]">الاستيراد والتصدير</span>.</li>
                      <li>قم برفع ملف الـ <strong className="font-mono text-[var(--text)]">.ics</strong> الذي قمت بتحميله واضغط استيراد.</li>
                    </ol>
                  </div>

                  {/* Outlook Instructions */}
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 space-y-2">
                    <strong className="text-blue-400 block text-xs border-b border-[var(--border)] pb-1.5 mb-1.5">📧 تقويم Outlook:</strong>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[var(--text-muted)]">
                      <li>افتح تطبيق <span className="text-[var(--text)]">Outlook</span> على الويب أو سطح المكتب.</li>
                      <li>انتقل إلى صفحة <span className="text-[var(--text)]">التقويم (Calendar)</span>.</li>
                      <li>اضغط على زر <span className="text-[var(--text)]">إضافة تقويم (Add Calendar)</span>.</li>
                      <li>اختر <span className="text-[var(--text)]">تحميل من ملف (Upload from file)</span> وحدد ملف الـ <strong className="font-mono text-[var(--text)]">.ics</strong>.</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent)] transition-colors"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rescheduleModalHearingId && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">
                  إعادة جدولة الجلسة
                </h3>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  سيتم حفظ التاريخ الجديد في Supabase ثم قراءته مرة أخرى للتأكيد.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalHearingId(null)}
                className="grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <label className="mt-5 block text-xs font-semibold text-[var(--text-muted)]">
              التاريخ الجديد
            </label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(event) => setRescheduleDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRescheduleModalHearingId(null)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)]"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={
                  !rescheduleDate ||
                  reschedulingHearingId === rescheduleModalHearingId
                }
                onClick={async () => {
                  const hearingId = rescheduleModalHearingId;
                  if (!hearingId) return;
                  const saved = await persistHearingReschedule(
                    hearingId,
                    rescheduleDate,
                  );
                  if (saved) setRescheduleModalHearingId(null);
                }}
                className="rounded-xl bg-[var(--axia-gold)] px-4 py-2 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reschedulingHearingId === rescheduleModalHearingId
                  ? "جارٍ الحفظ..."
                  : "حفظ الموعد"}
              </button>
            </div>
          </div>
        </div>
      )}

      {hearingActionMenu.menuNode}

      {/* HIDDEN COURTROOM-READY PRINTABLE PDF REPORT CONTAINER */}
      <div 
        id="printable-court-report"
        className="hidden"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '840px',
          padding: '40px',
          background: '#ffffff',
          color: '#1e293b',
          fontFamily: 'system-ui, sans-serif',
          direction: 'rtl',
          display: isGeneratingPDF ? 'block' : 'none'
        }}
      >
        {/* Header Section */}
        <div className="border-b-2 border-amber-600 pb-5 mb-6 text-right">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h1 className="text-2xl font-black text-slate-900 tracking-wide">أكسيا للمحاماة والاستشارات القانونية</h1>
              <p className="text-[10px] text-amber-700 font-bold tracking-widest mt-1">AXIA LAW FIRM & LEGAL ARBITRATION</p>
            </div>
            <div className="text-left bg-stone-100 p-2.5 rounded-xl border border-stone-200">
              <p className="text-[10px] text-stone-600 font-bold">تاريخ التقرير: 18 سبتمبر 2026</p>
              <p className="text-[10px] text-stone-500 font-mono mt-0.5">المرجع الرسمي: {reportCode}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center bg-slate-900 text-white px-4 py-2 rounded-lg">
            <span className="text-xs font-bold">أجندة رول الجلسات المعتمدة للمثول أمام هيئة المحكمة الموقرة</span>
            <span className="text-[11px] font-bold bg-amber-600 px-3 py-1 rounded text-white">
              {calendarView === "month" ? "تقرير شهري شامل" : calendarView === "week" ? "تقرير أسبوعي شامل" : "تقرير يومي"}
            </span>
          </div>
        </div>

        {/* Executive Summary / Metadata Box */}
        <div className="grid grid-cols-3 gap-4 mb-6 bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-right">
          <div>
            <span className="text-stone-500 block font-bold mb-1">النطاق الزمني المستهدف:</span>
            <strong className="text-slate-900 text-sm block">
              {calendarView === "month" && `شهر ${ARABIC_MONTHS[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`}
              {calendarView === "week" && `أسبوع الجلسات النشطة`}
              {calendarView === "day" && `يوم ${ARABIC_DAYS[currentCalendarDate.getDay()]} ${currentCalendarDate.getDate()} ${ARABIC_MONTHS[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`}
            </strong>
          </div>
          <div>
            <span className="text-stone-500 block font-bold mb-1">إجمالي الجلسات المدرجة:</span>
            <strong className="text-slate-900 text-sm block">{printHearings.length} جلسة قضائية</strong>
          </div>
          <div>
            <span className="text-stone-500 block font-bold mb-1">الجهة المعتمدة والمصدرة:</span>
            <strong className="text-slate-900 text-sm block">إدارة الشؤون القانونية والجدولة القضائية</strong>
          </div>
        </div>

        {/* Sessions / Hearings High-Contrast Data Table */}
        <table className="w-full border-collapse text-right text-xs" style={{ direction: "rtl" }}>
          <thead>
            <tr className="bg-slate-900 text-white text-[10px]">
              <th className="border border-stone-300 p-2.5 w-[16%]">اليوم والتاريخ</th>
              <th className="border border-stone-300 p-2.5 w-[10%]">الساعة</th>
              <th className="border border-stone-300 p-2.5 w-[16%]">رقم الدعوى</th>
              <th className="border border-stone-300 p-2.5 w-[22%]">المحكمة والدائرة</th>
              <th className="border border-stone-300 p-2.5 w-[12%]">القاعة والرول</th>
              <th className="border border-stone-300 p-2.5 w-[12%]">المحامي الحاضر</th>
              <th className="border border-stone-300 p-2.5 w-[12%]">المطلوب بالجلسة</th>
            </tr>
          </thead>
          <tbody>
            {printHearings.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-stone-300 p-8 text-center text-stone-400 font-bold bg-white">
                  لا توجد جلسات قضائية مجدولة لهذا النطاق حالياً.
                </td>
              </tr>
            ) : (
              printHearings.map((h) => {
                const parts = h.hearingDate.split("-");
                let arabicDateLabel = h.hearingDate;
                if (parts.length === 3) {
                  const year = parseInt(parts[0], 10);
                  const month = parseInt(parts[1], 10) - 1;
                  const day = parseInt(parts[2], 10);
                  const dateObj = new Date(year, month, day);
                  arabicDateLabel = `${ARABIC_DAYS[dateObj.getDay()]} ${day} ${ARABIC_MONTHS[month]}`;
                }

                return (
                  <tr key={h.id} className="text-slate-800 bg-white font-semibold">
                    <td className="border border-stone-300 p-2.5 font-bold">{arabicDateLabel}</td>
                    <td className="border border-stone-300 p-2.5 font-black text-slate-900">{h.hearingTime}</td>
                    <td className="border border-stone-300 p-2.5 font-mono text-slate-900">{h.caseNumber}</td>
                    <td className="border border-stone-300 p-2.5">
                      <div className="font-bold text-slate-900">{h.court}</div>
                      <div className="text-[9px] text-stone-500 mt-0.5">{h.circuit}</div>
                    </td>
                    <td className="border border-stone-300 p-2.5 text-center">
                      <div className="text-xs font-black text-slate-900">رول {h.rollNumber}</div>
                      <div className="text-[9px] text-stone-500 mt-0.5">{h.hall}</div>
                    </td>
                    <td className="border border-stone-300 p-2.5 text-stone-600">{h.attendingLawyer}</td>
                    <td className="border border-stone-300 p-2.5 text-[10px] font-bold text-slate-900 leading-relaxed">{h.purpose}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Compliance Footer and Official Signatures Section */}
        <div className="mt-12 pt-8 border-t border-stone-200 grid grid-cols-3 gap-8 text-center text-xs">
          <div className="flex flex-col items-center">
            <span className="text-stone-500 font-bold mb-14">توقيع المندوب القضائي الحاضر</span>
            <div className="w-36 border-b border-stone-400 border-dashed" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-stone-500 font-bold mb-14">اعتماد مستشار الهيئة</span>
            <div className="w-36 border-b border-stone-400 border-dashed" />
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="size-20 rounded-full border border-amber-600/40 border-dashed flex items-center justify-center text-[8px] text-amber-700 font-black tracking-widest bg-amber-50/50">
              ختم الإدارة الرسمية
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-[9px] text-stone-400 font-medium">
          هذا التقرير الصادر آلياً يمثل مستنداً رسمياً لتمثيل مكتب أكسيا للمحاماة أمام المحاكم المصرية.
        </div>
      </div>
    </div>
  );
}
