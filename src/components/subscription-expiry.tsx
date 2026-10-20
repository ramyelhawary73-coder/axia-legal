"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatControlDate } from "@/lib/control-presentation";
import styles from "@/components/platform-workspace.module.css";

export function SubscriptionExpiry({ value }: { value: string | null }) {
  const [openEnded, setOpenEnded] = useState(!value);
  const [date, setDate] = useState(() => {
    if (!value) return "";
    const instant = new Date(value);
    return new Date(instant.getTime() - instant.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  });
  const [time, setTime] = useState(() => {
    if (!value) return "23:59";
    const instant = new Date(value);
    return `${String(instant.getHours()).padStart(2, "0")}:${String(instant.getMinutes()).padStart(2, "0")}`;
  });
  return <div className={styles.expiry}>
    <h4 className={styles.sectionHeading}><CalendarDays size={18} aria-hidden="true" />مدة الاشتراك</h4>
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={openEnded} onChange={e => setOpenEnded(e.target.checked)} />مدة مفتوحة بدون تاريخ انتهاء</label>
    <div className={styles.expiryInputs}>
      <label className={styles.label}><span>تاريخ انتهاء الاشتراك</span><input type="date" name="expiresDate" lang="en-GB" dir="ltr" disabled={openEnded} required={!openEnded} value={date} onChange={e => setDate(e.target.value)} className={`${styles.field} ${styles.nativeField}`} /></label>
      <label className={styles.label}><span>وقت انتهاء الاشتراك</span><input type="time" name="expiresTime" lang="en-GB" dir="ltr" disabled={openEnded} required={!openEnded} value={time} onChange={e => setTime(e.target.value)} className={`${styles.field} ${styles.nativeField}`} /></label>
    </div>
    <p className={styles.hint}>بتوقيت جهازك: <bdi dir="ltr">{Intl.DateTimeFormat().resolvedOptions().timeZone}</bdi>. {openEnded ? "لا يوجد تاريخ انتهاء." : date && time ? <bdi>{formatControlDate(`${date}T${time}`)}</bdi> : "حدد التاريخ والوقت لإكمال المدة."}</p>
  </div>;
}
