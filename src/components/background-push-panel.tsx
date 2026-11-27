"use client";
import { useEffect, useRef, useState } from "react";
type Config = { enabled: boolean; testOnly?: boolean; publicKey?: string; csrf?: string; workspace?: string };
type Device = { id: string; expiresAt: string };
export function BackgroundPushPanel({ scope }: { scope?: string }) {
  const [config, setConfig] = useState<Config | null>(null), [device, setDevice] = useState<Device | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const live = useRef(true), locked = useRef(false), pendingRequest = useRef<string | null>(null);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  async function request(action: string, method = "GET", input?: unknown, csrf = config?.csrf) {
    if (!scope || !live.current) throw new Error("scope");
    const response = await fetch("/api/push/" + action, { method, cache: "no-store", credentials: "same-origin",
      headers: { "x-axia-push-client": "1", "x-axia-organization-id": scope.split(":")[0], ...(method !== "GET" ? { "Content-Type": "application/json", "x-axia-push-csrf": csrf ?? "" } : {}) },
      ...(input ? { body: JSON.stringify(input) } : {}) });
    if (!response.ok) throw new Error("request");
    const value = await response.json();
    if (!live.current) throw new Error("scope"); return value;
  }
  async function operation(run: () => Promise<void>) {
    if (locked.current) return; locked.current = true; setBusy(true); setMessage("");
    try { await run(); } catch { if (live.current) setMessage("تعذّر إتمام الاختبار. افحص الاتصال وإذن الجهاز، ثم افحص جاهزية الخدمة مجددًا. لم يُؤكَّد وصول إشعار."); }
    finally { locked.current = false; if (live.current) setBusy(false); }
  }
  async function inspect() {
    if (!window.isSecureContext || !("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) {
      setConfig({ enabled: false }); setMessage("إرسال الخلفية غير متاح في وضع هذا المتصفح."); return;
    }
    const value: Config = await request("config");
    if (value.enabled && (value.workspace !== scope || !value.csrf || !value.publicKey || value.testOnly !== true)) throw new Error("scope");
    setConfig(value);
    setMessage(value.enabled ? "خدمة الاختبار جاهزة. الاشتراك اختياري ومؤقت، ولا يفعّل تذكيرات القضايا والمهام تلقائيًا." : "خدمة الخلفية تنتظر اعتماد وتجهيز بيئة الاختبار. لن نطلب إذنًا أو نسجّل اشتراكًا الآن.");
  }
  async function enroll() {
    if (!config?.enabled || !config.publicKey || config.workspace !== scope) return;
    // Permission request is the first asynchronous action after this explicit click.
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission !== "granted" || !live.current) { if (live.current) setMessage("لم يُمنح إذن الإشعارات. يمكنك تغييره من إعدادات الجهاز باختيارك."); return; }
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration?.active || registration.active.scriptURL !== new URL("/axia-sw.js", location.origin).href || !live.current) throw new Error("worker");
    const bytes = Uint8Array.from(atob(config.publicKey.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
    let subscription = await registration.pushManager.getSubscription(), created = false;
    if (subscription) {
      const previous = subscription.options.applicationServerKey;
      if (!previous || new Uint8Array(previous).length !== bytes.length || !new Uint8Array(previous).every((b, i) => b === bytes[i])) throw new Error("different_key");
    } else { subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes }); created = true; }
    try {
      if (!live.current) throw new Error("scope");
      const value: Device = await request("device", "POST", { installationId: crypto.randomUUID(), subscription: subscription.toJSON() });
      if (!value.id || !Number.isFinite(Date.parse(value.expiresAt))) throw new Error("response");
      setDevice(value); pendingRequest.current = null;
      setMessage("تم تسجيل جهاز الاختبار مؤقتًا حتى " + new Date(value.expiresAt).toLocaleTimeString("ar-EG",{timeZone:"Africa/Cairo"}) + " بتوقيت القاهرة. يمكنك الآن طلب الاختبار المؤجّل.");
    } catch (error) { if (created && live.current) await subscription.unsubscribe().catch(() => false); throw error; }
  }
  async function schedule() {
    if (!device) return;
    if (Date.parse(device.expiresAt) <= Date.now()) { setDevice(null); setMessage("انتهى اشتراك الاختبار المؤقت. افحص الجاهزية وسجّل الجهاز مجددًا باختيارك."); return; }
    pendingRequest.current ??= crypto.randomUUID();
    const result = await request("test", "POST", { deviceId: device.id, requestId: pendingRequest.current });
    if (!result.accepted || !Number.isFinite(Date.parse(result.scheduledAt))) throw new Error("response");
    pendingRequest.current = null;
    setMessage("قُبل طلب الاختبار للإرسال عند " + new Date(result.scheduledAt).toLocaleTimeString("ar-EG",{timeZone:"Africa/Cairo"}) + " بتوقيت القاهرة. اقفل AXIA اقفالًا عاديًا ثم اقفل الشاشة واترك الإنترنت متصلًا. قبول الطلب لا يؤكد وصول الإشعار.");
  }
  async function revoke() {
    if (!device) return;
    const result = await request("device", "DELETE", { deviceId: device.id });
    if (!result.revoked) throw new Error("response");
    setDevice(null); pendingRequest.current = null;
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (registration?.active?.scriptURL === new URL("/axia-sw.js",location.origin).href) await (await registration.pushManager.getSubscription())?.unsubscribe().catch(() => false);
    setMessage("تم إبطال اشتراك الاختبار على الخادم. إذن إشعارات النظام لا يتغير تلقائيًا.");
  }
  return <section aria-label="اختبار الإرسال والتطبيق مغلق" className="mt-4 border-t border-[var(--border)] pt-4">
    <h4 className="font-bold">اختبار الإشعار والتطبيق مغلق</h4>
    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">اختبار عام لجهاز أندرويد الحالي فقط، باشتراك مؤقت حتى ١٥ دقيقة. يحتاج تجهيز خدمة الخادم وموافقتك. لا يرسل بيانات قضايا أو يفعّل التذكيرات التلقائية.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className="axia-text-action" disabled={busy || !scope} onClick={() => void operation(inspect)}>فحص جاهزية الإرسال في الخلفية</button>
      {config?.enabled ? <button type="button" className="axia-primary-action" disabled={busy} onClick={() => void operation(enroll)}>السماح باختبار الخلفية لهذا الجهاز</button> : null}
      {device ? <>
        <button type="button" className="axia-primary-action" disabled={busy} onClick={() => void operation(schedule)}>اختبار بعد ٩٠ ثانية</button>
        <button type="button" className="axia-text-action" disabled={busy} onClick={() => void operation(revoke)}>إلغاء اشتراك الاختبار</button>
      </> : null}
    </div>
    {message ? <p role="status" className="mt-3 text-sm leading-7">{message}</p> : null}
  </section>;
}
