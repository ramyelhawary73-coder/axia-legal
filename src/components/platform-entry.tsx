"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { PlatformState } from "@/lib/platform-control";
import { PlatformMfaPanel } from "@/components/platform-mfa-panel";
import { PlatformConsole } from "@/components/platform-console";
import { PlatformPasswordPanel } from "@/components/platform-password-panel";
import styles from "@/components/platform-workspace.module.css";

type Entry = PlatformState | "PLATFORM_DISABLED" | "unavailable";
export function PlatformEntry({ initialState }: { initialState: Entry }) {
  const [state, setState] = useState<Entry>(initialState);
  const [revision, setRevision] = useState(0);
  const [accountSecurity, setAccountSecurity] = useState(false);
  const reload = useCallback(() => setRevision(n => n + 1), []);
  const requireMfa = useCallback(() => setState("mfa_required"), []);
  // Revalidate on entry and after MFA. A browser state never grants server authority;
  // every data endpoint independently checks the live role/session again.
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/platform/context", { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (controller.signal.aborted) return;
      setState(response.ok && ["ready", "mfa_required"].includes(data.state) ? data.state : data.code === "PLATFORM_DISABLED" ? "PLATFORM_DISABLED" : "unavailable");
    }).catch(() => { if (!controller.signal.aborted) setState("unavailable"); });
    return () => controller.abort();
  }, [revision]);
  if (state === "ready") return <div className="space-y-5"><div className="flex justify-end"><button type="button" aria-expanded={accountSecurity} onClick={() => setAccountSecurity(v => !v)} className={styles.button}>{accountSecurity ? "العودة لإدارة المكاتب" : "أمان الحساب"}</button></div>{accountSecurity ? <PlatformPasswordPanel onMfaRequired={requireMfa} /> : <PlatformConsole onMfaRequired={requireMfa} />}</div>;
  if (state === "mfa_required") return <PlatformMfaPanel onVerified={reload} />;
  return <section className="mx-auto max-w-lg space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
    <h2 className="text-xl font-bold">{state === "PLATFORM_DISABLED" ? "إدارة المنصة غير مفعلة" : "الوصول إلى إدارة المنصة غير متاح"}</h2>
    <p className="text-sm leading-7 text-[var(--text-muted)]">{state === "PLATFORM_DISABLED" ? "التجهيزات متاحة للمراجعة فقط. لم تُفعّل صلاحيات المطوّر في هذه البيئة، ودخول المكتب الحالي مستمر." : "يلزم حساب مطوّر مخوّل وجلسة صالحة. صلاحية مالك المكتب لا تمنح إدارة المنصة تلقائيًا."}</p>
    <Link prefetch={false} href="/login?next=/platform" className="inline-block rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold">تسجيل الدخول إلى إدارة المنصة</Link>
  </section>;
}
