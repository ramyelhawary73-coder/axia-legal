import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
import { PlatformThemeToggle } from "@/components/platform-theme-toggle";
import styles from "@/components/platform-workspace.module.css";
import { resolvePlatformContext } from "@/lib/api/platform";
import { PlatformEntry } from "@/components/platform-entry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إدارة المنصة | AXIA Legal", robots: { index: false, follow: false } };

export default async function PlatformPage() {
  const context = await resolvePlatformContext(true);
  return <main dir="rtl" className={styles.shell}>
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.identity}><span className={styles.mark}><ShieldCheck size={25} aria-hidden="true" /></span><div><p className={styles.eyebrow} dir="ltr">AXIA LEGAL · CONTROL CENTER</p><h1>إدارة المنصة</h1></div></div>
        <div className={styles.actions}><PlatformThemeToggle /><Link prefetch={false} href="/" className={styles.button}>مساحة المكتب<ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      </header>
      <PlatformEntry initialState={context.ok ? context.state : context.code === "PLATFORM_DISABLED" ? "PLATFORM_DISABLED" : "unavailable"} />
    </div>
  </main>;
}
