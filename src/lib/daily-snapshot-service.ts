import { Matter, LegalTask } from "@/types/legal";
import { 
  DailySnapshot, 
  SnapshotConfig, 
  SnapshotRecord, 
  SnapshotFormat,
  SnapshotMatterItem,
  SnapshotTaskItem 
} from "@/types/snapshot";

const CONFIG_STORAGE_KEY = "axia_daily_snapshot_config";
const HISTORY_STORAGE_KEY = "axia_daily_snapshot_history";
// Legacy local vault data is intentionally retained; it is not a cloud backup.

export const DEFAULT_SNAPSHOT_CONFIG: SnapshotConfig = {
  enabled: true,
  destination: "download_folder",
  format: "json",
  autoExportTime: "17:00",
  autoDownloadOnAppOpen: true,
  cloudSyncUrl: "",
  cloudSyncStatus: "idle",
  retentionDays: 30,
};

// Local consistency marker only; this is not a cryptographic signature.
function computeChecksum(str: string): string {
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 * 33) ^ char;
  }
  const part1 = (hash1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (hash2 >>> 0).toString(16).padStart(8, "0");
  const part3 = ((hash1 ^ hash2) >>> 0).toString(16).padStart(8, "0");
  const part4 = ((hash1 + hash2) >>> 0).toString(16).padStart(8, "0");
  return `${part1}-${part2}-${part3}-${part4}`.toUpperCase();
}

// Convert numbers to Arabic numerals
function toArabicDigits(num: number | string): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num).replace(/[0-9]/g, (w) => arabicDigits[+w]);
}

// Format date into standard YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format readable Arabic timestamp
export function getFormattedArabicDateTime(date: Date = new Date()): string {
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "م" : "ص";
  hours = hours % 12 || 12;

  return `${toArabicDigits(day)} ${month} ${toArabicDigits(year)} - ${toArabicDigits(hours)}:${toArabicDigits(minutes)} ${period}`;
}

export function getSnapshotConfig(): SnapshotConfig {
  if (typeof window === "undefined") return DEFAULT_SNAPSHOT_CONFIG;
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      return normalizeSnapshotConfig(JSON.parse(stored));
    }
  } catch (e) {
    console.error("Failed to load snapshot config:", e);
  }
  return DEFAULT_SNAPSHOT_CONFIG;
}

export function normalizeSnapshotConfig(value: unknown): SnapshotConfig {
  const stored = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<SnapshotConfig> : {};
  return {
    ...DEFAULT_SNAPSHOT_CONFIG,
    ...stored,
    format: ["json", "markdown", "csv"].includes(String(stored.format))
      ? stored.format as SnapshotFormat : "json",
    destination: "download_folder",
    lastExportDate: stored.destination === "cloud_sync" ? undefined : stored.lastExportDate,
    cloudSyncUrl: "",
    cloudSyncStatus: "idle",
    enabled: typeof stored.enabled === "boolean" ? stored.enabled : true,
    autoDownloadOnAppOpen: typeof stored.autoDownloadOnAppOpen === "boolean"
      ? stored.autoDownloadOnAppOpen : true,
  };
}

export function saveSnapshotConfig(config: SnapshotConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalizeSnapshotConfig(config)));
  } catch (e) {
    console.error("Failed to save snapshot config:", e);
  }
}

export function getSnapshotRecords(): SnapshotRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load snapshot history:", e);
  }
  return [];
}

export function addSnapshotRecord(record: SnapshotRecord): void {
  if (typeof window === "undefined") return;
  try {
    const history = getSnapshotRecords();
    const updated = [record, ...history.filter(r => r.id !== record.id)].slice(0, 50);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to record snapshot history:", e);
  }
}

export function clearSnapshotRecords(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}

