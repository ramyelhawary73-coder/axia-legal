"use client";

import { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  X,
  Radio,
  Send,
  BellRing,
  Download,
  Mic,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  Check,
  FolderOpen,
  RefreshCw,
  List,
  Kanban,
  GripVertical
} from "lucide-react";
import { NavigationTab, LegalTask, Matter } from "@/types/legal";
import { analyzeTaskDeadline } from "@/lib/task-utils";
import { 
  getNotificationPermissionStatus, 
  requestBrowserNotificationPermission, 
  sendTestBrowserNotification, 
  sendTaskDeadlineBrowserNotification, 
  NotificationPermissionStatus 
} from "@/lib/browser-notifications";
import { LegalPdfReportModal } from "@/components/legal-pdf-report-modal";
import { VoiceCommandModal } from "@/components/voice-command-modal";
import { TaskCreationModal } from "@/components/task-creation-modal";
import type { TaskMatterOption } from "@/lib/tasks-client";

interface TasksEmptyStateProps {
  currentCategory: string;
  onResetCategory: () => void;
  onCreateTaskClick: () => void;
  availableTasksCount: number;
}

function TasksEmptyState({
  currentCategory,
  onResetCategory,
  onCreateTaskClick,
  availableTasksCount,
}: TasksEmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-[var(--border-strong)] bg-gradient-to-b from-[var(--panel)] to-[var(--bg)] p-10 text-center shadow-sm transition duration-300 hover:border-[var(--axia-gold)]/40">
      {/* Decorative background vectors */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />
      <div className="absolute -left-16 -top-16 size-48 rounded-full bg-[var(--axia-gold-dim)]/5 blur-3xl pointer-events-none" />
      <div className="absolute -right-16 -bottom-16 size-48 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

      {/* Decorative stacked isometric icon cluster */}
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
        {/* Soft radial glow */}
        <div className="absolute inset-0 rounded-full bg-[var(--axia-gold-dim)]/25 blur-xl animate-pulse" />
        
        {/* Outer dashed spinning orbit */}
        <div className="absolute size-20 rounded-full border border-dashed border-[var(--axia-gold)]/30 animate-[spin_40s_linear_infinite]" />
        
        {/* Secondary offset back-plate */}
        <div className="absolute size-14 translate-x-2 -translate-y-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--panel-glass)]/60 backdrop-blur-sm opacity-50 rotate-6" />
        
        {/* Main central card container */}
        <div className="absolute size-14 rounded-2xl bg-gradient-to-br from-[var(--panel)] to-[var(--bg)] border border-[var(--border-strong)] shadow-md flex items-center justify-center -rotate-6 transition-transform hover:rotate-0 duration-300">
          <FolderOpen className="size-6 text-[var(--axia-gold)]" />
        </div>

        {/* Top-right floating indicator */}
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400 shadow animate-[bounce_3s_infinite]">
          <AlertTriangle className="size-3" />
        </div>
      </div>

      <div className="mt-6 max-w-md mx-auto space-y-2">
        <h3 className="text-base font-bold text-[var(--text)] tracking-tight">
          {currentCategory === "all" 
            ? "سجل المهام الإجرائية فارغ تماماً" 
            : `لا توجد مهام في تصنيف "${currentCategory}"`}
        </h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          {currentCategory === "all"
            ? "لم يتم تسجيل أي إعلانات محضرين أو مواعيد طعن بعد. ابدأ بإضافة أول مهمة لمتابعة سير الإجراءات المكتبية الفورية."
            : `لا توجد أي مواعيد سقوط أو التزامات قضائية مجدولة تحت هذا التصنيف حالياً. يمكنك التحقق من باقي الأقسام أو تسجيل مهمة جديدة.`}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        {currentCategory !== "all" && (
          <button
            type="button"
            onClick={onResetCategory}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--panel)] px-4.5 py-2.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] shadow-sm transition"
          >
            <RefreshCw className="size-3.5" />
            <span>عرض كافة المهام ({availableTasksCount})</span>
          </button>
        )}
        <button
          type="button"
          onClick={onCreateTaskClick}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-700 px-5 py-2.5 text-xs font-bold text-[var(--text)] shadow-md hover:brightness-110 transition"
        >
          <Plus className="size-4" />
          <span>إضافة مهمة إجرائية جديدة</span>
        </button>
      </div>

      {/* Interactive suggestions or educational tip */}
      <div className="mt-10 pt-8 border-t border-[var(--border)] max-w-lg mx-auto">
        <div className="text-[11px] font-semibold text-[var(--axia-gold)] mb-3">
          💡 تلميحات سريعة لإدارة قلم المحضرين والمواعيد الإجرائية
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
          <div className="rounded-xl bg-[var(--panel-glass)]/40 p-3 border border-[var(--border)]">
            <span className="block text-[11px] font-bold text-[var(--text)]">مواعيد السقوط الصارمة</span>
            <span className="block text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
              تأكد من إدراج تاريخ الحكم بدقة ليقوم النظام بحساب مواعيد الاستئناف والطعن تلقائياً وتفعيل التنبيهات.
            </span>
          </div>
          <div className="rounded-xl bg-[var(--panel-glass)]/40 p-3 border border-[var(--border)]">
            <span className="block text-[11px] font-bold text-[var(--text)]">إعلان الخصوم</span>
            <span className="block text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
              قم بجدولة مراجعة المحضرين للتحقق من إتمام تسليم صحيفة الدعوى وإعادتها بتقرير الإعلان القانوني.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TasksViewProps {
  tasks?: LegalTask[];
  onToggleTaskStatus?: (id: string) => void;
  onCreateTask?: (task: LegalTask) => boolean | void | Promise<boolean | void>;
  onBulkUpdateTaskStatus?: (taskIds: string[], status: LegalTask["status"]) => void | Promise<void>;
  taskMatterOptions?: TaskMatterOption[];
  taskAssigneeLabel?: string;
  onBulkDeleteTasks?: (taskIds: string[]) => void;
  onDeleteTask?: (taskId: string) => void;
  onNavigate?: (tab: NavigationTab) => void;
}

