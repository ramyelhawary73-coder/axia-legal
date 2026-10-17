"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AxiaBrandLogo } from "@/components/axia-brand-logo";
import { invitationLogin, invitationLogout } from "./actions";
import { isInvitationToken } from "@/lib/staff-invitations";
import { readJsonResponse } from "@/lib/api/client-response";

type Session = { authenticated: boolean; email?: string; confirmed?: boolean };
export default function AcceptStaffInvitation() {
  const token = useRef<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  async function loadSession() {
    const response = await fetch("/api/staff-invitations/accept", {
      cache: "no-store",
    });
    if (response.status === 401) {
      setSession({ authenticated: false });
      return;
    }
    setSession(
      await readJsonResponse<Session>(response, "تعذر التحقق من حسابك."),
    );
  }
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    if (value && isInvitationToken(value)) token.current = value;
    window.history.replaceState(null, "", window.location.pathname);
    if (!token.current) {
      setError("رابط الدعوة غير صالح. افتح رابطًا جديدًا من إدارة المكتب.");
      return;
    }
    void loadSession().catch(() =>
      setError("تعذر تحميل الدعوة. حاول فتح رابط الدعوة مجددًا."),
    );
  }, []);

  async function login(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const result = await invitationLogin(formData);
      if (result.error) setError(result.error);
      else await loadSession();
    } catch {
      setError("تعذر تسجيل الدخول. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }
  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/staff-invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.current }),
      });
      await readJsonResponse(response, "تعذر قبول الدعوة.");
      token.current = null;
      setAccepted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر قبول الدعوة.");
    } finally {
      setBusy(false);
    }
  }
  async function switchAccount() {
    setBusy(true);
    setError(null);
    try {
      await invitationLogout();
      await loadSession();
    } catch {
      setError("تعذر تغيير الحساب. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }
  const inputClass =
    "min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-[var(--text)]";
  return (
    <main
      className="grid min-h-dvh place-items-center bg-[var(--bg)] p-4 text-[var(--text)]"
      dir="rtl"
    >
      <section className="w-full max-w-lg space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
        <AxiaBrandLogo />
        <h1 className="text-2xl font-bold">الانضمام لفريق المكتب</h1>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/30 p-3 text-sm"
          >
            {error}
          </p>
        )}
        {accepted ? (
          <div role="status" className="space-y-4">
            <p>تم قبول الدعوة. صلاحياتك مرتبطة بمكتبك والدور المحدد لك.</p>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center rounded-xl bg-[var(--axia-gold)] px-5 text-black"
            >
              فتح مساحة العمل
            </Link>
          </div>
        ) : session?.authenticated ? (
          <div className="space-y-4">
            <p className="break-all text-sm">
              الحساب الحالي: <bdi>{session.email}</bdi>
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              القبول متاح للبريد المؤكَّد المطابق للدعوة فقط. لا يمنحك الرابط
              صلاحيات خارج المكتب.
            </p>
            {!session.confirmed && (
              <p role="status">أكد بريدك الإلكتروني أولًا.</p>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void switchAccount()}
              className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm"
            >
              استخدام حساب آخر
            </button>
            <button
              type="button"
              onClick={() => void accept()}
              disabled={busy || !session.confirmed}
              className="min-h-12 w-full rounded-xl bg-[var(--axia-gold)] px-4 font-bold text-black disabled:opacity-50"
            >
              {busy ? "جارٍ التحقق..." : "قبول الدعوة"}
            </button>
          </div>
        ) : session ? (
          <form action={login} className="space-y-4">
            <p className="text-sm leading-7 text-[var(--text-muted)]">
              سجّل الدخول بحسابك المؤكَّد بنفس البريد المدعو. إذا لم يكن لديك
              حساب، تواصل مع إدارة المكتب لتجهيزه؛ إنشاء الحسابات وإرسال البريد
              لم يُفعّلا في هذه المرحلة.
            </p>
            <label className="block space-y-2">
              <span>البريد الإلكتروني</span>
              <input
                required
                name="email"
                type="email"
                autoComplete="username"
                dir="ltr"
                className={inputClass}
              />
            </label>
            <label className="block space-y-2">
              <span>كلمة المرور</span>
              <input
                required
                name="password"
                type="password"
                autoComplete="current-password"
                className={inputClass}
              />
            </label>
            <button
              disabled={busy}
              className="min-h-12 w-full rounded-xl bg-[var(--axia-gold)] px-4 font-bold text-black disabled:opacity-50"
            >
              {busy ? "جارٍ الدخول..." : "تسجيل الدخول للمتابعة"}
            </button>
          </form>
        ) : !error ? (
          <p role="status">جارٍ التحقق من حسابك...</p>
        ) : null}
      </section>
    </main>
  );
}
