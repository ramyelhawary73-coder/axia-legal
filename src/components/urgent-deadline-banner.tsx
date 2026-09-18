"use client";

import { useState } from "react";
import { AlertOctagon, Clock, ArrowLeft, X, Check } from "lucide-react";
import { NavigationTab } from "@/types/legal";
import { TaskDeadlineAnalysis } from "@/lib/task-utils";

interface UrgentDeadlineBannerProps {
  urgentTasks: TaskDeadlineAnalysis[];
  onNavigate: (tab: NavigationTab) => void;
  onToggleTaskStatus?: (taskId: string) => void;
}

export function UrgentDeadlineBanner({
  urgentTasks,
  onNavigate,
  onToggleTaskStatus,
}: UrgentDeadlineBannerProps) {
  const [dismissedTaskIds, setDismissedTaskIds] = useState<Set<string>>(new Set());

  // Filter out any dismissed tasks
  const visibleTasks = urgentTasks.filter(
    (item) => !dismissedTaskIds.has(item.task.id) && item.task.status !== "مكتملة"
  );

  if (visibleTasks.length === 0) return null;

  const current = visibleTasks[0]; // Show the most urgent
  const remainingMinutes = Math.max(1, Math.round(current.diffHours * 60));
  const otherCount = visibleTasks.length - 1;

  const handleDismiss = (taskId: string) => {
    setDismissedTaskIds((prev) => new Set(prev).add(taskId));
  };

  return (
    <div
      id="urgent-deadline-toast-banner"
      role="alert"
      aria-live="assertive"
      className="relative z-30 mb-3 overflow-hidden rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-red-900/30 to-amber-950/30 p-3 shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Urgent Info */}
        <div className="flex items-start gap-2.5">
          <div className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-600/20 text-red-500 ring-1 ring-red-500/40">
            <AlertOctagon className="size-4.5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-red-600" />
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                إنذار ميعاد حرج
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
                <Clock className="size-3" />
                <span>ينقضي خلال {remainingMinutes} دقيقة فقط!</span>
              </span>
              {otherCount > 0 && (
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  (+{otherCount} مهام أخرى وشيكة)
                </span>
              )}
            </div>

            <h3 className="text-xs font-bold text-[var(--text)] line-clamp-1 mt-0.5">
              {current.task.title}
            </h3>

            <p className="text-[11px] text-[var(--text-muted)]">
              {current.task.matterCaseNumber ? `دعوى: ${current.task.matterCaseNumber} · ` : ""}
              {current.task.courtOrBailiffOffice} · المسؤول: {current.task.assignedTo}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {onToggleTaskStatus && (
            <button
              type="button"
              onClick={() => onToggleTaskStatus(current.task.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              title="تحديد كمكتملة الآن"
            >
              <Check className="size-3.5" />
              <span className="hidden xs:inline">إتمام فوري</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate("tasks")}
            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-500 transition-colors"
          >
            <span>فتح قلم المحضرين</span>
            <ArrowLeft className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleDismiss(current.task.id)}
            className="grid size-7 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            title="إخفاء التنبيه مؤقتاً"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
