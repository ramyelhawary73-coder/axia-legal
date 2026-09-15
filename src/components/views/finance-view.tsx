"use client";

import { useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Receipt, 
  Plus, 
  X
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
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <DollarSign className="size-4" />
            <span>الحسابات المالية والأتعاب القضائية</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            إدارة المطالبات والأتعاب ومصروفات الدعاوى
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            سجل المقبوضات، أتعاب المؤخر والنجاح، أمانات الخبراء، ورسوم الخزينة
          </p>
        </div>

        <button
          onClick={() => setIsNewEntryOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110"
        >
          <Plus className="size-4" />
          <span>تسجيل حركة مالية / سند قبض</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/30 bg-[#0d1726] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">إجمالي الأتعاب المحصلة</span>
            <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-400">
            {totalCollected.toLocaleString("ar-EG")} ج.م
          </p>
          <p className="mt-1 text-[11px] text-slate-400">دفوعات مسددة بحسابات البنك والخزينة</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-[#0d1726] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">أتعاب وفواتير مستحقة</span>
            <div className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-300">
            {totalPending.toLocaleString("ar-EG")} ج.م
          </p>
          <p className="mt-1 text-[11px] text-slate-400">أتعاب مؤخرة وأمانات قيد التحصيل من الموكلين</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-[#0d1726] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">أمانات ومصروفات محاكم مسددة</span>
            <div className="grid size-8 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
              <Receipt className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-300">
            {totalCourtDeposits.toLocaleString("ar-EG")} ج.م
          </p>
          <p className="mt-1 text-[11px] text-slate-400">أمانات خبراء وزارة العدل والرسوم القضائية</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {[
          { id: "all", label: "كافة السجلات المالية" },
          { id: "محصلة", label: "المقبوضات المحصلة" },
          { id: "مستحقة", label: "المطالبات المستحقة" },
          { id: "مسددة للمحكمة", label: "رسوم وأمانات المحاكم" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filterStatus === tab.id
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Financial Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1726]">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-black/20 text-slate-400">
              <th className="p-4 font-semibold">رقم السند</th>
              <th className="p-4 font-semibold">الموكل</th>
              <th className="p-4 font-semibold">القضية المرتبطة</th>
              <th className="p-4 font-semibold">نوع الحركة</th>
              <th className="p-4 font-semibold">المبلغ</th>
              <th className="p-4 font-semibold">التاريخ</th>
              <th className="p-4 font-semibold">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredFinances.map((rec) => (
              <tr key={rec.id} className="hover:bg-white/[0.02] transition">
                <td className="p-4 font-mono font-bold text-[var(--axia-gold-light)]">
                  {rec.receiptNumber}
                </td>
                <td className="p-4 font-bold text-white">{rec.clientName}</td>
                <td className="p-4 text-slate-300">{rec.matterCaseNumber}</td>
                <td className="p-4 text-slate-200">{rec.type}</td>
                <td className="p-4 font-bold text-white">
                  {rec.amount.toLocaleString("ar-EG")} ج.م
                </td>
                <td className="p-4 text-slate-400">{rec.date}</td>
                <td className="p-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    rec.status === "محصلة"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : rec.status === "مستحقة"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}>
                    {rec.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Transaction Modal */}
      {isNewEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-emerald-500/30 bg-[#0d1726] p-6 lg:p-8 shadow-2xl">
            <button
              onClick={() => setIsNewEntryOpen(false)}
              className="absolute left-6 top-6 grid size-8 place-items-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Plus className="size-4" />
              <span>إدراج سند مالي جديد</span>
            </div>
            
            <h2 className="mt-1 text-xl font-bold text-white">تسجيل حركة أتعاب / مصروفات</h2>
            
            <form onSubmit={handleCreateTransaction} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">اسم الموكل</label>
                <input
                  type="text"
                  required
                  placeholder="اسم الشركة أو الشخص"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">رقم القضية</label>
                <input
                  type="text"
                  placeholder="مثال: ١٤٢٠ لسنة ٩٣ ق - نقض"
                  value={matterCaseNumber}
                  onChange={(e) => setMatterCaseNumber(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">نوع البند</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as FinancialRecord["type"])}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="دفعة أتعاب">دفعة أتعاب محاماة مقدمة</option>
                    <option value="أتعاب نجاح مؤخرة">أتعاب نجاح مؤخرة</option>
                    <option value="أمانة خبير">أمانة خبير قضائي</option>
                    <option value="رسوم قضائية">رسوم قضائية وخزينة</option>
                    <option value="مصروفات إدارية">مصروفات إدارية وانتقالات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">الحالة</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as FinancialRecord["status"])}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="محصلة">محصلة فعلياً</option>
                    <option value="مستحقة">مستحقة قيد التحصيل</option>
                    <option value="مسددة للمحكمة">مسددة للمحكمة / الخزينة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">المبلغ بالجنيه المصري (EGP)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewEntryOpen(false)}
                  className="rounded-xl bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/15"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 font-bold text-slate-950 hover:brightness-110"
                >
                  حفظ السند المالي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
