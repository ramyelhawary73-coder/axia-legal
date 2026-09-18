"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  ArrowLeft, 
  X, 
  Scale, 
  Building2, 
  User 
} from "lucide-react";
import { LegalTask, NavigationTab } from "@/types/legal";
import { getUpcomingDeadlineTasks } from "@/lib/task-utils";

interface NotificationsPopoverProps {
  tasks: LegalTask[];
  onToggleTaskStatus?: (taskId: string) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export function NotificationsPopover({
  tasks,
  onToggleTaskStatus,
  onNavigate,
}: NotificationsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [completedNotificationId, setCompletedNotificationId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Compute tasks due within next 24 hours
  const upcomingDeadlines = useMemo(() => {
    return getUpcomingDeadlineTasks(tasks);
  }, [tasks]);

  const hasCritical = upcomingDeadlines.some(
    (item) => item.task.priority.includes("حرجة") || item.isOverdue
  );

  const handleTaskClick = () => {
    setIsOpen(false);
    onNavigate("tasks");
  };

  const handleQuickComplete = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setCompletedNotificationId(taskId);
    if (onToggleTaskStatus) {
      onToggleTaskStatus(taskId);
    }
    setTimeout(() => {
      setCompletedNotificationId(null);
    }, 1500);
  };

  return (
    <div className="relative" ref={containerRef} id="notifications-menu-container">
      {/* Trigger Button */}
      <button
        type="button"
        id="notifications-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="تنبيهات المواعيد النهائية"
        aria-expanded={isOpen}
        className={`relative grid size-8 place-items-center rounded-lg border transition-all ${
          isOpen
            ? "border-[var(--axia-gold)] bg-[var(--accent-hover)] text-[var(--axia-gold)] shadow-sm"
            : "border-[var(--border)] bg-[var(--panel)]/60 text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
        }`}
        title={
          upcomingDeadlines.length > 0
            ? `${upcomingDeadlines.length} مهام تقترب مواعيدها خلال ٢٤ ساعة`
            : "التنبيهات"
        }
      >
        <Bell className="size-4" />

        {upcomingDeadlines.length > 0 && (
          <>
            {/* Pulsing indicator for critical items */}
            {hasCritical && (
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-rose-600" />
              </span>
            )}
            
            {/* Count Badge */}
            <span
              id="notifications-count-badge"
              className="absolute -top-1.5 -right-1.5 flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--bg)]"
            >
              {upcomingDeadlines.length}
            </span>
          </>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          id="notifications-popover-panel"
          className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--border-strong)] bg-[var(--panel)] p-0 shadow-2xl z-50 text-xs overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--accent)]/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text)] text-sm leading-tight">
                  تنبيهات المواعيد النهائية
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  المهام والمواعيد الإجرائية خلال الـ 24 ساعة القادمة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {upcomingDeadlines.length > 0 && (
                <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                  {upcomingDeadlines.length} عاجل
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-6 place-items-center rounded-md text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
                title="إغلاق"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Body: List of 24h Deadline Tasks */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border)] custom-scrollbar">
            {upcomingDeadlines.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="grid size-12 place-items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-3">
                  <CheckCircle2 className="size-6" />
                </div>
                <h4 className="text-xs font-bold text-[var(--text)]">
                  لا توجد مهام تقترب مواعيدها خلال الـ 24 ساعة القادمة
                </h4>
                <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-[240px]">
                  جميع مواعيد سقوط الطعون وإعلانات قلم المحضرين مسددة ومنتظمة في موعدها.
                </p>
              </div>
            ) : (
              upcomingDeadlines.map(({ task, remainingText, badgeColorClass }) => {
                const isJustCompleted = completedNotificationId === task.id;

                return (
                  <div
                    key={task.id}
                    id={`notification-task-${task.id}`}
                    onClick={handleTaskClick}
                    className="group relative cursor-pointer p-3.5 transition-colors hover:bg-[var(--accent-hover)] text-right"
                  >
                    {/* Top Row: Category + Remaining Time Pill */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                          {task.category}
                        </span>
                        {task.priority.includes("حرجة") && (
                          <span className="rounded-md bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-500">
                            ميعاد سقوط
                          </span>
                        )}
                      </div>

                      {/* Remaining hours badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeColorClass}`}
                      >
                        <Clock className="size-3" />
                        <span>{remainingText}</span>
                      </span>
                    </div>

                    {/* Task Title */}
                    <h4 className="font-semibold text-xs text-[var(--text)] group-hover:text-[var(--axia-gold)] transition-colors line-clamp-2 leading-relaxed">
                      {task.title}
                    </h4>

                    {/* Meta Details: Case Number & Court/Office */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
                      {task.matterCaseNumber && (
                        <div className="flex items-center gap-1">
                          <Scale className="size-3 text-[var(--axia-gold)]" />
                          <span className="font-mono text-[10px]">{task.matterCaseNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Building2 className="size-3" />
                        <span className="truncate max-w-[140px]">{task.courtOrBailiffOffice}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="size-3" />
                        <span>{task.assignedTo.split(" ")[0]} {task.assignedTo.split(" ")[1] || ""}</span>
                      </div>
                    </div>

                    {/* Quick Complete Button */}
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[var(--border)]">
                      <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
                        انقر للتفاصيل والتنفيذ &larr;
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleQuickComplete(e, task.id)}
                        disabled={isJustCompleted}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
                          isJustCompleted
                            ? "bg-emerald-500 text-white"
                            : "border border-[var(--border)] bg-[var(--panel)] text-[var(--text-muted)] hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-500"
                        }`}
                        title="تحديد كمكتملة الآن"
                      >
                        <Check className="size-3" />
                        <span>{isJustCompleted ? "تم الإنجاز" : "إتمام المهمة"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border)] bg-[var(--accent)]/40 p-2.5">
            <button
              type="button"
              id="notifications-view-all-tasks-button"
              onClick={handleTaskClick}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] py-2 text-xs font-semibold text-[var(--text)] shadow-sm hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] transition-colors"
            >
              <span>فتح جدول المواعيد وقلم المحضرين بالكامل</span>
              <ArrowLeft className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
