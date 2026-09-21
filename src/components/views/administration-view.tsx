"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  LockKeyhole,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import {
  loadAdministrationWorkspace,
  type AdministrationWorkspace,
} from "@/lib/administration-client";

const roleOrder: Array<keyof AdministrationWorkspace["roleCounts"]> = [
  "owner",
  "admin",
  "lawyer",
  "staff",
  "trainee",
  "viewer",
];

const roleLabels: Record<
  keyof AdministrationWorkspace["roleCounts"],
  string
> = {
  owner: "المالك",
  admin: "الإدارة",
  lawyer: "المحامون",
  staff: "الموظفون",
  trainee: "المتدربون",
  viewer: "القراءة فقط",
};

export function AdministrationView() {
  const [workspace, setWorkspace] =
    useState<AdministrationWorkspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadAdministrationWorkspace()
      .then((loaded) => {
        if (cancelled) return;
        setWorkspace(loaded);
        setSyncError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSyncError(
          error instanceof Error
            ? error.message
            : "تعذر تحميل بيانات الإدارة.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const populatedRoles = useMemo(() => {
    if (!workspace) return [];
    return roleOrder.filter((role) => workspace.roleCounts[role] > 0);
  }, [workspace]);

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
            <Shield className="size-4" />
            <span>الإدارة والصلاحيات الفعلية</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
            إدارة المؤسسة
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            عرض مباشر للعضوية والدور الحالي. الصلاحيات تُفرض من Supabase RLS
            وليست محاكاة داخل الواجهة.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">
          <ShieldCheck className="size-4" />
          <span>قراءة فقط — لا تعديل أدوار من هذه الشاشة</span>
        </div>
      </div>

      {syncError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
          {syncError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-xs text-[var(--text-muted)]">
          جارٍ تحميل بيانات المؤسسة الفعلية...
        </div>
      )}

      {workspace && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  المؤسسة
                </span>
                <Building2 className="size-4 text-[var(--axia-gold)]" />
              </div>
              <div className="mt-3 text-lg font-bold text-[var(--text)]">
                {workspace.organization.name || "غير مسجل"}
              </div>
              <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                {workspace.organization.slug || "غير مسجل"}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  دور المستخدم الحالي
                </span>
                <UserCheck className="size-4 text-[var(--axia-gold)]" />
              </div>
              <div className="mt-3 text-lg font-bold text-[var(--text)]">
                {workspace.currentUser.roleLabel}
              </div>
              <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                {workspace.currentUser.label || "غير مسجل"}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  أعضاء المؤسسة
                </span>
                <Users className="size-4 text-[var(--axia-gold)]" />
              </div>
              <div className="mt-3 text-2xl font-bold text-[var(--text)]">
                {workspace.membersCount}
              </div>
              <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                عضويات فعلية في organization_members
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text)]">
                <Users className="size-4 text-[var(--axia-gold)]" />
                توزيع الأدوار الحقيقي
              </h2>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                محسوب مباشرة من عضويات المؤسسة الحالية.
              </p>

              <div className="mt-4 space-y-2">
                {populatedRoles.map((role) => (
                  <div
                    key={role}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-xs"
                  >
                    <span className="text-[var(--text-muted)]">
                      {roleLabels[role]}
                    </span>
                    <strong className="text-[var(--text)]">
                      {workspace.roleCounts[role]}
                    </strong>
                  </div>
                ))}
                {populatedRoles.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
                    لا توجد عضويات مسجلة.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text)]">
                <LockKeyhole className="size-4 text-[var(--axia-gold)]" />
                حدود الإدارة الحالية
              </h2>

              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                  <div className="font-bold text-[var(--text)]">
                    محرك الصلاحيات
                  </div>
                  <div className="mt-1 text-[var(--text-muted)]">
                    {workspace.security.enforcedBy}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                  <div className="font-bold text-[var(--text)]">
                    تعديل الأدوار من هذه الشاشة
                  </div>
                  <div className="mt-1 text-[var(--text-muted)]">
                    {workspace.security.editableFromThisScreen
                      ? "متاح"
                      : "غير متاح"}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                  <div className="font-bold text-[var(--text)]">
                    دعوة أعضاء جدد
                  </div>
                  <div className="mt-1 text-[var(--text-muted)]">
                    {workspace.security.invitationFlowEnabled
                      ? "مفعلة"
                      : "غير مفعلة بعد — تحتاج Invitation/Auth Phase"}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[var(--text)]">
              بيانات المنشأة المتاحة حاليًا
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs">
                <div className="text-[var(--text-muted)]">اسم المؤسسة</div>
                <div className="mt-1 font-semibold text-[var(--text)]">
                  {workspace.organization.name || "غير مسجل"}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs">
                <div className="text-[var(--text-muted)]">رقم القيد المهني</div>
                <div className="mt-1 font-semibold text-[var(--text)]">
                  غير مسجل
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs">
                <div className="text-[var(--text-muted)]">عنوان المكتب</div>
                <div className="mt-1 font-semibold text-[var(--text)]">
                  غير مسجل
                </div>
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-[var(--text-muted)]">
              لم يتم إنشاء حقول قاعدة بيانات لرقم القيد المهني أو عنوان المكتب
              في هذه المرحلة، لذلك لا تعرض AXIA قيمًا افتراضية أو غير موثقة.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
