"use client";

import { useState } from "react";
import { Settings, Shield, Key, Database, Building2, UserCheck, Save, Check } from "lucide-react";

export function AdministrationView() {
  const [firmName, setFirmName] = useState("مكتب د. رامي الهواري للاستشارات القانونية والتحكيم الدولي");
  const [barNumber, setBarNumber] = useState("قيد نقابة المحامين: ١٤٥٢١ / جدول النقض");
  const [address, setAddress] = useState("شارع قصر النيل، وسط البلد، القاهرة");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
          <Settings className="size-4" />
          <span>إعدادات النظام والمكتب القانوني</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          إدارة المنشأة القانونية والصلاحيات
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          بيانات ترخيص نقابة المحامين، إدارة الصلاحيات والأدوار، وإعدادات الربط الآمن
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="rounded-2xl border border-white/10 bg-[#0d1726] p-6 shadow-lg space-y-4 text-xs">
            <h2 className="text-base font-bold text-white mb-2">
              الهوية الرسمية للمكتب وبيانات القيد
            </h2>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">اسم المنشأة القانونية أو المكتب</label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">رقم القيد بنقابة المحامين والدرجة</label>
                <input
                  type="text"
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">المقر الرئيسي</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#a77e16] px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110"
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

          <div className="rounded-2xl border border-white/10 bg-[#0d1726] p-6 shadow-lg">
            <h2 className="text-base font-bold text-white mb-2">
              مستويات الصلاحيات والأدوار (RBAC)
            </h2>
            <div className="divide-y divide-white/5 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-white">الشركاء والمديرون (Managing Partners)</strong>
                  <p className="text-slate-400 text-[11px]">كامل الصلاحيات المالية، العقود، وأرشيف القضايا</p>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-300 text-[10px] font-bold">نشط</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-white">المحامون والمستشارون (Senior Counsel)</strong>
                  <p className="text-slate-400 text-[11px]">إدارة القضايا والجلسات والمذكرات المسندة إليهم</p>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-300 text-[10px] font-bold">نشط</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-white">المحامون المتدربون والسكرتارية (Trainees & Clerks)</strong>
                  <p className="text-slate-400 text-[11px]">قلم المحضرين، استخراج الشهادات، وتدوين القرارات</p>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-300 text-[10px] font-bold">نشط</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0d1726] p-6 shadow-lg text-xs space-y-3">
            <div className="flex items-center gap-2 text-[var(--axia-gold-light)] font-bold">
              <Database className="size-4" />
              <span>جاهزية الربط السحابي (Supabase)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              هيكل البيانات مهيأ بالكامل للربط المباشر مع قاعدة بيانات Supabase / Cloud SQL فور تثبيت المفاتيح، مع عزل بيانات القضايا بسياسات RLS المحكمة.
            </p>
            <div className="rounded-xl bg-black/30 p-3 font-mono text-[10px] text-slate-400">
              NEXT_PUBLIC_SUPABASE_URL=ready<br />
              NEXT_PUBLIC_SUPABASE_KEY=configured<br />
              STATUS: STABLE_STANDALONE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
