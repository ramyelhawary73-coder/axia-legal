"use client";

import { useState } from "react";
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
  ChevronLeft
} from "lucide-react";
import { mockMatters, mockHearings, mockTasks, mockClients } from "@/lib/mock-legal-data";
import { NavigationTab } from "@/types/legal";

interface OverviewViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenMatter: (matterId: string) => void;
}

export function OverviewView({ onNavigate, onOpenMatter }: OverviewViewProps) {
  const [quickDecisionInput, setQuickDecisionInput] = useState<{ [id: string]: string }>({});

  const handleSaveDecision = (hearingId: string) => {
    if (quickDecisionInput[hearingId]) {
      setQuickDecisionInput((prev) => ({ ...prev, [hearingId]: "" }));
    }
  };

  const todayHearings = mockHearings.filter((h) => h.status === "اليوم");
  const criticalTasks = mockTasks.filter((t) => t.priority.includes("حرجة") || t.priority === "عاجلة");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header (Apple style: Large clean typography, no big colorful cards for titles) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            نظرة عامة
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Scale className="size-3.5" />
            نظام إدارة الممارسة القانونية (AXIA Legal ERP)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("matters")}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-medium text-[var(--text)] shadow-sm hover:bg-[var(--accent)] transition-colors"
          >
            <Briefcase className="size-3.5 text-[var(--text-muted)]" />
            <span>سجل القضايا</span>
          </button>
          <button
            onClick={() => onNavigate("hearings")}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] shadow-sm hover:opacity-90 transition-opacity"
          >
            <Gavel className="size-3.5" />
            <span>جلسات اليوم ({todayHearings.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Section - High density, minimal cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate("matters")}
          className="group cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm hover:border-[var(--border-strong)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">القضايا والملفات</span>
            <Briefcase className="size-4 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{mockMatters.length}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center">
              <ArrowUpRight className="size-3 mr-0.5" /> نشطة
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate("hearings")}
          className="group cursor-pointer rounded-xl border border-[var(--gold)]/30 bg-[var(--gold-dim)] p-4 shadow-sm hover:border-[var(--gold)]/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--gold)] uppercase tracking-wider">جلسات اليوم</span>
            <Gavel className="size-4 text-[var(--gold)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[var(--gold)]">{todayHearings.length}</span>
            <span className="text-[10px] bg-[var(--gold)]/20 text-[var(--gold)] font-medium px-1.5 py-0.5 rounded">
              رول #{todayHearings[0]?.rollNumber || "N/A"}
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate("tasks")}
          className="group cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm hover:border-red-500/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">مواعيد السقوط</span>
            <AlertTriangle className="size-4 text-[var(--text-muted)] group-hover:text-red-500 transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{criticalTasks.length}</span>
            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium bg-red-500/10 px-1.5 py-0.5 rounded">
              حتمية
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate("clients")}
          className="group cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm hover:border-[var(--border-strong)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">الموكلين والشركات</span>
            <Users className="size-4 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{mockClients.length}</span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium bg-[var(--accent)] px-1.5 py-0.5 rounded">
              توكيلات سارية
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout for detailed views */}
      <div className="grid gap-6 xl:grid-cols-3 items-start">
        
        {/* Left Column (2/3 width on xl): Matters Table */}
        <div className="xl:col-span-2 space-y-6">
          
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 bg-[var(--bg)]/50">
              <h2 className="text-sm font-semibold text-[var(--text)]">أحدث القضايا والملفات المنظورة</h2>
              <button
                onClick={() => onNavigate("matters")}
                className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] flex items-center"
              >
                عرض السجل الكامل
                <ChevronLeft className="size-3 mr-1" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg)]/30 text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-2 font-medium">القضية</th>
                    <th className="px-4 py-2 font-medium">الدائرة</th>
                    <th className="px-4 py-2 font-medium">الموكل</th>
                    <th className="px-4 py-2 font-medium">الحالة</th>
                    <th className="px-4 py-2 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {mockMatters.slice(0, 5).map((matter) => (
                    <tr key={matter.id} className="hover:bg-[var(--accent)] transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-[var(--text)]">{matter.caseNumber}</div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">{matter.title}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-[var(--text)]">{matter.court}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{matter.circuit}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-[var(--text)]">{matter.clientName}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{matter.clientRole}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          matter.stage === "حجز للحكم" 
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                            : matter.stage === "متداولة"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}>
                          {matter.stage}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-left">
                        <button
                          onClick={() => onOpenMatter(matter.id)}
                          className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ArrowUpRight className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Urgent Court Session Tracker */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 bg-[var(--bg)]/50">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-[var(--gold)]" />
                <h2 className="text-sm font-semibold text-[var(--text)]">أجندة الجلسات الفورية</h2>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {mockHearings.map((hearing) => {
                const isToday = hearing.status === "اليوم";
                return (
                  <div
                    key={hearing.id}
                    className={`rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isToday
                        ? "border-[var(--gold)]/30 bg-[var(--gold)]/5"
                        : "border-[var(--border)] bg-[var(--bg)]/30"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isToday ? "bg-[var(--gold)] text-[var(--bg)]" : "bg-[var(--accent)] text-[var(--text-muted)]"
                        }`}>
                          {isToday ? "اليوم" : hearing.hearingDate}
                        </span>
                        <span className="text-[11px] font-semibold text-[var(--text)]">
                          {hearing.caseNumber}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] border-r border-[var(--border)] pr-2 mr-2">
                          رول #{hearing.rollNumber}
                        </span>
                      </div>
                      <h3 className="text-xs font-medium text-[var(--text)]">
                        {hearing.court} — {hearing.circuit}
                      </h3>
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                        المطلوب: {hearing.purpose} | المحامي: {hearing.attendingLawyer}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative flex-1 sm:w-48">
                         <input
                          type="text"
                          placeholder="قرار الجلسة..."
                          value={quickDecisionInput[hearing.id] || ""}
                          onChange={(e) =>
                            setQuickDecisionInput({
                              ...quickDecisionInput,
                              [hearing.id]: e.target.value,
                            })
                          }
                          className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-[11px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveDecision(hearing.id)}
                        className="rounded bg-[var(--text)] px-2 py-1 text-[10px] font-medium text-[var(--bg)] hover:opacity-90"
                      >
                        حفظ
                      </button>
                      <button
                        onClick={() => onOpenMatter(hearing.matterId)}
                        className="p-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]"
                      >
                         <ArrowUpRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width on xl): Deadlines & AI */}
        <div className="space-y-6">
          
          {/* Critical Deadlines */}
          <div className="rounded-xl border border-red-500/20 bg-[var(--panel)] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 bg-red-500/5">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="size-4" />
                <h3 className="text-sm font-semibold">مواعيد السقوط الإجرائية</h3>
              </div>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {mockTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="p-3.5 hover:bg-[var(--accent)] transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      {task.priority}
                    </span>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="size-2.5" />
                      قبل {task.deadline}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-[var(--text)] leading-relaxed">
                    {task.title}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {task.courtOrBailiffOffice}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-[var(--border)] bg-[var(--bg)]/30 text-center">
              <button 
                onClick={() => onNavigate("tasks")}
                className="text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                عرض كافة المهام
              </button>
            </div>
          </div>

          {/* RAJIH AI Assistant Quick Query Card */}
          <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--panel)] shadow-sm overflow-hidden relative group">
            {/* Subtle glow effect behind */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/5 to-transparent opacity-50 pointer-events-none" />
            
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-[var(--gold)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">مساعد راجح الذكي</h3>
                <span className="ml-auto rounded-full bg-[var(--text)] px-1.5 py-0.5 text-[8px] font-bold text-[var(--bg)] tracking-widest uppercase">RAJIH AI</span>
              </div>
              
              <p className="text-[11px] leading-relaxed text-[var(--text-muted)] mb-4">
                المستشار القانوني الرقمي لأحكام النقض والدفوع وصياغة المذكرات بقوة الذكاء الاصطناعي.
              </p>

              <div className="space-y-1.5">
                <button
                  onClick={() => onNavigate("rajih")}
                  className="w-full text-right rounded-md border border-[var(--border)] bg-[var(--bg)]/50 p-2 text-[10px] text-[var(--text-muted)] hover:border-[var(--gold)]/40 hover:text-[var(--text)] transition-all flex items-center justify-between"
                >
                  <span className="truncate pr-2">البحث في أحكام النقض الحديثة</span>
                  <ChevronLeft className="size-3 shrink-0" />
                </button>
                <button
                  onClick={() => onNavigate("rajih")}
                  className="w-full text-right rounded-md border border-[var(--border)] bg-[var(--bg)]/50 p-2 text-[10px] text-[var(--text-muted)] hover:border-[var(--gold)]/40 hover:text-[var(--text)] transition-all flex items-center justify-between"
                >
                  <span className="truncate pr-2">صياغة مذكرة دفاع في بطلان إعلان</span>
                  <ChevronLeft className="size-3 shrink-0" />
                </button>
              </div>

              <button
                onClick={() => onNavigate("rajih")}
                className="mt-4 w-full rounded-md bg-[var(--gold)]/10 border border-[var(--gold)]/30 py-2 text-center text-[11px] font-semibold text-[var(--gold)] transition-colors hover:bg-[var(--gold)]/20"
              >
                فتح غرفة الأبحاث
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
