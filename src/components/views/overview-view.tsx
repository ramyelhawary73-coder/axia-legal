"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Scale,
  Gavel,
  Calendar,
  AlertTriangle,
  Briefcase,
  Users,
  Clock,
  ArrowUpRight,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import type { Client, Hearing, LegalTask, Matter, NavigationTab } from "@/types/legal";
import { loadPersistentClients } from "@/lib/clients-client";
import { loadMattersWorkspace } from "@/lib/matters-client";
import {
  loadPersistentHearings,
  updatePersistentHearing,
} from "@/lib/hearings-client";
import { loadTaskWorkspace } from "@/lib/tasks-client";

interface OverviewViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenMatter: (matterId: string) => void;
}

export function OverviewView({ onNavigate, onOpenMatter }: OverviewViewProps) {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [tasks, setTasks] = useState<LegalTask[]>([]);
  const [quickDecisionInput, setQuickDecisionInput] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      loadPersistentClients(),
      loadMattersWorkspace(),
      loadTaskWorkspace(),
    ])
      .then(async ([loadedClients, matterWorkspace, taskWorkspace]) => {
        if (cancelled) return;
        setClients(loadedClients);
        setMatters(matterWorkspace.matters);
        setTasks(taskWorkspace.tasks);

        const loadedHearings = await loadPersistentHearings(
          matterWorkspace.matters,
        );
        if (cancelled) return;
        setHearings(loadedHearings);
        setSyncError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSyncError(
          error instanceof Error
            ? error.message
            : "تعذر تحميل لوحة النظرة العامة.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayHearings = useMemo(
    () =>
      hearings.filter(
        (hearing) =>
          hearing.hearingDate === today &&
          hearing.status !== "منتهية" &&
          !hearing.isArchived,
      ),
    [hearings, today],
  );

  const criticalTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status !== "مكتملة" &&
          (task.priority.includes("حرجة") || task.priority === "عاجلة"),
      ),
    [tasks],
  );

  const handleSaveDecision = async (hearingId: string) => {
    const decision = quickDecisionInput[hearingId]?.trim();
    if (!decision) return;

    try {
      const updated = await updatePersistentHearing(
        hearingId,
        {
          lastDecision: decision,
          status: "completed",
          isArchived: true,
        },
        matters,
      );
      setHearings((current) =>
        current.map((hearing) =>
          hearing.id === hearingId ? updated : hearing,
        ),
      );
      setQuickDecisionInput((current) => ({ ...current, [hearingId]: "" }));
      setSyncError(null);
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر حفظ قرار الجلسة.",
      );
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">نظرة عامة</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Scale className="size-3.5" />
            بيانات حية من AXIA Legal Development
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("matters")}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-medium"
          >
            <Briefcase className="size-3.5" />
            سجل القضايا
          </button>
          <button
            onClick={() => onNavigate("hearings")}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-xs font-medium text-[var(--bg)]"
          >
            <Gavel className="size-3.5" />
            جلسات اليوم ({todayHearings.length})
          </button>
        </div>
      </div>

      {syncError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
          {syncError}
        </div>
      )}
      {isLoading && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-xs text-[var(--text-muted)]">
          جارٍ تحميل البيانات الحقيقية...
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "القضايا والملفات",
            value: matters.length,
            icon: Briefcase,
            tab: "matters" as NavigationTab,
          },
          {
            label: "جلسات اليوم",
            value: todayHearings.length,
            icon: Gavel,
            tab: "hearings" as NavigationTab,
          },
          {
            label: "المهام الحرجة والعاجلة",
            value: criticalTasks.length,
            icon: AlertTriangle,
            tab: "tasks" as NavigationTab,
          },
          {
            label: "الموكلون",
            value: clients.length,
            icon: Users,
            tab: "clients" as NavigationTab,
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigate(item.tab)}
            className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-right shadow-sm transition hover:border-[var(--border-strong)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {item.label}
              </span>
              <item.icon className="size-4 text-[var(--text-muted)]" />
            </div>
            <div className="mt-2 text-2xl font-bold">{item.value}</div>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/50 px-4 py-3">
              <h2 className="text-sm font-semibold">
                أحدث القضايا والملفات الحقيقية
              </h2>
              <button
                onClick={() => onNavigate("matters")}
                className="flex items-center text-[11px] text-[var(--text-muted)]"
              >
                عرض السجل
                <ChevronLeft className="mr-1 size-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                    <th className="px-4 py-2">القضية</th>
                    <th className="px-4 py-2">المحكمة / الدائرة</th>
                    <th className="px-4 py-2">الموكل</th>
                    <th className="px-4 py-2">المرحلة</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {matters.slice(0, 5).map((matter) => (
                    <tr key={matter.id} className="hover:bg-[var(--accent)]">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold">{matter.caseNumber}</div>
                        <div className="max-w-[180px] truncate text-[10px] text-[var(--text-muted)]">
                          {matter.title}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {matter.court}
                        <div className="text-[10px] text-[var(--text-muted)]">
                          {matter.circuit}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">{matter.clientName}</td>
                      <td className="px-4 py-2.5">{matter.stage}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => onOpenMatter(matter.id)}>
                          <ArrowUpRight className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && matters.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-xs text-[var(--text-muted)]"
                      >
                        لا توجد قضايا حقيقية محفوظة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
              <Calendar className="size-4 text-[var(--gold)]" />
              <h2 className="text-sm font-semibold">جلسات اليوم</h2>
            </div>
            <div className="space-y-3 p-4">
              {todayHearings.map((hearing) => (
                <div
                  key={hearing.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-[var(--gold)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--bg)]">
                        اليوم
                      </span>
                      <span className="text-[11px] font-semibold">
                        {hearing.caseNumber}
                      </span>
                    </div>
                    <div className="text-xs">
                      {hearing.court} — {hearing.circuit}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      المطلوب: {hearing.purpose}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="قرار الجلسة..."
                      value={quickDecisionInput[hearing.id] || ""}
                      onChange={(event) =>
                        setQuickDecisionInput((current) => ({
                          ...current,
                          [hearing.id]: event.target.value,
                        }))
                      }
                      className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-[11px]"
                    />
                    <button
                      onClick={() => void handleSaveDecision(hearing.id)}
                      className="rounded bg-[var(--text)] px-2 py-1 text-[10px] font-medium text-[var(--bg)]"
                    >
                      حفظ
                    </button>
                    <button onClick={() => onOpenMatter(hearing.matterId)}>
                      <ArrowUpRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {!isLoading && todayHearings.length === 0 && (
                <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                  لا توجد جلسات محفوظة لليوم.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-red-500/20 bg-[var(--panel)] shadow-sm">
            <div className="flex items-center gap-2 border-b border-[var(--border)] bg-red-500/5 px-4 py-3 text-red-400">
              <AlertTriangle className="size-4" />
              <h3 className="text-sm font-semibold">المهام الحرجة والعاجلة</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {criticalTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="p-3.5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
                      {task.priority}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <Clock className="size-2.5" />
                      {task.deadline}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium">{task.title}</p>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {task.courtOrBailiffOffice}
                  </p>
                </div>
              ))}
              {!isLoading && criticalTasks.length === 0 && (
                <div className="p-5 text-center text-xs text-[var(--text-muted)]">
                  لا توجد مهام حرجة أو عاجلة.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate("rajih")}
            className="w-full rounded-xl border border-[var(--gold)]/30 bg-[var(--panel)] p-4 text-right shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-[var(--gold)]" />
              <h3 className="text-sm font-semibold">مساعد راجح الذكي</h3>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
              افتح راجح لتحليل الملفات القانونية والعمل على بيانات القضايا
              المصرح بها.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
