"use client";
import Link from "next/link";
import { useState } from "react";
import { Download, Monitor, Smartphone, CheckCircle2, RefreshCw, WifiOff, ShieldCheck } from "lucide-react";
import { usePwa } from "@/components/pwa-provider";
const guides = {
  desktop: { label: "كمبيوتر / لاب توب", steps: ["افتح AXIA في Chrome أو Edge على جهازك.", "اختار علامة التثبيت في شريط العنوان، أو «تثبيت هذا الموقع كتطبيق» من قائمة المتصفح.", "بعد التأكيد افتح AXIA من قائمة التطبيقات أو اختصار سطح المكتب."] },
  android: { label: "أندرويد", steps: ["افتح الرابط في Chrome مباشرة، وليس داخل تطبيق تواصل.", "من قائمة المتصفح اختار «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».", "أكد التثبيت، ثم افتح أيقونة AXIA على الشاشة الرئيسية."] },
  ios: { label: "آيفون / آيباد", steps: ["افتح رابط AXIA في Safari على جهازك.", "اضغط «مشاركة»، ثم «إضافة إلى الشاشة الرئيسية».", "فعّل «فتح كتطبيق ويب» لو ظهر، ثم اضغط «إضافة» وافتح أيقونة AXIA."] },
};
export function PwaInstallPanel() {
  const pwa = usePwa(), [guide, setGuide] = useState<keyof typeof guides>("desktop");
  return <>
    <section aria-labelledby="install-title" className="min-w-0 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-9">
      <div className="flex items-center gap-3 text-[var(--axia-gold-light)]"><Download aria-hidden="true" size={22} /><span className="text-sm font-semibold">AXIA على جهازك</span></div>
      <h1 id="install-title" className="mt-5 text-3xl font-bold leading-snug sm:text-5xl">مكتبك القانوني،<br />بنافذة خاصة بيه.</h1>
      <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-muted)]">ثبّت AXIA وافتحه من أيقونته على الكمبيوتر أو الموبايل. نفس حسابك ونفس صلاحيات مكتبك، من غير تغيير بياناتك.</p>
      <div role="status" className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 text-base leading-7">
        {pwa.standalone ? <span className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="shrink-0 text-emerald-500" size={20} />AXIA مفتوح في نافذة تطبيق مستقلة.</span> : pwa.installed ? "تم التثبيت. افتح AXIA من أيقونته على جهازك." : "اتبع الخطوات المناسبة لجهازك، أو استخدم زر التثبيت لو ظهر."}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {pwa.canInstall && !pwa.standalone && !pwa.installed ? <button type="button" onClick={() => void pwa.install()} className="flex min-h-12 items-center gap-2 rounded-xl bg-[var(--axia-gold)] px-6 py-3 text-base font-bold text-slate-950"><Download aria-hidden="true" size={19} />تثبيت AXIA</button> : null}
        <Link href="/" prefetch={false} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] px-6 py-3 text-base font-semibold">فتح مساحة العمل</Link>
      </div>
      {pwa.message ? <p role="status" className="mt-4 text-sm leading-7 text-[var(--text-muted)]">{pwa.message}</p> : null}
      <div className="mt-9 border-t border-[var(--border)] pt-6">
        <h2 className="text-lg font-bold">طريقة التثبيت</h2>
        <div role="group" aria-label="نوع الجهاز" className="mt-4 flex flex-wrap gap-2">
          {(Object.entries(guides) as [keyof typeof guides, typeof guides.desktop][]).map(([key, item]) => <button key={key} type="button" aria-pressed={key === guide} onClick={() => setGuide(key)} className={`flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${guide === key ? "border-[var(--axia-gold)] bg-[var(--axia-gold-dim)]" : "border-[var(--border)]"}`}>{key === "desktop" ? <Monitor size={17} aria-hidden="true" /> : <Smartphone size={17} aria-hidden="true" />}{item.label}</button>)}
        </div>
        <ol className="mt-5 list-decimal space-y-3 ps-6 text-base leading-8 text-[var(--text-muted)]">{guides[guide].steps.map(step => <li key={step} className="ps-1">{step}</li>)}</ol>
        <p className="mt-5 text-sm leading-7 text-[var(--text-muted)]">الاختيارات المتاحة وأسماؤها تختلف حسب المتصفح وإصداره. لو خيار التثبيت غير متاح، تقدر تستخدم AXIA من المتصفح.</p>
      </div>
    </section>
    <aside aria-label="الاتصال والتحديث" className="min-w-0 space-y-5">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <ShieldCheck aria-hidden="true" className="text-[var(--axia-gold-light)]" size={25} /><h2 className="mt-4 text-xl font-bold">بيانات مكتبك تفضل في مكانها</h2>
        <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">التثبيت الحالي يحتاج اتصالًا لفتح القضايا والملفات وحفظ التعديلات. لا يتم تنزيل نسخة من بيانات مكتبك للاستخدام بدون اتصال.</p>
      </section>
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <WifiOff aria-hidden="true" className="text-[var(--axia-gold-light)]" size={25} /><h2 className="mt-4 text-xl font-bold">لو الاتصال انقطع</h2>
        <p role="status" className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{pwa.shell === "ready" ? "شاشة انقطاع الاتصال جاهزة على هذا المتصفح." : pwa.shell === "preparing" ? "جارٍ تجهيز شاشة انقطاع الاتصال…" : "تعذر تجهيز شاشة انقطاع الاتصال على هذا المتصفح. تقدر تواصل الاستخدام مع الاتصال."}</p>
        {pwa.online === false ? <p role="status" className="mt-3 text-sm leading-7">المتصفح حاليًا بدون اتصال بالشبكة.</p> : null}
        <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">الشاشة توضّح حالة الاتصال فقط. احتفظ بأي تعديل غير مؤكّد في نافذته الأصلية؛ لا توجد مزامنة تلقائية للتعديلات في هذه النسخة.</p>
      </section>
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <RefreshCw aria-hidden="true" className="text-[var(--axia-gold-light)]" size={25} /><h2 className="mt-4 text-xl font-bold">التحديث في وقت مناسب</h2>
        <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">احفظ عملك قبل إعادة التحميل. لو فيه تحديث جاهز هيظهر تنبيه يتيح لك تطبيقه أو تأجيله.</p>
        <button type="button" onClick={() => void pwa.checkUpdate()} className="mt-4 min-h-11 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold">فحص تحديث AXIA</button>
      </section>
    </aside>
  </>;
}
