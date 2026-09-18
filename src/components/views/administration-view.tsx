"use client";

import { useState } from "react";
import { Settings, Database, Save, Check, FolderDown, RefreshCw } from "lucide-react";
import { Matter, LegalTask } from "@/types/legal";
import { mockMatters, mockTasks } from "@/lib/mock-legal-data";
import { DailySnapshotManager } from "@/components/daily-snapshot-manager";
import { getSnapshotConfig } from "@/lib/daily-snapshot-service";

interface AdministrationViewProps {
  matters?: Matter[];
  tasks?: LegalTask[];
}

export function AdministrationView({ matters = mockMatters, tasks = mockTasks }: AdministrationViewProps) {
  const [firmName, setFirmName] = useState("مكتب د. رامي الهواري للاستشارات القانونية والتحكيم الدولي");
  const [barNumber, setBarNumber] = useState("قيد نقابة المحامين: ١٤٥٢١ / جدول النقض");
  const [address, setAddress] = useState("شارع قصر النيل، وسط البلد، القاهرة");
  const [isSaved, setIsSaved] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

  const snapshotConfig = getSnapshotConfig();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      <div className="border-b border-[var(--border)] pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
          <Settings className="size-4" />
          <span>إعدادات النظام والمكتب القانوني</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
          إدارة المنشأة القانونية والصلاحيات
        </h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          بيانات ترخيص نقابة المحامين، إدارة الصلاحيات والأدوار، وإعدادات الربط الآمن
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg space-y-4 text-xs">
            <h2 className="text-base font-bold text-[var(--text)] mb-2">
              الهوية الرسمية للمكتب وبيانات القيد
            </h2>

            <div>
              <label className="block text-[var(--text-muted)] mb-1 font-semibold">اسم المنشأة القانونية أو المكتب</label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] p-2.5 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-semibold">رقم القيد بنقابة المحامين والدرجة</label>
                <input
                  type="text"
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] p-2.5 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-semibold">المقر الرئيسي</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] p-2.5 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#a77e16] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110"
              >
                {isSaved ? (
                  <>
                    <Check className="size-4" />
                    <span>تم حفظ التعديلات بنجاح</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>حفظ بيانات المكتب</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg">
            <h2 className="text-base font-bold text-[var(--text)] mb-2">
              مستويات الصلاحيات والأدوار (RBAC)
            </h2>
            <div className="divide-y divide-white/5 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-[var(--text)]">الشركاء والمديرون (Managing Partners)</strong>
                  <p className="text-[var(--text-muted)] text-[11px]">كامل الصلاحيات المالية، العقود، وأرشيف القضايا</p>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-300 text-[10px] font-bold">نشط</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-[var(--text)]">المحامون والمستشارون (Senior Counsel)</strong>
                  <p className="text-[var(--text-muted)] text-[11px]">إدارة القضايا والجلسات والمذكرات المسندة إليهم</p>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-300 text-[10px] font-bold">نشط</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-[var(--text)]">المحامون المتدربون والسكرتارية (Trainees & Clerks)</strong>
                  <p className="text-[var(--text-muted)] text-[11px]">قلم المحضرين، استخراج الشهادات، وتدوين القرارات</p>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-300 text-[10px] font-bold">نشط</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Daily Snapshot & Cloud Sync Card */}
          <div className="rounded-2xl border border-[var(--axia-gold)]/40 bg-gradient-to-b from-[var(--panel)] to-[var(--axia-gold-dim)]/20 p-6 shadow-lg text-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--axia-gold-light)] font-bold">
                <FolderDown className="size-4 text-[var(--axia-gold)]" />
                <span>النسخ الاحتياطي اليومي للقضايا والمهام</span>
              </div>
              <span className="rounded bg-[var(--axia-gold)] text-black px-2 py-0.5 text-[10px] font-bold">
                مؤتمت
              </span>
            </div>

            <p className="text-[var(--text-muted)] leading-relaxed">
              يقوم النظام بتوليد وتصدير لقطة يومية معتمدة (Daily Summary Snapshot) تشمل جميع القضايا النشطة والمهام المفتوحة وحفظها تلقائياً بمجلد التنزيلات المحلي ومزامنتها سحابياً.
            </p>

            <div className="space-y-2 rounded-xl bg-[var(--bg)]/60 p-3 border border-[var(--border)]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">حالة الأتمتة:</span>
                <span className={`font-semibold ${snapshotConfig.enabled ? "text-emerald-400" : "text-zinc-400"}`}>
                  {snapshotConfig.enabled ? "نشطة ومفعلة" : "متوقفة"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">وجهة الحفظ:</span>
                <span className="font-semibold text-[var(--text)]">
                  {snapshotConfig.destination === "download_folder" ? "مجلد Downloads المحلي" : snapshotConfig.destination === "cloud_sync" ? "سحابي فقط" : "تنزيل محلي + سحابي"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">توقيت التصدير:</span>
                <span className="font-mono text-[var(--axia-gold-light)]">{snapshotConfig.autoExportTime}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSnapshotModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--axia-gold)] px-4 py-2 text-xs font-bold text-black hover:bg-[var(--axia-gold-light)] shadow transition"
            >
              <RefreshCw className="size-3.5" />
              <span>إدارة اللقطات والمزامنة السحابية</span>
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg text-xs space-y-3">
            <div className="flex items-center gap-2 text-[var(--axia-gold-light)] font-bold">
              <Database className="size-4" />
              <span>جاهزية الربط السحابي (Supabase)</span>
            </div>
            <p className="text-[var(--text-muted)] leading-relaxed">
              هيكل البيانات مهيأ بالكامل للربط المباشر مع قاعدة بيانات Supabase / Cloud SQL فور تثبيت المفاتيح، مع عزل بيانات القضايا بسياسات RLS المحكمة.
            </p>
            <div className="rounded-xl bg-[var(--accent)] p-3 font-mono text-[10px] text-[var(--text-muted)]">
              NEXT_PUBLIC_SUPABASE_URL=ready<br />
              NEXT_PUBLIC_SUPABASE_KEY=configured<br />
              STATUS: STABLE_STANDALONE
            </div>
          </div>
        </div>
      </div>

      {/* Daily Snapshot Manager Modal */}
      <DailySnapshotManager
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        matters={matters}
        tasks={tasks}
      />
    </div>
  );
}
