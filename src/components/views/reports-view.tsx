"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Gavel,
  ShieldCheck,
} from "lucide-react";
import type {
  Hearing,
  LegalDocument,
  LegalTask,
  Matter,
} from "@/types/legal";
import {
  LegalPdfReportModal,
  type ReportType,
} from "@/components/legal-pdf-report-modal";

interface ReportsViewProps {
  matters: Matter[];
  tasks: LegalTask[];
  hearings: Hearing[];
  documents: LegalDocument[];
}

export function ReportsView({
  matters,
  tasks,
  hearings,
  documents,
}: ReportsViewProps) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType>("matters");

  const today = new Date().toISOString().slice(0, 10);
  const openMatters = matters.filter((matter) => matter.status !== "مغلقة");
  const closedMatters = matters.filter((matter) => matter.status === "مغلقة");
  const pendingTasks = tasks.filter((task) => task.status !== "مكتملة");
  const criticalTasks = pendingTasks.filter(
    (task) =>
      task.priority.includes("حرجة") || task.priority === "عاجلة",
  );
  const overdueTasks = pendingTasks.filter(
    (task) => Boolean(task.deadline) && task.deadline < today,
  );
  const upcomingHearings = hearings.filter(
    (hearing) =>
      !hearing.isArchived &&
      hearing.status !== "منتهية" &&
      hearing.hearingDate >= today,
  );

  const courtDistribution = useMemo(() => {
    const counts = new Map<string, number>();

    for (const matter of matters) {
      const key = matter.court || "غير مسجل";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([court, count]) => ({
        court,
        count,
        percentage:
          matters.length > 0 ? Math.round((count / matters.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [matters]);

  const handleOpenPdfModal = (type: ReportType) => {
    setSelectedReportType(type);
    setIsPdfModalOpen(true);
  };

  return (
    <div className="w-full space-y-8 p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
            <BarChart3 className="size-4" />
            <span>التقارير من البيانات المحفوظة</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
            مركز التقارير
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            كل المؤشرات أدناه محسوبة من بيانات مساحة العمل الحالية فقط.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenPdfModal("executive")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--axia-gold)] px-4 py-2 text-xs font-bold text-black shadow-md"
        >
          <Download className="size-4" />
          تصدير تقرير PDF
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="القضايا المفتوحة"
          value={String(openMatters.length)}
          icon={<Briefcase className="size-4" />}
        />
        <MetricCard
          label="المهام المعلقة"
          value={String(pendingTasks.length)}
          icon={<Clock className="size-4" />}
        />
        <MetricCard
          label="الجلسات القادمة"
          value={String(upcomingHearings.length)}
          icon={<Gavel className="size-4" />}
        />
        <MetricCard
          label="المستندات المحفوظة"
          value={String(documents.length)}
          icon={<FileText className="size-4" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="القضايا المغلقة"
          value={String(closedMatters.length)}
          icon={<ShieldCheck className="size-4" />}
        />
        <MetricCard
          label="المهام الحرجة/العاجلة"
          value={String(criticalTasks.length)}
          icon={<AlertTriangle className="size-4" />}
        />
        <MetricCard
          label="المهام المتأخرة حاليًا"
          value={String(overdueTasks.length)}
          icon={<Clock className="size-4" />}
        />
        <MetricCard
          label="نسبة كسب القضايا"
          value="غير مسجل"
          subtitle="لا توجد بيانات verdict كافية في الـschema الحالي"
          icon={<BarChart3 className="size-4" />}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
            <FileSpreadsheet className="size-4 text-[var(--axia-gold)]" />
            تقارير قابلة للتصدير
          </h2>
          <span className="text-[11px] text-[var(--text-muted)]">
            المحتوى مبني على السجلات المرئية للمستخدم الحالي
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <ReportCard
            title="تقرير القضايا"
            description="القضايا المتاحة، المحكمة، المرحلة، والبيانات المسجلة فعليًا."
            count={matters.length}
            action={() => handleOpenPdfModal("matters")}
          />
          <ReportCard
            title="تقرير المهام"
            description="المهام الحالية، الأولوية، الموعد، والحالة الفعلية."
            count={tasks.length}
            action={() => handleOpenPdfModal("tasks")}
          />
          <ReportCard
            title="التقرير التنفيذي"
            description="ملخص القضايا والمهام الحالية بدون مؤشرات تقديرية أو أرقام افتراضية."
            count={matters.length + tasks.length}
            action={() => handleOpenPdfModal("executive")}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-[var(--text)]">
            توزيع القضايا حسب المحكمة
          </h2>

          <div className="space-y-3">
            {courtDistribution.map((item) => (
              <div key={item.court}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">{item.court}</span>
                  <span className="font-bold text-[var(--text)]">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--accent)]">
                  <div
                    className="h-full rounded-full bg-[var(--axia-gold)]"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}

            {courtDistribution.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
                لا توجد قضايا محفوظة لحساب التوزيع.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-[var(--text)]">
            الالتزام بالمواعيد الحالية
          </h2>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">
                  مهام متأخرة وغير مكتملة
                </span>
                <strong
                  className={
                    overdueTasks.length > 0
                      ? "text-red-300"
                      : "text-emerald-300"
                  }
                >
                  {overdueTasks.length}
                </strong>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
                هذا المؤشر يراجع المهام الحالية فقط ولا يدّعي سجلًا تاريخيًا
                لآخر 12 شهرًا.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">
                  مهام حرجة أو عاجلة غير مكتملة
                </span>
                <strong>{criticalTasks.length}</strong>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="text-[var(--text-muted)]">
                متوسط أمد التقاضي / معدل تحصيل الأتعاب
              </div>
              <div className="mt-2 font-bold text-[var(--text)]">
                غير مسجل
              </div>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                لن تعرض AXIA نسبة تقديرية قبل توفر بيانات تاريخ الإغلاق
                والتحصيل المناسبة في التقرير.
              </p>
            </div>
          </div>
        </section>
      </div>

      <LegalPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        defaultReportType={selectedReportType}
        matters={matters}
        tasks={tasks}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex items-center justify-between text-[var(--text-muted)]">
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          {label}
        </span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold text-[var(--text)]">{value}</div>
      {subtitle && (
        <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ReportCard({
  title,
  description,
  count,
  action,
}: {
  title: string;
  description: string;
  count: number;
  action: () => void;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <div>
        <div className="flex items-center justify-between">
          <FileText className="size-5 text-[var(--axia-gold)]" />
          <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
            {count} سجل
          </span>
        </div>
        <h3 className="mt-3 text-base font-bold text-[var(--text)]">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={action}
        className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--text)] px-3 py-2 text-xs font-semibold text-[var(--bg)]"
      >
        <Download className="size-3.5" />
        معاينة وتصدير PDF
      </button>
    </div>
  );
}
