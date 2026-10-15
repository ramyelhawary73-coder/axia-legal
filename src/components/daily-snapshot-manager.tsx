"use client";

import { useState, useMemo } from "react";
import { 
  Download, 
  Cloud, 
  FolderDown, 
  Settings, 
  History, 
  CheckCircle2, 
  ShieldAlert, 
  FileText, 
  FileCode, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  RefreshCw, 
  X, 
  Briefcase, 
  CheckSquare, 
  Lock, 
  Trash2 
} from "lucide-react";
import { Matter, LegalTask } from "@/types/legal";
import { 
  DailySnapshot, 
  SnapshotConfig, 
  SnapshotRecord, 
  SnapshotFormat 
} from "@/types/snapshot";
import { 
  getSnapshotConfig, 
  saveSnapshotConfig, 
  getSnapshotRecords, 
  buildDailySnapshot, 
  performDailyExport, 
  downloadSnapshotFile, 
  clearSnapshotRecords,
  getTodayDateString
} from "@/lib/daily-snapshot-service";

interface DailySnapshotManagerProps {
  isOpen: boolean;
  onClose: () => void;
  matters: Matter[];
  tasks: LegalTask[];
  isDataReady?: boolean;
}

export function DailySnapshotManager({
  isOpen,
  onClose,
  matters,
  tasks,
  isDataReady = false,
}: DailySnapshotManagerProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "config" | "history">("preview");
  const [config, setConfig] = useState<SnapshotConfig>(() => getSnapshotConfig());
  const [history, setHistory] = useState<SnapshotRecord[]>(() => getSnapshotRecords());
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Compute live snapshot smoothly without cascading effect re-renders
  const liveSnapshot: DailySnapshot = useMemo(() => {
    return buildDailySnapshot(matters, tasks);
  }, [matters, tasks]);

  if (!isOpen) return null;

  const todayDate = getTodayDateString();
  const isExportedToday = config.lastExportDate === todayDate;

  const handleExportNow = async (formatOverride?: SnapshotFormat) => {
    if (!isDataReady || isExporting) {
      setExportError("لم يكتمل تحميل بيانات مساحة العمل. أعد المحاولة بعد نجاح التحميل.");
      return;
    }
    setExportError(null);
    setIsExporting(true);
    try {
      const effectiveFormat = formatOverride || config.format;
      const result = await performDailyExport(matters, tasks, { format: effectiveFormat });
      setConfig(getSnapshotConfig());
      setHistory(getSnapshotRecords());
      setSaveMessage(`تم تجهيز الملف وطلب تنزيله: ${result.record.filename}. تحقق من التنزيلات في المتصفح.`);
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "تعذر تجهيز ملف التصدير.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveConfig = () => {
    saveSnapshotConfig(config);
    setSaveMessage("تم حفظ إعدادات الأتمتة والتصدير اليومي بنجاح.");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleCopyJson = async () => {
    if (!isDataReady || !liveSnapshot) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(liveSnapshot, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setExportError("تعذر نسخ اللقطة. استخدم تنزيل الملف بدلًا من ذلك.");
    }
  };

  const handleReDownload = (record: SnapshotRecord) => {
    if (!isDataReady || !liveSnapshot) return;
    downloadSnapshotFile(liveSnapshot, record.format);
  };

  const handleClearHistory = () => {
    if (confirm("هل ترغب في مسح سجل اللقطات السابقة؟")) {
      clearSnapshotRecords();
      setHistory([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-4xl overflow-hidden rounded-t-[28px] sm:rounded-2xl border-t sm:border border-[var(--border)] bg-[var(--panel)] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/40 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[var(--axia-gold-dim)] border border-[var(--axia-gold)]/40 text-[var(--axia-gold)]">
              <FolderDown className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text)]">
                  اللقطة اليومية المحلية للقضايا والمهام
                </h2>
                <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] font-mono text-[var(--axia-gold-light)] border border-[var(--border)]">
                  Daily Snapshot OS
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                لقطة محلية جزئية للقضايا والمهام. ليست نسخة احتياطية كاملة، ولا تتم مزامنتها سحابيًا.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {!isDataReady && (
          <div role="status" className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-3 text-xs text-[var(--text)]">
            التصدير والنسخ غير متاحين حتى يكتمل تحميل بيانات مساحة العمل بنجاح.
          </div>
        )}
        {exportError && (
          <div role="alert" className="border-b border-red-500/30 px-6 py-3 text-xs text-[var(--text)]">{exportError}</div>
        )}
        {/* Global Toast / Feedback */}
        {saveMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2.5 text-xs font-semibold text-emerald-400 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-6 py-2 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "preview"
                  ? "bg-[var(--text)] text-[var(--bg)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]"
              }`}
            >
              <FileText className="size-3.5" />
              <span>معاينة اللقطة الحية (Live Preview)</span>
              {liveSnapshot && (
                <span className="rounded-full bg-[var(--axia-gold)] text-black text-[10px] px-1.5 font-bold">
                  {liveSnapshot.metrics.totalActiveMatters + liveSnapshot.metrics.totalPendingTasks}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("config")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "config"
                  ? "bg-[var(--text)] text-[var(--bg)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]"
              }`}
            >
              <Settings className="size-3.5" />
              <span>إعدادات التنزيل المحلي</span>
              {config.enabled && (
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "history"
                  ? "bg-[var(--text)] text-[var(--bg)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]"
              }`}
            >
              <History className="size-3.5" />
              <span>سجل التصدير والأرشيف ({history.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportNow()}
              disabled={isExporting || !isDataReady}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--axia-gold)] px-3.5 py-1.5 text-xs font-bold text-black shadow-md hover:bg-[var(--axia-gold-light)] transition disabled:opacity-50"
            >
              <Download className={`size-3.5 ${isExporting ? "animate-bounce" : ""}`} />
              <span>{isExporting ? "جارٍ التصدير..." : "تصدير لقطة اليوم فوراً"}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          
          {/* TAB 1: PREVIEW */}
          {activeTab === "preview" && liveSnapshot && (
            <div className="space-y-5">
              {/* Daily Status Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                <div className="flex items-center gap-3">
                  <div className={`grid size-9 place-items-center rounded-lg ${
                    isExportedToday ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {isExportedToday ? <CheckCircle2 className="size-5" /> : <RefreshCw className="size-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[var(--text)]">
                        {isExportedToday ? "تم تصدير لقطة اليوم بنجاح" : "لقطة اليوم جاهزة للتصدير"}
                      </h4>
                      <span className="rounded bg-[var(--panel)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)]">
                        {liveSnapshot.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      آخر تصدير: {config.lastExportTimestamp || "لم يتم التصدير اليوم بعد"} · رمز المطابقة: <code className="text-[var(--axia-gold-light)]">{liveSnapshot.checksum}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleExportNow("json")}
                    disabled={!isDataReady || isExporting}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--accent)] transition"
                    title="تنزيل كملف JSON البرمجي الشامل"
                  >
                    <FileCode className="size-3.5 text-blue-400" />
                    <span>تنزيل JSON</span>
                  </button>
                  <button
                    onClick={() => handleExportNow("markdown")}
                    disabled={!isDataReady || isExporting}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--accent)] transition"
                    title="تنزيل كتقرير نصي تنفيذي للمحامين"
                  >
                    <FileText className="size-3.5 text-emerald-400" />
                    <span>تقرير نصي (MD)</span>
                  </button>
                  <button
                    onClick={() => handleExportNow("csv")}
                    disabled={!isDataReady || isExporting}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--accent)] transition"
                    title="تنزيل كجدول إكسيل متوافق"
                  >
                    <FileSpreadsheet className="size-3.5 text-amber-400" />
                    <span>جدول Excel (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3.5 space-y-1">
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Briefcase className="size-3 text-amber-400" />
                    القضايا النشطة المتداولة
                  </span>
                  <div className="text-2xl font-bold text-[var(--text)]">
                    {liveSnapshot.metrics.totalActiveMatters}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    دعوى مشمولة باللقطة اليومية
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3.5 space-y-1">
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <CheckSquare className="size-3 text-blue-400" />
                    المهام القضائية المعلقة
                  </span>
                  <div className="text-2xl font-bold text-[var(--text)]">
                    {liveSnapshot.metrics.totalPendingTasks}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    مهام قيد المتابعة والتنفيذ
                  </div>
                </div>

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 space-y-1">
                  <span className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                    <ShieldAlert className="size-3 text-red-400" />
                    مواعيد السقوط الحرجة
                  </span>
                  <div className="text-2xl font-bold text-red-400">
                    {liveSnapshot.metrics.criticalDeadlinesCount}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    إعلانات قلم محضرين وطعون حتمية
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3.5 space-y-1">
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Lock className="size-3 text-[var(--axia-gold)]" />
                    سلامة البيانات والختم
                  </span>
                  <div className="text-sm font-bold text-[var(--axia-gold-light)] font-mono truncate">
                    {liveSnapshot.checksum}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    مطابق لمعايير الأمان القضائي
                  </div>
                </div>
              </div>

              {/* Active Matters Snapshot Table */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 overflow-hidden">
                <div className="bg-[var(--panel)] px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="font-bold text-xs text-[var(--text)] flex items-center gap-1.5">
                    <Briefcase className="size-3.5 text-[var(--axia-gold)]" />
                    <span>القضايا النشطة المدرجة في اللقطة ({liveSnapshot.activeMatters.length})</span>
                  </h3>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    يتم تفريغ كافة البيانات الأساسية، المواعيد، والأتعاب
                  </span>
                </div>
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-right text-[11px]">
                    <thead className="sticky top-0 bg-[var(--panel)] border-b border-[var(--border)] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-3 py-2 font-medium">رقم القضية</th>
                        <th className="px-3 py-2 font-medium">موضوع الدعوى</th>
                        <th className="px-3 py-2 font-medium">المحكمة والدائرة</th>
                        <th className="px-3 py-2 font-medium">الموكل والخصم</th>
                        <th className="px-3 py-2 font-medium">الجلسة القادمة</th>
                        <th className="px-3 py-2 font-medium">المحامي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]/50">
                      {liveSnapshot.activeMatters.map((m) => (
                        <tr key={m.id} className="hover:bg-[var(--accent)]/50 transition">
                          <td className="px-3 py-2 font-mono font-bold text-[var(--text)]">{m.caseNumber}</td>
                          <td className="px-3 py-2 font-semibold text-[var(--text)] max-w-xs truncate">{m.title}</td>
                          <td className="px-3 py-2 text-[var(--text-muted)]">{m.court} - {m.circuit}</td>
                          <td className="px-3 py-2 text-[var(--text-muted)]">{m.clientName} ضد {m.opponentName}</td>
                          <td className="px-3 py-2 font-mono text-[var(--axia-gold-light)]">{m.nextHearingDate}</td>
                          <td className="px-3 py-2 text-[var(--text)]">{m.assignedLawyer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Tasks Snapshot Table */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 overflow-hidden">
                <div className="bg-[var(--panel)] px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="font-bold text-xs text-[var(--text)] flex items-center gap-1.5">
                    <CheckSquare className="size-3.5 text-blue-400" />
                    <span>المهام القضائية المعلقة المدرجة ({liveSnapshot.pendingTasks.length})</span>
                  </h3>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    مهام قلم المحضرين، المذكرات، وسداد الرسوم
                  </span>
                </div>
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-right text-[11px]">
                    <thead className="sticky top-0 bg-[var(--panel)] border-b border-[var(--border)] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-3 py-2 font-medium">المهمة والإجراء</th>
                        <th className="px-3 py-2 font-medium">التصنيف</th>
                        <th className="px-3 py-2 font-medium">جهة التنفيذ / القلم</th>
                        <th className="px-3 py-2 font-medium">المسؤول</th>
                        <th className="px-3 py-2 font-medium">الميعاد الحتمي</th>
                        <th className="px-3 py-2 font-medium">الأهمية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]/50">
                      {liveSnapshot.pendingTasks.map((t) => (
                        <tr key={t.id} className="hover:bg-[var(--accent)]/50 transition">
                          <td className="px-3 py-2 font-semibold text-[var(--text)]">{t.title}</td>
                          <td className="px-3 py-2 text-[var(--text-muted)]">{t.category}</td>
                          <td className="px-3 py-2 text-[var(--text-muted)]">{t.courtOrBailiffOffice}</td>
                          <td className="px-3 py-2 text-[var(--text)]">{t.assignedTo}</td>
                          <td className="px-3 py-2 font-mono text-red-400 font-bold">{t.deadline}</td>
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.priority.includes("حرجة") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-[var(--accent)] text-[var(--text-muted)]"
                            }`}>
                              {t.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw JSON Inspect */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    ملف البيانات المتكامل (Schema Payload)
                  </span>
                  <button
                    onClick={handleCopyJson}
                    disabled={!isDataReady || isExporting}
                    className="inline-flex items-center gap-1 rounded bg-[var(--panel)] border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text)] hover:bg-[var(--accent)] transition"
                  >
                    {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    <span>{copied ? "تم النسخ" : "نسخ البيانات"}</span>
                  </button>
                </div>
                <pre className="font-mono text-[10px] text-[var(--text-muted)] max-h-36 overflow-y-auto p-2 bg-[var(--panel)] rounded-lg custom-scrollbar dir-ltr text-left">
                  {JSON.stringify(liveSnapshot, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURATION */}
          {activeTab === "config" && (
            <div className="space-y-6 max-w-2xl">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text)]">
                      التصدير التلقائي اليومي (Daily Auto-Export)
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      تصدير لقطة محدثة يومياً بجميع القضايا المفتوحة والمهام القضائية إلى مسار الحفظ المختار
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--accent)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--axia-gold)]"></div>
                  </label>
                </div>

                {/* Destination Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--text)]">
                    وجهة التصدير والحفظ (Export & Sync Destination)
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, destination: "download_folder" })}
                      className={`p-3 rounded-xl border text-right transition flex flex-col justify-between ${
                        config.destination === "download_folder"
                          ? "border-[var(--axia-gold)] bg-[var(--axia-gold-dim)]/20 text-[var(--text)]"
                          : "border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:border-[var(--axia-gold)]/40"
                      }`}
                    >
                      <FolderDown className={`size-5 mb-2 ${config.destination === "download_folder" ? "text-[var(--axia-gold)]" : ""}`} />
                      <div>
                        <div className="font-bold text-xs text-[var(--text)]">مجلد التنزيل المحلي</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          تنزيل مباشر لملف التقرير في مجلد Downloads بجهازك
                        </div>
                      </div>
                    </button>

                    <div className="rounded-xl border border-[var(--border)] p-3 text-xs text-[var(--text-muted)] sm:col-span-2">
                      المزامنة السحابية غير مفعّلة. التنزيل المحلي هو الوجهة المتاحة؛ لا تُحفظ ملفات هذه اللقطات على الخادم.
                    </div>
                  </div>
                </div>

                {/* Format Selection */}
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="block text-[var(--text-muted)] mb-1 font-semibold">
                      صيغة ملف اللقطة الافتراضية
                    </label>
                    <select
                      value={config.format}
                      onChange={(e) => setConfig({ ...config, format: e.target.value as SnapshotFormat })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                    >
                      <option value="json">JSON - بيانات اللقطة الجزئية</option>
                      <option value="markdown">Markdown / Text - تقرير نصي تنفيذي منسق</option>
                      <option value="csv">CSV / Excel - جداول بيانات متوافقة مع إكسيل</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--text-muted)] mb-1 font-semibold">
                      الجدولة في الخلفية غير مفعّلة
                    </label>
                    <input
                      type="time"
                      disabled
                      title="الجدولة في الخلفية غير متاحة؛ يعمل التصدير عند فتح الصفحة فقط."
                      value={config.autoExportTime}
                      onChange={(e) => setConfig({ ...config, autoExportTime: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Auto trigger on app launch */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text)]">
                    <input
                      type="checkbox"
                      checked={config.autoDownloadOnAppOpen}
                      onChange={(e) => setConfig({ ...config, autoDownloadOnAppOpen: e.target.checked })}
                      className="rounded border-[var(--border)] text-[var(--axia-gold)] focus:ring-[var(--axia-gold)]"
                    />
                    <span>تصدير تلقائي فوري عند أول تشغيل للمنظومة يومياً (إذا لم يتم التصدير بعد)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--text)] px-4 py-2 text-xs font-bold text-[var(--bg)] shadow-md hover:opacity-90 transition"
                >
                  <Check className="size-4" />
                  <span>حفظ وتفعيل إعدادات الأتمتة</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text)]">
                    سجل اللقطات اليومية المصدرة والأرشيف
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    هذا سجل محلي لطلبات التصدير ولا يحتوي على نسخ الملفات. السجلات السحابية القديمة غير متحقق منها.
                  </p>
                </div>

                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1 text-[11px] text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="size-3" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center space-y-3">
                  <div className="grid size-12 place-items-center rounded-xl bg-[var(--accent)] text-[var(--text-muted)] mx-auto">
                    <History className="size-6" />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    لم يتم تسجيل لقطات مصدرة حتى الآن في السجل الحالي.
                  </p>
                  <button
                    onClick={() => handleExportNow()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--axia-gold)] px-3.5 py-1.5 text-xs font-bold text-black"
                  >
                    <Download className="size-3.5" />
                    <span>تصدير أول لقطة يومية الآن</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden shadow-sm">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-[var(--bg)]/50 border-b border-[var(--border)] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">اسم الملف والتاريخ</th>
                        <th className="px-4 py-2.5 font-medium">المحتويات (قضايا / مهام)</th>
                        <th className="px-4 py-2.5 font-medium">الحجم</th>
                        <th className="px-4 py-2.5 font-medium">الوجهة</th>
                        <th className="px-4 py-2.5 font-medium">مؤشر اتساق محلي</th>
                        <th className="px-4 py-2.5 font-medium">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {history.map((record) => (
                        <tr key={record.id} className="hover:bg-[var(--accent)]/50 transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-[var(--text)] font-mono text-xs">{record.filename}</div>
                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{record.timestamp}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-[var(--text)] font-medium">
                              <span className="text-amber-400 font-bold">{record.mattersCount} دعوى</span>
                              <span>·</span>
                              <span className="text-blue-400 font-bold">{record.tasksCount} مهمة</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[var(--text-muted)]">{record.fileSizeFormatted}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--accent)] text-[var(--text)]">
                              {record.destination === "download_folder" && <FolderDown className="size-3 text-amber-400" />}
                              {record.destination === "cloud_sync" && <Cloud className="size-3 text-blue-400" />}
                              {record.destination === "both" && <RefreshCw className="size-3 text-emerald-400" />}
                              <span>
                                {record.destination === "download_folder" ? "تنزيل محلي" : record.destination === "cloud_sync" ? "سجل سحابي قديم غير مؤكد" : "سجل قديم غير مؤكد"}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-[10px] font-mono text-[var(--axia-gold-light)] bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                              {record.checksum.slice(0, 17)}...
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleReDownload(record)}
                    disabled={!isDataReady || isExporting}
                              className="inline-flex items-center gap-1 rounded bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] transition"
                            >
                              <Download className="size-3" />
                              <span>تصدير الحالية بنفس الصيغة</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] bg-[var(--bg)]/40 px-6 py-3 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400"></span>
            <span>الملف المحلي غير مشفّر؛ احفظه في مكان آمن. النسخ القديمة لا تُحفظ ضمن السجل.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent)] transition"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
