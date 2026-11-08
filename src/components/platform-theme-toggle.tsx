"use client";

import { useTheme } from "next-themes";
import { SunMoon } from "lucide-react";
import styles from "@/components/platform-workspace.module.css";

export function PlatformThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return <button type="button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className={styles.button}><SunMoon size={17} aria-hidden="true" />تبديل المظهر</button>;
}
