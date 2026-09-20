"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Receipt,
  Plus,
  X,
  ChevronDown,
} from "lucide-react";
import type { Client, FinancialRecord, Matter } from "@/types/legal";
import { loadPersistentClients } from "@/lib/clients-client";
import { loadMattersWorkspace } from "@/lib/matters-client";
import {
  createPersistentFinanceRecord,
  loadPersistentFinances,
} from "@/lib/finance-client";

export function FinanceView() {
  const [finances, setFinances] = useState<FinancialRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [matterId, setMatterId] = useState("");
  const [type, setType] = useState<FinancialRecord["type"]>("دفعة أتعاب");
  const [amount, setAmount] = useState<number>(50000);
  const [status, setStatus] = useState<FinancialRecord["status"]>("محصلة");

  useEffect(() => {
    let cancelled = false;

    void Promise.all([loadPersistentClients(), loadMattersWorkspace()])
      .then(async ([loadedClients, matterWorkspace]) => {
        if (cancelled) return;
        setClients(loadedClients);
        setMatters(matterWorkspace.matters);

        const loadedFinances = await loadPersistentFinances(
          loadedClients,
          matterWorkspace.matters,
        );
        if (cancelled) return;
        setFinances(loadedFinances);
        setSyncError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSyncError(
          error instanceof Error ? error.message : "تعذر تحميل السجل المالي.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedClientMatters = useMemo(
    () =>
      clientId
        ? matters.filter((matter) => matter.clientId === clientId)
        : matters,
    [clientId, matters],
  );

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || isSaving) return;

    setIsSaving(true);
    setSyncError(null);

    try {
      const record = await createPersistentFinanceRecord(
        {
          clientId: clientId || undefined,
          matterId: matterId || undefined,
          type,
          amount,
          status,
        },
        clients,
        matters,
      );

      setFinances((current) => [record, ...current]);
      setIsNewEntryOpen(false);
      setClientId("");
      setMatterId("");
      setAmount(50000);
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "تعذر حفظ الحركة المالية.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const totalCollected = finances
    .filter((item) => item.status === "محصلة")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalPending = finances
    .filter((item) => item.status === "مستحقة")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalCourtDeposits = finances
    .filter((item) => item.status === "مسددة للمحكمة")
    .reduce((sum, item) => sum + item.amount, 0);

  const filteredFinances = finances.filter(
    (item) => filterStatus === "all" || item.status === filterStatus,
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 flex-col justify-between gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            الإدارة المالية والأتعاب
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <DollarSign className="size-3.5" />
            سجل مالي حقيقي محمي بصلاحيات المؤسسة
          </p>
        </div>

        <button
          onClick={() => setIsNewEntryOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] shadow-sm hover:opacity-90"
        >
          <Plus className="size-3.5" />
          <span>سند قبض / قيد حركة</span>
        </button>
      </div>

      {syncError && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
          {syncError}
        </div>
      )}
      {isLoading && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-xs text-[var(--text-muted)]">
          جارٍ تحميل السجل المالي المحفوظ...
        </div>
      )}

      <div className="grid shrink-0 gap-4 py-4 sm:grid-cols-3">
        {[
          {
            label: "الأتعاب المحصلة",
            value: totalCollected,
            icon: TrendingUp,
          },
          {
            label: "مطالبات مستحقة",
            value: totalPending,
            icon: Clock,
          },
          {
            label: "أمانات مسددة",
            value: totalCourtDeposits,
            icon: Receipt,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {item.label}
              </span>
              <item.icon className="size-4 text-[var(--text-muted)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--text)]">
              {item.value.toLocaleString("ar-EG")}{" "}
              <span className="text-xs font-normal text-[var(--text-muted)]">
                ج.م
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2 pb-3">
        {[
          { id: "all", label: "كافة السجلات" },
          { id: "محصلة", label: "مقبوضات" },
          { id: "مستحقة", label: "مطالبات" },
          { id: "مسددة للمحكمة", label: "أمانات" },
          { id: "ملغاة", label: "ملغاة" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
              filterStatus === tab.id
                ? "bg-[var(--text)] text-[var(--bg)]"
                : "border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--accent)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-right text-[11px]">
            <thead className="sticky top-0 z-10 bg-[var(--panel)] shadow-[0_1px_0_var(--border)]">
              <tr className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-4 py-2 font-medium">السند / التاريخ</th>
                <th className="px-4 py-2 font-medium">الموكل</th>
                <th className="px-4 py-2 font-medium">القضية المرتبطة</th>
                <th className="px-4 py-2 font-medium">نوع الحركة</th>
                <th className="px-4 py-2 font-medium">المبلغ</th>
                <th className="px-4 py-2 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredFinances.map((record) => (
                <tr key={record.id} className="hover:bg-[var(--accent)]">
                  <td className="px-4 py-3 align-top">
                    <div className="font-mono font-semibold text-[var(--text)]">
                      {record.receiptNumber}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {record.date}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top font-semibold">
                    {record.clientName}
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--text-muted)]">
                    {record.matterCaseNumber}
                  </td>
                  <td className="px-4 py-3 align-top">{record.type}</td>
                  <td className="px-4 py-3 align-top font-bold">
                    {record.amount.toLocaleString("ar-EG")}{" "}
                    <span className="text-[9px] font-normal text-[var(--text-muted)]">
                      {record.currency || "EGP"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">{record.status}</td>
                </tr>
              ))}
              {!isLoading && filteredFinances.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-xs text-[var(--text-muted)]"
                  >
                    لا توجد سجلات مالية محفوظة مطابقة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] bg-[var(--bg)]/30 px-4 py-2 text-[10px] text-[var(--text-muted)]">
          إجمالي السجلات: {filteredFinances.length}
        </div>
      </div>

      {isNewEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <button
              onClick={() => setIsNewEntryOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)]"
            >
              <X className="size-4" />
            </button>

            <h2 className="border-b border-[var(--border)] pb-4 text-xl font-bold">
              قيد حركة مالية حقيقية
            </h2>

            <form onSubmit={handleCreateTransaction} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-medium text-[var(--text-muted)]">
                  الموكل
                </label>
                <select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setMatterId("");
                  }}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                >
                  <option value="">بدون ربط بموكل</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-[var(--text-muted)]">
                  القضية
                </label>
                <select
                  value={matterId}
                  onChange={(e) => setMatterId(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                >
                  <option value="">عام بالمكتب / بدون قضية</option>
                  {selectedClientMatters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.caseNumber} — {matter.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-[var(--text-muted)]">
                    نوع البند
                  </label>
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) =>
                        setType(e.target.value as FinancialRecord["type"])
                      }
                      className="w-full appearance-none rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                    >
                      <option value="دفعة أتعاب">دفعة أتعاب</option>
                      <option value="أتعاب نجاح مؤخرة">أتعاب نجاح مؤخرة</option>
                      <option value="أمانة خبير">أمانة خبير</option>
                      <option value="رسوم قضائية">رسوم قضائية</option>
                      <option value="مصروفات إدارية">مصروفات إدارية</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-2.5 top-2.5 size-3 text-[var(--text-muted)]" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-[var(--text-muted)]">
                    الحالة
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as FinancialRecord["status"])
                    }
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                  >
                    <option value="محصلة">محصلة فعليًا</option>
                    <option value="مستحقة">مستحقة</option>
                    <option value="مسددة للمحكمة">مسددة للمحكمة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-[var(--text-muted)]">
                  المبلغ بالجنيه المصري
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewEntryOpen(false)}
                  className="rounded-md border border-[var(--border)] px-4 py-2"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-md bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "جارٍ الحفظ..." : "حفظ السند"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
