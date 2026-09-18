"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Matter, LegalTask } from "@/types/legal";
import { 
  getSnapshotConfig, 
  getTodayDateString, 
  performDailyExport 
} from "@/lib/daily-snapshot-service";
import { SnapshotRecord, DailySnapshot } from "@/types/snapshot";

interface UseDailySnapshotReturn {
  isAutoExporting: boolean;
  toastNotification: {
    visible: boolean;
    title: string;
    message: string;
    filename: string;
    destination: string;
  } | null;
  dismissToast: () => void;
  triggerManualExport: () => Promise<void>;
}

export function useDailySnapshotAutoExport(
  matters: Matter[],
  tasks: LegalTask[]
): UseDailySnapshotReturn {
  const [isAutoExporting, setIsAutoExporting] = useState(false);
  const [toastNotification, setToastNotification] = useState<{
    visible: boolean;
    title: string;
    message: string;
    filename: string;
    destination: string;
  } | null>(null);

  const hasExecutedRef = useRef(false);

  const dismissToast = useCallback(() => {
    setToastNotification(null);
  }, []);

  const triggerManualExport = useCallback(async () => {
    setIsAutoExporting(true);
    try {
      const result = await performDailyExport(matters, tasks);
      setToastNotification({
        visible: true,
        title: "تم تصدير اللقطة اليومية بنجاح",
        message: `تم حفظ لقطة القضايا (${result.record.mattersCount}) والمهام (${result.record.tasksCount})`,
        filename: result.record.filename,
        destination: result.record.destination === "download_folder"
          ? "مجلد التنزيل المحلي (Downloads)"
          : result.record.destination === "cloud_sync"
          ? "المستودع السحابي المشفر"
          : "مجلد التنزيل والمستودع السحابي معاً",
      });
    } catch (e) {
      console.error("Manual snapshot export error:", e);
    } finally {
      setIsAutoExporting(false);
    }
  }, [matters, tasks]);

  // Run automatic check on mount
  useEffect(() => {
    if (typeof window === "undefined" || hasExecutedRef.current) return;

    // Small timeout to allow initial render to complete smoothly
    const timer = setTimeout(async () => {
      hasExecutedRef.current = true;
      const config = getSnapshotConfig();
      if (!config.enabled || !config.autoDownloadOnAppOpen) return;

      const today = getTodayDateString();
      if (config.lastExportDate === today) return; // Already exported today

      setIsAutoExporting(true);
      try {
        const result = await performDailyExport(matters, tasks, config);
        setToastNotification({
          visible: true,
          title: "تصدير آلي: تم حفظ اللقطة اليومية للقضايا والمهام",
          message: `تم إنشاء لقطة معتمدة لجميع القضايا النشطة (${result.record.mattersCount}) والمهام المعلقة (${result.record.tasksCount}) وحفظها تلقائياً`,
          filename: result.record.filename,
          destination: result.record.destination === "download_folder"
            ? "مجلد التنزيل المحلي (Downloads)"
            : result.record.destination === "cloud_sync"
            ? "المستودع السحابي المشفر"
            : "مجلد التنزيلات والمزامنة السحابية معاً",
        });
      } catch (e) {
        console.error("Daily auto-export failed:", e);
      } finally {
        setIsAutoExporting(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [matters, tasks]);

  // Listen to external window events
  useEffect(() => {
    const handleSnapshotExported = (e: Event) => {
      const customEvent = e as CustomEvent<{
        snapshot: DailySnapshot;
        record: SnapshotRecord;
      }>;
      if (customEvent.detail?.record) {
        const rec = customEvent.detail.record;
        setToastNotification({
          visible: true,
          title: "تم تصدير اللقطة اليومية بنجاح",
          message: `تم حفظ ${rec.mattersCount} قضية نشطة و ${rec.tasksCount} مهمة قضائية`,
          filename: rec.filename,
          destination: rec.destination === "download_folder"
            ? "مجلد التنزيلات (Downloads)"
            : rec.destination === "cloud_sync"
            ? "المستودع السحابي المشفر"
            : "مجلد التنزيلات والمستودع السحابي",
        });
      }
    };

    window.addEventListener("axia-daily-snapshot-exported", handleSnapshotExported);
    return () => {
      window.removeEventListener("axia-daily-snapshot-exported", handleSnapshotExported);
    };
  }, []);

  return {
    isAutoExporting,
    toastNotification,
    dismissToast,
    triggerManualExport,
  };
}
