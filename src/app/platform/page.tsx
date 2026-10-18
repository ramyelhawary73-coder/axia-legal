import type { Metadata } from "next";
import Link from "next/link";
import { resolvePlatformContext } from "@/lib/api/platform";
import { PlatformEntry } from "@/components/platform-entry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إدارة المنصة | AXIA Legal", robots: { index: false, follow: false } };

export default async function PlatformPage() {
  const context = await resolvePlatformContext(true);
  return <main dir="rtl" className="min-h-dvh bg-[var(--background)] px-4 py-6 text-[var(--text)] sm:px-8 lg:px-12">
    <div className="mx-auto w-full max-w-6xl space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div><p className="text-xs font-bold tracking-widest text-[var(--axia-gold)]" dir="ltr">AXIA LEGAL</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">إدارة المنصة</h1></div>
        <Link prefetch={false} href="/" className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm">مساحة المكتب</Link>
      </header>
      <PlatformEntry initialState={context.ok ? context.state : context.code === "PLATFORM_DISABLED" ? "PLATFORM_DISABLED" : "unavailable"} />
    </div>
  </main>;
}
