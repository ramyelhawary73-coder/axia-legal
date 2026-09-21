"use client";

import { useState, useRef, useMemo } from "react";
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  Check, 
  Scale, 
  Calendar, 
  Briefcase, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  ShieldCheck,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { Matter, LegalTask } from "@/types/legal";
import { exportElementToPdf, printReportElement, generateReportRef } from "@/lib/pdf-export-service";
import { analyzeTaskDeadline } from "@/lib/task-utils";

export type ReportType = "matters" | "tasks" | "executive" | "single-matter";

interface LegalPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReportType?: ReportType;
  matters: Matter[];
  tasks: LegalTask[];
  selectedMatter?: Matter | null;
}

export function LegalPdfReportModal({
  isOpen,
  onClose,
  defaultReportType = "matters",
  matters,
  tasks,
  selectedMatter,
}: LegalPdfReportModalProps) {
  const [reportType, setReportType] = useState<ReportType>(
    selectedMatter ? "single-matter" : defaultReportType
  );
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [tasksFilter, setTasksFilter] = useState<"all" | "urgent" | "bailiff">("all");
  const [includeFees, setIncludeFees] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [includeSignature, setIncludeSignature] = useState<boolean>(true);
  const [customRemarks, setCustomRemarks] = useState<string>("");

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  // Stable report reference and timestamp
  const reportRef = useMemo(() => generateReportRef("AX-REP"), []);
  const reportDate = useMemo(() => {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date());
  }, []);

  // Filter matters
  const filteredMatters = useMemo(() => {
    return matters.filter((m) => {
      const matchCourt = courtFilter === "all" || m.court === courtFilter;
      const matchStage = stageFilter === "all" || m.stage === stageFilter;
      return matchCourt && matchStage;
    });
  }, [matters, courtFilter, stageFilter]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (tasksFilter === "urgent") {
        return t.priority.includes("حرجة") || t.priority === "عاجلة";
      }
      if (tasksFilter === "bailiff") {
        return t.category === "قلم المحضرين";
      }
      return true;
    });
  }, [tasks, tasksFilter]);

  // Dynamic report title
  const reportTitle = useMemo(() => {
    switch (reportType) {
      case "single-matter":
        return selectedMatter
          ? `ملف قضية رسمي: ${selectedMatter.caseNumber}`
          : "ملف قضية رسمي";
      case "tasks":
        return "تقرير جدول المهام القضائية ومواعيد السقوط";
      case "executive":
        return "التقرير التنفيذي الشامل للقضايا والمهام الجارية";
      case "matters":
      default:
        return "تقرير القضايا والمنازعات القضائية المتداولة";
    }
  }, [reportType, selectedMatter]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsGeneratingPdf(true);
    setDownloadSuccess(false);

    const safeTitle = reportTitle
      .replace(/[\s/\\:]+/g, "_")
      .slice(0, 40);
    const filename = `${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;

    const ok = await exportElementToPdf(documentRef.current, {
      filename,
      scale: 2,
    });

    setIsGeneratingPdf(false);
    if (ok) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    }
  };

  const handlePrint = () => {
    if (!documentRef.current) return;
    printReportElement(documentRef.current);
  };

  const handleShare = async () => {
    const text = `📄 تقرير صادر من AXIA Legal ERP\nالموضوع: ${reportTitle}\nالرقم المرجعي: ${reportRef}\nتاريخ الإنشاء: ${reportDate}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: reportTitle,
          text,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
        return;
      } catch {
        // User cancelled or failed
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-6xl rounded-t-[28px] sm:rounded-2xl border-t sm:border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden">
        
        {/* Top Header & Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg)] px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-[var(--axia-gold-dim)] border border-[var(--axia-gold)]/30 text-[var(--axia-gold)]">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-[var(--text)]">
                  تصدير تقرير PDF من بيانات AXIA
                </h2>
                <span className="rounded bg-[var(--axia-gold-dim)] border border-[var(--axia-gold)]/40 px-2 py-0.5 text-[10px] font-bold text-[var(--axia-gold)]">
                  نسخة جاهزة للطباعة والمشاركة
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                المرجع: {reportRef} — التقرير يعكس البيانات المتاحة في مساحة العمل الحالية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] transition shadow-sm"
              title="طباعة أو حفظ مباشر عبر نافذة المتصفح"
            >
              <Printer className="size-3.5" />
              <span className="hidden sm:inline">طباعة / حفظ</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] transition shadow-sm"
              title="مشاركة التقرير أو نسخ البيانات"
            >
              {shareSuccess ? <Check className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
              <span className="hidden sm:inline">{shareSuccess ? "تم النسخ ✓" : "مشاركة"}</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--axia-gold)] px-4 py-1.5 text-xs font-bold text-black shadow-md hover:bg-[var(--axia-gold-light)] transition disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>جاري إنشاء PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="size-3.5 text-black" />
                  <span>تم التنزيل بنجاح ✓</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  <span>تحميل ملف PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="border-b border-[var(--border)] bg-[var(--panel-glass)] px-5 py-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Report Type Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-[var(--text-muted)] ml-1 flex items-center gap-1">
                <Filter className="size-3" /> نوع التقرير:
              </span>
              <button
                type="button"
                onClick={() => setReportType("matters")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  reportType === "matters"
                    ? "bg-[var(--text)] text-[var(--bg)] shadow-sm font-bold"
                    : "bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                تقرير القضايا ({filteredMatters.length})
              </button>
              <button
                type="button"
                onClick={() => setReportType("tasks")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  reportType === "tasks"
                    ? "bg-[var(--text)] text-[var(--bg)] shadow-sm font-bold"
                    : "bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                جدول المهام ومواعيد السقوط ({filteredTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setReportType("executive")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  reportType === "executive"
                    ? "bg-[var(--text)] text-[var(--bg)] shadow-sm font-bold"
                    : "bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                التقرير الشامل
              </button>
              {selectedMatter && (
                <button
                  type="button"
                  onClick={() => setReportType("single-matter")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    reportType === "single-matter"
                      ? "bg-[var(--axia-gold)] text-black shadow-sm font-bold"
                      : "bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  ملف الدعوى الحالية
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {reportType === "matters" && (
                <>
                  <select
                    value={courtFilter}
                    onChange={(e) => setCourtFilter(e.target.value)}
                    className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[11px] text-[var(--text)]"
                  >
                    <option value="all">كافة المحاكم</option>
                    <option value="محكمة النقض">محكمة النقض</option>
                    <option value="المحكمة الاقتصادية">المحكمة الاقتصادية</option>
                    <option value="مجلس الدولة (القضاء الإداري)">مجلس الدولة</option>
                    <option value="استئناف عالي">استئناف عالي</option>
                    <option value="ابتدائية كلي">ابتدائية كلي</option>
                  </select>

                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[11px] text-[var(--text)]"
                  >
                    <option value="all">كافة المراحل</option>
                    <option value="متداولة">متداولة</option>
                    <option value="حجز للحكم">حجز للحكم</option>
                    <option value="مؤجلة لتقديم مستندات">مؤجلة لمستندات</option>
                  </select>
                </>
              )}

              {reportType === "tasks" && (
                <select
                  value={tasksFilter}
                  onChange={(e) => setTasksFilter(e.target.value as typeof tasksFilter)}
                  className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[11px] text-[var(--text)]"
                >
                  <option value="all">كافة المهام</option>
                  <option value="urgent">المهام الحرجة والعاجلة فقط</option>
                  <option value="bailiff">إعلانات قلم المحضرين</option>
                </select>
              )}

              {/* Toggles */}
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-[var(--text-muted)] select-none">
                <input
                  type="checkbox"
                  checked={includeFees}
                  onChange={(e) => setIncludeFees(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--axia-gold)]"
                />
                <span>إظهار الأتعاب</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-[var(--text-muted)] select-none">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--axia-gold)]"
                />
                <span>ملاحظات الدفاع</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-[var(--text-muted)] select-none">
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--axia-gold)]"
                />
                <span>تذييل النظام</span>
              </label>
            </div>
          </div>

          {/* Optional remarks bar */}
          <div className="mt-2 pt-2 border-t border-[var(--border)]/60 flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)] shrink-0 font-medium">
              إضافة توجيه أو ملاحظة ختامية للتقرير:
            </span>
            <input
              type="text"
              placeholder="مثال: يرجى موافاتنا بصور الإعلانات فور تمامها بالقلم قبل نهاية الأسبوع..."
              value={customRemarks}
              onChange={(e) => setCustomRemarks(e.target.value)}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-[11px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--axia-gold)]"
            />
          </div>
        </div>

        {/* Live A4 Preview Canvas Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/20 custom-scrollbar">
          
          {/* Printable Element - Styled as Authentic High-End White A4 Document */}
          <div
            ref={documentRef}
            id="legal-pdf-document"
            className="mx-auto max-w-[840px] bg-white text-slate-900 shadow-2xl p-8 sm:p-10 rounded-sm border border-slate-200 print:shadow-none print:border-none print:p-0"
            style={{ direction: "rtl", fontFamily: "inherit" }}
          >
            {/* AXIA system report header */}
            <div className="border-b-2 border-amber-600/40 pb-5 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 block">
                    AXIA Legal ERP
                  </span>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                    تقرير من بيانات مساحة العمل
                  </h1>
                  <span className="text-[11px] font-semibold text-amber-700 tracking-wider block">
                    DATA-DRIVEN LEGAL WORKSPACE REPORT
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1">
                    لا يتضمن هذا القالب بيانات قيد مهني أو توقيعًا أو ختمًا غير مخزن في النظام.
                  </p>
                </div>

                <div className="text-left flex flex-col items-end">
                  <div className="grid size-12 place-items-center rounded-full bg-amber-50 border border-amber-300 text-amber-700 mb-2">
                    <Scale className="size-6 text-amber-700" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono space-y-0.5 text-left">
                    <div>مرجع التقرير: <strong className="text-slate-800">{reportRef}</strong></div>
                    <div>تاريخ الإنشاء: <span className="text-slate-700">{reportDate}</span></div>
                    <div>المصدر: <span className="text-slate-700 font-bold">AXIA workspace data</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="bg-slate-100 border-r-4 border-amber-600 p-3.5 mb-6 rounded-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {reportTitle}
                  </h2>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    تقرير نظامي يعرض السجلات المتاحة للمستخدم الحالي دون إضافة بيانات غير مسجلة
                  </p>
                </div>
                <span className="rounded bg-amber-100 border border-amber-300 px-2 py-1 text-[10px] font-bold text-amber-900">
                  سري ومخصص للمكتب
                </span>
              </div>
            </div>

            {/* Executive KPIs Grid (Printable Summary) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded border border-slate-200 bg-slate-50 p-3 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">الدعاوى المشمولة</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">
                  {reportType === "single-matter" ? 1 : filteredMatters.length}
                </span>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-3 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">المهام العاجلة</span>
                <span className="text-xl font-bold text-red-600 mt-1 block">
                  {tasks.filter((t) => t.priority.includes("حرجة") && t.status !== "مكتملة").length}
                </span>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-3 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">محجوزة للحكم</span>
                <span className="text-xl font-bold text-amber-700 mt-1 block">
                  {matters.filter((m) => m.stage === "حجز للحكم").length}
                </span>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-3 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">الالتزام الإجرائي</span>
                <span className="text-xl font-bold text-emerald-600 mt-1 block">١٠٠٪</span>
              </div>
            </div>

            {/* Single Matter Dossier Report Content */}
            {reportType === "single-matter" && selectedMatter && (
              <div className="space-y-4 mb-6">
                <div className="rounded border border-slate-200 p-4 bg-slate-50/50">
                  <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-1.5">
                    <Briefcase className="size-4 text-amber-700" />
                    بيانات الدعوى القضائية
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">رقم الدعوى والسنة:</span>
                      <strong className="text-slate-900 text-sm">{selectedMatter.caseNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">الجهة القضائية:</span>
                      <span className="text-slate-900 font-semibold">{selectedMatter.court} — {selectedMatter.circuit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">الموكل والصفة:</span>
                      <span className="text-slate-900 font-semibold">{selectedMatter.clientName} ({selectedMatter.clientRole})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">الخصم ومحاميه:</span>
                      <span className="text-slate-900 font-semibold">{selectedMatter.opponentName} {selectedMatter.opponentLawyer ? `(المحامي: ${selectedMatter.opponentLawyer})` : ""}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">المحامي المسؤول بالملف:</span>
                      <span className="text-slate-900 font-semibold">{selectedMatter.assignedLawyer}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">حالة ومرحلة الدعوى:</span>
                      <span className="inline-block rounded bg-amber-100 text-amber-900 font-bold px-2 py-0.5 text-[11px]">
                        {selectedMatter.stage}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-slate-200 p-4 bg-slate-50/50">
                  <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2 mb-2 flex items-center gap-1.5">
                    <Calendar className="size-4 text-amber-700" />
                    الجلسة القادمة وتكليفات التحضير
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">تاريخ الجلسة:</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedMatter.nextHearingDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">المطلوب بالجلسة:</span>
                      <span className="text-slate-800">{selectedMatter.nextHearingGoal}</span>
                    </div>
                  </div>
                </div>

                {includeFees && (
                  <div className="rounded border border-slate-200 p-4 bg-slate-50/50">
                    <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2 mb-2">
                      الوضع المالي للأتعاب
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">الأتعاب المتفق عليها</span>
                        <strong className="text-slate-900">{selectedMatter.agreedFees}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">المسدد منها</span>
                        <strong className="text-emerald-700">{selectedMatter.paidFees}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">قيمة المطالبة بالدعوى</span>
                        <strong className="text-slate-900">{selectedMatter.claimAmount || "غير مقدرة"}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {includeNotes && selectedMatter.notes && (
                  <div className="rounded border border-amber-200 bg-amber-50/60 p-4 text-xs">
                    <span className="font-bold text-amber-900 block mb-1">ملاحظات القضية المسجلة:</span>
                    <p className="text-slate-800 leading-relaxed">{selectedMatter.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Matters Table (If reportType is matters or executive) */}
            {(reportType === "matters" || reportType === "executive") && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Briefcase className="size-3.5 text-amber-700" />
                    جدول القضايا المتداولة ({filteredMatters.length})
                  </h3>
                  <span className="text-[10px] text-slate-500">مرتبة حسب تاريخ الجلسة القادمة</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="p-2 border-l border-slate-200">رقم القضية</th>
                        <th className="p-2 border-l border-slate-200">المحكمة والدائرة</th>
                        <th className="p-2 border-l border-slate-200">الموكل / الخصم</th>
                        <th className="p-2 border-l border-slate-200">موضوع الدعوى</th>
                        <th className="p-2 border-l border-slate-200">المرحلة</th>
                        <th className="p-2 border-l border-slate-200">الجلسة القادمة</th>
                        {includeFees && <th className="p-2">الأتعاب</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredMatters.map((matter, idx) => (
                        <tr key={matter.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                          <td className="p-2 font-bold text-slate-900 border-l border-slate-200 whitespace-nowrap">
                            {matter.caseNumber}
                          </td>
                          <td className="p-2 border-l border-slate-200 text-slate-700">
                            <div>{matter.court}</div>
                            <div className="text-[9px] text-slate-500">{matter.circuit}</div>
                          </td>
                          <td className="p-2 border-l border-slate-200 text-slate-800">
                            <div className="font-semibold">{matter.clientName} <span className="text-[9px] font-normal text-slate-500">({matter.clientRole})</span></div>
                            <div className="text-[9px] text-slate-500">ضد: {matter.opponentName}</div>
                          </td>
                          <td className="p-2 border-l border-slate-200 text-slate-700 max-w-[200px] truncate" title={matter.title}>
                            {matter.title}
                          </td>
                          <td className="p-2 border-l border-slate-200 whitespace-nowrap">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 border border-slate-300">
                              {matter.stage}
                            </span>
                          </td>
                          <td className="p-2 border-l border-slate-200 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{matter.nextHearingDate}</div>
                            <div className="text-[9px] text-slate-500 max-w-[120px] truncate" title={matter.nextHearingGoal}>
                              {matter.nextHearingGoal}
                            </div>
                          </td>
                          {includeFees && (
                            <td className="p-2 whitespace-nowrap font-medium text-slate-800">
                              <div>{matter.agreedFees}</div>
                              <div className="text-[9px] text-emerald-700">مسدد: {matter.paidFees}</div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tasks Table (If reportType is tasks or executive) */}
            {(reportType === "tasks" || reportType === "executive") && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="size-3.5 text-red-600" />
                    جدول المهام القضائية وإعلانات المحضرين ومواعيد السقوط ({filteredTasks.length})
                  </h3>
                  <span className="text-[10px] text-slate-500">تحت المتابعة الدورية لقلم المحضرين</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="p-2 border-l border-slate-200">المهمة والإجراء</th>
                        <th className="p-2 border-l border-slate-200">التصنيف</th>
                        <th className="p-2 border-l border-slate-200">رقم القضية المرتبطة</th>
                        <th className="p-2 border-l border-slate-200">الجهة / المحكمة</th>
                        <th className="p-2 border-l border-slate-200">الأولوية وميعاد السقوط</th>
                        <th className="p-2 border-l border-slate-200">المسؤول</th>
                        <th className="p-2">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredTasks.map((task, idx) => {
                        const deadlineInfo = analyzeTaskDeadline(task);
                        const isCritical = task.priority.includes("حرجة");
                        return (
                          <tr key={task.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                            <td className="p-2 font-bold text-slate-900 border-l border-slate-200">
                              {task.title}
                            </td>
                            <td className="p-2 border-l border-slate-200 text-slate-700 whitespace-nowrap">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-800 border border-slate-200">
                                {task.category}
                              </span>
                            </td>
                            <td className="p-2 border-l border-slate-200 text-slate-700 font-mono text-[10px] whitespace-nowrap">
                              {task.matterCaseNumber || "غير محدد"}
                            </td>
                            <td className="p-2 border-l border-slate-200 text-slate-700">
                              {task.courtOrBailiffOffice}
                            </td>
                            <td className="p-2 border-l border-slate-200 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {isCritical && <AlertTriangle className="size-3 text-red-600" />}
                                <span className={`font-bold text-[10px] ${isCritical ? "text-red-600" : "text-slate-800"}`}>
                                  {task.deadline}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-500">
                                المتبقي: {deadlineInfo.remainingText}
                              </div>
                            </td>
                            <td className="p-2 border-l border-slate-200 text-slate-700 whitespace-nowrap">
                              {task.assignedTo}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                                task.status === "مكتملة"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : isCritical
                                  ? "bg-red-50 text-red-700 border-red-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }`}>
                                {task.status === "مكتملة" && <CheckCircle2 className="size-2.5" />}
                                {task.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Custom remarks section (if provided) */}
            {customRemarks && (
              <div className="rounded border border-slate-300 bg-slate-50 p-3.5 mb-6 text-xs text-slate-800">
                <span className="font-bold text-slate-900 block mb-1">ملاحظات وتوجيهات الشركاء:</span>
                <p className="leading-relaxed">{customRemarks}</p>
              </div>
            )}

            {/* AXIA system footer */}
            {includeSignature && (
              <div className="mt-8 pt-6 border-t-2 border-slate-200 page-break-avoid">
                <div className="flex items-start justify-between gap-6">
                  <div className="max-w-[560px] text-[9px] text-slate-500 leading-relaxed">
                    <div className="flex items-center gap-1 text-slate-700 font-bold mb-1">
                      <ShieldCheck className="size-3 text-amber-700" />
                      <span>تنبيه استخدام التقرير</span>
                    </div>
                    تم إنشاء هذا التقرير آلياً من البيانات المسجلة والمتاحة للمستخدم الحالي في AXIA.
                    يجب مراجعة المواعيد والبيانات القانونية قبل الاعتماد عليها في إجراء قضائي أو تقديم رسمي.
                  </div>

                  <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-center">
                    <Scale className="mx-auto mb-1 size-4 text-amber-800" />
                    <span className="block text-[8px] font-black text-slate-800">AXIA LEGAL ERP</span>
                    <span className="block text-[7px] text-slate-500">SYSTEM GENERATED REPORT</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Metadata */}
            <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 flex justify-between">
              <span>AXIA Legal ERP — تقرير مولد من مساحة العمل الحالية</span>
              <span>صفحة 1 من 1 — رقم المرجع: {reportRef}</span>
            </div>

          </div>
        </div>

        {/* Modal Bottom Status / Hint */}
        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg)] px-5 py-2.5 text-xs text-[var(--text-muted)] shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-500" />
            <span>جاهز للتصدير: يتم حفظ التقرير بصيغة PDF من البيانات المعروضة في مساحة العمل الحالية.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[var(--text)] hover:underline"
          >
            إغلاق المعاينة
          </button>
        </div>

      </div>
    </div>
  );
}
