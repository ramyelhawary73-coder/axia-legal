"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AxiaBrandLogo } from "@/components/axia-brand-logo";
import { invitationLogin, invitationLogout } from "./actions";
import { isInvitationToken } from "@/lib/staff-invitations";
import { readJsonResponse } from "@/lib/api/client-response";

type Session = { authenticated: boolean; email?: string; confirmed?: boolean; registrationEnabled?: boolean };
const inputClass = "min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-[var(--text)]";
const primaryClass = "min-h-12 w-full rounded-xl bg-[var(--axia-gold)] px-4 py-3 font-bold text-black disabled:opacity-50";
export default function AcceptStaffInvitation() {
  const token = useRef<string | null>(null);
  const operation = useRef(false);
  const [hasInvitation, setHasInvitation] = useState<boolean | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [checkEmail, setCheckEmail] = useState(false);

  async function loadSession() {
    const response = await fetch("/api/staff-invitations/accept", { cache: "no-store" });
    if (response.status === 401) {
      const data = await response.json();
      setSession({ authenticated: false, registrationEnabled: data.registrationEnabled === true });
      return;
    }
    setSession(await readJsonResponse<Session>(response, "تعذر التحقق من حسابك."));
  }
  useEffect(() => {
    function readLocation() {
      const value = new URLSearchParams(window.location.hash.slice(1)).get("token");
      const confirmation = new URLSearchParams(window.location.search).get("confirmation");
      if (value && isInvitationToken(value)) token.current = value;
      else if (window.location.hash) token.current = null;
      window.history.replaceState(null, "", window.location.pathname);
      setHasInvitation(Boolean(token.current));
      setSession(null);
      setNotice(null);
      setError(null);
      setAccepted(false);
      setCheckEmail(false);
      setMode("login");
      if (!token.current) {
        if (confirmation === "success") setNotice("تم تأكيد بريدك. افتح رابط الدعوة الأصلي من إدارة المكتب لإكمال الانضمام.");
        else if (confirmation === "failed") setError("تعذر إكمال التأكيد هنا. إذا أكدت بريدك على جهاز آخر، افتح الدعوة الأصلية وسجّل الدخول؛ وإلا راجع إدارة المكتب.");
        else if (confirmation === "unavailable") setNotice("تأكيد الحسابات الجديدة غير متاح حاليًا. تواصل مع إدارة المكتب.");
        else if (confirmation === "account_conflict") setNotice("يوجد حساب مسجَّل بالفعل. افتح الدعوة الأصلية بالحساب المدعو، أو استخدم نافذة خاصة لتأكيد حساب آخر.");
        else setError("رابط الدعوة غير صالح. افتح رابطًا جديدًا من إدارة المكتب.");
        return;
      }
      void loadSession().catch(() => setError("تعذر تحميل الدعوة. حاول فتح رابط الدعوة مجددًا."));
    }
    readLocation();
    // Reopening the original link in this same tab can be a fragment navigation.
    window.addEventListener("hashchange", readLocation);
    window.addEventListener("popstate", readLocation);
    return () => {
      window.removeEventListener("hashchange", readLocation);
      window.removeEventListener("popstate", readLocation);
    };
  }, []);

  async function run(action: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError(null);
    try { await action(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "تعذر إكمال الطلب. حاول مرة أخرى."); }
    finally { operation.current = false; setBusy(false); }
  }
  async function submit(formData: FormData) {
    await run(async () => {
      if (mode === "login") {
        const result = await invitationLogin(formData);
        if (result.error) setError(result.error);
        else await loadSession();
      } else {
        const response = await fetch("/api/staff-registration", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.get("email"), password: formData.get("password"), passwordConfirmation: formData.get("passwordConfirmation") }),
        });
        await readJsonResponse(response, "تعذر بدء التسجيل. حاول لاحقًا.");
        setCheckEmail(true);
      }
    });
  }
  async function accept() {
    await run(async () => {
      if (!token.current) throw new Error("افتح رابط الدعوة الأصلي أولًا.");
      const acceptingToken = token.current;
      const response = await fetch("/api/staff-invitations/accept", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: acceptingToken }),
      });
      await readJsonResponse(response, "تعذر قبول الدعوة.");
      if (token.current !== acceptingToken) return;
      token.current = null;
      setAccepted(true);
    });
  }
  async function switchAccount() {
    await run(async () => { await invitationLogout(); await loadSession(); });
  }
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--bg)] p-4 text-[var(--text)]" dir="rtl">
      <section aria-busy={busy} className="w-full max-w-lg space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
        <AxiaBrandLogo />
        <h1 className="text-2xl font-bold">الانضمام لفريق المكتب</h1>
        {error && <p role="alert" className="rounded-xl border border-red-500/30 p-3 text-sm leading-7">{error}</p>}
        {notice && <p role="status" className="text-sm leading-7">{notice}</p>}
        {accepted ? (
          <div role="status" className="space-y-4">
            <p>تم قبول الدعوة. صلاحياتك مرتبطة بمكتبك والدور المحدد لك.</p>
            <Link href="/" className="inline-flex min-h-12 items-center rounded-xl bg-[var(--axia-gold)] px-5 text-black">فتح مساحة العمل</Link>
          </div>
        ) : hasInvitation === null ? <p role="status">جارٍ التحقق من الدعوة...</p> : !hasInvitation ? (
          <p className="text-sm leading-7 text-[var(--text-muted)]">تأكيد البريد لا يمنح عضوية المكتب تلقائيًا. تحتاج رابط الدعوة الأصلي وقبولها بالحساب المدعو.</p>
        ) : session?.authenticated ? (
          <div className="space-y-4">
            <p className="break-all text-sm">الحساب الحالي: <bdi>{session.email}</bdi></p>
            <p className="text-sm leading-7 text-[var(--text-muted)]">القبول متاح للبريد المؤكَّد المطابق للدعوة فقط. لا يمنحك الرابط صلاحيات خارج المكتب.</p>
            {!session.confirmed && <p role="status">أكد بريدك الإلكتروني أولًا، ثم حدّث حالة الحساب.</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={() => void switchAccount()} className="min-h-11 rounded-xl border border-[var(--border)] px-4 py-2 text-sm">استخدام حساب آخر</button>
              {!session.confirmed && <button type="button" disabled={busy} onClick={() => void run(loadSession)} className="min-h-11 rounded-xl border border-[var(--border)] px-4 py-2 text-sm">حدّث حالة الحساب</button>}
            </div>
            <button type="button" onClick={() => void accept()} disabled={busy || !session.confirmed} className={primaryClass}>{busy ? "جارٍ التحقق..." : "قبول الدعوة"}</button>
          </div>
        ) : checkEmail ? (
          <div className="space-y-4">
            <p role="status" className="text-sm leading-7">إذا كان التسجيل متاحًا لهذا البريد، راجع رسالة التأكيد. إن لم تصلك، تواصل مع إدارة المكتب. بعد التأكيد افتح رابط الدعوة الأصلي، وسجّل الدخول بنفس البريد ثم اقبل الدعوة.</p>
            <p className="text-sm leading-7 text-[var(--text-muted)]">إنشاء الحساب لا يمنحك عضوية المكتب أو أي دور تلقائيًا.</p>
            <button type="button" onClick={() => { setCheckEmail(false); setMode("login"); setError(null); }} className={primaryClass}>العودة لتسجيل الدخول</button>
          </div>
        ) : session ? (
          <form action={submit} className="space-y-4">
            <p className="text-sm leading-7 text-[var(--text-muted)]">{mode === "signup" ? "أنشئ حسابك بنفس البريد المدعو، واختر كلمة مرور خاصة بك. بعد تأكيد البريد ارجع إلى رابط الدعوة الأصلي." : "سجّل الدخول بحسابك المؤكَّد بنفس البريد المدعو لإكمال الانضمام."}</p>
            <label className="block space-y-2">
              <span>البريد الإلكتروني</span>
              <input required name="email" type="email" autoComplete={mode === "signup" ? "email" : "username"} maxLength={254} dir="ltr" className={inputClass} />
            </label>
            <label className="block space-y-2">
              <span>كلمة المرور</span>
              <input required name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 12 : undefined} maxLength={mode === "signup" ? 128 : undefined} dir="ltr" className={inputClass} />
            </label>
            {mode === "signup" && <>
              <label className="block space-y-2"><span>تأكيد كلمة المرور</span><input required name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} dir="ltr" className={inputClass} /></label>
              <p className="text-xs leading-6 text-[var(--text-muted)]">استخدم ١٢ حرفًا على الأقل. لا تشارك كلمة مرورك مع إدارة المكتب.</p>
            </>}
            <button disabled={busy} className={primaryClass}>{busy ? "جارٍ التحقق..." : mode === "signup" ? "إنشاء الحساب ومتابعة التأكيد" : "تسجيل الدخول للمتابعة"}</button>
            {session.registrationEnabled ? <button type="button" disabled={busy} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }} className="min-h-11 w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm">{mode === "login" ? "ليس لدي حساب — إنشاء حساب" : "لدي حساب — تسجيل الدخول"}</button> : <p className="text-sm leading-7 text-[var(--text-muted)]">إنشاء الحسابات الجديدة غير متاح حاليًا. تواصل مع إدارة المكتب.</p>}
          </form>
        ) : !error ? <p role="status">جارٍ التحقق من حسابك...</p> : null}
      </section>
    </main>
  );
}
