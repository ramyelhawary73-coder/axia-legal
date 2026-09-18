"use client";

import { useState } from "react";
import { 
  Gavel, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Building2,
  X,
  Search,
  Filter
} from "lucide-react";
import { mockHearings } from "@/lib/mock-legal-data";
import { Hearing } from "@/types/legal";

export function HearingsView() {
  const [hearings, setHearings] = useState<Hearing[]>(mockHearings);
  const [activeTab, setActiveTab] = useState<"all" | "today" | "upcoming">("all");
  const [isNewHearingOpen, setIsNewHearingOpen] = useState(false);

  // New hearing state
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCourt, setNewCourt] = useState("دار القضاء العالي - محكمة النقض");
  const [newCircuit, setNewCircuit] = useState("الدائرة المدنية والتجارية");
  const [newHall, setNewHall] = useState("قاعة ٤");
  const [newRoll, setNewRoll] = useState(12);
  const [newDate, setNewDate] = useState("2026-09-25");
  const [newTime, setNewTime] = useState("10:00 ص");
  const [newLawyer, setNewLawyer] = useState("د. رامي الهواري");
  const [newPurpose, setNewPurpose] = useState("المرافعة وتقديم المستندات");

  const [decisionNotes, setDecisionNotes] = useState<{ [id: string]: string }>({});

  const handleAddDecision = (id: string, decision: string) => {
    setHearings(
      hearings.map((h) =>
        h.id === id ? { ...h, lastDecision: decision, status: "منتهية" } : h
      )
    );
  };

  const handleCreateHearing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber) return;

    const hearing: Hearing = {
      id: `HR-${Date.now()}`,
      matterId: "MAT-NEW",
      caseNumber: newCaseNumber,
      court: newCourt,
      circuit: newCircuit,
      hall: newHall,
      rollNumber: newRoll,
      hearingDate: newDate,
      hearingTime: newTime,
      attendingLawyer: newLawyer,
      purpose: newPurpose,
      status: newDate === "2026-09-15" ? "اليوم" : "قادمة",
    };

    setHearings([hearing, ...hearings]);
    setIsNewHearingOpen(false);
    setNewCaseNumber("");
  };

  const filteredHearings = hearings.filter((h) => {
    if (activeTab === "today") return h.status === "اليوم";
    if (activeTab === "upcoming") return h.status === "قادمة";
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            أجندة المحاكم ورول الجلسات
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Gavel className="size-3.5" />
            توزيع المحامين على قاعات المحاكم وتدوين القرارات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute right-2.5 top-1.5 size-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="بحث في الأجندة..."
              className="w-48 rounded-md border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setIsNewHearingOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" />
            <span>إدراج جلسة</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] pb-0">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "all"
              ? "border-[var(--gold)] text-[var(--gold)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          كافة الجلسات
          <span className="ml-1.5 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[9px] text-[var(--text)]">{hearings.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("today")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "today"
              ? "border-[var(--text)] text-[var(--text)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <span className={`size-1.5 rounded-full ${activeTab === 'today' ? 'bg-red-500 animate-pulse' : 'bg-transparent'}`} />
          جلسات اليوم
          <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[9px] ${
            activeTab === "today" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--accent)] text-[var(--text)]"
          }`}>
            {hearings.filter((h) => h.status === "اليوم").length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "upcoming"
              ? "border-[var(--gold)] text-[var(--gold)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          الجلسات القادمة
          <span className="ml-1.5 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[9px] text-[var(--text)]">
            {hearings.filter((h) => h.status === "قادمة").length}
          </span>
        </button>
        <div className="mr-auto">
          <button className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-1">
            <Filter className="size-3" />
            تصفية
          </button>
        </div>
      </div>

      {/* Hearings List */}
      <div className="space-y-3">
        {filteredHearings.map((hearing) => {
          const isToday = hearing.status === "اليوم";
          return (
            <div
              key={hearing.id}
              className={`rounded-xl border transition-all ${
                isToday
                  ? "border-[var(--gold)]/40 bg-[var(--gold)]/5 shadow-[var(--shadow-sm)]"
                  : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-strong)] shadow-sm"
              }`}
            >
              <div className="p-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isToday ? "bg-[var(--gold)] text-[var(--bg)]" : "bg-[var(--accent)] text-[var(--text-muted)]"
                    }`}>
                      {isToday ? "اليوم" : hearing.hearingDate}
                    </span>
                    <span className="text-xs font-bold text-[var(--text)]">
                      {hearing.caseNumber}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] border-r border-[var(--border)] pr-2 mr-1">
                      رول #{hearing.rollNumber}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 border-r border-[var(--border)] pr-2 mr-1">
                      <Clock className="size-3" />
                      {hearing.hearingTime}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                    <Building2 className="size-4 text-[var(--text-muted)]" />
                    <span>{hearing.court}</span>
                    <span className="text-xs font-normal text-[var(--text-muted)]">({hearing.circuit})</span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]"></span>
                    <span className="font-medium text-[var(--text)]">المطلوب:</span> {hearing.purpose}
                  </p>
                </div>

                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 lg:gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block mb-0.5">المحامي المكلف</span>
                    <div className="flex items-center gap-1.5 bg-[var(--accent)] px-2 py-1 rounded-md">
                       <div className="size-4 rounded-full bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] flex items-center justify-center text-[8px] font-bold text-white">
                         {hearing.attendingLawyer.charAt(0)}
                       </div>
                       <strong className="text-[var(--text)] text-xs font-medium">{hearing.attendingLawyer}</strong>
                    </div>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    القاعة: <strong className="text-[var(--text)]">{hearing.hall}</strong>
                  </div>
                </div>
              </div>

              {/* Court Decision Row */}
              <div className="border-t border-[var(--border)] bg-[var(--bg)]/30 px-4 py-2.5 rounded-b-xl">
                {hearing.lastDecision ? (
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-medium text-[var(--text)]">قرار المحكمة:</span>
                    <span className="text-[var(--text-muted)]">{hearing.lastDecision}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 max-w-2xl">
                    <input
                      type="text"
                      placeholder="تدوين قرار الجلسة (تأجيل / حجز للحكم / ندب خبير)..."
                      value={decisionNotes[hearing.id] || ""}
                      onChange={(e) =>
                        setDecisionNotes({
                          ...decisionNotes,
                          [hearing.id]: e.target.value,
                        })
                      }
                      className="flex-1 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                    />
                    <button
                      onClick={() => {
                        if (decisionNotes[hearing.id]) {
                          handleAddDecision(hearing.id, decisionNotes[hearing.id]);
                        }
                      }}
                      className="rounded-md bg-[var(--text)] px-3 py-1.5 text-[11px] font-medium text-[var(--bg)] hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                      اعتماد
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Hearing Modal */}
      {isNewHearingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--accent)] backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel-glass)] backdrop-blur-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => setIsNewHearingOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              <Plus className="size-4 text-[var(--text)]" />
              <span>جدولة جلسة</span>
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text)] border-b border-[var(--border)] pb-4">إضافة جلسة للرول</h2>
            
            <form onSubmit={handleCreateHearing} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">رقم القضية</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ١٤٢٠ لسنة ٩٣ ق - نقض"
                  value={newCaseNumber}
                  onChange={(e) => setNewCaseNumber(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">المحكمة ومقرها</label>
                  <input
                    type="text"
                    required
                    value={newCourt}
                    onChange={(e) => setNewCourt(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">الدائرة القضائية</label>
                  <input
                    type="text"
                    value={newCircuit}
                    onChange={(e) => setNewCircuit(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">القاعة</label>
                  <input
                    type="text"
                    value={newHall}
                    onChange={(e) => setNewHall(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">رقم الرول</label>
                  <input
                    type="number"
                    value={newRoll}
                    onChange={(e) => setNewRoll(Number(e.target.value))}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">توقيت الانعقاد</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">تاريخ الجلسة</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">المحامي المكلف بالحضور</label>
                  <input
                    type="text"
                    value={newLawyer}
                    onChange={(e) => setNewLawyer(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">المطلوب بالجلسة</label>
                <textarea
                  rows={2}
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] resize-none"
                />
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewHearingOpen(false)}
                  className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-2 font-medium text-[var(--text)] hover:bg-[var(--accent)] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] hover:opacity-90 transition-opacity"
                >
                  حفظ الجلسة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
