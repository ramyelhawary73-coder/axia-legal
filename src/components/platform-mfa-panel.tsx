"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PLATFORM_UUID } from "@/lib/platform-control";

type Factor = { id: string; status: string };
export function PlatformMfaPanel({ onVerified }: { onVerified: () => void }) {
  const router = useRouter();
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/platform/mfa", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!Array.isArray(data.factors)) throw new Error();
        if (controller.signal.aborted) return;
        setFactors(data.factors);
        setFactorId(data.factors.find((f: Factor) => f.status === "verified")?.id ?? "");
      }).catch(() => { if (!controller.signal.aborted) setError("تعذر تحميل وسائل المصادقة. أعد فتح الصفحة أو راجع المشغّل."); });
    return () => controller.abort();
  }, []);

  async function enroll() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/platform/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "enroll" }), cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !PLATFORM_UUID.test(data.factorId ?? "") || typeof data.qrCode !== "string" || !/^data:image\/(svg\+xml|png);/.test(data.qrCode)) throw new Error();
      setFactorId(data.factorId); setQrCode(data.qrCode);
    } catch { setError("تعذر بدء الربط. لا تكرر إنشاء وسائل المصادقة؛ أعد فتح الصفحة أو راجع المشغّل."); }
    finally { setBusy(false); }
  }
  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code) || !PLATFORM_UUID.test(factorId)) return;
    const value = code; setCode(""); setBusy(true); setError("");
    try {
      const response = await fetch("/api/platform/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", factorId, code: value }), cache: "no-store" });
      const data = await response.json();
      if (!response.ok || data.verified !== true) throw new Error();
      setQrCode(null);
      router.refresh();
      onVerified();
    } catch { setError("تعذر التحقق من الرمز أو الصلاحية. استخدم رمزًا جديدًا؛ لو فقدت جهاز المصادقة راجع المشغّل."); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="mfa-heading" className="mx-auto max-w-lg space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-8">
    <div><h2 id="mfa-heading" className="text-xl font-bold">حماية حساب المطوّر</h2><p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">أكمل التحقق بخطوتين باستخدام تطبيق المصادقة للوصول إلى إدارة المنصة.</p></div>
    {factors === null && !error ? <p role="status">جارٍ تحميل وسائل المصادقة…</p> : null}
    {factors?.length === 0 && !factorId ? <button type="button" disabled={busy} onClick={() => void enroll()} className="w-full rounded-xl bg-[var(--axia-gold)] px-4 py-3 font-bold text-slate-950 disabled:opacity-50">ربط تطبيق المصادقة</button> : null}
    {factors?.some(f => f.status === "unverified") && !factorId ? <p role="status" className="text-sm leading-7">يوجد ربط غير مكتمل. أكمله من الشاشة الأصلية أو راجع المشغّل؛ لن نحذف وسيلة مصادقة تلقائيًا.</p> : null}
    {qrCode ? <div className="space-y-3 text-center"><Image src={qrCode} unoptimized width={192} height={192} alt="رمز ربط تطبيق المصادقة — خاص بحسابك" className="mx-auto rounded-lg bg-white p-2" /><p className="text-sm leading-7">امسح الرمز داخل تطبيق المصادقة. لا تشاركه أو تحفظه في محادثة أو تقرير.</p></div> : null}
    {factorId ? <form onSubmit={event => void verify(event)} className="space-y-3">
      <label htmlFor="platform-totp" className="block text-sm font-bold">رمز تطبيق المصادقة</label>
      <input id="platform-totp" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required dir="ltr" className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-center text-xl tracking-[0.3em] outline-none focus-visible:ring-2 focus-visible:ring-[var(--axia-gold)]" />
      <button disabled={busy || code.length !== 6} className="w-full rounded-xl bg-[var(--axia-gold)] px-4 py-3 font-bold text-slate-950 disabled:opacity-50">{busy ? "جارٍ التحقق…" : "تأكيد الرمز"}</button>
    </form> : null}
    {error ? <p role="alert" className="text-sm leading-7 text-red-600 dark:text-red-300">{error}</p> : null}
    <p className="text-xs leading-6 text-[var(--text-muted)]">فقدان تطبيق المصادقة يحتاج إجراء استرداد مراجَع. دخول المكتب الحالي لم يتغير.</p>
  </section>;
}
