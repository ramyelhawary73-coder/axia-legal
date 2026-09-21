"use client";

import {
  AlertTriangle,
  Briefcase,
  ChevronLeft,
  FileText,
  Gavel,
  Scale,
  Users,
} from "lucide-react";
import type {
  Client,
  Hearing,
  LegalDocument,
  LegalTask,
  Matter,
  NavigationTab,
} from "@/types/legal";

interface OverviewViewProps {
  matters: Matter[];
  hearings: Hearing[];
  tasks: LegalTask[];
  clients: Client[];
  documents: LegalDocument[];
  onNavigate: (tab: NavigationTab) => void;
  onOpenMatter: (matterId: string) => void;
}

export function OverviewView({
  matters,
  hearings,
  tasks,
  clients,
  documents,
  onNavigate,
  onOpenMatter,
}: OverviewViewProps) {
  const today = new Date().toISOString().slice(0, 10);
  const todayHearings = hearings.filter(
    (hearing) =>
      hearing.hearingDate === today &&
      !hearing.isArchived &&
      hearing.status !== "منتهية",
  );
  const criticalTasks = tasks.filter(
    (task) =>
      task.status !== "مكتملة" &&
      (task.priority.includes("حرجة") || task.priority === "عاجلة"),
  );
  const openMatters = matters.filter((matter) => matter.status !== "مغلقة");

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            نظرة عامة
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Scale className="size-3.5" />
            مؤشرات مباشرة من بيانات AXIA Legal المحفوظة
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          {
            label: "القضايا المفتوحة",
            value: openMatters.length,
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
            label: "المهام العاجلة",
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
          {
            label: "المستندات",
            value: documents.length,
            icon: FileText,
            tab: "documents" as NavigationTab,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
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
                <Icon className="size-4 text-[var(--text-muted)]" />
              </div>
              <div className="mt-2 text-2xl font-bold">{item.value}</div>
            </button>
          );
        })}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/50 px-4 py-3">
              <h2 className="text-sm font-semibold">أحدث القضايا المحفوظة</h2>
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
                  <tr className="border-b border-[var(--border)] bg-[var(--bg)]/30 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="px-4 py-2 font-medium">القضية</th>
                    <th className="px-4 py-2 font-medium">الموكل</th>
                    <th className="px-4 py-2 font-medium">المحكمة / الدائرة</th>
                    <th className="px-4 py-2 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {matters.slice(0, 6).map((matter) => (
                    <tr
                      key={matter.id}
                      onClick={() => onOpenMatter(matter.id)}
                      className="cursor-pointer hover:bg-[var(--accent)]"
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-semibold">{matter.caseNumber}</div>
                        <div className="max-w-[220px] truncate text-[10px] text-[var(--text-muted)]">
                          {matter.title}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">{matter.clientName}</td>
                      <td className="px-4 py-2.5 text-[var(--text-muted)]">
                        {matter.court} — {matter.circuit}
                      </td>
                      <td className="px-4 py-2.5">{matter.status || "مفتوحة"}</td>
                    </tr>
                  ))}
                  {matters.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-xs text-[var(--text-muted)]"
                      >
                        لا توجد قضايا حقيقية محفوظة بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-sm font-semibold">جلسات اليوم</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {todayHearings.slice(0, 5).map((hearing) => (
                <div key={hearing.id} className="p-3 text-xs">
                  <div className="font-semibold">{hearing.caseNumber}</div>
                  <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {hearing.court} — {hearing.hearingTime}
                  </div>
                </div>
              ))}
              {todayHearings.length === 0 && (
                <div className="p-5 text-center text-xs text-[var(--text-muted)]">
                  لا توجد جلسات مسجلة لليوم.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-sm font-semibold">مهام عاجلة</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {criticalTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-3 text-xs">
                  <div className="font-semibold">{task.title}</div>
                  <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {task.matterCaseNumber || "بدون قضية"} — {task.deadline}
                  </div>
                </div>
              ))}
              {criticalTasks.length === 0 && (
                <div className="p-5 text-center text-xs text-[var(--text-muted)]">
                  لا توجد مهام عاجلة محفوظة.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