export function TasksView({
  tasks: propTasks,
  onToggleTaskStatus: propToggleStatus,
  onCreateTask: propCreateTask,
  onBulkUpdateTaskStatus: propBulkUpdateStatus,
  taskMatterOptions = [],
  taskAssigneeLabel = "المستخدم الحالي",
  onBulkDeleteTasks: propBulkDelete,
  onDeleteTask: propDeleteTask,
  onNavigate,
}: TasksViewProps = {}) {
  const [internalTasks, setInternalTasks] = useState<LegalTask[]>([]);
  const tasks = propTasks ?? internalTasks;

  const reportMatters: Matter[] = taskMatterOptions.map((matter) => ({
    id: matter.id,
    caseNumber: matter.caseNumber,
    year: new Date().getFullYear(),
    court: (matter.court || "غير مسجل") as Matter["court"],
    circuit: "غير مسجل",
    title: matter.title,
    clientName: "غير مسجل",
    clientRole: "غير مسجل",
    opponentName: "غير مسجل",
    assignedLawyer: "غير مسجل",
    nextHearingDate: "غير مسجل",
    nextHearingGoal: "غير مسجل",
    stage: "غير مسجل",
    agreedFees: "غير مسجل",
    paidFees: "غير مسجل",
    status: "مفتوحة",
  }));
  const deletionEnabled =
    propTasks === undefined || Boolean(propBulkDelete || propDeleteTask);

  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [hoveredColumn, setHoveredColumn] = useState<LegalTask["status"] | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleUpdateTaskStatus = async (id: string, newStatus: LegalTask["status"]) => {
    if (propBulkUpdateStatus) {
      await propBulkUpdateStatus([id], newStatus);
      return;
    }

    setInternalTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    );
  };

  const statuses: { id: LegalTask["status"]; label: string; bg: string; border: string; text: string; dot: string }[] = [
    { 
      id: "قيد التنفيذ", 
      label: "قيد التنفيذ", 
      bg: "bg-amber-500/10", 
      border: "border-amber-500/30", 
      text: "text-amber-400", 
      dot: "bg-amber-500"
    },
    { 
      id: "معلقة", 
      label: "معلقة (مؤجلة)", 
      bg: "bg-slate-500/10", 
      border: "border-slate-500/30", 
      text: "text-slate-400", 
      dot: "bg-slate-400"
    },
    { 
      id: "مكتملة", 
      label: "مكتملة", 
      bg: "bg-emerald-500/10", 
      border: "border-emerald-500/30", 
      text: "text-emerald-400", 
      dot: "bg-emerald-500"
    },
  ];

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(() => {
    return typeof window !== "undefined" ? getNotificationPermissionStatus() : "default";
  });
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermissionStatus(getNotificationPermissionStatus());
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setPermissionStatus(res);
  };

  const handleSendTest = () => {
    const ok = sendTestBrowserNotification();
    if (ok) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  // Voice Command & Dictation State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceToastMessage, setVoiceToastMessage] = useState<string | null>(null);

  const handleVoiceTaskCreated = (newTask: LegalTask) => {
    if (propCreateTask) {
      void Promise.resolve(propCreateTask(newTask)).then((result) => {
        if (result === false) {
          setVoiceToastMessage("تعذر حفظ المهمة الصوتية.");
          return;
        }
        setVoiceToastMessage(`تمت إضافة المهمة الصوتية بنجاح: "${newTask.title}"`);
        setTimeout(() => setVoiceToastMessage(null), 4500);
      });
      return;
    }

    setVoiceToastMessage("إنشاء المهام غير متاح بدون Backend handler موثّق.");
    setTimeout(() => setVoiceToastMessage(null), 4500);
  };

  const handleToggleTaskStatus = (id: string) => {
    if (propToggleStatus) {
      propToggleStatus(id);
    }
  };

  // Multi-select & Bulk actions state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskIdsToDelete, setTaskIdsToDelete] = useState<string[]>([]);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setHoveredColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: LegalTask["status"]) => {
    e.preventDefault();
    setHoveredColumn(status);
  };

  const handleDragLeave = () => {
    setHoveredColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LegalTask["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId) {
      void handleUpdateTaskStatus(taskId, targetStatus);
    }
    setHoveredColumn(null);
    setDraggedTaskId(null);
  };

  const dueSoonTasksCount = tasks.filter((t) => {
    const analysis = analyzeTaskDeadline(t);
    return t.status !== "مكتملة" && analysis.diffHours <= 48;
  }).length;

  const filteredTasks = tasks.filter((t) => {
    if (filterCategory === "all") return true;
    if (filterCategory === "due-soon") {
      const analysis = analyzeTaskDeadline(t);
      return t.status !== "مكتملة" && analysis.diffHours <= 48;
    }
    return t.category === filterCategory;
  });

  const filteredTaskIds = filteredTasks.map((t) => t.id);
  const isAllFilteredSelected =
    filteredTaskIds.length > 0 &&
    filteredTaskIds.every((id) => selectedTaskIds.includes(id));
  const isSomeFilteredSelected =
    filteredTaskIds.some((id) => selectedTaskIds.includes(id)) &&
    !isAllFilteredSelected;

  const handleToggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedTaskIds((prev) =>
        prev.filter((id) => !filteredTaskIds.includes(id))
      );
    } else {
      setSelectedTaskIds((prev) =>
        Array.from(new Set([...prev, ...filteredTaskIds]))
      );
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  const handleBulkUpdateStatus = async (newStatus: LegalTask["status"]) => {
    if (selectedTaskIds.length === 0) return;

    if (propBulkUpdateStatus) {
      await propBulkUpdateStatus(selectedTaskIds, newStatus);
    } else {
      setInternalTasks((prev) =>
        prev.map((t) =>
          selectedTaskIds.includes(t.id) ? { ...t, status: newStatus } : t,
        ),
      );
    }

    setVoiceToastMessage(
      `تم تحديث حالة ${selectedTaskIds.length} ${
        selectedTaskIds.length === 1 ? "مهمة" : "مهام"
      } إلى "${newStatus}" بنجاح`,
    );
    setTimeout(() => setVoiceToastMessage(null), 4000);
    setSelectedTaskIds([]);
  };

  const handleRequestBulkDelete = () => {
    if (!deletionEnabled || selectedTaskIds.length === 0) return;
    setTaskIdsToDelete(selectedTaskIds);
    setIsDeleteConfirmOpen(true);
  };

  const handleRequestSingleDelete = (id: string) => {
    if (!deletionEnabled) return;
    setTaskIdsToDelete([id]);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletionEnabled || taskIdsToDelete.length === 0) return;
    if (propBulkDelete) {
      propBulkDelete(taskIdsToDelete);
    } else if (propDeleteTask && taskIdsToDelete.length === 1) {
      propDeleteTask(taskIdsToDelete[0]);
    } else {
      setInternalTasks((prev) =>
        prev.filter((t) => !taskIdsToDelete.includes(t.id))
      );
    }
    setSelectedTaskIds((prev) =>
      prev.filter((id) => !taskIdsToDelete.includes(id))
    );
    setVoiceToastMessage(
      `تم حذف ${taskIdsToDelete.length} ${
        taskIdsToDelete.length === 1 ? "مهمة إجرائية" : "مهام إجرائية"
      } بنجاح`
    );
    setTimeout(() => setVoiceToastMessage(null), 4000);
    setIsDeleteConfirmOpen(false);
    setTaskIdsToDelete([]);
  };

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
            <AlertTriangle className="size-4" />
            <span>قلم المحضرين والمواعيد الإجرائية</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
            مواعيد السقوط والمهام القضائية
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            تتبع تسليم إعلانات المحضرين، مواعيد الطعن القانونية الصارمة، وسداد رسوم الخبراء
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2.5 text-xs font-bold text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] shadow-sm transition"
            title="تصدير جدول المهام وإعلانات المحضرين ومواعيد السقوط إلى PDF"
          >
            <Download className="size-4" />
            <span>تصدير جدول المهام (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--axia-gold)]/50 bg-[var(--panel)] px-3.5 py-2.5 text-xs font-bold text-[var(--axia-gold)] hover:bg-[var(--accent)] hover:border-[var(--axia-gold)] shadow-sm transition"
            title="إملاء المهام والملاحظات عبر الصوت (Web Speech API)"
          >
            <Mic className="size-4" />
            <span>إملاء مهمة صوتية (Web Speech)</span>
          </button>

          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-700 px-4 py-2.5 text-xs font-bold text-[var(--text)] shadow-md transition hover:brightness-110"
            title="تكليف بمهمة إجرائية جديدة (Ctrl+N أو Alt+N)"
          >
            <Plus className="size-4" />
            <span>تكليف بمهمة إجرائية جديدة</span>
            <kbd className="hidden sm:inline-block rounded bg-black/30 border border-white/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white/90">
              Ctrl+N
            </kbd>
          </button>
        </div>
      </div>

      {/* Voice Action Toast / Notice */}
      {voiceToastMessage && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center justify-between animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{voiceToastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceToastMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Browser Notification API Status Banner */}
      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--panel-glass)] p-4 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`grid size-9 place-items-center rounded-xl border ${
              permissionStatus === "granted"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : permissionStatus === "denied"
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-[var(--axia-gold-dim)] bg-[var(--axia-gold)]/10 text-[var(--axia-gold)]"
            }`}>
              <Radio className="size-4.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[var(--text)]">
                  نظام التنبيهات المكتبية الفورية (Browser Notification API)
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  permissionStatus === "granted"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : permissionStatus === "denied"
                    ? "bg-red-500/15 border border-red-500/30 text-red-400"
                    : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                }`}>
                  {permissionStatus === "granted" ? "متصل ونشط" : permissionStatus === "denied" ? "محظور بالمتصفح" : "بانتظار الإذن"}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                تنبيه صوتي ومرئي منبثق من المتصفح عند بقاء أقل من ساعة على المهام القضائية العاجلة ومواعيد الطعن.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permissionStatus === "granted" ? (
              <button
                type="button"
                onClick={handleSendTest}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] transition shadow-sm"
              >
                <Send className="size-3" />
                <span>{testSent ? "تم إرسال الإشعار بنجاح ✓" : "اختبار إشعار المتصفح"}</span>
              </button>
            ) : permissionStatus === "denied" ? (
              <span className="text-xs text-red-400 font-medium">
                يرجى السماح بالإشعارات من إعدادات المتصفح
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--axia-gold)] px-3.5 py-1.5 text-xs font-bold text-black shadow hover:brightness-110 transition"
              >
                <BellRing className="size-3.5" />
                <span>تفعيل التنبيهات المكتبية</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & View Mode Switcher */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border)] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: `كافة المهام (${tasks.length})` },
            { id: "due-soon", label: `مواعيد قريبة [48 س] (${dueSoonTasksCount})` },
            { id: "قلم المحضرين", label: "أعمال قلم المحضرين" },
            { id: "ميعاد طعن قانوني", label: "مواعيد سقوط الطعون" },
            { id: "سداد رسوم", label: "الخزينة ورسوم الخبراء" },
            { id: "إيداع مذكرات", label: "إيداع المذكرات القضائية" },
          ].map((tab) => {
            const isActive = filterCategory === tab.id;
            let themeClass = "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]";
            
            if (isActive) {
              if (tab.id === "due-soon") {
                themeClass = "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse font-bold";
              } else {
                themeClass = "bg-red-500/20 text-red-300 border border-red-500/30 font-bold";
              }
            } else if (tab.id === "due-soon" && dueSoonTasksCount > 0) {
              themeClass = "text-amber-400 hover:bg-amber-500/10 font-bold";
            }

            return (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${themeClass}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Layout Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-[var(--accent)] p-1 border border-[var(--border)] shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "list"
                ? "bg-[var(--panel)] text-[var(--text)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
            title="عرض المهام في قائمة مفصلة متعاقبة"
          >
            <List className="size-3.5" />
            <span>جدول المواعيد</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "kanban"
                ? "bg-[var(--panel)] text-[var(--text)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
            title="عرض المهام في لوحة كانبان التفاعلية للسحب والإفلات"
          >
            <Kanban className="size-3.5" />
            <span>لوحة كانبان</span>
          </button>
        </div>
      </div>

      {/* Multi-Select & Bulk Actions Bar */}
      {selectedTaskIds.length > 0 ? (
        <div className="sticky top-0 z-20 rounded-2xl border border-[var(--axia-gold)]/50 bg-[var(--panel)]/95 p-3.5 sm:p-4 shadow-xl backdrop-blur-md transition-all">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--text)] border border-[var(--border)] hover:border-[var(--axia-gold)] transition shadow-sm"
                title={isAllFilteredSelected ? "إلغاء تحديد الكل" : "تحديد كافة المهام المعروضة"}
              >
                {isAllFilteredSelected ? (
                  <CheckSquare className="size-4 text-[var(--axia-gold)]" />
                ) : isSomeFilteredSelected ? (
                  <MinusSquare className="size-4 text-[var(--axia-gold)]" />
                ) : (
                  <Square className="size-4 text-[var(--text-muted)]" />
                )}
                <span>{isAllFilteredSelected ? "إلغاء تحديد الكل" : "تحديد كافة المعروض"}</span>
              </button>

              <div className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--axia-gold)]/15 border border-[var(--axia-gold)]/40 px-3 py-1 text-xs font-bold text-[var(--axia-gold-light)]">
                <span>تم تحديد</span>
                <span className="font-mono text-sm font-extrabold text-[var(--axia-gold)]">{selectedTaskIds.length}</span>
                <span>من أصل {filteredTasks.length} مهمة</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { void handleBulkUpdateStatus("مكتملة"); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 shadow-sm transition"
                title="تحديث حالة كافة المهام المحددة إلى 'مكتملة'"
              >
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>تعيين كمكتملة ({selectedTaskIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => { void handleBulkUpdateStatus("قيد التنفيذ"); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 shadow-sm transition"
                title="تحديث حالة كافة المهام المحددة إلى 'قيد التنفيذ'"
              >
                <Clock className="size-3.5 text-amber-400" />
                <span>تعيين كقيد التنفيذ</span>
              </button>

              {deletionEnabled && (
                <button
                  type="button"
                  onClick={handleRequestBulkDelete}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/50 bg-red-600/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-600/30 shadow-sm transition"
                  title="حذف المهام المحددة نهائياً"
                >
                  <Trash2 className="size-3.5 text-red-400" />
                  <span>حذف المحدد ({selectedTaskIds.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClearSelection}
                className="inline-flex items-center gap-1 rounded-xl bg-[var(--accent)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition border border-transparent hover:border-[var(--border)]"
                title="إلغاء التحديد"
              >
                <X className="size-3.5" />
                <span>إلغاء</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-1 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition border border-transparent hover:border-[var(--border)]"
              title="تحديد كافة المهام في هذه القائمة"
            >
              <Square className="size-3.5 text-[var(--text-muted)]" />
              <span>تحديد الكل ({filteredTasks.length})</span>
            </button>
            <span className="text-[var(--border-strong)]">|</span>
            <span>عرض {filteredTasks.length} من {tasks.length} مهمة مسجلة</span>
          </div>

          <span className="text-[11px] text-[var(--text-muted)]">
            حدد مربع الاختيار على أي مهمة للبدء في إجراءات التحديث الجماعي
          </span>
        </div>
      )}

      {/* Tasks Content Block */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {statuses.map((statusCol) => {
            const columnTasks = filteredTasks.filter((t) => t.status === statusCol.id);
            const isColumnHovered = hoveredColumn === statusCol.id;

            return (
              <div
                key={statusCol.id}
                onDragOver={(e) => handleDragOver(e, statusCol.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, statusCol.id)}
                className={`flex flex-col rounded-3xl border p-4.5 min-h-[500px] transition-all duration-200 ${
                  isColumnHovered
                    ? `${statusCol.bg} ${statusCol.border} border-dashed ring-2 ring-[var(--axia-gold)]/40 shadow-lg`
                    : "border-[var(--border)] bg-[var(--panel-glass)]/30 backdrop-blur-sm"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${statusCol.dot}`} />
                    <span className="font-bold text-xs text-[var(--text)]">{statusCol.label}</span>
                  </div>
                  <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-mono font-bold text-[var(--text-muted)]">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column Content */}
                <div className="space-y-3.5 flex-1 flex flex-col justify-start">
                  {columnTasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel)]/20 p-6 text-center text-[var(--text-muted)] min-h-[250px] transition duration-200">
                      <FolderOpen className="size-6 text-[var(--text-muted)] opacity-30 mb-2" />
                      <span className="text-[11px] font-semibold">لا توجد مهام حالياً</span>
                      <span className="text-[10px] text-[var(--text-muted)] opacity-80 mt-1">
                        اسحب أي مهمة هنا لتغيير حالتها
                      </span>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const isCritical = task.priority.includes("حرجة");
                      const isCompleted = task.status === "مكتملة";
                      const isSelected = selectedTaskIds.includes(task.id);
                      const deadlineInfo = analyzeTaskDeadline(task);
                      const isDueWithinOneHour =
                        deadlineInfo.diffHours > -0.08 &&
                        deadlineInfo.diffHours <= 1.0 &&
                        (isCritical || task.priority === "عاجلة") &&
                        !isCompleted;

                      return (
                        <div
                          key={task.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          className={`rounded-2xl border p-3.5 transition duration-200 cursor-grab active:cursor-grabbing select-none relative ${
                            draggedTaskId === task.id
                              ? "opacity-40 border-[var(--border-strong)] bg-[var(--bg)]"
                              : isSelected
                              ? "border-[var(--axia-gold)] bg-gradient-to-r from-[var(--panel)] via-[var(--accent)] to-[var(--panel)] ring-2 ring-[var(--axia-gold)]/60 shadow-md"
                              : isCompleted
                              ? "border-emerald-500/20 bg-emerald-950/10 opacity-75"
                              : isDueWithinOneHour
                              ? "border-red-500/60 bg-gradient-to-r from-red-950/30 to-[var(--panel)] shadow-lg"
                              : isCritical
                              ? "border-red-500/30 bg-[var(--accent-hover)]"
                              : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-strong)] hover:shadow-sm"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                  isCritical ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-[var(--text-muted)]"
                                }`}>
                                  {task.priority}
                                </span>
                                <span className="rounded bg-[var(--accent)] px-1.5 py-0.2 text-[9px] font-medium text-[var(--text-muted)]">
                                  {task.category}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 text-[var(--text-muted)]">
                                <GripVertical className="size-3.5 opacity-40 cursor-grab" />
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectTask(task.id)}
                                  className={`grid size-4 shrink-0 place-items-center rounded border transition ${
                                    isSelected
                                      ? "border-[var(--axia-gold)] bg-[var(--axia-gold)] text-black"
                                      : "border-[var(--border-strong)] bg-[var(--accent)] text-transparent hover:border-[var(--axia-gold)]"
                                  }`}
                                >
                                  <Check className="size-3 stroke-[3]" />
                                </button>
                              </div>
                            </div>

                            <h4 className={`text-xs font-bold leading-relaxed ${
                              isCompleted ? "line-through text-[var(--text-muted)] text-[11px]" : "text-[var(--text)]"
                            }`}>
                              {task.title}
                            </h4>

                            {task.matterCaseNumber && (
                              <div className="text-[10px] font-semibold text-[var(--axia-gold-light)]">
                                {task.matterCaseNumber}
                              </div>
                            )}

                            <div className="text-[10px] text-[var(--text-muted)] space-y-1">
                              <div className="flex justify-between items-center">
                                <span>الجهة:</span>
                                <strong className="text-[var(--text)]">{task.courtOrBailiffOffice}</strong>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>المسؤول:</span>
                                <strong className="text-[var(--text)]">{task.assignedTo}</strong>
                              </div>
                            </div>

                            <div className="border-t border-[var(--border)] pt-2 mt-2 flex items-center justify-between gap-1.5">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold rounded px-1.5 py-0.5 ${
                                isDueWithinOneHour
                                  ? "bg-red-600 text-white"
                                  : deadlineInfo.isWithin24Hours && !isCompleted
                                  ? "bg-amber-500/15 text-amber-500"
                                  : "bg-[var(--accent)] text-[var(--text-muted)]"
                              }`}>
                                <Clock className="size-3" />
                                <span>{deadlineInfo.remainingText}</span>
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTaskStatus(task.id)}
                                  className="text-[9px] font-bold text-[var(--text-muted)] hover:text-[var(--text)]"
                                >
                                  {isCompleted ? "تراجع" : "إكمال"}
                                </button>
                                {deletionEnabled && (
                                  <button
                                    type="button"
                                    onClick={() => handleRequestSingleDelete(task.id)}
                                    className="p-1 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredTasks.length === 0 ? (
            <TasksEmptyState
              currentCategory={filterCategory}
              onResetCategory={() => setFilterCategory("all")}
              onCreateTaskClick={() => setIsNewTaskOpen(true)}
              availableTasksCount={tasks.length}
            />
          ) : (
            filteredTasks.map((task) => {
              const isCritical = task.priority.includes("حرجة");
              const isCompleted = task.status === "مكتملة";
              const isSelected = selectedTaskIds.includes(task.id);
              const deadlineInfo = analyzeTaskDeadline(task);
              const isDueWithinOneHour = 
                deadlineInfo.diffHours > -0.08 && 
                deadlineInfo.diffHours <= 1.0 && 
                (isCritical || task.priority === "عاجلة") && 
                !isCompleted;

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-4 sm:p-4.5 transition relative ${
                    isSelected
                      ? "border-[var(--axia-gold)] bg-gradient-to-r from-[var(--panel)] via-[var(--accent)] to-[var(--panel)] ring-2 ring-[var(--axia-gold)]/60 shadow-md"
                      : isCompleted
                      ? "border-emerald-500/20 bg-emerald-950/10 opacity-75"
                      : isDueWithinOneHour
                      ? "border-red-500/60 bg-gradient-to-r from-red-950/30 to-[var(--panel)] shadow-lg ring-1 ring-red-500/30"
                      : isCritical
                      ? "border-red-500/30 bg-[var(--accent-hover)] shadow-md"
                      : deadlineInfo.isWithin24Hours
                      ? "border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50"
                      : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      {/* Multi-Select Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelectTask(task.id)}
                        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition ${
                          isSelected
                            ? "border-[var(--axia-gold)] bg-[var(--axia-gold)] text-black"
                            : "border-[var(--border-strong)] bg-[var(--accent)] text-transparent hover:border-[var(--axia-gold)]"
                        }`}
                        title="تحديد المهمة لتنفيذ إجراء جماعي"
                        aria-label={`تحديد المهمة ${task.title}`}
                      >
                        <Check className="size-3.5 stroke-[3]" />
                      </button>

                      {/* Quick Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(task.id)}
                        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition ${
                          isCompleted
                            ? "border-emerald-400 bg-emerald-400 text-white"
                            : "border-white/30 hover:border-white text-transparent"
                        }`}
                        title={isCompleted ? "المهمة مكتملة - انقر لإعادة الفتح" : "انقر لتحديد المهمة كمكتملة"}
                      >
                        {isCompleted && <CheckCircle2 className="size-3.5" />}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {isDueWithinOneHour && (
                            <span className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                              <AlertTriangle className="size-3" />
                              <span>ينقضي خلال أقل من ساعة!</span>
                            </span>
                          )}
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            isCritical ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-[var(--text-muted)]"
                          }`}>
                            {task.priority}
                          </span>
                          <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                            {task.category}
                          </span>
                          {task.matterCaseNumber && (
                            <span className="text-xs font-semibold text-[var(--axia-gold-light)]">
                              {task.matterCaseNumber}
                            </span>
                          )}
                          {isSelected && (
                            <span className="rounded-md bg-[var(--axia-gold)]/20 border border-[var(--axia-gold)]/40 px-2 py-0.2 text-[10px] font-extrabold text-[var(--axia-gold)]">
                              محددة لإجراء جماعي
                            </span>
                          )}
                        </div>

                        <h3 className={`mt-2 text-sm font-semibold ${
                          isCompleted ? "line-through text-[var(--text-muted)]" : "text-[var(--text)]"
                        }`}>
                          {task.title}
                        </h3>

                        <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                          <span>الجهة: <strong className="text-[var(--text)]">{task.courtOrBailiffOffice}</strong></span>
                          <span>المسؤول: <strong className="text-[var(--text)]">{task.assignedTo}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                        isDueWithinOneHour
                          ? "bg-red-600 text-white shadow-sm"
                          : isCritical 
                          ? "bg-red-500/20 text-red-300 border border-red-500/30" 
                          : deadlineInfo.isWithin24Hours && !isCompleted
                          ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                          : "bg-[var(--accent-hover)] text-[var(--text-muted)]"
                      }`}>
                        <Clock className="size-3.5" />
                        <span>{deadlineInfo.remainingText}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isDueWithinOneHour && (
                          <button
                            type="button"
                            onClick={() => {
                              sendTaskDeadlineBrowserNotification({
                                task,
                                diffHours: deadlineInfo.diffHours,
                                force: true,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-600/10 px-2 py-0.5 text-[10px] font-bold text-red-400 hover:bg-red-600/20 transition"
                            title="إرسال تنبيه مكتبي فوري لهذه المهمة"
                          >
                            <BellRing className="size-3" />
                            <span>إشعار مكتبي</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                        >
                          {isCompleted ? "إلغاء الإكمال" : "تحديد كمكتمل"}
                        </button>
                        {deletionEnabled && (
                          <button
                            type="button"
                            onClick={() => handleRequestSingleDelete(task.id)}
                            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition"
                            title="حذف هذه المهمة الإجرائية"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* New Task Modal */}
      <TaskCreationModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onCreateTask={async (newTask) => {
          if (propCreateTask) {
            return propCreateTask(newTask);
          }

          return false;
        }}
        matterOptions={taskMatterOptions}
        assigneeLabel={taskAssigneeLabel}
      />
      {/* Legal PDF Report Modal */}
      <LegalPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        defaultReportType="tasks"
        matters={reportMatters}
        tasks={tasks}
      />

      {/* Voice Command & Dictation Assistant Modal */}
      <VoiceCommandModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onNavigate={(tab) => {
          if (onNavigate) {
            onNavigate(tab);
          }
        }}
        onCreateTask={handleVoiceTaskCreated}
      />

      {/* Bulk & Single Delete Confirmation Modal */}
      {deletionEnabled && isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="relative w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl border-t sm:border border-red-500/40 bg-[var(--panel)] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <div className="grid size-11 place-items-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                <Trash2 className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">تأكيد حذف المهام الإجرائية</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {taskIdsToDelete.length === 1
                    ? "هل أنت متأكد من رغبتك في حذف هذه المهمة نهائياً؟"
                    : `هل أنت متأكد من حذف ${taskIdsToDelete.length} مهام محددة دفعة واحدة؟`}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--bg)] p-3 border border-[var(--border)] max-h-48 overflow-y-auto space-y-2 text-xs">
              <span className="block text-[11px] font-semibold text-[var(--text-muted)]">
                المهام المحددة للحذف ({taskIdsToDelete.length}):
              </span>
              {tasks
                .filter((t) => taskIdsToDelete.includes(t.id))
                .map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-[var(--accent)] p-2.5 border border-[var(--border)]"
                  >
                    <span className="truncate font-medium text-[var(--text)]">{t.title}</span>
                    <span className="shrink-0 rounded bg-[var(--panel)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                      {t.category}
                    </span>
                  </div>
                ))}
            </div>

            <p className="text-[11px] text-red-400/90 leading-relaxed font-medium bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
              ⚠️ تنبيه قانوني: سيتم حذف المهام ومواعيدها بشكل نهائي من سجل قلم المحضرين وجدول مواعيد الطعون.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setTaskIdsToDelete([]);
                }}
                className="rounded-xl bg-[var(--accent-hover)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-white/15 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition"
              >
                تأكيد الحذف نهائياً ({taskIdsToDelete.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
