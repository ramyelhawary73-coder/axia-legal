"use client";

import { useState } from "react";
import { 
  Search, 
  Plus, 
  Briefcase, 
  X,
  ArrowUpRight,
  ChevronDown,
  Download,
  FileText
} from "lucide-react";
import { mockMatters, mockTasks } from "@/lib/mock-legal-data";
import { Matter, CourtCategory } from "@/types/legal";
import { LegalPdfReportModal } from "@/components/legal-pdf-report-modal";

interface MattersViewProps {
  selectedMatterId?: string | null;
  onCloseMatterModal?: () => void;
}

export function MattersView({ selectedMatterId, onCloseMatterModal }: MattersViewProps) {
  const [matters, setMatters] = useState<Matter[]>(mockMatters);
  const [searchQuery, setSearchQuery] = useState("");
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  
  // PDF Export Modal state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfSelectedMatter, setPdfSelectedMatter] = useState<Matter | null>(null);
  
  // Selected matter for viewing dossier
  const [localActiveMatterId, setLocalActiveMatterId] = useState<string | null>(null);
  const effectiveMatterId = selectedMatterId ?? localActiveMatterId;
  const activeMatter = effectiveMatterId ? mockMatters.find((m) => m.id === effectiveMatterId) || null : null;

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
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border)] shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            سجل القضايا والمنازعات
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Briefcase className="size-3.5" />
            إدارة متكاملة لصحف الدعاوى، المذكرات، ومتابعة الإجراءات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPdfSelectedMatter(null);
              setIsPdfModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] shadow-sm transition"
            title="تصدير جدول القضايا الحالية إلى ملف PDF رسمي"
          >
            <Download className="size-3.5" />
            <span>تصدير تقرير القضايا (PDF)</span>
          </button>

          <button
            onClick={() => setIsNewMatterOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" />
            <span>قيد قضية جديدة</span>
          </button>
        </div>
      </div>

      {/* Filters Bar - High Density */}
      <div className="flex flex-wrap items-center gap-3 py-3 shrink-0">
        <div className="relative flex-1 min-w-[250px] max-w-sm">
          <Search className="absolute right-2.5 top-1.5 size-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="بحث برقم القضية، الموكل، الخصم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          />
        </div>

        <div className="relative">
          <select
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            className="appearance-none rounded-md border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          >
            <option value="all">كافة المحاكم والجهات</option>
            <option value="محكمة النقض">محكمة النقض</option>
            <option value="المحكمة الاقتصادية">المحكمة الاقتصادية</option>
            <option value="مجلس الدولة (القضاء الإداري)">مجلس الدولة</option>
            <option value="استئناف عالي">استئناف عالي</option>
            <option value="ابتدائية كلي">ابتدائية كلي</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-2 size-3 text-[var(--text-muted)] pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="appearance-none rounded-md border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          >
            <option value="all">كافة مراحل الدعوى</option>
            <option value="متداولة">متداولة</option>
            <option value="حجز للحكم">محجوزة للحكم</option>
            <option value="مؤجلة لتقديم مستندات">مؤجلة للمستندات</option>
            <option value="طعن بالنقض">طعن بالنقض</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-2 size-3 text-[var(--text-muted)] pointer-events-none" />
        </div>
      </div>

      {/* Matters Table - Replaces chunky cards with a clean, high-density Mac-like list */}
      <div className="flex-1 overflow-hidden flex flex-col rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right text-[11px]">
            <thead className="sticky top-0 bg-[var(--panel)] z-10 shadow-[0_1px_0_var(--border)]">
              <tr className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                <th className="px-4 py-2 font-medium w-[15%]">رقم القضية</th>
                <th className="px-4 py-2 font-medium w-[25%]">الموضوع والمحكمة</th>
                <th className="px-4 py-2 font-medium w-[20%]">الأطراف (موكل / خصم)</th>
                <th className="px-4 py-2 font-medium w-[15%]">الجلسة القادمة</th>
                <th className="px-4 py-2 font-medium w-[10%]">الحالة</th>
                <th className="px-4 py-2 font-medium w-[10%]">المحامي</th>
                <th className="px-4 py-2 font-medium w-[5%] text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredMatters.map((matter) => (
                <tr 
                  key={matter.id} 
                  className="hover:bg-[var(--accent)] transition-colors group cursor-default"
                  onDoubleClick={() => setLocalActiveMatterId(matter.id)}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-[var(--text)]">{matter.caseNumber}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-[var(--text)] mb-0.5 line-clamp-1" title={matter.title}>{matter.title}</div>
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                      <span className="font-semibold">{matter.court}</span>
                      <span>·</span>
                      <span>{matter.circuit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-[var(--text)] flex items-center justify-between mb-0.5">
                      <span className="truncate pr-1">{matter.clientName}</span>
                      <span className="shrink-0 bg-[var(--text)]/10 text-[var(--text)] px-1 py-0.5 rounded text-[8px]">{matter.clientRole}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate" title={matter.opponentName}>
                      ضد: {matter.opponentName}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-[var(--text)] mb-0.5">{matter.nextHearingDate}</div>
                    <div className="text-[9px] text-[var(--text-muted)] line-clamp-1" title={matter.nextHearingGoal}>
                      {matter.nextHearingGoal}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-medium border ${
                      matter.stage === "حجز للحكم"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : matter.stage === "متداولة"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}>
                      {matter.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-[10px] text-[var(--text-muted)]">
                     {matter.assignedLawyer.split(" ")[0]} {matter.assignedLawyer.split(" ")[1]}
                  </td>
                  <td className="px-4 py-3 align-top text-center">
                    <button
                      onClick={() => setLocalActiveMatterId(matter.id)}
                      className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text)] transition-colors opacity-0 group-hover:opacity-100 mx-auto"
                      title="فتح الملف"
                    >
                      <ArrowUpRight className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMatters.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)] text-xs">
                    لا توجد قضايا مطابقة للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] bg-[var(--bg)]/30 px-4 py-2 text-[10px] text-[var(--text-muted)] flex justify-between">
          <span>إجمالي الملفات: {filteredMatters.length}</span>
          <span>انقر نقراً مزدوجاً لفتح الملف</span>
        </div>
      </div>

      {/* Dossier Modal / View details */}
      {activeMatter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--accent)] backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel-glass)] backdrop-blur-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => {
                setLocalActiveMatterId(null);
                if (onCloseMatterModal) onCloseMatterModal();
              }}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              <Briefcase className="size-3.5" />
              <span>ملف القضية المعتمد</span>
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text)]">
              {activeMatter.caseNumber}
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)] pb-4 border-b border-[var(--border)]">{activeMatter.title}</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                <span className="text-[10px] text-[var(--text-muted)] uppercase">المحكمة والدائرة</span>
                <p className="mt-1 font-semibold text-[var(--text)]">{activeMatter.court} — {activeMatter.circuit}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                <span className="text-[10px] text-[var(--text-muted)] uppercase">حالة الدعوى</span>
                <p className="mt-1 font-semibold text-[var(--text)]">{activeMatter.stage}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                <span className="text-[10px] text-[var(--text-muted)] uppercase">الموكل والصفة</span>
                <p className="mt-1 font-semibold text-[var(--text)]">{activeMatter.clientName} <span className="text-[10px] text-[var(--text-muted)] font-normal">({activeMatter.clientRole})</span></p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                <span className="text-[10px] text-[var(--text-muted)] uppercase">الخصم ومحاميه</span>
                <p className="mt-1 font-semibold text-[var(--text)]">{activeMatter.opponentName}</p>
                {activeMatter.opponentLawyer && <p className="text-[10px] text-[var(--text-muted)]">المحامي: {activeMatter.opponentLawyer}</p>}
              </div>
            </div>

            {/* Financials & Lawyer */}
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4 text-xs">
              <div className="grid grid-cols-3 gap-4 divide-x divide-x-reverse divide-[var(--border)] text-center">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">الأتعاب المتفق عليها</span>
                  <p className="mt-1 font-bold text-[var(--text)]">{activeMatter.agreedFees}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">المسدد منها</span>
                  <p className="mt-1 font-bold text-emerald-600 dark:text-emerald-400">{activeMatter.paidFees}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">المحامي المسؤول</span>
                  <p className="mt-1 font-semibold text-[var(--text)]">{activeMatter.assignedLawyer}</p>
                </div>
              </div>
            </div>

            {/* Notes & Actions */}
            {activeMatter.notes && (
              <div className="mt-4 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4 text-xs">
                <span className="font-semibold text-[var(--gold)] text-[11px]">ملاحظات الدفاع والتحضير:</span>
                <p className="mt-1 leading-relaxed text-[var(--text)]">{activeMatter.notes}</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setPdfSelectedMatter(activeMatter);
                  setIsPdfModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--axia-gold)] px-4 py-2 text-xs font-bold text-black shadow-md hover:bg-[var(--axia-gold-light)] transition"
              >
                <FileText className="size-3.5" />
                <span>تصدير ملف القضية (PDF)</span>
              </button>

              <button
                onClick={() => {
                  setLocalActiveMatterId(null);
                  if (onCloseMatterModal) onCloseMatterModal();
                }}
                className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-5 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--accent)] transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Matter Modal */}
      {isNewMatterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--accent)] backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel-glass)] backdrop-blur-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => setIsNewMatterOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              <Plus className="size-4" />
              <span>قيد ملف جديد</span>
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text)] border-b border-[var(--border)] pb-4">إضافة دعوى قضائية</h2>
            
            <form onSubmit={handleCreateMatter} className="mt-4 space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">رقم القضية والسنة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ٥٢١ لسنة ٢٠٢٦"
                    value={newCaseNumber}
                    onChange={(e) => setNewCaseNumber(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">المحكمة</label>
                  <div className="relative">
                    <select
                      value={newCourt}
                      onChange={(e) => setNewCourt(e.target.value as CourtCategory)}
                      className="appearance-none w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                    >
                      <option value="محكمة النقض">محكمة النقض</option>
                      <option value="المحكمة الاقتصادية">المحكمة الاقتصادية</option>
                      <option value="مجلس الدولة (القضاء الإداري)">مجلس الدولة</option>
                      <option value="استئناف عالي">استئناف عالي</option>
                      <option value="ابتدائية كلي">ابتدائية كلي</option>
                    </select>
                    <ChevronDown className="absolute left-2.5 top-2.5 size-3 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">موضوع الدعوى / الطعن</label>
                <input
                  type="text"
                  required
                  placeholder="دعوى مطالبة بتعويض..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">اسم الموكل</label>
                  <input
                    type="text"
                    required
                    placeholder="اسم الشركة أو الموكل"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">صفة الموكل</label>
                  <div className="relative">
                    <select
                      value={newClientRole}
                      onChange={(e) => setNewClientRole(e.target.value as Matter["clientRole"])}
                      className="appearance-none w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                    >
                      <option value="مدعي">مدعي</option>
                      <option value="مدعى عليه">مدعى عليه</option>
                      <option value="طاعن">طاعن</option>
                      <option value="مطعون ضده">مطعون ضده</option>
                      <option value="مستأنف">مستأنف</option>
                      <option value="مستأنف ضده">مستأنف ضده</option>
                    </select>
                    <ChevronDown className="absolute left-2.5 top-2.5 size-3 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">الخصم في الدعوى</label>
                  <input
                    type="text"
                    placeholder="اسم الخصم أو الجهة"
                    value={newOpponentName}
                    onChange={(e) => setNewOpponentName(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">الدائرة / القاعة</label>
                  <input
                    type="text"
                    placeholder="مثال: الدائرة ٧ مدني استثماري"
                    value={newCircuit}
                    onChange={(e) => setNewCircuit(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">تاريخ الجلسة القادمة</label>
                  <input
                    type="date"
                    value={newNextHearingDate}
                    onChange={(e) => setNewNextHearingDate(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">الأتعاب المتفق عليها</label>
                  <input
                    type="text"
                    placeholder="مثال: ١٥٠,٠٠٠ ج.م"
                    value={newAgreedFees}
                    onChange={(e) => setNewAgreedFees(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewMatterOpen(false)}
                  className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2 font-medium text-[var(--text)] hover:bg-[var(--accent)] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] hover:opacity-90 transition-opacity"
                >
                  حفظ الدعوى
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Legal PDF Report Modal */}
      <LegalPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => {
          setIsPdfModalOpen(false);
          setPdfSelectedMatter(null);
        }}
        defaultReportType={pdfSelectedMatter ? "single-matter" : "matters"}
        matters={filteredMatters}
        tasks={mockTasks}
        selectedMatter={pdfSelectedMatter}
      />
    </div>
  );
}