// Build the Daily Snapshot Object
export function buildDailySnapshot(matters: Matter[], tasks: LegalTask[]): DailySnapshot {
  const today = getTodayDateString();
  const now = new Date();

  // Active matters (exclude strictly closed/decided matters)
  const activeMattersList: SnapshotMatterItem[] = matters
    .filter(m => m.status === "مفتوحة" || (!m.status && m.stage !== "محكوم فيها"))
    .map(m => ({
      id: m.id,
      caseNumber: m.caseNumber,
      title: m.title,
      court: m.court,
      circuit: m.circuit,
      clientName: m.clientName,
      clientRole: m.clientRole,
      opponentName: m.opponentName,
      assignedLawyer: m.assignedLawyer,
      stage: m.stage,
      nextHearingDate: m.nextHearingDate,
      nextHearingGoal: m.nextHearingGoal,
      claimAmount: m.claimAmount,
      agreedFees: m.agreedFees,
      paidFees: m.paidFees,
      status: m.status || "مفتوحة",
    }));

  // Pending tasks (incomplete)
  const pendingTasksList: SnapshotTaskItem[] = tasks
    .filter(t => t.status !== "مكتملة")
    .map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      matterCaseNumber: t.matterCaseNumber,
      courtOrBailiffOffice: t.courtOrBailiffOffice,
      assignedTo: t.assignedTo,
      deadline: t.deadline,
      priority: t.priority,
      status: t.status,
    }));

  const criticalDeadlinesCount = pendingTasksList.filter(
    t => t.priority.includes("حرجة") || t.priority.includes("عاجلة")
  ).length;

  const rawJsonForChecksum = JSON.stringify({
    date: today,
    matters: activeMattersList,
    tasks: pendingTasksList,
    timestamp: now.toISOString(),
  });

  const checksum = computeChecksum(rawJsonForChecksum);

  return {
    id: `SNAP-${today.replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: today,
    generatedAt: now.toISOString(),
    generatedAtArabic: getFormattedArabicDateTime(now),
    firm: {
      name: "مساحة العمل الحالية",
      barRegistration: "غير مسجل",
      address: "غير مسجل",
      managingPartner: "غير مسجل",
    },
    metrics: {
      totalActiveMatters: activeMattersList.length,
      totalPendingTasks: pendingTasksList.length,
      criticalDeadlinesCount,
      upcomingHearingsCount: activeMattersList.filter(m => !!m.nextHearingDate).length,
      totalAgreedFees: "غير متاح في هذه اللقطة",
      totalPaidFees: "غير متاح في هذه اللقطة",
    },
    activeMatters: activeMattersList,
    pendingTasks: pendingTasksList,
    checksum,
    securityClassification: "سري ومقيد - مداولات مهنية وقضائية لمكتب المحاماة",
    systemVersion: "AXIA Legal OS v2.5",
  };
}

// Generate Markdown Format
function snapshotToMarkdown(snapshot: DailySnapshot): string {
  let md = `# اللقطة اليومية المحلية للقضايا النشطة والمهام المعلقة
**التاريخ**: ${snapshot.date} (${snapshot.generatedAtArabic})  
**المنشأة**: ${snapshot.firm.name}  
**القيد**: ${snapshot.firm.barRegistration}  
**مؤشر اتساق محلي (غير مشفر)**: \`${snapshot.checksum}\`
**التصنيف**: ${snapshot.securityClassification}  

---

## ١. ملخص الموقف العام والمؤشرات
- **إجمالي القضايا النشطة المتداولة**: ${snapshot.metrics.totalActiveMatters} دعوى
- **إجمالي المهام القضائية المعلقة**: ${snapshot.metrics.totalPendingTasks} مهمة
- **مهام سقوط المواعيد والإعلانات الحرجة**: ${snapshot.metrics.criticalDeadlinesCount} مهمة
- **الجلسات المجدولة القادمة**: ${snapshot.metrics.upcomingHearingsCount} جلسة

---

## ٢. بيان القضايا النشطة المتداولة (${snapshot.activeMatters.length})
| رقم الدعوى | موضوع الدعوى | المحكمة والدائرة | الموكل | الخصم | الجلسة القادمة | المطلوب بالجلسة | المحامي المسؤول |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

  snapshot.activeMatters.forEach((m) => {
    md += `| ${m.caseNumber} | ${m.title} | ${m.court} - ${m.circuit} | ${m.clientName} (${m.clientRole}) | ${m.opponentName} | ${m.nextHearingDate} | ${m.nextHearingGoal} | ${m.assignedLawyer} |\n`;
  });

  md += `\n---

## ٣. جدول المهام المعلقة ومواعيد قلم المحضرين (${snapshot.pendingTasks.length})
| المهمة والإجراء | التصنيف | رقم الدعوى المرتبطة | جهة التنفيذ / القلم | المسؤول | الميعاد الحتمي | درجة الأهمية |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

  snapshot.pendingTasks.forEach((t) => {
    md += `| ${t.title} | ${t.category} | ${t.matterCaseNumber || "-"} | ${t.courtOrBailiffOffice} | ${t.assignedTo} | ${t.deadline} | ${t.priority} |\n`;
  });

  md += `\n---
*تم إنشاء هذا التقرير وتصديره تلقائياً عبر نظام AXIA Legal الذكي. هذه لقطة محلية جزئية وليست نسخة احتياطية كاملة.*
`;

  return md;
}

