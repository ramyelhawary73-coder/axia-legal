"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import styles from "@/components/platform-workspace.module.css";

export function PlatformPasswordPanel({ onMfaRequired }: { onMfaRequired: () => void }) {
  const fieldId = useId();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [currentRequired, setCurrentRequired] = useState(false);

  async function send(body: Record<string, string>) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/platform/password", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (data.code === "PLATFORM_MFA_REQUIRED") { onMfaRequired(); return; }
      if (!response.ok) {
        if (data.code === "PASSWORD_REAUTH_REQUIRED") setNeedsCode(true);
        if (data.code === "PASSWORD_CURRENT_REQUIRED") setCurrentRequired(true);
        setError(typeof data.error === "string" ? data.error : "تعذر تأكيد العملية. احتفظ بجلستك الحالية.");
        return;
      }
      if (body.action === "reauthenticate" && data.status === "code_requested") {
        setNeedsCode(true); setMessage("تم طلب إرسال رمز التأكيد إلى بريد حسابك. راجع البريد والرسائل غير المرغوب فيها؛ وصوله لم يُتحقق منه هنا.");
      } else if (body.action === "update" && data.status === "password_updated") {
        setNeedsCode(false); setCurrentRequired(false);
        setMessage("تم تغيير كلمة المرور. احتفظ بهذه الصفحة مفتوحة واختبر الدخول بالكلمة الجديدة في نافذة أخرى، ثم أكمل MFA.");
      } else setError("تعذر تأكيد النتيجة. احتفظ بالجلسة الحالية واختبر الدخول في نافذة أخرى قبل إعادة المحاولة.");
    } catch { setError("انقطع الاتصال أو تعذر قراءة النتيجة. احتفظ بالجلسة الحالية واختبر الدخول في نافذة أخرى قبل إعادة المحاولة."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget, values = new FormData(form);
    const password = String(values.get("password") ?? "");
    if (password !== values.get("passwordConfirmation")) { setError("كلمتا المرور غير متطابقتين."); return; }
    const currentPassword = String(values.get("currentPassword") ?? ""), nonce = String(values.get("nonce") ?? "").trim();
    // Sensitive values live only in this request; never persist, log or auto-retry them.
    form.reset();
    void send({ action: "update", password, passwordConfirmation: password, ...(currentPassword ? { currentPassword } : {}), ...(nonce ? { nonce } : {}) });
  }

  return <section aria-labelledby="platform-password-heading" className={`${styles.surface} mx-auto max-w-2xl space-y-5`}>
    <div><h2 id="platform-password-heading" className={styles.sectionHeading}><KeyRound size={20} aria-hidden="true" />أمان حساب المطوّر</h2><p className={styles.muted}>اختر كلمة مرور جديدة لحسابك الحالي فقط. احتفظ بجلستك المفتوحة حتى تتأكد من الدخول بالكلمة الجديدة. يظل التحقق بخطوتين مطلوبًا.</p></div>
    <form onSubmit={update} autoComplete="off" className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <label className={styles.label}><span id={`${fieldId}-current`}>كلمة المرور الحالية {currentRequired ? "— مطلوبة" : "— إن كنت تعرفها"}</span><input name="currentPassword" type="password" aria-labelledby={`${fieldId}-current`} aria-describedby={`${fieldId}-current-hint`} autoComplete="current-password" dir="ltr" maxLength={128} required={currentRequired} className={styles.field} /><span id={`${fieldId}-current-hint`} className={styles.hint}>قد تتطلب سياسة الحساب الكلمة الحالية؛ لن نغيّر إعدادات الأمان لتجاوزها.</span></label>
        <label className={styles.label}><span id={`${fieldId}-new`}>كلمة المرور الجديدة</span><input name="password" type="password" aria-labelledby={`${fieldId}-new`} aria-describedby={`${fieldId}-new-hint`} autoComplete="new-password" dir="ltr" minLength={12} maxLength={128} required className={styles.field} /><span id={`${fieldId}-new-hint`} className={styles.hint}>١٢ حرفًا على الأقل. استخدم كلمة فريدة لم تشاركها في محادثة.</span></label>
        <label className={styles.label}><span>تأكيد كلمة المرور الجديدة</span><input name="passwordConfirmation" type="password" autoComplete="new-password" dir="ltr" minLength={12} maxLength={128} required className={styles.field} /></label>
        {needsCode ? <label className={styles.label}><span>رمز التأكيد من البريد</span><input name="nonce" type="text" autoComplete="one-time-code" dir="ltr" maxLength={128} required className={styles.field} /></label> : null}
        <p className={styles.hint}>قد يصلك إشعار أمان من خدمة الدخول بعد التغيير. لا تشارك كلمة المرور أو رمز التأكيد مع أي شخص.</p>
        <button type="submit" className={`${styles.button} ${styles.primary}`}>{busy ? "جارٍ تنفيذ الطلب…" : "حفظ كلمة المرور الجديدة"}</button>
      </fieldset>
    </form>
    {needsCode ? <div className="space-y-2"><p className={styles.hint}>اضغط عند الحاجة لإرسال رمز إلى بريد حسابك الحالي، ثم أدخله أعلاه مع كلمة المرور الجديدة.</p><button type="button" disabled={busy} onClick={() => void send({ action: "reauthenticate" })} className={styles.button}>إرسال رمز تأكيد إلى بريدي</button></div> : null}
    {error ? <p role="alert" className={styles.notice}>{error}</p> : null}
    {message ? <p role="status" className={styles.notice}>{message}</p> : null}
  </section>;
}
