"use client";

import { useState } from "react";
import { 
  Settings, 
  Database, 
  Save, 
  Check, 
  FolderDown, 
  RefreshCw, 
  Mic, 
  Volume2,
  Lock,
  Unlock,
  Shield,
  EyeOff,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Matter, LegalTask } from "@/types/legal";
import { mockMatters, mockTasks } from "@/lib/mock-legal-data";
import { DailySnapshotManager } from "@/components/daily-snapshot-manager";
import { getSnapshotConfig } from "@/lib/daily-snapshot-service";
import { VoiceCommandModal } from "@/components/voice-command-modal";
import { isSpeechRecognitionSupported } from "@/lib/web-speech-service";

interface AdministrationViewProps {
  matters?: Matter[];
  tasks?: LegalTask[];
}

type UserRole = "Admin" | "Lawyer" | "Intern";

interface PermissionConfig {
  id: string;
  name: string;
  description: string;
  allowAdmin: boolean;
  allowLawyer: boolean;
  allowIntern: boolean;
}

export function AdministrationView({ matters = mockMatters, tasks = mockTasks }: AdministrationViewProps) {
  // Office settings state
  const [firmName, setFirmName] = useState("مكتب د. رامي الهواري للاستشارات القانونية والتحكيم الدولي");
  const [barNumber, setBarNumber] = useState("قيد نقابة المحامين: ١٤٥٢١ / جدول النقض");
  const [address, setAddress] = useState("شارع قصر النيل، وسط البلد، القاهرة");
  const [isSaved, setIsSaved] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // --- Permission System States ---
  // 1. Current simulated user role
  const [currentRole, setCurrentRole] = useState<UserRole>("Admin");
  
  // 2. Granular permissions list managed in local state to allow interactive toggles!
  const [permissions, setPermissions] = useState<PermissionConfig[]>([
    {
      id: "view-finances",
      name: "عرض الأتعاب والتدفقات المالية",
      description: "مشاهدة المبالغ المتفق عليها، والمحصلات المترصدة، وميزانية المكتب الإجمالية.",
      allowAdmin: true,
      allowLawyer: false,
      allowIntern: false,
    },
    {
      id: "view-sensitive-cases",
      name: "عرض القضايا الحساسة وقضايا النقض",
      description: "الاطلاع على ملفات الموكلين الاستراتيجيين وقضايا الطعن الجنائي والتحكيم الدولي.",
      allowAdmin: true,
      allowLawyer: true,
      allowIntern: false,
    },
    {
      id: "edit-deadlines",
      name: "تعديل وحذف المواعيد الطعنية القانونية",
      description: "صلاحية إلغاء أو تأجيل مواعيد سقوط الطعن المكتوبة بالرول القضائي.",
      allowAdmin: true,
      allowLawyer: true,
      allowIntern: false,
    },
    {
      id: "add-team",
      name: "إدارة وتعيين المحامين المتدربين",
      description: "توسيع هيئة الدفاع وإضافة مستندات القيد وعقود العمل والمستشارين الجدد.",
      allowAdmin: true,
      allowLawyer: false,
      allowIntern: false,
    },
    {
      id: "export-database",
      name: "تصدير قواعد البيانات واللقطات اليومية",
      description: "القيام بالنسخ الاحتياطي اليدوي أو السحابي للملفات والشركاء والموكلين.",
      allowAdmin: true,
      allowLawyer: false,
      allowIntern: false,
    }
  ]);

  const snapshotConfig = getSnapshotConfig();
  const speechSupported = typeof window !== "undefined" ? isSpeechRecognitionSupported() : false;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Helper to toggle a single permission cell dynamically in UI
  const handleTogglePermission = (permissionId: string, role: UserRole) => {
    setPermissions(prev => prev.map(p => {
      if (p.id !== permissionId) return p;
      if (role === "Admin") return { ...p, allowAdmin: !p.allowAdmin };
      if (role === "Lawyer") return { ...p, allowLawyer: !p.allowLawyer };
      return { ...p, allowIntern: !p.allowIntern };
    }));
  };

  // Helper to check if current simulated role has access to a specific permission
  const hasAccess = (permissionId: string): boolean => {
    const perm = permissions.find(p => p.id === permissionId);
    if (!perm) return false;
    if (currentRole === "Admin") return perm.allowAdmin;
    if (currentRole === "Lawyer") return perm.allowLawyer;
    return perm.allowIntern;
  };

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Upper header */}
      <div className="border-b border-[var(--border)] pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
            <Settings className="size-4" />
            <span>لوحة التحكم في الصلاحيات والإدارة</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
            إدارة المنشأة القانونية والصلاحيات
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            محاكاة التحكم في الأدوار (RBAC)، قيد نقابة المحامين، وعزل البيانات المالية والقضايا الحساسة
          </p>
        </div>

        {/* Live Role Simulator Widget */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 shadow-md flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">معاينة النظام بدور:</span>
            <span className="text-xs font-bold text-[var(--axia-gold-light)]">
              {currentRole === "Admin" ? "الشريك المدير (Admin)" : currentRole === "Lawyer" ? "محامٍ مقيد (Lawyer)" : "محامٍ متدرب (Intern)"}
            </span>
          </div>
          <div className="flex gap-1 bg-[var(--accent)] p-1 rounded-xl border border-[var(--border)]">
            {(["Admin", "Lawyer", "Intern"] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all ${
                  currentRole === role
                    ? "bg-[var(--axia-gold)] text-black shadow-sm scale-105"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {role === "Admin" ? "مدير" : role === "Lawyer" ? "محام" : "متدرب"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Permissions & Masking Preview (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Granular Permissions Matrix */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                  <Shield className="size-5 text-[var(--axia-gold)]" />
                  <span>مصفوفة إدارة الصلاحيات التفصيلية (RBAC Matrix)</span>
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  اضغط على أي خانة أدناه لتغيير الصلاحية فوراً وتحديث مستوى الأمان للمحامين والمتدربين.
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                <Unlock className="size-3" />
                <span>مصفوفة حية قابلة للتعديل</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                    <th className="py-2.5 font-bold">اسم الصلاحية والقابلية</th>
                    <th className="py-2.5 text-center font-bold px-3">المدير (Admin)</th>
                    <th className="py-2.5 text-center font-bold px-3">المحامي (Lawyer)</th>
                    <th className="py-2.5 text-center font-bold px-3">المتدرب (Intern)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60">
                  {permissions.map((perm) => (
                    <tr key={perm.id} className="hover:bg-[var(--accent-hover)] transition-colors">
                      <td className="py-3 pr-1 max-w-[240px]">
                        <strong className="text-[var(--text)] block font-bold">{perm.name}</strong>
                        <span className="text-[10px] text-[var(--text-muted)] block leading-relaxed mt-0.5">{perm.description}</span>
                      </td>
                      {/* Admin Toggle */}
                      <td className="py-3 text-center px-3">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "Admin")}
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all ${
                            perm.allowAdmin 
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                              : "bg-red-500/15 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {perm.allowAdmin ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                        </button>
                      </td>
                      {/* Lawyer Toggle */}
                      <td className="py-3 text-center px-3">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "Lawyer")}
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all ${
                            perm.allowLawyer 
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                              : "bg-red-500/15 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {perm.allowLawyer ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                        </button>
                      </td>
                      {/* Intern Toggle */}
                      <td className="py-3 text-center px-3">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, "Intern")}
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all ${
                            perm.allowIntern 
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                              : "bg-red-500/15 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {perm.allowIntern ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Live View Masking Simulator Card (VERY COLLABORATIVE UI) */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-glass)] p-6 shadow-lg space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <UserCheck className="size-4 text-[var(--axia-gold-light)]" />
                <span>محاكي الحجب التلقائي للبيانات والملفات الحساسة</span>
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                توضح هذه اللوحة كيف ينعكس دور المستخدم الحالي ونظام الصلاحيات على حجب البيانات في شاشات قضايا الموكلين والشؤون المالية تلقائياً.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Box A: Financial Data (restricted by "view-finances") */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">قسم الشؤون المالية والرسوم</span>
                  <div className="flex items-center gap-1">
                    {hasAccess("view-finances") ? (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                        <Unlock className="size-2.5" /> مسموح
                      </span>
                    ) : (
                      <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                        <Lock className="size-2.5" /> محجوب
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">إجمالي أتعاب المكتب:</span>
                    <strong className={`font-mono text-[var(--text)] transition-all duration-300 ${!hasAccess("view-finances") ? "blur-[5px] select-none" : ""}`}>
                      {hasAccess("view-finances") ? "٤٥٠,٠٠٠ ج.م" : "•••••••"}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">الرسوم المحصلة لقضية النيل:</span>
                    <strong className={`font-mono text-[var(--text)] transition-all duration-300 ${!hasAccess("view-finances") ? "blur-[5px] select-none" : ""}`}>
                      {hasAccess("view-finances") ? "١٢٠,٠٠٠ ج.م" : "•••••••"}
                    </strong>
                  </div>
                </div>

                {!hasAccess("view-finances") && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-3">
                    <EyeOff className="size-5 text-[var(--axia-gold-light)] mb-1" />
                    <span className="text-[10px] text-[var(--text)] font-bold">معلومات مالية حساسة محجوبة</span>
                    <p className="text-[9px] text-[var(--text-muted)] mt-0.5">تتطلب صلاحية شريك قانوني مدير</p>
                  </div>
                )}
              </div>

              {/* Box B: Sensitive Case Details (restricted by "view-sensitive-cases") */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">ملف الدعوى الاستراتيجية</span>
                  <div className="flex items-center gap-1">
                    {hasAccess("view-sensitive-cases") ? (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                        <Unlock className="size-2.5" /> مسموح
                      </span>
                    ) : (
                      <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                        <Lock className="size-2.5" /> محجوب
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[var(--axia-gold-light)] font-bold block">رقم الدعوى: ٣٨٢ لسنة ٢٠٢٥ تجاري كلي</span>
                  <p className={`text-xs text-[var(--text)] leading-relaxed font-semibold transition-all duration-300 ${!hasAccess("view-sensitive-cases") ? "blur-[4px] select-none" : ""}`}>
                    {hasAccess("view-sensitive-cases") ? "دعوى شريك وتنفيذ عقد بيع أسهم وفسخ ملحق الشراكة الدولي" : "قضية استراتيجية ذات حماية مشددة للمعلومات"}
                  </p>
                </div>

                {!hasAccess("view-sensitive-cases") && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-3">
                    <ShieldAlert className="size-5 text-amber-400 mb-1" />
                    <span className="text-[10px] text-[var(--text)] font-bold">ملف قضية تحت طائلة السرية</span>
                    <p className="text-[9px] text-[var(--text-muted)] mt-0.5">تتطلب صلاحية مستشار أول أو نقض</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Firm Identity Form */}
          <form onSubmit={handleSave} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg space-y-4 text-xs">
            <h2 className="text-base font-bold text-[var(--text)] mb-2 flex items-center gap-2">
              <Database className="size-4 text-[var(--axia-gold)]" />
              <span>الهوية الرسمية للمكتب وبيانات القيد</span>
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
        </div>

        {/* Right Side Cards */}
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
              disabled={!hasAccess("export-database")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--axia-gold)] px-4 py-2 text-xs font-bold text-black hover:bg-[var(--axia-gold-light)] disabled:opacity-40 disabled:cursor-not-allowed shadow transition"
            >
              <RefreshCw className="size-3.5" />
              <span>إدارة اللقطات والمزامنة السحابية</span>
            </button>
          </div>

          {/* Web Speech API Voice Control Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--axia-gold-light)] font-bold">
                <Mic className="size-4 text-[var(--axia-gold)]" />
                <span>محرك الأوامر الصوتية (Web Speech API)</span>
              </div>
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                speechSupported ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"
              }`}>
                {speechSupported ? "مدعوم بالمتصفح" : "غير مدعوم مباشرة"}
              </span>
            </div>
            <p className="text-[var(--text-muted)] leading-relaxed">
              يدعم النظام التنقل الصوتي الفوري بين جميع الأقسام، وتسجيل المهام القضائية وإعلانات المحضرين بمجرد النطق باللهجة المصرية والعربية الفصحى مع دعم الرد الصوتي (SpeechSynthesis).
            </p>
            <div className="space-y-1.5 rounded-xl bg-[var(--bg)]/60 p-3 border border-[var(--border)] text-[11px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">معالجة اللهجة المصرية:</span>
                <span className="font-semibold text-emerald-400">مفعلة (تطبيع الهمزات والتاء المربوطة)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">إذن الميكروفون:</span>
                <span className="font-semibold text-[var(--text)]">مطلوب عند أول استخدام</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--axia-gold)]/40 bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--axia-gold)] hover:bg-[var(--axia-gold)] hover:text-black transition"
            >
              <Volume2 className="size-3.5" />
              <span>فتح لوحة الأوامر الصوتية ودليل الكلمات</span>
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

      {/* Voice Command Modal */}
      <VoiceCommandModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onNavigate={() => {}}
        onCreateTask={() => {}}
      />
    </div>
  );
}
