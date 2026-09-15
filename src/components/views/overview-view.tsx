"use client";

import { useState } from "react";
import { 
  Scale, 
  Gavel, 
  Calendar, 
  AlertTriangle, 
  Briefcase, 
  Users, 
  FileText, 
  Clock, 
  ArrowUpRight, 
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Building2,
  DollarSign
} from "lucide-react";
import { mockMatters, mockHearings, mockTasks, mockClients } from "@/lib/mock-legal-data";
import { NavigationTab } from "@/types/legal";

interface OverviewViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenMatter: (matterId: string) => void;
}

export function OverviewView({ onNavigate, onOpenMatter }: OverviewViewProps) {
  const [quickDecisionInput, setQuickDecisionInput] = useState<{ [id: string]: string }>({});
  const [savedDecisions, setSavedDecisions] = useState<{ [id: string]: string }>({});

  const handleSaveDecision = (hearingId: string) => {
    if (quickDecisionInput[hearingId]) {
      setSavedDecisions((prev) => ({
        ...prev,
        [hearingId]: quickDecisionInput[hearingId],
      }));
      setQuickDecisionInput((prev) => ({ ...prev, [hearingId]: "" }));
    }
  };

  const todayHearings = mockHearings.filter((h) => h.status === "اليوم");
  const criticalTasks = mockTasks.filter((t) => t.priority.includes("حرجة") || t.priority === "عاجلة");

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Top Banner: Prestigious Law Firm Status */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--axia-gold-dim)] bg-gradient-to-r from-[#0d1726] via-[#111e33] to-[#0d1726] p-6 lg:p-8 shadow-xl shadow-black/20">
        <div className="absolute top-0 right-0 h-full w-96 bg-[radial-gradient(ellipse_at_top_right,_rgba(197,155,39,0.15),_transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/10 px-3.5 py-1 text-xs font-semibold text-[var(--axia-gold-light)]">
              <Scale className="size-3.5" />
              <span>مكتب الاستشارات القانونية والتحكيم الدولي · المنظومة القضائية الذكية</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              نظام إدارة الممارسة القانونية المصرية (AXIA Legal ERP)
            </h1>
            <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-slate-300">
              متابعة دقيقة لجلسات اليوم برول المحاكم، تنبيهات مواعيد السقوط القضائية، تتبع التوكيلات الرسمية، وأتمتة ملفات القضايا بقوة محرك <strong className="text-[var(--axia-gold-light)] font-semibold">راجح RAJIH AI</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate("hearings")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#a77e16] px-5 py-3 text-sm font-bold text-slate-950 shadow-md shadow-[var(--axia-gold)]/20 transition hover:brightness-110 active:scale-95"
            >
              <Gavel className="size-4" />
              <span>رول جلسات اليوم ({todayHearings.length})</span>
            </button>
            <button
              onClick={() => onNavigate("matters")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Briefcase className="size-4 text-[var(--axia-gold-light)]" />
              <span>سجل القضايا الشامل</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Primary Operational Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div 
          onClick={() => onNavigate("matters")}
          className="group cursor-pointer rounded-2xl border border-white/10 bg-[#0d1726]/80 p-5 backdrop-blur transition hover:border-[var(--axia-gold)]/50 hover:bg-[#111e33]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">القضايا والملفات النشطة</span>
            <div className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-[var(--axia-gold-light)] group-hover:scale-110 transition">
              <Briefcase className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-white">{mockMatters.length}</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <ArrowUpRight className="size-3" />
              ١٠٠٪ قضايا متداولة
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">تشمل النقض، الاستئناف، القضاء الإداري والاقتصادي</p>
        </div>

        <div 
          onClick={() => onNavigate("hearings")}
          className="group cursor-pointer rounded-2xl border border-amber-500/20 bg-[#171c26]/90 p-5 backdrop-blur transition hover:border-amber-400/50 hover:bg-[#1b2230]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-200">جلسات اليوم الحرجة</span>
            <div className="grid size-9 place-items-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300 group-hover:scale-110 transition">
              <Gavel className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-amber-300">١ جلسة</span>
            <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              رول رقم ٧
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-200/70">استئناف الجيزة · دائرة ٩ مدني</p>
        </div>

        <div 
          onClick={() => onNavigate("clients")}
          className="group cursor-pointer rounded-2xl border border-white/10 bg-[#0d1726]/80 p-5 backdrop-blur transition hover:border-[var(--axia-gold)]/50 hover:bg-[#111e33]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">الموكلين والشركات</span>
            <div className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-[var(--axia-gold-light)] group-hover:scale-110 transition">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-white">{mockClients.length}</span>
            <span className="text-xs text-slate-300 font-medium">
              توكيلات سارية ٥/٥
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">شركات مساهمة، مستثمرون، وأفراد</p>
        </div>

        <div 
          onClick={() => onNavigate("tasks")}
          className="group cursor-pointer rounded-2xl border border-red-500/20 bg-[#1a141b]/80 p-5 backdrop-blur transition hover:border-red-400/50 hover:bg-[#221822]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-red-200">مواعيد السقوط وقلم المحضرين</span>
            <div className="grid size-9 place-items-center rounded-xl border border-red-400/30 bg-red-400/10 text-red-300 group-hover:scale-110 transition">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-red-300">{criticalTasks.length}</span>
            <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-300">
              مواعيد حتمية
            </span>
          </div>
          <p className="mt-2 text-xs text-red-200/70">إعلانات محضرين وطعون استئنافية</p>
        </div>
      </div>

      {/* Main Grid: Urgent Hearings Roll & Critical Tasks */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        
        {/* Urgent Court Session Tracker */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1726] p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Calendar className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">رول وأجندة الجلسات الفورية</h2>
                <p className="text-xs text-slate-400">متابعة دقيقة لقرارات الدوائر وتدوين تقرير الجلسة لحظياً</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("hearings")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--axia-gold-light)] hover:underline"
            >
              <span>فتح الأجندة الكاملة</span>
              <ChevronLeft className="size-3.5" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {mockHearings.map((hearing) => {
              const isToday = hearing.status === "اليوم";
              return (
                <div
                  key={hearing.id}
                  className={`relative rounded-xl border p-4.5 transition ${
                    isToday
                      ? "border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-transparent"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${
                          isToday ? "bg-amber-400 text-slate-950" : "bg-white/10 text-slate-200"
                        }`}>
                          {isToday ? "جلسة اليوم" : hearing.hearingDate}
                        </span>
                        <span className="text-xs font-semibold text-[var(--axia-gold-light)]">
                          {hearing.caseNumber}
                        </span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                          رول #{hearing.rollNumber}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-white">
                        {hearing.court} — {hearing.circuit}
                      </h3>
                      <p className="mt-1 text-xs text-slate-300">
                        <strong>المطلوب بالجلسة:</strong> {hearing.purpose}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                        <span>المحامي الحاضر: <strong className="text-slate-200">{hearing.attendingLawyer}</strong></span>
                        <span>القاعة: <strong className="text-slate-200">{hearing.hall}</strong></span>
                      </div>
                    </div>

                    <div className="text-left">
                      <button
                        onClick={() => onOpenMatter(hearing.matterId)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 hover:text-white"
                      >
                        ملف القضية
                      </button>
                    </div>
                  </div>

                  {/* Immediate Decision Note Input */}
                  <div className="mt-3.5 border-t border-white/10 pt-3 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="تسجيل قرار الجلسة فور صدوره (مثال: التأجيل لجلسة ١٠/١٥ للمذكرات)..."
                      value={quickDecisionInput[hearing.id] || ""}
                      onChange={(e) =>
                        setQuickDecisionInput({
                          ...quickDecisionInput,
                          [hearing.id]: e.target.value,
                        })
                      }
                      className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-[var(--axia-gold)] focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveDecision(hearing.id)}
                      className="rounded-lg bg-[var(--axia-gold)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--axia-gold-light)] hover:bg-[var(--axia-gold)]/30"
                    >
                      حفظ القرار
                    </button>
                  </div>

                  {(savedDecisions[hearing.id] || hearing.lastDecision) && (
                    <div className="mt-2 rounded bg-black/20 p-2 text-[11px] text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span>آخر قرار مسجل: {savedDecisions[hearing.id] || hearing.lastDecision}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Procedural Deadlines & RAJIH Spotlight */}
        <div className="space-y-6">
          {/* Critical Deadlines (قلم المحضرين والطعون) */}
          <div className="rounded-2xl border border-red-500/20 bg-[#0d1726] p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-red-500/15 text-red-300 border border-red-500/30">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">مواعيد السقوط الإجرائية</h3>
                  <p className="text-xs text-slate-400">مهام المحضرين وقيد الطعون المحددة بمواعيد قانونية حتمية</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("tasks")}
                className="text-xs font-semibold text-red-300 hover:underline"
              >
                عرض الكل
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {mockTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                      {task.priority}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="size-3" />
                      قبل {task.deadline}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-100 leading-relaxed">
                    {task.title}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{task.courtOrBailiffOffice}</span>
                    <span className="text-slate-300">المسؤول: {task.assignedTo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RAJIH AI Assistant Quick Query Card */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--axia-gold)]/30 bg-gradient-to-br from-[#121c2c] via-[#0d1726] to-[#152033] p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl border border-[var(--axia-gold)]/40 bg-[var(--axia-gold)]/10 text-[var(--axia-gold-light)]">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">مساعد راجح الذكي — RAJIH AI</h3>
                <p className="text-xs text-[var(--axia-gold-light)]">المستشار القانوني الرقمي لأحكام النقض والدفوع</p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              يقوم راجح بمطابقة وقائع الدعوى مع أكثر من ١٠٠ ألف مبدأ قضائي لمحكمة النقض المصرية، صياغة مذكرات الدفوع، وفحص بنود التعويض في عقود الفيديك والمقاولات.
            </p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => onNavigate("rajih")}
                className="w-full text-right rounded-xl border border-white/10 bg-black/20 p-2.5 text-xs text-slate-300 hover:border-[var(--axia-gold)]/40 hover:text-white transition flex items-center justify-between"
              >
                <span>🔍 استخراج الدفوع في دعوى بطلان شرط التحكيم</span>
                <ChevronLeft className="size-3 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate("rajih")}
                className="w-full text-right rounded-xl border border-white/10 bg-black/20 p-2.5 text-xs text-slate-300 hover:border-[var(--axia-gold)]/40 hover:text-white transition flex items-center justify-between"
              >
                <span>⚖️ أحدث أحكام الهيئة العامة للنقض في سقوط الحق بالتقادم</span>
                <ChevronLeft className="size-3 text-slate-400" />
              </button>
            </div>

            <button
              onClick={() => onNavigate("rajih")}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#b0871d] py-2.5 text-center text-xs font-bold text-slate-950 transition hover:brightness-110"
            >
              فتح غرفة أبحاث راجح القانونية
            </button>
          </div>
        </div>

      </div>

      {/* Recent Matters Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1726] p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">أحدث القضايا والملفات المنظورة</h2>
            <p className="text-xs text-slate-400">سجل الدعاوى القضائية بمحاكم النقض والاستئناف والابتدائية</p>
          </div>
          <button
            onClick={() => onNavigate("matters")}
            className="rounded-xl border border-[var(--axia-gold-dim)] bg-[var(--axia-gold)]/10 px-4 py-2 text-xs font-semibold text-[var(--axia-gold-light)] hover:bg-[var(--axia-gold)]/20 transition"
          >
            عرض كافة القضايا ({mockMatters.length})
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-3 font-semibold">رقم القضية</th>
                <th className="pb-3 font-semibold">المحكمة والدائرة</th>
                <th className="pb-3 font-semibold">موضوع الدعوى</th>
                <th className="pb-3 font-semibold">الموكل (الصفة)</th>
                <th className="pb-3 font-semibold">الجلسة القادمة</th>
                <th className="pb-3 font-semibold">المحامي المسؤول</th>
                <th className="pb-3 font-semibold">الحالة</th>
                <th className="pb-3 font-semibold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockMatters.map((matter) => (
                <tr key={matter.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 font-bold text-white">
                    {matter.caseNumber}
                  </td>
                  <td className="py-3.5 text-slate-300">
                    <div>{matter.court}</div>
                    <span className="text-[11px] text-slate-400">{matter.circuit}</span>
                  </td>
                  <td className="py-3.5 max-w-xs text-slate-200">
                    <p className="truncate font-medium">{matter.title}</p>
                    <span className="text-[11px] text-slate-400">الخصم: {matter.opponentName}</span>
                  </td>
                  <td className="py-3.5 text-slate-300">
                    <div className="font-medium text-white">{matter.clientName}</div>
                    <span className="inline-block rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] text-cyan-300">
                      صفته: {matter.clientRole}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-200 font-medium">
                    <span className="text-amber-300">{matter.nextHearingDate}</span>
                  </td>
                  <td className="py-3.5 text-slate-300">
                    {matter.assignedLawyer}
                  </td>
                  <td className="py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      matter.stage === "حجز للحكم" 
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : matter.stage === "متداولة"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {matter.stage}
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <button
                      onClick={() => onOpenMatter(matter.id)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-200 hover:bg-[var(--axia-gold)] hover:text-slate-950 transition font-medium"
                    >
                      فتح الملف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
