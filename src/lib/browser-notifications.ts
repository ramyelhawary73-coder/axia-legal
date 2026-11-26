export type NotificationPermissionStatus = "granted" | "denied" | "default" | "unsupported" | "restricted";
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && "Notification" in window && "serviceWorker" in navigator;
}
export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (!isBrowserNotificationSupported()) return "unsupported";
  try { return window.Notification.permission; } catch { return "restricted"; }
}
// Call only from an explicit user action. No mount/timer permission prompts.
export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionStatus> {
  const current = getNotificationPermissionStatus();
  if (current !== "default") return current;
  try { return await window.Notification.requestPermission(); } catch { return "restricted"; }
}
export async function sendPublicWorkspaceNotification({ test = false, shouldDisplay = () => true }: { test?: boolean; shouldDisplay?: () => boolean } = {}): Promise<boolean> {
  if (getNotificationPermissionStatus() !== "granted" || !shouldDisplay()) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const expected = new URL("/axia-sw.js", window.location.origin).href;
    if (!registration?.active || registration.active.scriptURL !== expected || typeof registration.showNotification !== "function") return false;
    if (getNotificationPermissionStatus() !== "granted" || !shouldDisplay()) return false;
    await registration.showNotification(test ? "AXIA Legal · إشعار تجريبي" : "AXIA Legal · تذكير من مساحة العمل", {
      body: test ? "هذا اختبار لعرض إشعارات هذا الجهاز فقط. الإرسال عند إغلاق التطبيق غير مفعّل بعد." : "لديك موعد يحتاج المراجعة. افتح مساحة العمل للاطلاع على التفاصيل.",
      icon: "/pwa/icon-192.png", badge: "/pwa/notification-badge-96.png", tag: test ? "axia-notification-test" : "axia-workspace-reminder",
      dir: "rtl", lang: "ar", data: { path: "/?workspace=1" },
    });
    return true;
  } catch { return false; }
}
