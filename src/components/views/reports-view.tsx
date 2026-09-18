"use client";

import { useState } from "react";
import { 
  BarChart3, 
  CheckCircle2, 
  FileText, 
  Download, 
  Clock, 
  Briefcase, 
  ShieldCheck, 
  Printer, 
  FileSpreadsheet,
  FolderDown,
  Cloud,
  Settings,
  Sparkles
} from "lucide-react";
import { Matter, LegalTask } from "@/types/legal";
import { mockMatters, mockTasks } from "@/lib/mock-legal-data";
import { LegalPdfReportModal, ReportType } from "@/components/legal-pdf-report-modal";
import { DailySnapshotManager } from "@/components/daily-snapshot-manager";
import { getSnapshotConfig, performDailyExport, getTodayDateString } from "@/lib/daily-snapshot-service";

interface ReportsViewProps {
  matters?: Matter[];
  tasks?: LegalTask[];
}

export function ReportsView({ matters = mockMatters, tasks = mockTasks }: ReportsViewProps) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("matters");
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isQuickExporting, setIsQuickExporting] = useState(false);
  const [quickExportSuccess, setQuickExportSuccess] = useState<string | null>(null);

  const snapshotConfig = getSnapshotConfig();
  const today = getTodayDateString();
  const isExportedToday = snapshotConfig.lastExportDate === today;

  const handleOpenPdfModal = (type: ReportType) => {
    setSelectedReportType(type);
    setIsPdfModalOpen(true);
  };

  const handleQuickExportSnapshot = async () => {
    setIsQuickExporting(true);
    try {
      const res = await performDailyExport(matters, tasks);
      setQuickExportSuccess(`تم تنزيل ${res.record.filename} بنجاح إلى مجلد التنزيلات (Downloads)`);
      setTimeout(() => setQuickExportSuccess(null), 4000);
    } catch (e) {
      console.error("Quick export error:", e);
    } finally {
      setIsQuickExporting(false);
    }
  };

  const activeMattersCount = matters.length;
  const criticalTasksCount = tasks.filter((t) => t.priority.includes("حرجة") && t.status !== "مكتملة").length;
  const pendingTasksCount = tasks.filter((t) => t.status !== "مكتملة").length;

  return (
    <div className="space-y-8 p-6 sm:p-8 lg:p-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
            <BarChart3 className="size-4" />
            <span>التقارير التحليلية والوثائق الرسمية</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
            مركز التقارير وتصدير ملفات PDF
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            إحصائيات الأداء، مؤشرات التقاضي، وتوليد تقارير رسمية معتمدة للطباعة والمشاركة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenPdfModal("executive")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--axia-gold)] px-4 py-2 text-xs font-bold text-black shadow-md hover:bg-[var(--axia-gold-light)] transition"
          >
            <Download className="size-4" />
            <span>تصدير التقرير الشامل (PDF)</span>
          </button>
        </div>
      </div>

      {/* Daily Summary Snapshot & Cloud Sync Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--axia-gold)]/40 bg-gradient-to-r from-[var(--panel)] via-[var(--panel)] to-[var(--axia-gold-dim)]/20 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--axia-gold)] text-black px-2.5 py-0.5 text-[10px] font-bold">
                <Sparkles className="size-3" />
                <span>أرشفة يومية مؤتمتة</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] text-[var(--text-muted)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-mono">
                Daily Snapshot Engine
              </span>
              {snapshotConfig.enabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>الأتمتة نشطة (مجلد التنزيل والمزامنة)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-2.5 py-0.5 text-[10px] font-semibold">
                  <span>الأتمتة متوقفة مؤقتاً</span>
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-[var(--text)] sm:text-xl">
              التصدير التلقائي للقطة اليومية للقضايا والمهام (Daily Summary Snapshot)
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              تفريغ دوري وشامل لجميع القضايا النشطة المتداولة والمهام القضائية المعلقة وحفظها تلقائياً في مجلد التنزيلات المحلي (Downloads) مع المزامنة المشفرة للمستودع السحابي لمكتب المحاماة.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <FolderDown className="size-3.5 text-amber-400" />
                <span>المسار: <strong>مجلد التنزيلات المحلي (OS Downloads)</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Cloud className="size-3.5 text-blue-400" />
                <span>المزامنة: <strong>{snapshotConfig.destination === "download_folder" ? "تنزيل محلي فقط" : snapshotConfig.destination === "cloud_sync" ? "سحابي فقط" : "تنزيل محلي + مستودع سحابي"}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 text-emerald-400" />
                <span>حالة اليوم: <strong className={isExportedToday ? "text-emerald-400" : "text-amber-400"}>{isExportedToday ? "تم الحفظ بنجاح اليوم" : "بانتظار لقطة اليوم"}</strong></span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleQuickExportSnapshot}
              disabled={isQuickExporting}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--axia-gold)] px-4 py-2.5 text-xs font-bold text-black shadow-md hover:bg-[var(--axia-gold-light)] transition disabled:opacity-50"
            >
              <Download className={`size-4 ${isQuickExporting ? "animate-bounce" : ""}`} />
              <span>{isQuickExporting ? "جارٍ الحفظ..." : "تصدير لقطة اليوم الآن"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSnapshotModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-xs font-bold text-[var(--text)] hover:bg-[var(--accent)] transition"
            >
              <Settings className="size-4 text-[var(--axia-gold)]" />
              <span>إدارة الأتمتة والسجل</span>
            </button>
          </div>
        </div>

        {quickExportSuccess && (
          <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-400 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{quickExportSuccess}</span>
          </div>
        )}
      </div>

      {/* PDF Export Center Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-[var(--axia-gold)]" />
            <span>نماذج التقارير المعتمدة الجاهزة للتصدير (PDF)</span>
          </h2>
          <span className="text-[11px] text-[var(--text-muted)]">
            تنسيق رسمي معتمد بترويسة مكتب أكسيا وخاتم الشركاء
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Card 1: Cases Report */}
          <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg hover:border-[var(--axia-gold)]/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  <Briefcase className="size-5" />
                </div>
                <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
                  {activeMattersCount} دعوى مسجلة
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-[var(--text)]">
                تقرير القضايا والمنازعات
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                بيان تفصيلي بجميع الدعاوى المتداولة، الجهات القضائية، الدوائر، صفات الخصوم، ومواعيد الجلسات القادمة مع الوضع المالي للأتعاب.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-500" />
                جاهز للتصدير
              </span>
              <button
                type="button"
                onClick={() => handleOpenPdfModal("matters")}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-xs font-semibold text-[var(--bg)] hover:opacity-90 transition"
              >
                <FileText className="size-3.5" />
                <span>معاينة وتصدير PDF</span>
              </button>
            </div>
          </div>

          {/* Card 2: Tasks & Deadlines Report */}
          <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg hover:border-[var(--axia-gold)]/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                  <Clock className="size-5" />
                </div>
                <span className="rounded bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
                  {criticalTasksCount} مهام سقوط حرجة
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-[var(--text)]">
                جدول المهام ومواعيد السقوط
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                جدول متابعة إعلانات قلم المحضرين، سداد الرسوم القضائية، إيداع مذكرات النقض والاستئناف ومواعيد الطعن الموقوتة قانوناً.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">
                {pendingTasksCount} مهام قيد المتابعة
              </span>
              <button
                type="button"
                onClick={() => handleOpenPdfModal("tasks")}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-xs font-semibold text-[var(--bg)] hover:opacity-90 transition"
              >
                <FileText className="size-3.5" />
                <span>معاينة وتصدير PDF</span>
              </button>
            </div>
          </div>

          {/* Card 3: Executive Office Report */}
          <div className="group relative rounded-2xl border border-[var(--axia-gold)]/30 bg-gradient-to-b from-[var(--panel)] to-[var(--axia-gold-dim)]/20 p-5 shadow-lg hover:border-[var(--axia-gold)] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-[var(--axia-gold-dim)] border border-[var(--axia-gold)]/40 text-[var(--axia-gold)]">
                  <FileSpreadsheet className="size-5" />
                </div>
                <span className="rounded bg-[var(--axia-gold)] text-black px-2 py-0.5 text-[10px] font-bold">
                  شامل للشركاء
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-[var(--text)]">
                التقرير التنفيذي الشامل للمكتب
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                وثيقة قضائية جامعة تشمل مؤشرات التقاضي، القضايا المحجوزة للحكم، استحقاقات قلم المحضرين، ومطابقة التوكيلات الرسمية.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--axia-gold)] font-medium flex items-center gap-1">
                <Printer className="size-3" />
                جاهز للمحاكم والموكلين
              </span>
              <button
                type="button"
                onClick={() => handleOpenPdfModal("executive")}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--axia-gold)] px-3 py-1.5 text-xs font-bold text-black shadow hover:bg-[var(--axia-gold-light)] transition"
              >
                <Download className="size-3.5" />
                <span>تصدير فوري (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg">
          <span className="text-xs text-[var(--text-muted)]">نسبة كسب الدعاوى والأحكام الصالحة</span>
          <p className="mt-2 text-3xl font-bold text-emerald-400">٨٨.٤٪</p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">من إجمالي الأحكام الصادرة هذا العام</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg">
          <span className="text-xs text-[var(--text-muted)]">متوسط أمد التقاضي</span>
          <p className="mt-2 text-3xl font-bold text-[var(--text)]">٧.٢ شهر</p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">بالمحاكم الابتدائية والاقتصادية</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg">
          <span className="text-xs text-[var(--text-muted)]">معدل تحصيل الأتعاب</span>
          <p className="mt-2 text-3xl font-bold text-amber-300">٧٦٪</p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">تحصيل منتظم ومقدمات عقود</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg">
          <span className="text-xs text-[var(--text-muted)]">مذكرات الدفاع المحررة</span>
          <p className="mt-2 text-3xl font-bold text-[var(--text)]">١٤٢ مذكرة</p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">مراجعة ومعتمدة من الشركاء</p>
        </div>
      </div>

      {/* Court Distribution & Procedural Compliance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg">
          <h2 className="text-base font-bold text-[var(--text)] mb-4">
            توزيع القضايا حسب الجهات القضائية
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-[var(--text-muted)] mb-1">
                <span>المحاكم الاقتصادية والاستثمارية</span>
                <span className="font-bold text-[var(--axia-gold-light)]">٣٥٪</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--accent)] overflow-hidden">
                <div className="h-full bg-[var(--axia-gold)] rounded-full w-[35%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[var(--text-muted)] mb-1">
                <span>محكمة النقض (طعون مدنية وتجارية)</span>
                <span className="font-bold text-[var(--text)]">٢٨٪</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--accent)] overflow-hidden">
                <div className="h-full bg-[var(--text)] rounded-full w-[28%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[var(--text-muted)] mb-1">
                <span>مجلس الدولة (القضاء الإداري والتراخيص)</span>
                <span className="font-bold text-emerald-400">٢٢٪</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--accent)] overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full w-[22%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[var(--text-muted)] mb-1">
                <span>محاكم الاستئناف والابتدائية المدنية</span>
                <span className="font-bold text-purple-400">١٥٪</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--accent)] overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full w-[15%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg">
          <h2 className="text-base font-bold text-[var(--text)] mb-4">
            مؤشر الالتزام الإجرائي ومواعيد السقوط
          </h2>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="size-5 text-emerald-400" />
              <span>صفر مواعيد سقوط غير مستوفاة خلال الـ ١٢ شهراً الماضية</span>
            </div>
            <p className="text-[var(--text-muted)] leading-relaxed text-xs">
              جميع صحف الطعن بالاستئناف والنقض وإعلانات المحضرين تمت مطابقتها وقيدها ضمن المواعيد القانونية الحتمية المقررة بقانون المرافعات المصري.
            </p>
          </div>
        </div>
      </div>

      {/* Legal PDF Report Modal */}
      <LegalPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        defaultReportType={selectedReportType}
        matters={matters}
        tasks={tasks}
      />

      {/* Daily Snapshot & Auto-Export Manager Modal */}
      <DailySnapshotManager
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        matters={matters}
        tasks={tasks}
      />
    </div>
  );
}

