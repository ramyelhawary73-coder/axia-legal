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
  tasks: LegalTask[],
  isDataReady = false,
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
    if (!isDataReady) throw new Error("انتظر اكتمال تحميل بيانات مساحة العمل قبل التصدير.");
    setIsAutoExporting(true);
    try {
      const result = await performDailyExport(matters, tasks);
      setToastNotification({
        visible: true,
        title: "تم تجهيز اللقطة وطلب تنزيلها",
        message: `تم تجهيز لقطة القضايا (${result.record.mattersCount}) والمهام (${result.record.tasksCount})`,
        filename: result.record.filename,
        destination: "تنزيل محلي عبر المتصفح",
      });
    } catch (e) {
      console.error("Manual snapshot export error:", e);
    } finally {
      setIsAutoExporting(false);
    }
  }, [matters, tasks, isDataReady]);

  // Run automatic check on mount
  useEffect(() => {
    if (typeof window === "undefined" || hasExecutedRef.current || !isDataReady) return;

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
          title: "تصدير آلي: تم طلب تنزيل اللقطة اليومية",
          message: `تم تجهيز لقطة محلية للقضايا النشطة (${result.record.mattersCount}) والمهام المعلقة (${result.record.tasksCount}) وطلب تنزيلها`,
          filename: result.record.filename,
          destination: "تنزيل محلي عبر المتصفح",
        });
      } catch (e) {
        console.error("Daily auto-export failed:", e);
      } finally {
        setIsAutoExporting(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [matters, tasks, isDataReady]);

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
          title: "تم تجهيز اللقطة وطلب تنزيلها",
          message: `تم تجهيز ${rec.mattersCount} قضية نشطة و ${rec.tasksCount} مهمة قضائية`,
          filename: rec.filename,
          destination: "تنزيل محلي عبر المتصفح",
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
