"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export function PlatformAccessLink() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/platform/context", { cache: "no-store", signal: controller.signal }).then(async r => {
      if (!r.ok) return;
      const data = await r.json();
      if (!controller.signal.aborted) setVisible(data.state === "ready" || data.state === "mfa_required");
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  return visible ? <Link prefetch={false} href="/platform" className="block rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-bold hover:bg-[var(--accent)]">إدارة المنصة</Link> : null;
}
