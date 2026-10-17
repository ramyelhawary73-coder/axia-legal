"use client";

import { useEffect, useState } from "react";
import { readJsonResponse } from "@/lib/api/client-response";
import {
  staffRoleLabels,
  type StaffInvitationList,
  type StaffInviteRole,
} from "@/lib/staff-invitations";

export function StaffInvitationsPanel() {
  const [list, setList] = useState<StaffInvitationList | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffInviteRole>("staff");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [loadedAt, setLoadedAt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/staff-invitations", { cache: "no-store" })
      .then((response) =>
        readJsonResponse<StaffInvitationList>(response, "تعذر تحميل الدعوات."),
      )
      .then((data) => {
        if (!cancelled) {
          setList(data);
          setLoadedAt(Date.now());
        }
      })
      .catch((reason) => {
        if (!cancelled)
          setError(
            reason instanceof Error ? reason.message : "تعذر تحميل الدعوات.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [revision]);
  async function mutate(
    action: "create" | "rotate" | "revoke",
    invitationId?: string,
  ) {
    if (busy) return;
    if (
      action === "revoke" &&
      !window.confirm("هل تريد إلغاء هذه الدعوة؟ سيتوقف رابطها عن العمل.")
    )
      return;
    setBusy(true);
    setError(null);
    setLink(null);
    setNotice(null);
    try {
      const response = await fetch("/api/staff-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email, role, invitationId }),
      });
      const result = await readJsonResponse<{ invitationPath: string | null }>(
        response,
        "تعذر تنفيذ طلب الدعوة.",
      );
      if (result.invitationPath)
        setLink(window.location.origin + result.invitationPath);
      setNotice(
        action === "revoke"
          ? "تم إلغاء الدعوة."
          : "تم إنشاء الرابط. لم يُرسل بريد إلكتروني.",
      );
      if (action === "create") setEmail("");
      setRevision((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تنفيذ الطلب.");
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setNotice("تم نسخ الرابط. شاركه مع صاحب البريد المدعو فقط.");
    } catch {
      setError("تعذر النسخ. يمكنك تحديد الرابط ونسخه يدويًا.");
    }
  }
  const control =
    "min-h-11 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]";
  return (
    <section
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-5"
      aria-labelledby="staff-invitations-title"
    >
      <h2 id="staff-invitations-title" className="text-lg font-bold">
        دعوات الموظفين بالبريد
      </h2>
      {error && (
        <div role="alert" className="space-y-2 text-sm">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setRevision((value) => value + 1);
            }}
            className={control}
          >
            إعادة تحميل الدعوات
          </button>
        </div>
      )}
      {!list && !error && (
        <p role="status" className="text-sm">
          جارٍ تحميل الدعوات...
        </p>
      )}
      {list && !list.enabled && (
        <p className="text-sm leading-7 text-[var(--text-muted)]">
          الدعوات غير مفعلة في هذه البيئة بعد. تفعيلها يخضع لمراجعة إعدادات
          المكتب.
        </p>
      )}
      {list?.enabled && !list.canManage && (
        <p className="text-sm text-[var(--text-muted)]">
          إدارة الدعوات متاحة لمالك المكتب والمدير.
        </p>
      )}
      {list?.canManage && (
        <>
          <p className="text-sm leading-7 text-[var(--text-muted)]">
            حدّد بريد الموظف ودوره. الرابط صالح ٧ أيام، ويُقبل بحساب مؤكد
            بالبريد نفسه. شارك الرابط مع الموظف؛ إرسال رسالة الدعوة تلقائيًا
            غير مفعَّل حاليًا.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void mutate("create");
            }}
            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
          >
            <label className="space-y-1 text-sm">
              <span>بريد الموظف</span>
              <input
                type="email"
                required
                maxLength={254}
                autoComplete="off"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                dir="ltr"
                className={`${control} w-full`}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>الدور</span>
              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as StaffInviteRole)
                }
                className={`${control} w-full`}
              >
                {Object.entries(staffRoleLabels)
                  .filter(([value]) => value !== "admin" || list.canInviteAdmin)
                  .map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
            <button
              disabled={busy}
              className="min-h-11 self-end rounded-xl bg-[var(--axia-gold)] px-4 text-sm font-bold text-black disabled:opacity-50"
            >
              {busy ? "جارٍ التنفيذ..." : "إنشاء رابط دعوة"}
            </button>
          </form>
          {notice && (
            <p role="status" className="text-sm">
              {notice}
            </p>
          )}
          {link && (
            <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
              <label className="block space-y-2 text-sm">
                <span>الرابط يظهر الآن فقط. تجديده يُلغي الرابط السابق.</span>
                <input
                  readOnly
                  value={link}
                  dir="ltr"
                  onFocus={(event) => event.target.select()}
                  className={`${control} w-full`}
                />
              </label>
              <button
                type="button"
                onClick={() => void copy()}
                className={control}
              >
                نسخ رابط الدعوة
              </button>
            </div>
          )}
          <ul className="divide-y divide-[var(--border)]">
            {list.invitations.map((invitation) => {
              const expired =
                invitation.status === "pending" &&
                new Date(invitation.expires_at).getTime() <= loadedAt;
              const manageable =
                invitation.role !== "admin" || list.canInviteAdmin;
              return (
                <li
                  key={invitation.id}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="break-all text-sm">
                      <bdi>{invitation.email_normalized}</bdi>
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {staffRoleLabels[invitation.role]} ·{" "}
                      {invitation.status === "accepted"
                        ? "مقبولة"
                        : invitation.status === "revoked"
                          ? "ملغاة"
                          : expired
                            ? "منتهية"
                            : "في انتظار القبول"}{" "}
                      · انتهاء {invitation.expires_at.slice(0, 10)}
                    </p>
                  </div>
                  {invitation.status === "pending" && manageable && (
                    <div className="flex gap-2">
                      <button
                        disabled={busy}
                        type="button"
                        className={control}
                        onClick={() => void mutate("rotate", invitation.id)}
                      >
                        تجديد الرابط
                      </button>
                      <button
                        disabled={busy}
                        type="button"
                        className={control}
                        onClick={() => void mutate("revoke", invitation.id)}
                      >
                        إلغاء
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {!list.invitations.length && (
            <p className="text-sm text-[var(--text-muted)]">
              لا توجد دعوات مسجلة.
            </p>
          )}
          <p className="text-xs text-[var(--text-muted)]">
            تُعرض أحدث ١٠٠ دعوة. يمكن تجديد الرابط بعد دقيقة من آخر إصدار.
          </p>
        </>
      )}
    </section>
  );
}
