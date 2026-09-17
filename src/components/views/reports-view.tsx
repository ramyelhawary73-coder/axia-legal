"use client";

import { BarChart3, CheckCircle2 } from "lucide-react";

export function ReportsView() {
  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      <div className="border-b border-[var(--border)] pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
          <BarChart3 className="size-4" />
          <span>التقارير التحليلية ونسب النجاح القضائي</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
          إحصائيات الأداء ومؤشرات التقاضي
        </h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          تحليل معدلات كسب القضايا، توزيع الدعاوى على المحاكم، والتدفق المالي للأتعاب
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg">
          <span className="text-xs text-[var(--text-muted)]">نسبة كسب الدعاوى والأحكام الصالحة</span>
          <p className="mt-2 text-3xl font-bold text-emerald-400">٨٨.٤٪</p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">من إجمالي الأحكام الصادرة هذا العام</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg">
          <span className="text-xs text-[var(--text-muted)]">متوسط أمد التقاضي</span>
          <p className="mt-2 text-3xl font-bold text-cyan-400">٧.٢ شهر</p>
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
                <span className="font-bold text-cyan-400">٢٨٪</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--accent)] overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full w-[28%]" />
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
    </div>
  );
}
