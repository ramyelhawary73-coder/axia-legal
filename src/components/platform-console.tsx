"use client";

import { useEffect, useState } from "react";
import { ControlCenter, controlRequest } from "@/components/control-center";
import type { PlatformAudit, PlatformOffice, PlatformPage } from "@/lib/platform-control";

export function PlatformConsole({ onMfaRequired }: { onMfaRequired: () => void }) {
  const [mode, setMode] = useState<"loading" | "foundation" | "control" | "unavailable">("loading");
  useEffect(() => {
    const controller = new AbortController();
    void controlRequest<{ version: number }>("capabilities", null, {}, controller.signal)
      .then(data => { if (!controller.signal.aborted) setMode(data.version === 1 ? "control" : "unavailable"); })
      .catch(error => { if (!controller.signal.aborted) { if (error.message === "MFA_REQUIRED") onMfaRequired(); else setMode(error.message === "CONTROL_DISABLED" ? "foundation" : "unavailable"); } });
    return () => controller.abort();
  }, [onMfaRequired]);
  if (mode === "loading") return <p role="status">جارٍ تحميل أدوات إدارة المنصة…</p>;
  if (mode === "control") return <ControlCenter onMfaRequired={onMfaRequired} />;
  return <>{mode === "unavailable" ? <p role="alert" className="mb-4 text-sm">مركز التحكم غير متاح حاليًا. العمليات الجديدة متوقفة؛ دليل المنصة الأساسي متاح أدناه.</p> : null}<FoundationPlatformConsole onMfaRequired={onMfaRequired} /></>;
}

function FoundationPlatformConsole({ onMfaRequired }: { onMfaRequired: () => void }) {
  const [tab, setTab] = useState<"offices" | "audit">("offices");
  const [cursor, setCursor] = useState<string | null>(null);
  const [data, setData] = useState<PlatformPage<PlatformOffice | PlatformAudit>>({ items: [], nextCursor: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/platform/${tab}${cursor ? `?after=${encodeURIComponent(cursor)}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const body = await response.json();
        if (controller.signal.aborted) return;
        if (body.code === "PLATFORM_MFA_REQUIRED") { onMfaRequired(); return; }
        if (!response.ok || !Array.isArray(body.items)) throw new Error();
        setData(body); setError("");
      }).catch(() => { if (!controller.signal.aborted) { setData({ items: [], nextCursor: null }); setError("تعذر تحميل البيانات أو انتهت صلاحيتك. أعد تسجيل الدخول وتحقق من المصادقة."); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [tab, cursor, onMfaRequired]);
  function navigate(nextTab: "offices" | "audit", nextCursor: string | null = null) {
    setLoading(true); setError(""); setData({ items: [], nextCursor: null }); setTab(nextTab); setCursor(nextCursor);
  }
  return <section className="space-y-5" aria-label="لوحة إدارة المنصة">
    <div className="flex flex-wrap gap-2" role="group" aria-label="أقسام إدارة المنصة">
      <button type="button" aria-pressed={tab === "offices"} onClick={() => tab !== "offices" && navigate("offices")} className={`rounded-xl border px-5 py-3 text-sm font-bold ${tab === "offices" ? "border-[var(--axia-gold)] bg-[var(--axia-gold-dim)]" : "border-[var(--border)]"}`}>دليل المكاتب</button>
      <button type="button" aria-pressed={tab === "audit"} onClick={() => tab !== "audit" && navigate("audit")} className={`rounded-xl border px-5 py-3 text-sm font-bold ${tab === "audit" ? "border-[var(--axia-gold)] bg-[var(--axia-gold-dim)]" : "border-[var(--border)]"}`}>سجل إدارة المنصة</button>
    </div>
    <div className="min-h-80 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-6" aria-busy={loading}>
      {loading ? <p role="status">جارٍ تحميل البيانات…</p> : error ? <p role="alert" className="text-sm leading-7 text-red-600 dark:text-red-300">{error}</p> : data.items.length === 0 ? <p className="text-[var(--text-muted)]">لا توجد بيانات في هذه الصفحة.</p> : <ul className="grid gap-3 md:grid-cols-2">
        {data.items.map(item => <li key={item.id} className="min-w-0 space-y-2 rounded-xl border border-[var(--border)] p-4">
          {"name" in item ? <><h2 className="break-words font-bold">{item.name}</h2><p dir="ltr" className="break-all text-right text-sm text-[var(--text-muted)]">{item.slug}</p></> : <><h2 className="break-all font-bold">{item.action}</h2><p className="text-sm text-[var(--text-muted)]">{"actorType" in item && item.actorType === "operator" ? "إجراء بواسطة المشغّل" : "إجراء بواسطة مستخدم مخوّل"}</p></>}
          <p dir="ltr" className="break-all text-right text-xs text-[var(--text-muted)]">{item.id}</p>
          <time className="block text-xs text-[var(--text-muted)]" dateTime={item.createdAt}>{new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeZone: "Africa/Cairo" }).format(new Date(item.createdAt))}</time>
        </li>)}
      </ul>}
    </div>
    <div className="flex flex-wrap gap-3">
      {cursor ? <button type="button" disabled={loading} onClick={() => navigate(tab)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-50">أول صفحة</button> : null}
      {data.nextCursor ? <button type="button" disabled={loading} onClick={() => navigate(tab, data.nextCursor)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-50">الصفحة التالية</button> : null}
    </div>
    <p className="text-xs leading-7 text-[var(--text-muted)]">يعرض الدليل بيانات تعريف المكاتب فقط. القضايا والبيانات القانونية تظل خاضعة لصلاحيات المكتب والقضية. لا توجد أدوات لمنح الأدوار أو إرسال البريد هنا.</p>
  </section>;
}