export function snapshotCsvCell(value: unknown): string {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '\"\"')}"`;
}

// Generate CSV Format
function snapshotToCsv(snapshot: DailySnapshot): string {
  // UTF-8 BOM for Excel Arabic compatibility
  const BOM = "\uFEFF";
  let csv = BOM;

  csv += `"تقرير اللقطة اليومية للقضايا النشطة والمهام - ${snapshot.date}"\n`;
  csv += `"مؤشر اتساق محلي:","${snapshot.checksum}"\n`;
  csv += `"وقت التصدير:","${snapshot.generatedAtArabic}"\n\n`;

  // Matters
  csv += `"=== أولاً: القضايا النشطة المتداولة (${snapshot.activeMatters.length}) ==="\n`;
  csv += `"رقم القضية","موضوع الدعوى","المحكمة","الدائرة","الموكل","صفة الموكل","الخصم","المرحلة","الجلسة القادمة","المطلوب بالجلسة","المحامي المسؤول","قيمة المطالبة","الأتعاب المتفق عليها","المسدد"\n`;
  snapshot.activeMatters.forEach((m) => {
    csv += [m.caseNumber, m.title, m.court, m.circuit, m.clientName, m.clientRole, m.opponentName, m.stage, m.nextHearingDate, m.nextHearingGoal, m.assignedLawyer, m.claimAmount, m.agreedFees, m.paidFees].map(snapshotCsvCell).join(",") + "\n";
  });

  csv += `\n"=== ثانياً: المهام القضائية المعلقة ومواعيد المحضرين (${snapshot.pendingTasks.length}) ==="\n`;
  csv += `"المهمة والإجراء","التصنيف","رقم الدعوى","القلم / الجهة","المسؤول المكلف","الميعاد الحتمي","درجة الأهمية","الحالة"\n`;
  snapshot.pendingTasks.forEach((t) => {
    csv += [t.title, t.category, t.matterCaseNumber, t.courtOrBailiffOffice, t.assignedTo, t.deadline, t.priority, t.status].map(snapshotCsvCell).join(",") + "\n";
  });

  return csv;
}

// Format bytes into human readable string
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Request a browser download; the browser controls its destination and completion.
export function downloadSnapshotFile(
  snapshot: DailySnapshot, 
  format: SnapshotFormat = "json"
): { filename: string; sizeBytes: number; sizeFormatted: string } {
  let content = "";
  let mimeType = "";
  let ext = "";

  if (format === "json") {
    content = JSON.stringify(snapshot, null, 2);
    mimeType = "application/json;charset=utf-8";
    ext = "json";
  } else if (format === "markdown") {
    content = snapshotToMarkdown(snapshot);
    mimeType = "text/markdown;charset=utf-8";
    ext = "md";
  } else if (format === "csv") {
    content = snapshotToCsv(snapshot);
    mimeType = "text/csv;charset=utf-8";
    ext = "csv";
  }

  const filename = `AXIA-Daily-Snapshot-${snapshot.date}.${ext}`;
  const blob = new Blob([content], { type: mimeType });
  const sizeBytes = blob.size;
  const sizeFormatted = formatBytes(sizeBytes);

  // A successful click requests a download; it cannot confirm a file was saved.
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 2000);

  return { filename, sizeBytes, sizeFormatted };
}

