"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type PwaContextValue = {
  standalone: boolean; installed: boolean; canInstall: boolean;
  shell: "preparing" | "ready" | "unavailable"; online: boolean | null; message: string;
  install: () => Promise<void>; checkUpdate: () => Promise<void>;
};
const PwaContext = createContext<PwaContextValue | null>(null);
export function usePwa() {
  const value = useContext(PwaContext);
  if (!value) throw new Error("PWA provider unavailable");
  return value;
}
export function PwaProvider({ children }: { children: ReactNode }) {
  const [standalone, setStandalone] = useState(false), [installed, setInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false), [message, setMessage] = useState("");
  const [shell, setShell] = useState<PwaContextValue["shell"]>("preparing");
  const [online, setOnline] = useState<boolean | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null), [updating, setUpdating] = useState(false);
  const installEvent = useRef<InstallEvent | null>(null);
  const registration = useRef<ServiceWorkerRegistration | null>(null), reloadRequested = useRef(false);
  useEffect(() => {
    let live = true;
    const display = window.matchMedia("(display-mode: standalone)");
    const syncDisplay = () => setStandalone(display.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const syncOnline = () => setOnline(navigator.onLine);
    const beforeInstall = (event: Event) => { event.preventDefault(); installEvent.current = event as InstallEvent; setCanInstall(true); };
    const onInstalled = () => { installEvent.current = null; setCanInstall(false); setInstalled(true); setMessage("تم تثبيت AXIA. افتحه من أيقونته على جهازك."); };
    const onControllerChange = () => { if (reloadRequested.current) { reloadRequested.current = false; window.location.reload(); } };
    display.addEventListener("change", syncDisplay);
    window.addEventListener("online", syncOnline); window.addEventListener("offline", syncOnline);
    window.addEventListener("beforeinstallprompt", beforeInstall); window.addEventListener("appinstalled", onInstalled);
    queueMicrotask(() => { if (live) { syncDisplay(); syncOnline(); } });
    const cleaners: (() => void)[] = [];
    if (window.isSecureContext && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      void navigator.serviceWorker.register("/axia-sw.js", { scope: "/", updateViaCache: "none" }).then(reg => {
        if (!live) return;
        registration.current = reg;
        if (reg.active) setShell("ready");
        if (reg.waiting && reg.active) setWaiting(reg.waiting);
        const track = (worker: ServiceWorker) => {
          const onState = () => {
            if (!live) return;
            if (worker.state === "activated") { setShell("ready"); setWaiting(current => current === worker ? null : current); }
            if (worker.state === "installed" && reg.waiting && reg.active) setWaiting(reg.waiting);
            if (worker.state === "redundant" && !reg.active) setShell("unavailable");
          };
          worker.addEventListener("statechange", onState); cleaners.push(() => worker.removeEventListener("statechange", onState)); onState();
        };
        const onUpdate = () => { if (reg.installing) track(reg.installing); };
        reg.addEventListener("updatefound", onUpdate); cleaners.push(() => reg.removeEventListener("updatefound", onUpdate));
        if (reg.installing) track(reg.installing);
      }).catch(() => { if (live) setShell("unavailable"); });
    } else queueMicrotask(() => { if (live) setShell("unavailable"); });
    return () => {
      live = false; display.removeEventListener("change", syncDisplay);
      window.removeEventListener("online", syncOnline); window.removeEventListener("offline", syncOnline);
      window.removeEventListener("beforeinstallprompt", beforeInstall); window.removeEventListener("appinstalled", onInstalled);
      if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      cleaners.forEach(clean => clean());
    };
  }, []);
  async function install() {
    const event = installEvent.current; if (!event) return;
    installEvent.current = null; setCanInstall(false);
    try { await event.prompt(); const choice = await event.userChoice; setMessage(choice.outcome === "accepted" ? "تم قبول طلب التثبيت. راجع تأكيد المتصفح." : "يمكنك التثبيت لاحقًا من قائمة المتصفح."); }
    catch { setMessage("استخدم خيار التثبيت من قائمة المتصفح."); }
  }
  async function checkUpdate() {
    if (!registration.current) { setMessage("تعذر فحص التحديث الآن. تأكد من الاتصال وأعد فتح الصفحة."); return; }
    try { await registration.current.update(); if (registration.current.waiting && registration.current.active) setWaiting(registration.current.waiting); setMessage("تم طلب فحص التحديث. لو توفرت نسخة جديدة سيظهر تنبيه قبل إعادة التحميل."); }
    catch { setMessage("تعذر فحص التحديث الآن. حاول بعد عودة الاتصال."); }
  }
  return <PwaContext.Provider value={{ standalone, installed, canInstall, shell, online, install, checkUpdate, message }}>
    {children}
    {waiting ? <aside aria-label="تحديث AXIA" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-xl rounded-2xl border border-[var(--axia-gold)] bg-[var(--panel)] p-5 text-[var(--text)] shadow-2xl">
      <p className="text-base font-bold">تحديث جديد جاهز</p>
      <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">احفظ عملك في كل النوافذ أولًا. التحديث يعيد تحميل هذه النافذة عند اختيارك، وقد تحتاج النوافذ الأخرى إلى إعادة فتح لاحقًا.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={updating} onClick={() => { reloadRequested.current = true; setUpdating(true); waiting.postMessage({ type: "AXIA_ACTIVATE_UPDATE" }); }} className="min-h-11 rounded-xl bg-[var(--axia-gold)] px-5 py-2 text-sm font-bold text-slate-950 disabled:opacity-60">{updating ? "جارٍ تجهيز التحديث…" : "حفظت عملي، أعد التحميل"}</button>
        <button type="button" disabled={updating} onClick={() => setWaiting(null)} className="min-h-11 rounded-xl border border-[var(--border)] px-5 py-2 text-sm">لاحقًا</button>
      </div>
    </aside> : null}
  </PwaContext.Provider>;
}
