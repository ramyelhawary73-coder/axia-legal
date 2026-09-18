export type SnapshotDestination = "download_folder" | "cloud_sync" | "both";
export type SnapshotFormat = "json" | "markdown" | "csv";

export interface SnapshotMatterItem {
  id: string;
  caseNumber: string;
  title: string;
  court: string;
  circuit: string;
  clientName: string;
  clientRole: string;
  opponentName: string;
  assignedLawyer: string;
  stage: string;
  nextHearingDate: string;
  nextHearingGoal: string;
  claimAmount?: string;
  agreedFees: string;
  paidFees: string;
  status: "مفتوحة" | "مغلقة";
}

export interface SnapshotTaskItem {
  id: string;
  title: string;
  category: string;
  matterCaseNumber?: string;
  courtOrBailiffOffice: string;
  assignedTo: string;
  deadline: string;
  priority: string;
  status: "قيد التنفيذ" | "مكتملة" | "معلقة";
}

export interface DailySnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  generatedAt: string; // ISO
  generatedAtArabic: string;
  firm: {
    name: string;
    barRegistration: string;
    address: string;
    managingPartner: string;
  };
  metrics: {
    totalActiveMatters: number;
    totalPendingTasks: number;
    criticalDeadlinesCount: number;
    upcomingHearingsCount: number;
    totalAgreedFees: string;
    totalPaidFees: string;
  };
  activeMatters: SnapshotMatterItem[];
  pendingTasks: SnapshotTaskItem[];
  checksum: string;
  securityClassification: string;
  systemVersion: string;
}

export interface SnapshotConfig {
  enabled: boolean;
  destination: SnapshotDestination;
  format: SnapshotFormat;
  autoExportTime: string; // HH:MM, e.g. "17:00"
  autoDownloadOnAppOpen: boolean;
  cloudSyncUrl: string;
  cloudSyncStatus: "idle" | "synced" | "syncing" | "error";
  cloudSyncLastMessage?: string;
  lastExportDate?: string; // YYYY-MM-DD
  lastExportTimestamp?: string;
  retentionDays: number;
}

export interface SnapshotRecord {
  id: string;
  date: string;
  timestamp: string;
  filename: string;
  format: SnapshotFormat;
  destination: SnapshotDestination;
  mattersCount: number;
  tasksCount: number;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  checksum: string;
  status: "success" | "warning" | "error";
}
