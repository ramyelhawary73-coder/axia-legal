"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { usePwa } from "@/components/pwa-provider";
export function PwaInstallLink() {
  const pwa=usePwa();
  if(pwa.standalone||pwa.installed)return null;
  return <Link href="/install" prefetch={false} aria-label="فتح دليل تثبيت AXIA" className="axia-install-shortcut"><Download size={18} aria-hidden="true"/><span>تثبيت التطبيق</span></Link>;
}
export function PwaInstallPromotion() {
  const pwa=usePwa(),[dismissed,setDismissed]=useState(false);
  if(pwa.standalone||pwa.installed||dismissed)return null;
  return <section aria-label="AXIA على جهازك" className="axia-install-promotion">
    <Image src="/pwa/icon-192.png" alt="" width={48} height={48} unoptimized className="rounded-[14px] shrink-0"/>
    <div className="min-w-0 flex-1"><p className="font-bold text-base">AXIA على جهازك {pwa.preview?<span className="axia-preview-label">نسخة مراجعة</span>:null}</p><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">أيقونة واحدة. نافذة مستقلة. وصول أسرع لمكتبك.</p></div>
    {pwa.canInstall?<button type="button" className="axia-primary-action" onClick={()=>void pwa.install()}><Download size={18} aria-hidden="true"/>تثبيت AXIA</button>:<Link href="/install" prefetch={false} className="axia-primary-action">طريقة التثبيت</Link>}
    <button type="button" aria-label="إخفاء اقتراح التثبيت لهذه الزيارة" className="axia-icon-action" onClick={()=>setDismissed(true)}><X size={18} aria-hidden="true"/></button>
    {pwa.message?<p role="status" className="basis-full text-sm leading-6">{pwa.message}</p>:null}
  </section>;
}
