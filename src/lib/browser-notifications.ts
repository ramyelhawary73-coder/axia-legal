import { LegalTask } from "@/types/legal";

export type NotificationPermissionStatus =
  | "granted"
  | "denied"
  | "default"
  | "unsupported"
  | "restricted";

// In-memory set to prevent spamming notifications for the exact same task in one session
const notifiedTaskIds = new Set<string>();

/**
 * Checks if the Browser Notification API is available in this environment
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Gets the current notification permission state safely
 */
export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }
  try {
    return Notification.permission;
  } catch {
    return "restricted";
  }
}

/**
 * Requests permission from the user for desktop/browser notifications.
 * Catches errors if run inside a sandboxed iframe without allow-scripts/allow-same-origin
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn("Notification.requestPermission() was restricted:", error);
    return "restricted";
  }
}

/**
 * Synthesizes a high-contrast, professional legal alert chime via Web Audio API.
 * Does not depend on any external MP3 files or network requests.
 */
export function playLegalAlertChime(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second tone (880.00 Hz - A5) slightly higher & prominent
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0.001, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch {
    // Gracefully handle browsers with audio auto-play blocks
  }
}

/**
 * Dispatches a native browser notification for a high-priority legal task due within the next hour.
 */
export function sendTaskDeadlineBrowserNotification({
  task,
  diffHours,
  onClick,
  force = false,
}: {
  task: LegalTask;
  diffHours: number;
  onClick?: () => void;
  force?: boolean;
}): boolean {
  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  // Prevent sending duplicate notifications for the same task in one session unless forced
  if (!force && notifiedTaskIds.has(task.id)) {
    return false;
  }

  const minutesRemaining = Math.max(1, Math.round(diffHours * 60));
  const isDropDeadline = task.priority.includes("حرجة");

  const title = isDropDeadline
    ? "⚠️ إنذار سقوط ميعاد قضائي (خلال أقل من ساعة)"
    : "⏳ تنبيه مهمة قضائية عاجلة (خلال أقل من ساعة)";

  const caseInfo = task.matterCaseNumber ? `رقم الدعوى: ${task.matterCaseNumber} | ` : "";
  const body = `«${task.title}»\nمتبقي: ${minutesRemaining} دقيقة فقط!\nالجهة: ${caseInfo}${task.courtOrBailiffOffice}\nالمسؤول: ${task.assignedTo}`;

  try {
    const notification = new Notification(title, {
      body,
      tag: `high-priority-deadline-${task.id}`,
      requireInteraction: true, // Remains on desktop until user dismisses or acts
      dir: "rtl",
      lang: "ar",
      silent: false,
    });

    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        // window.focus might be restricted in some browsers
      }
      if (onClick) onClick();
      notification.close();
    };

    notifiedTaskIds.add(task.id);
    playLegalAlertChime();
    return true;
  } catch (err) {
    console.warn("Failed to create native Notification instance:", err);
    return false;
  }
}

/**
 * Sends a test notification to verify browser notification capabilities
 */
export function sendTestBrowserNotification(onClick?: () => void): boolean {
  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  try {
    const notification = new Notification("⚖️ نظام AXIA Legal - تجربة التنبيهات", {
      body: "إشعارات المتصفح نشطة وتعمل بكفاءة! سيتم تنبيهك فوراً عند اقتراب أي ميعاد قضائي حرج خلال الساعة القادمة.",
      tag: "axia-test-notification",
      dir: "rtl",
      lang: "ar",
      requireInteraction: false,
    });

    notification.onclick = () => {
      try {
        window.focus();
      } catch {}
      if (onClick) onClick();
      notification.close();
    };

    playLegalAlertChime();
    return true;
  } catch (err) {
    console.warn("Test notification failed:", err);
    return false;
  }
}

/**
 * Checks if a task has already been notified
 */
export function hasTaskBeenNotified(taskId: string): boolean {
  return notifiedTaskIds.has(taskId);
}

/**
 * Clears notified status for a task (e.g. if deadline was updated)
 */
export function resetTaskNotification(taskId: string): void {
  notifiedTaskIds.delete(taskId);
}
