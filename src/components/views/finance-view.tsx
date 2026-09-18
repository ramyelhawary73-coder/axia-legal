"use client";

import { useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Receipt, 
  Plus, 
  X,
  ChevronDown
} from "lucide-react";
import { mockFinances } from "@/lib/mock-legal-data";
import { FinancialRecord } from "@/types/legal";

export function FinanceView() {
  const [finances, setFinances] = useState<FinancialRecord[]>(mockFinances);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);

  // New transaction form
  const [clientName, setClientName] = useState("");
  const [matterCaseNumber, setMatterCaseNumber] = useState("");
  const [type, setType] = useState<FinancialRecord["type"]>("دفعة أتعاب");
  const [amount, setAmount] = useState<number>(50000);
  const [status, setStatus] = useState<FinancialRecord["status"]>("محصلة");

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !amount) return;

    const newRecord: FinancialRecord = {
      id: `FIN-${Date.now()}`,
      clientName,
      matterCaseNumber: matterCaseNumber || "عام بالمكتب",
      type,
      amount,
      date: "2026-09-15",
      status,
      receiptNumber: `REC-2026-${Math.floor(100 + Math.random() * 900)}`,
    };

    setFinances([newRecord, ...finances]);
    setIsNewEntryOpen(false);
    setClientName("");
  };

  const totalCollected = finances
    .filter((f) => f.status === "محصلة")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPending = finances
    .filter((f) => f.status === "مستحقة")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalCourtDeposits = finances
    .filter((f) => f.status === "مسددة للمحكمة")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredFinances = finances.filter((f) => {
    if (filterStatus === "all") return true;
    return f.status === filterStatus;
  });

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border)] shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            الإدارة المالية والأتعاب
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <DollarSign className="size-3.5" />
            سجل المقبوضات، أتعاب المؤخر، وأمانات الخبراء
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewEntryOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" />
            <span>سند قبض / قيد حركة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - Dense & Flat */}
      <div className="grid gap-4 sm:grid-cols-3 py-4 shrink-0">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">الأتعاب المحصلة</span>
            <div className="grid size-6 place-items-center rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text)]">
              {totalCollected.toLocaleString("ar-EG")} <span className="text-xs font-normal text-[var(--text-muted)]">ج.م</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">مطالبات مستحقة</span>
            <div className="grid size-6 place-items-center rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text)]">
              {totalPending.toLocaleString("ar-EG")} <span className="text-xs font-normal text-[var(--text-muted)]">ج.م</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">أمانات مسددة</span>
            <div className="grid size-6 place-items-center rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Receipt className="size-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text)]">
              {totalCourtDeposits.toLocaleString("ar-EG")} <span className="text-xs font-normal text-[var(--text-muted)]">ج.م</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-3 shrink-0">
        {[
          { id: "all", label: "كافة السجلات" },
          { id: "محصلة", label: "مقبوضات" },
          { id: "مستحقة", label: "مطالبات" },
          { id: "مسددة للمحكمة", label: "أمانات" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
              filterStatus === tab.id
                ? "bg-[var(--text)] text-[var(--bg)]"
                : "bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Financial Ledger Table */}
      <div className="flex-1 overflow-hidden flex flex-col rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right text-[11px]">
            <thead className="sticky top-0 bg-[var(--panel)] z-10 shadow-[0_1px_0_var(--border)]">
              <tr className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                <th className="px-4 py-2 font-medium w-[15%]">السند / التاريخ</th>
                <th className="px-4 py-2 font-medium w-[20%]">الموكل</th>
                <th className="px-4 py-2 font-medium w-[25%]">القضية المرتبطة</th>
                <th className="px-4 py-2 font-medium w-[15%]">نوع الحركة</th>
                <th className="px-4 py-2 font-medium w-[15%]">المبلغ</th>
                <th className="px-4 py-2 font-medium w-[10%]">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredFinances.map((rec) => (
                <tr key={rec.id} className="hover:bg-[var(--accent)] transition-colors group cursor-default">
                  <td className="px-4 py-3 align-top">
                    <div className="font-mono font-semibold text-[var(--text)] mb-0.5">{rec.receiptNumber}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{rec.date}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-[var(--text)]">{rec.clientName}</div>
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--text-muted)]">
                    {rec.matterCaseNumber}
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--text)]">
                    {rec.type}
                  </td>
                  <td className="px-4 py-3 align-top font-bold text-[var(--text)]">
                    {rec.amount.toLocaleString("ar-EG")} <span className="text-[9px] text-[var(--text-muted)] font-normal">ج.م</span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-medium border ${
                      rec.status === "محصلة"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : rec.status === "مستحقة"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredFinances.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)] text-xs">
                    لا يوجد سجلات مطابقة.
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

      {/* New Transaction Modal */}
      {isNewEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-lg overflow-y-auto rounded-t-[28px] sm:rounded-2xl border-t sm:border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => setIsNewEntryOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              <Plus className="size-4 text-[var(--text)]" />
              <span>إدراج سند مالي</span>
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text)] border-b border-[var(--border)] pb-4">قيد حركة أتعاب أو مصروفات</h2>
            
            <form onSubmit={handleCreateTransaction} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">اسم الموكل</label>
                <input
                  type="text"
                  required
                  placeholder="اسم الشركة أو الشخص"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">رقم القضية</label>
                <input
                  type="text"
                  placeholder="مثال: ١٤٢٠ لسنة ٩٣ ق - نقض"
                  value={matterCaseNumber}
                  onChange={(e) => setMatterCaseNumber(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">نوع البند</label>
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as FinancialRecord["type"])}
                      className="appearance-none w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                    >
                      <option value="دفعة أتعاب">دفعة أتعاب مقدمة</option>
                      <option value="أتعاب نجاح مؤخرة">أتعاب نجاح مؤخرة</option>
                      <option value="أمانة خبير">أمانة خبير</option>
                      <option value="رسوم قضائية">رسوم قضائية وخزينة</option>
                      <option value="مصروفات إدارية">مصروفات إدارية</option>
                    </select>
                    <ChevronDown className="absolute left-2.5 top-2.5 size-3 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">الحالة</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as FinancialRecord["status"])}
                      className="appearance-none w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                    >
                      <option value="محصلة">محصلة فعلياً</option>
                      <option value="مستحقة">مستحقة / لم تسدد</option>
                      <option value="مسددة للمحكمة">مسددة للمحكمة</option>
                    </select>
                    <ChevronDown className="absolute left-2.5 top-2.5 size-3 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">المبلغ بالجنيه (EGP)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] font-mono"
                />
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEntryOpen(false)}
                  className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2 font-medium text-[var(--text)] hover:bg-[var(--accent)] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] hover:opacity-90 transition-opacity"
                >
                  حفظ السند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