// Cloud backup is unavailable until an authenticated server integration is approved.
// Never claim remote durability or write sensitive snapshots to an unscoped local vault.
export async function syncSnapshotToCloud(
  snapshot: DailySnapshot,
  cloudUrl: string,
): Promise<{ success: boolean; message: string }> {
  void snapshot;
  void cloudUrl;
  return { success: false, message: "المزامنة السحابية غير متاحة حاليًا. استخدم تنزيل الملف المحلي." };
}

// Export a partial local snapshot. Cloud destinations fail before side effects.
export async function performDailyExport(
  matters: Matter[],
  tasks: LegalTask[],
  customConfig?: Partial<SnapshotConfig>
): Promise<{
  snapshot: DailySnapshot;
  record: SnapshotRecord;
  downloadResult?: { filename: string; sizeFormatted: string };
  cloudResult?: { success: boolean; message: string };
}> {
  const currentConfig = { ...getSnapshotConfig(), ...(customConfig || {}) };
  if (currentConfig.destination !== "download_folder") {
    throw new Error("المزامنة السحابية غير متاحة. اختر تنزيل الملف المحلي أولًا.");
  }
  const snapshot = buildDailySnapshot(matters, tasks);

  const downloadResult = downloadSnapshotFile(snapshot, currentConfig.format);
  const cloudResult = undefined;

  // File size fallback
  const approxSize = downloadResult?.sizeBytes || 
    new Blob([JSON.stringify(snapshot)]).size;
  const sizeFormatted = downloadResult?.sizeFormatted || formatBytes(approxSize);
  const filename = downloadResult?.filename || `AXIA-Daily-Snapshot-${snapshot.date}.${currentConfig.format}`;

  // Record history
  const record: SnapshotRecord = {
    id: snapshot.id,
    date: snapshot.date,
    timestamp: snapshot.generatedAtArabic,
    filename,
    format: currentConfig.format,
    destination: currentConfig.destination,
    mattersCount: snapshot.activeMatters.length,
    tasksCount: snapshot.pendingTasks.length,
    fileSizeBytes: approxSize,
    fileSizeFormatted: sizeFormatted,
    checksum: snapshot.checksum,
    status: "success",
  };

  addSnapshotRecord(record);

  // Update last export date in config
  const updatedConfig: SnapshotConfig = {
    ...currentConfig,
    lastExportDate: snapshot.date,
    lastExportTimestamp: snapshot.generatedAtArabic,
    cloudSyncStatus: "idle",
    cloudSyncLastMessage: undefined,
  };
  saveSnapshotConfig(updatedConfig);

  // Dispatch custom window event for UI notifications
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("axia-daily-snapshot-exported", {
        detail: { snapshot, record, downloadResult, cloudResult },
      })
    );
  }

  return { snapshot, record, downloadResult, cloudResult };
}

// Background auto-export trigger: checks if today's snapshot needs to be exported
export async function checkAndRunDailyAutoExport(
  matters: Matter[],
  tasks: LegalTask[]
): Promise<{
  ran: boolean;
  reason?: string;
  snapshot?: DailySnapshot;
  record?: SnapshotRecord;
}> {
  const config = getSnapshotConfig();
  if (!config.enabled) {
    return { ran: false, reason: "auto_export_disabled" };
  }

  const today = getTodayDateString();
  if (config.lastExportDate === today) {
    return { ran: false, reason: "already_exported_today" };
  }

  // If autoDownloadOnAppOpen is true, perform export immediately!
  if (config.autoDownloadOnAppOpen) {
    const result = await performDailyExport(matters, tasks, config);
    return {
      ran: true,
      snapshot: result.snapshot,
      record: result.record,
    };
  }

  return { ran: false, reason: "waiting_for_scheduled_time" };
}
