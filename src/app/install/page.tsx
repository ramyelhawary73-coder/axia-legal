import type { Metadata } from "next";
import Link from "next/link";
import { AxiaBrandLogo } from "@/components/axia-brand-logo";
import { PwaInstallPanel } from "@/components/pwa-install-panel";
export const metadata: Metadata = { title: "تثبيت AXIA على جهازك", robots: { index: false, follow: false } };
export default function InstallPage() {
  return <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8"><AxiaBrandLogo mode="lockup" size="md" /><Link href="/login" prefetch={false} className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold">تسجيل الدخول</Link></header>
    {process.env.VERCEL_ENV === "preview" ? <p className="mx-auto mb-5 max-w-6xl px-5 text-sm leading-7 text-[var(--text-muted)] sm:px-8">نسخة مراجعة · التثبيت مرتبط بهذا الرابط، وليس بالإصدار النهائي.</p> : null}
    <main className="mx-auto grid max-w-6xl gap-6 px-5 pb-12 pt-2 sm:px-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"><PwaInstallPanel /></main>
    <footer className="mx-auto max-w-6xl px-5 pb-8 text-sm leading-7 text-[var(--text-muted)] sm:px-8">AXIA Legal · مساحة عمل واحدة، حسب صلاحيات حسابك.</footer>
  </div>;
}
