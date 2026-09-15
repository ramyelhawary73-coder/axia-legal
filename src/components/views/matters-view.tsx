"use client";

import { useState } from "react";
import { 
  Search, 
  Plus, 
  Briefcase, 
  X
} from "lucide-react";
import { mockMatters } from "@/lib/mock-legal-data";
import { Matter, CourtCategory } from "@/types/legal";

interface MattersViewProps {
  selectedMatterId?: string | null;
  onCloseMatterModal?: () => void;
}

export function MattersView({ selectedMatterId, onCloseMatterModal }: MattersViewProps) {
  const [matters, setMatters] = useState<Matter[]>(mockMatters);
  const [searchQuery, setSearchQuery] = useState("");
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  
  // Selected matter for viewing dossier
  const [activeMatter, setActiveMatter] = useState<Matter | null>(() => {
    if (selectedMatterId) {
      return mockMatters.find((m) => m.id === selectedMatterId) || null;
    }
    return null;
  });

  // Modal for new case
  const [isNewMatterOpen, setIsNewMatterOpen] = useState(false);
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCourt, setNewCourt] = useState<CourtCategory>("محكمة النقض");
  const [newCircuit, setNewCircuit] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientRole, setNewClientRole] = useState<Matter["clientRole"]>("مدعي");
  const [newOpponentName, setNewOpponentName] = useState("");
  const [newAssignedLawyer] = useState("د. رامي الهواري (محام بالنقض)");
  const [newNextHearingDate, setNewNextHearingDate] = useState("2026-10-12");
  const [newAgreedFees, setNewAgreedFees] = useState("١٠٠,٠٠٠ ج.م");

  const handleCreateMatter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber || !newTitle || !newClientName) return;

    const newMatter: Matter = {
      id: `MAT-${Date.now()}`,
      caseNumber: newCaseNumber,
      year: 2026,
      court: newCourt,
      circuit: newCircuit || "الدائرة الأولى",
      title: newTitle,
      clientName: newClientName,
      clientRole: newClientRole,
      opponentName: newOpponentName || "الجهة المدعى عليها",
      assignedLawyer: newAssignedLawyer,
      nextHearingDate: newNextHearingDate,
      nextHearingGoal: "إعلان الصحيفة وإيداع التوكيل",
      stage: "متداولة",
      agreedFees: newAgreedFees,
      paidFees: "٠ ج.م",
      notes: "تم قيد الدعوى حديثاً بقلم كتاب المحكمة.",
    };

    setMatters([newMatter, ...matters]);
    setIsNewMatterOpen(false);
    // Reset form
    setNewCaseNumber("");
    setNewTitle("");
    setNewClientName("");
  };

  const filteredMatters = matters.filter((matter) => {
    const matchesSearch =
      matter.caseNumber.includes(searchQuery) ||
      matter.title.includes(searchQuery) ||
      matter.clientName.includes(searchQuery) ||
      matter.opponentName.includes(searchQuery);

    const matchesCourt = courtFilter === "all" || matter.court === courtFilter;
    const matchesStage = stageFilter === "all" || matter.stage === stageFilter;

    return matchesSearch && matchesCourt && matchesStage;
  });

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Header with quick creation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
            <Briefcase className="size-4" />
            <span>إدارة الملفات والقضايا المتداولة</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            سجل القضايا والمنازعات القضائية
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            إدارة متكاملة لصحف الدعاوى، المذكرات، قرارات الدوائر، والمتابعة الإجرائية
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewMatterOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#a77e16] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110 active:scale-95"
          >
            <Plus className="size-4" />
            <span>قيد قضية جديدة</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#0d1726] p-4 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute right-3.5 top-3 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم القضية، المحكمة، اسم الموكل، أو الخصم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/25 pr-10 pl-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[var(--axia-gold)] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-200 focus:border-[var(--axia-gold)] focus:outline-none"
          >
            <option value="all">كافة المحاكم والجهات القضائية</option>
            <option value="محكمة النقض">محكمة النقض</option>
            <option value="المحكمة الاقتصادية">المحكمة الاقتصادية</option>
            <option value="مجلس الدولة (القضاء الإداري)">مجلس الدولة (القضاء الإداري)</option>
            <option value="استئناف عالي">استئناف عالي</option>
            <option value="ابتدائية كلي">ابتدائية كلي</option>
          </select>
        </div>

        <div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-200 focus:border-[var(--axia-gold)] focus:outline-none"
          >
            <option value="all">كافة مراحل الدعوى</option>
            <option value="متداولة">متداولة بالجلسات</option>
            <option value="حجز للحكم">محجوزة للحكم</option>
            <option value="مؤجلة لتقديم مستندات">مؤجلة للمستندات والمذكرات</option>
            <option value="طعن بالنقض">طعن بالنقض</option>
          </select>
        </div>
      </div>

      {/* Matters Cards / Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredMatters.map((matter) => (
          <div
            key={matter.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0d1726] p-5 shadow-lg transition hover:border-[var(--axia-gold)]/40 hover:bg-[#111e33]"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-lg border border-[var(--axia-gold-dim)] bg-[var(--axia-gold)]/10 px-2.5 py-1 text-xs font-bold text-[var(--axia-gold-light)]">
                  {matter.caseNumber}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  matter.stage === "حجز للحكم"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : matter.stage === "متداولة"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  {matter.stage}
                </span>
              </div>

              {/* Title & Subject */}
              <h3 className="mt-3 text-sm font-bold text-white group-hover:text-[var(--axia-gold-light)] transition">
                {matter.title}
              </h3>

              {/* Court & Circuit */}
              <div className="mt-2 text-xs text-slate-300">
                <span className="font-semibold text-slate-200">{matter.court}</span> · <span>{matter.circuit}</span>
              </div>

              {/* Parties */}
              <div className="mt-4 rounded-xl border border-white/5 bg-black/25 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">الموكل:</span>
                  <span className="font-semibold text-white truncate max-w-[170px]">{matter.clientName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">صفة الموكل:</span>
                  <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] text-cyan-300">{matter.clientRole}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">الخصم:</span>
                  <span className="text-slate-300 truncate max-w-[170px]">{matter.opponentName}</span>
                </div>
              </div>

              {/* Next Hearing & Goal */}
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">الجلسة القادمة:</span>
                  <span className="font-bold text-amber-300">{matter.nextHearingDate}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                  <strong>المطلوب:</strong> {matter.nextHearingGoal}
                </p>
              </div>
            </div>

            {/* Bottom Actions & Lawyer */}
            <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                المحامي: <strong className="text-slate-300">{matter.assignedLawyer.split(" ")[0]} {matter.assignedLawyer.split(" ")[1]}</strong>
              </span>
              <button
                onClick={() => setActiveMatter(matter)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--axia-gold)] hover:text-slate-950 transition"
              >
                فتح الملف بالكامل
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dossier Modal / View details */}
      {activeMatter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[var(--axia-gold-dim)] bg-[#0d1726] p-6 lg:p-8 shadow-2xl">
            <button
              onClick={() => {
                setActiveMatter(null);
                if (onCloseMatterModal) onCloseMatterModal();
              }}
              className="absolute left-6 top-6 grid size-8 place-items-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
              <Briefcase className="size-4" />
              <span>ملف القضية القضائي المعتمد</span>
            </div>
            
            <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              {activeMatter.caseNumber}
            </h2>
            <p className="mt-1 text-sm text-slate-300">{activeMatter.title}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-black/25 p-3.5">
                <span className="text-slate-400">المحكمة والدائرة:</span>
                <p className="mt-1 font-bold text-white">{activeMatter.court} — {activeMatter.circuit}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3.5">
                <span className="text-slate-400">حالة الدعوى:</span>
                <p className="mt-1 font-bold text-amber-300">{activeMatter.stage}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3.5">
                <span className="text-slate-400">الموكل والصفة:</span>
                <p className="mt-1 font-bold text-white">{activeMatter.clientName} ({activeMatter.clientRole})</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3.5">
                <span className="text-slate-400">الخصم ومحاميه:</span>
                <p className="mt-1 font-bold text-white">{activeMatter.opponentName} · {activeMatter.opponentLawyer || "محام الخصم"}</p>
              </div>
            </div>

            {/* Financials & Lawyer */}
            <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-slate-400">الأتعاب المتفق عليها</span>
                  <p className="mt-1 font-bold text-white">{activeMatter.agreedFees}</p>
                </div>
                <div>
                  <span className="text-slate-400">المسدد منها</span>
                  <p className="mt-1 font-bold text-emerald-400">{activeMatter.paidFees}</p>
                </div>
                <div>
                  <span className="text-slate-400">المحامي المسؤول</span>
                  <p className="mt-1 font-bold text-slate-200">{activeMatter.assignedLawyer}</p>
                </div>
              </div>
            </div>

            {/* Notes & Actions */}
            {activeMatter.notes && (
              <div className="mt-4 rounded-xl border border-[var(--axia-gold-dim)] bg-[var(--axia-gold)]/5 p-4 text-xs">
                <span className="font-bold text-[var(--axia-gold-light)]">ملاحظات الدفاع والتحضير:</span>
                <p className="mt-1 leading-relaxed text-slate-200">{activeMatter.notes}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setActiveMatter(null)}
                className="rounded-xl bg-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Matter Modal */}
      {isNewMatterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--axia-gold-dim)] bg-[#0d1726] p-6 lg:p-8 shadow-2xl">
            <button
              onClick={() => setIsNewMatterOpen(false)}
              className="absolute left-6 top-6 grid size-8 place-items-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
              <Plus className="size-4" />
              <span>قيد ملف قضية جديدة</span>
            </div>
            
            <h2 className="mt-1 text-xl font-bold text-white">إضافة دعوى قضائية جديدة</h2>
            
            <form onSubmit={handleCreateMatter} className="mt-6 space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">رقم القضية والسنة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ٥٢١ لسنة ٢٠٢٦ مدني كلي شمال"
                    value={newCaseNumber}
                    onChange={(e) => setNewCaseNumber(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">المحكمة</label>
                  <select
                    value={newCourt}
                    onChange={(e) => setNewCourt(e.target.value as CourtCategory)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  >
                    <option value="محكمة النقض">محكمة النقض</option>
                    <option value="المحكمة الاقتصادية">المحكمة الاقتصادية</option>
                    <option value="مجلس الدولة (القضاء الإداري)">مجلس الدولة (القضاء الإداري)</option>
                    <option value="استئناف عالي">استئناف عالي</option>
                    <option value="ابتدائية كلي">ابتدائية كلي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">موضوع الدعوى / الطعن</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دعوى مطالبة بتعويض مادي وأدبي عن الإخلال ببنود العقد"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 mb-1 font-semibold">اسم الموكل</label>
                  <input
                    type="text"
                    required
                    placeholder="اسم الشركة أو الموكل"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">صفة الموكل</label>
                  <select
                    value={newClientRole}
                    onChange={(e) => setNewClientRole(e.target.value as Matter["clientRole"])}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  >
                    <option value="مدعي">مدعي</option>
                    <option value="مدعى عليه">مدعى عليه</option>
                    <option value="طاعن">طاعن</option>
                    <option value="مطعون ضده">مطعون ضده</option>
                    <option value="مستأنف">مستأنف</option>
                    <option value="مستأنف ضده">مستأنف ضده</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">الخصم في الدعوى</label>
                  <input
                    type="text"
                    placeholder="اسم الخصم أو الجهة"
                    value={newOpponentName}
                    onChange={(e) => setNewOpponentName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">الدائرة / القاعة</label>
                  <input
                    type="text"
                    placeholder="مثال: الدائرة ٧ مدني استثماري"
                    value={newCircuit}
                    onChange={(e) => setNewCircuit(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">تاريخ الجلسة القادمة</label>
                  <input
                    type="date"
                    value={newNextHearingDate}
                    onChange={(e) => setNewNextHearingDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">الأتعاب المتفق عليها</label>
                  <input
                    type="text"
                    placeholder="مثال: ١٥٠,٠٠٠ ج.م"
                    value={newAgreedFees}
                    onChange={(e) => setNewAgreedFees(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewMatterOpen(false)}
                  className="rounded-xl bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/15"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#a77e16] px-5 py-2 font-bold text-slate-950 hover:brightness-110"
                >
                  حفظ وقيد الدعوى
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
