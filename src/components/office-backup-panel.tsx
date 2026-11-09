"use client";
import styles from "@/components/platform-workspace.module.css";
import { Archive } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { completeOfficeSnapshot, decryptOfficeSnapshot, encryptOfficeSnapshot, verifyOfficeSnapshot, type OfficeSnapshot } from "@/lib/office-backup";

export function OfficeBackupPanel({ officeId, reason, request }: { officeId: string; reason: string; request: <T>(action: string, input?: Record<string, unknown>) => Promise<T> }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lifetime = useRef<AbortController | null>(null);
  useEffect(() => { const controller = new AbortController(); lifetime.current = controller; return () => controller.abort(); }, [officeId]);
  async function exportOffice() {
    if (password.length < 12 || password !== confirmation) { setMessage("اكتب عبارة حماية من 12 حرفًا على الأقل وكررها بنفس الشكل."); return; }
    if (!confirm("سيتم تنزيل نسخة مشفرة خاصة بهذا المكتب. احتفظ بعبارة الحماية منفصلة؛ لن يمكن فتح النسخة بدونها.")) return;
    setBusy(true); setMessage("جارٍ التقاط بيانات المكتب والتحقق من الملفات…");
    const signal = lifetime.current!.signal;
    try {
      const snapshot = await request<OfficeSnapshot>("export", { reason });
      signal.throwIfAborted();
      if (snapshot.organizationId !== officeId) throw new Error("المكتب اتغير. لم يتم إنشاء نسخة.");
      const completed = await completeOfficeSnapshot(snapshot, async path => {
        const ticket = await request<{ url: string }>("file", { path });
        signal.throwIfAborted();
        const response = await fetch(ticket.url, { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store", signal });
        if (!response.ok) throw new Error("تعذر تحميل ملف؛ تم إيقاف التصدير بالكامل.");
        const expected = Number(snapshot.storage.find(item => item.path === path)?.size);
        const reader = response.body?.getReader();
        if (!reader || !Number.isSafeInteger(expected)) throw new Error("تعذر التحقق من حجم الملف.");
        const chunks: Uint8Array[] = []; let total = 0;
        try { while (true) { const part = await reader.read(); if (part.done) break; total += part.value.byteLength; if (total > expected) { await reader.cancel(); throw new Error("حجم الملف لا يطابق النسخة؛ تم إيقاف التصدير."); } chunks.push(part.value); } } finally { reader.releaseLock(); }
        const bytes = new Uint8Array(total); let offset = 0; for (const part of chunks) { bytes.set(part, offset); offset += part.byteLength; }
        return bytes;
      }, (n, total) => setMessage(`تم التحقق من ${n} من ${total} ملف…`));
      const encrypted = await encryptOfficeSnapshot(completed, password);
      signal.throwIfAborted();
      const url = URL.createObjectURL(new Blob([encrypted], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = `axia-office-${officeId}-${new Date().toISOString().slice(0, 10)}.axia-backup.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setPassword(""); setConfirmation(""); setMessage("تم تجهيز وتنزيل النسخة المشفرة. افتح الملف من قسم التحقق أدناه للتأكد من النسخة المحفوظة على جهازك.");
    } catch (error) { if (!signal.aborted) setMessage(error instanceof Error ? error.message : "فشل التصدير؛ لم يتم إنشاء نسخة مكتملة."); }
    finally { try { await request("end_support"); } catch { /* The database grant independently expires after 15 minutes. */ } if (!signal.aborted) setBusy(false); }
  }
  async function verify() {
    if (!file) return;
    setBusy(true); setMessage("جارٍ فك النسخة والتحقق محليًا على جهازك…");
    try {
      if (file.size > 125 * 1024 * 1024) throw new Error("الملف أكبر من الحد المدعوم.");
      const snapshot = await decryptOfficeSnapshot(await file.text(), password);
      const report = await verifyOfficeSnapshot(snapshot);
      setMessage(`تم التحقق من سلامة ${report.rows} سجل و${report.files} ملف للمكتب ${report.officeId}. لم يتم تعديل أي مكتب. اختبار الاسترجاع إلى قاعدة معزولة إجراء منفصل.`);
      setPassword(""); setConfirmation("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر التحقق من النسخة."); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="office-backup-heading" className={`${styles.surface} space-y-4`}>
    <h3 id="office-backup-heading" className={styles.sectionHeading}><Archive size={20} aria-hidden="true" />نسخة المكتب والتحقق منها</h3>
    <p className="text-sm leading-7 text-[var(--text-muted)]">تشمل البيانات المحفوظة والمراجعات والملفات. التشفير يتم على جهازك؛ عبارة الحماية لا تُرسل إلى السيرفر. لا تتضمن كلمات مرور أو أسرار الدخول. الحد الحالي 10,000 سجل و200 ملف وإجمالي ملفات 64 MB؛ التصدير يتوقف لو النسخة غير مكتملة أو تجاوزت الحد.</p>
    <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-2"><span>عبارة حماية النسخة</span><input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} maxLength={512} className={styles.field} /></label><label className="space-y-2"><span>تأكيد عبارة الحماية للتصدير</span><input type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} maxLength={512} className={styles.field} /></label></div>
    <button type="button" disabled={busy || reason.trim().length < 8} onClick={() => void exportOffice()} className={`${styles.button} ${styles.primary}`}>تصدير نسخة مشفرة للمكتب</button>
    <div className="space-y-3 border-t border-[var(--border)] pt-4"><label className="block space-y-2"><span>فحص نسخة محفوظة — على جهازك فقط</span><input type="file" accept=".json" disabled={busy} onChange={e => setFile(e.target.files?.[0] ?? null)} className="block max-w-full text-sm" /></label><button type="button" disabled={busy || !file || password.length < 12} onClick={() => void verify()} className={styles.button}>فك النسخة والتحقق من اكتمالها</button></div>
    {message ? <p role="status" className="text-sm leading-7 break-words">{message}</p> : null}
  </section>;
}
