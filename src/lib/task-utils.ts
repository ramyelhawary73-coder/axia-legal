import { LegalTask } from "@/types/legal";

export interface TaskDeadlineAnalysis {
  task: LegalTask;
  isWithin24Hours: boolean;
  isOverdue: boolean;
  diffHours: number;
  remainingText: string;
  badgeColorClass: string;
}

/**
 * Parses a task's deadline string (ISO or YYYY-MM-DD) into a Date object.
 * If only a date is given (YYYY-MM-DD), defaults to 17:00 (5:00 PM) on that day.
 */
export function parseTaskDeadline(deadlineStr: string): Date {
  if (!deadlineStr) return new Date();
  
  if (deadlineStr.includes("T")) {
    const parsed = new Date(deadlineStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  
  // Format YYYY-MM-DD
  const parts = deadlineStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date();
    date.setFullYear(year, month, day);
    date.setHours(17, 0, 0, 0); // End of court business hours (5:00 PM)
    return date;
  }

  const fallback = new Date(deadlineStr);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

/**
 * Formats time remaining in natural Arabic phrasing
 */
export function formatArabicRemaining(diffHours: number): { text: string; isOverdue: boolean } {
  if (diffHours < 0) {
    const pastHours = Math.abs(diffHours);
    if (pastHours < 1) {
      return { text: "انتهى الميعاد منذ قليل", isOverdue: true };
    }
    if (pastHours < 24) {
      const h = Math.round(pastHours);
      return { text: `انقضى الميعاد منذ ${h} ${h === 1 ? "ساعة" : h === 2 ? "ساعتين" : h <= 10 ? "ساعات" : "ساعة"}`, isOverdue: true };
    }
    return { text: "ميعاد منقضٍ (متأخرة)", isOverdue: true };
  }

  if (diffHours < 1) {
    const minutes = Math.max(1, Math.round(diffHours * 60));
    return { text: `متبقي ${minutes} دقيقة فقط!`, isOverdue: false };
  }

  if (diffHours <= 24) {
    const h = Math.round(diffHours);
    if (h === 1) return { text: "متبقي ساعة واحدة", isOverdue: false };
    if (h === 2) return { text: "متبقي ساعتان", isOverdue: false };
    if (h <= 10) return { text: `متبقي ${h} ساعات`, isOverdue: false };
    return { text: `متبقي ${h} ساعة`, isOverdue: false };
  }

  const days = Math.round(diffHours / 24);
  if (days === 1) return { text: "متبقي يوم واحد", isOverdue: false };
  if (days === 2) return { text: "متبقي يومان", isOverdue: false };
  return { text: `متبقي ${days} أيام`, isOverdue: false };
}

/**
 * Evaluates whether a task is approaching its deadline within the next 24 hours
 */
export function analyzeTaskDeadline(task: LegalTask, referenceTime = new Date()): TaskDeadlineAnalysis {
  const deadlineDate = parseTaskDeadline(task.deadline);
  const diffMs = deadlineDate.getTime() - referenceTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // A pending task is within 24 hours if remaining hours is between 0 and 24,
  // or if it became overdue today within the past 12 hours (critical attention needed).
  const isPending = task.status !== "مكتملة";
  const isWithin24Hours = isPending && diffHours >= -12 && diffHours <= 24;
  const isOverdue = isPending && diffHours < 0;

  const { text } = formatArabicRemaining(diffHours);

  let badgeColorClass = "border-amber-500/30 bg-amber-500/10 text-amber-500";
  if (isOverdue || task.priority.includes("حرجة")) {
    badgeColorClass = "border-red-500/30 bg-red-500/10 text-red-500";
  } else if (diffHours <= 6) {
    badgeColorClass = "border-rose-500/30 bg-rose-500/10 text-rose-500";
  }

  return {
    task,
    isWithin24Hours,
    isOverdue,
    diffHours,
    remainingText: text,
    badgeColorClass,
  };
}

/**
 * Filter and sort all tasks whose deadline is within the next 24 hours
 */
export function getUpcomingDeadlineTasks(tasks: LegalTask[], referenceTime = new Date()): TaskDeadlineAnalysis[] {
  return tasks
    .map((task) => analyzeTaskDeadline(task, referenceTime))
    .filter((analysis) => analysis.isWithin24Hours)
    .sort((a, b) => a.diffHours - b.diffHours);
}
