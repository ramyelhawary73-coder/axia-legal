"use client";

import { useState } from "react";
import { 
  Gavel, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Building2,
  X
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
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <Gavel className="size-4" />
            <span>أجندة المحاكم ورول الجلسات</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            جدول الجلسات القضائية والقرارات
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            توزيع المحامين على قاعات المحاكم، تدوين القرارات الفورية بعد رفع الجلسة
          </p>
        </div>

        <button
          onClick={() => setIsNewHearingOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110"
        >
          <Plus className="size-4" />
          <span>إدراج جلسة في الرول</span>
        </button>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "all"
              ? "bg-[var(--axia-gold)]/20 text-[var(--axia-gold-light)] border border-[var(--axia-gold)]/40"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          كافة الجلسات ({hearings.length})
        </button>
        <button
          onClick={() => setActiveTab("today")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === "today"
              ? "bg-amber-400 text-slate-950 font-bold"
              : "text-amber-300 hover:bg-amber-400/10"
          }`}
        >
          <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
          جلسات اليوم ({hearings.filter((h) => h.status === "اليوم").length})
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "upcoming"
              ? "bg-[var(--axia-gold)]/20 text-[var(--axia-gold-light)] border border-[var(--axia-gold)]/40"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          الجلسات القادمة ({hearings.filter((h) => h.status === "قادمة").length})
        </button>
      </div>

      {/* Hearings List */}
      <div className="space-y-4">
        {filteredHearings.map((hearing) => {
          const isToday = hearing.status === "اليوم";
          return (
            <div
              key={hearing.id}
              className={`rounded-2xl border p-5 transition ${
                isToday
                  ? "border-amber-400/50 bg-[#141b26] shadow-lg shadow-amber-950/20"
                  : "border-white/10 bg-[#0d1726] hover:border-white/20"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                      isToday ? "bg-amber-400 text-slate-950" : "bg-white/10 text-slate-200"
                    }`}>
                      {isToday ? "جلسة اليوم" : hearing.hearingDate}
                    </span>
                    <span className="text-xs font-bold text-[var(--axia-gold-light)]">
                      {hearing.caseNumber}
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-bold">
                      رول #{hearing.rollNumber}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="size-3" />
                      {hearing.hearingTime}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="size-4 text-slate-400" />
                    <span>{hearing.court}</span>
                    <span className="text-xs text-slate-400">({hearing.circuit})</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-amber-200">الغاية الإجرائية:</strong> {hearing.purpose}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 lg:flex-col lg:items-end">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                    <span className="text-[11px] text-slate-400 block">المحامي المكلف بالحضور</span>
                    <strong className="text-white text-xs">{hearing.attendingLawyer}</strong>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    القاعة: <strong className="text-slate-200">{hearing.hall}</strong>
                  </div>
                </div>
              </div>

              {/* Court Decision Row */}
              <div className="mt-4 border-t border-white/10 pt-3">
                {hearing.lastDecision ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">قرار المحكمة الصادر:</span>
                      <p className="mt-0.5 text-slate-200">{hearing.lastDecision}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="تدوين قرار الهيئة القضائية الصادر بالجلسة (تأجيل / حجز للحكم / ندب خبير)..."
                      value={decisionNotes[hearing.id] || ""}
                      onChange={(e) =>
                        setDecisionNotes({
                          ...decisionNotes,
                          [hearing.id]: e.target.value,
                        })
                      }
                      className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (decisionNotes[hearing.id]) {
                          handleAddDecision(hearing.id, decisionNotes[hearing.id]);
                        }
                      }}
                      className="rounded-xl bg-amber-400/20 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-400/30"
                    >
                      اعتماد القرار
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--axia-gold-dim)] bg-[#0d1726] p-6 lg:p-8 shadow-2xl">
            <button
              onClick={() => setIsNewHearingOpen(false)}
              className="absolute left-6 top-6 grid size-8 place-items-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <Plus className="size-4" />
              <span>جدولة جلسة جديدة في الرول القضائي</span>
            </div>
            
            <h2 className="mt-1 text-xl font-bold text-white">إضافة جلسة محكمة</h2>
            
            <form onSubmit={handleCreateHearing} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">رقم القضية</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ١٤٢٠ لسنة ٩٣ ق - نقض"
                  value={newCaseNumber}
                  onChange={(e) => setNewCaseNumber(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">المحكمة ومقرها</label>
                  <input
                    type="text"
                    required
                    value={newCourt}
                    onChange={(e) => setNewCourt(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">الدائرة القضائية</label>
                  <input
                    type="text"
                    value={newCircuit}
                    onChange={(e) => setNewCircuit(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">القاعة</label>
                  <input
                    type="text"
                    value={newHall}
                    onChange={(e) => setNewHall(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">رقم الرول</label>
                  <input
                    type="number"
                    value={newRoll}
                    onChange={(e) => setNewRoll(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">توقيت الانعقاد</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">تاريخ الجلسة</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">المحامي المكلف بالحضور</label>
                  <input
                    type="text"
                    value={newLawyer}
                    onChange={(e) => setNewLawyer(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">المطلوب بالجلسة (الهدف الإجرائي)</label>
                <textarea
                  rows={2}
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewHearingOpen(false)}
                  className="rounded-xl bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/15"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-5 py-2 font-bold text-slate-950 hover:brightness-110"
                >
                  تثبيت الجلسة بالرول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
