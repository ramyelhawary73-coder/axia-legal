"use client";

import { useState } from "react";
import { 
  Users, 
  Search, 
  UserPlus, 
  X, 
  ChevronLeft, 
  Sparkles,
  BookOpen,
  Calendar
} from "lucide-react";
import { mockTeam, mockTasks, mockMatters } from "@/lib/mock-legal-data";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  experience: string;
  casesCount: number;
  avatar: string;
}

export function TeamView() {
  const [team, setTeam] = useState(mockTeam);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "partner" | "lawyer" | "trainee" | "admin">("all");
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // New Member Form State
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("محام بالاستئناف");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newExperience, setNewExperience] = useState("");
  const [newCasesCount, setNewCasesCount] = useState(0);

  // Handle adding new member
  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Generate dynamic initials for avatar
    const initials = newName.trim().split(" ").map(n => n[0]).join(".").slice(0, 3);
    const newMember = {
      id: `TM-${Date.now()}`,
      name: newName,
      role: newRole,
      specialty: newSpecialty || "عام وشهر عقاري ومحاضر وتأسيس شركات",
      experience: newExperience || "سنة خبرة واحدة",
      casesCount: Number(newCasesCount) || 0,
      avatar: initials || "م.ج"
    };

    setTeam(prev => [newMember, ...prev]);
    setIsAddModalOpen(false);
    
    // Reset form
    setNewName("");
    setNewRole("محام بالاستئناف");
    setNewSpecialty("");
    setNewExperience("");
    setNewCasesCount(0);
  };

  // Helper to classify roles for tab filtering
  const getMemberType = (role: string): "partner" | "lawyer" | "trainee" | "admin" => {
    if (role.includes("شريك") || role.includes("مستشار") || role.includes("مدير")) return "partner";
    if (role.includes("متدرب") || role.includes("جدول عام")) return "trainee";
    if (role.includes("إداري") || role.includes("سكرتار") || role.includes("محضر")) return "admin";
    return "lawyer";
  };

  // Filter & Search Logic
  const filteredTeam = team.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      member.specialty.toLowerCase().includes(searchQuery.toLowerCase()) || 
      member.role.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === "all") return true;
    return getMemberType(member.role) === activeTab;
  });

  // Get specific tasks and matters for selected lawyer/member
  const getMemberAssignedItems = (memberName: string) => {
    const nameKeywords = memberName.split(" ").slice(0, 2); // match "رامي" or "أ. طارق"
    const assignedTasks = mockTasks.filter(t => 
      nameKeywords.some(keyword => t.assignedTo.includes(keyword))
    );
    const assignedMatters = mockMatters.filter(m => 
      nameKeywords.some(keyword => m.assignedLawyer.includes(keyword))
    );
    return { tasks: assignedTasks, matters: assignedMatters };
  };

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Header view */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
            <Users className="size-4" />
            <span>هيئة الدفاع والأجهزة المعاونة</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
            المحامون والمستشارون والمتدربون
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            صلاحيات الحضور، توزيع الدوائر القضائية، وتخصيص رول الجلسات للمتدربين والمحضرين
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#a77e16] px-4.5 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110"
        >
          <UserPlus className="size-4" />
          <span>ضم محامٍ أو متدرب جديد</span>
        </button>
      </div>

      {/* Control Bar: Search & Classification Tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border)] pb-4.5">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: `الكل (${team.length})` },
              { id: "partner", label: "الشركاء والمستشارون" },
              { id: "lawyer", label: "المحامون والمقيدون" },
              { id: "trainee", label: "المحامون المتدربون" },
              { id: "admin", label: "الجهاز الإداري والمحضرين" }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-[var(--axia-gold)] text-black font-bold shadow-sm"
                  : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search member */}
        <div className="relative max-w-xs w-full self-start md:self-auto">
          <span className="absolute inset-y-0 right-3.5 flex items-center text-[var(--text-muted)]">
            <Search className="size-4" />
          </span>
          <input
            type="text"
            placeholder="ابحث باسم المحامي أو التخصص..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] py-2.5 pl-3.5 pr-10 text-xs text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--axia-gold)] transition shadow-sm"
          />
        </div>
      </div>

      {/* Grid view of team cards */}
      {filteredTeam.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] p-12 text-center text-[var(--text-muted)]">
          <Users className="size-10 opacity-30 mb-3" />
          <span className="text-sm font-semibold">لم يتم العثور على أعضاء يطابقون خيارات البحث</span>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
            يمكنك محاولة مراجعة كلمات البحث أو الفلتر النشط لتبويب فريق العمل.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeam.map((member) => (
            <div
              key={member.id}
              className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel-glass)]/30 backdrop-blur-sm p-6 shadow-md hover:border-[var(--axia-gold)]/40 hover:bg-[var(--accent-hover)] transition-all duration-200 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="grid size-12 place-items-center rounded-2xl border border-[var(--axia-gold-dim)] bg-[var(--axia-gold)]/10 font-bold text-[var(--axia-gold-light)] text-base shadow-sm">
                    {member.avatar}
                  </div>
                  <span className="rounded-full bg-[var(--accent)] border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text-muted)] font-medium">
                    {member.experience}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-[var(--text)] group-hover:text-[var(--axia-gold-light)] transition">
                  {member.name}
                </h3>
                <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                  {member.role}
                </p>

                <div className="mt-4 rounded-xl bg-[var(--accent)]/50 p-3.5 text-xs text-[var(--text-muted)] space-y-1 border border-[var(--border)]/40">
                  <span className="text-[10px] text-[var(--axia-gold-light)] block font-semibold">التخصص والدوائر المفضلة:</span>
                  <p className="text-[var(--text)] leading-relaxed font-medium">{member.specialty}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-[var(--border)] pt-4 flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">
                  القضايا المسندة: <strong className="text-[var(--text)] font-semibold">{member.casesCount} قضية</strong>
                </span>
                <button
                  onClick={() => setSelectedMember(member)}
                  className="text-[var(--axia-gold-light)] hover:text-white hover:underline font-bold transition flex items-center gap-1"
                >
                  <span>عرض الرول المخصص</span>
                  <ChevronLeft className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-md overflow-y-auto rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute left-4 top-4 rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-[var(--axia-gold-light)] mb-4">
              <UserPlus className="size-5" />
              <h2 className="text-lg font-bold">ضم محامٍ أو مستشار جديد للمكتب</h2>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">الاسم الثلاثي أو الثنائي</label>
                <input
                  type="text"
                  required
                  placeholder="أدخل الاسم بالكامل..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--axia-gold)] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">الصفة والدرجة</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--axia-gold)] transition"
                  >
                    <option value="محام شريك بالنقض">محام شريك بالنقض</option>
                    <option value="مستشار قانوني أول">مستشار قانوني أول</option>
                    <option value="محام بالاستئناف العالي">محام بالاستئناف العالي</option>
                    <option value="محام ابتدائي كلي">محام ابتدائي كلي</option>
                    <option value="محام متدرب (جدول عام)">محام متدرب (جدول عام)</option>
                    <option value="مستشار مجلس الدولة">مستشار مجلس الدولة</option>
                    <option value="إداري وقلم المحضرين">إداري وقلم المحضرين</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">الخبرة العملية</label>
                  <input
                    type="text"
                    placeholder="مثال: ٥ سنوات خبرة"
                    value={newExperience}
                    onChange={(e) => setNewExperience(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--axia-gold)] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">التخصص الدقيق والدوائر المفضلة</label>
                <input
                  type="text"
                  placeholder="مثال: القضايا المدنية، الضرائب، المحاكم الاقتصادية..."
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--axia-gold)] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">عدد الملفات/القضايا الابتدائية المسندة</label>
                <input
                  type="number"
                  min="0"
                  value={newCasesCount}
                  onChange={(e) => setNewCasesCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--axia-gold)] transition"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[var(--axia-gold)] py-2.5 text-xs font-bold text-black shadow-md hover:brightness-110 transition"
                >
                  إضافة وإدراج بالسجل
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--panel)] py-2.5 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition"
                >
                  إلغاء التكليف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Assigned Items (الرول المخصص) Side Drawer Modal */}
      {selectedMember && (() => {
        const { tasks: assignedTasks, matters: assignedMatters } = getMemberAssignedItems(selectedMember.name);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="h-full w-full max-w-lg border-r border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4.5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-2xl border border-[var(--axia-gold-dim)] bg-[var(--axia-gold)]/10 font-bold text-[var(--axia-gold-light)] text-sm shadow-sm">
                      {selectedMember.avatar}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text)]">{selectedMember.name}</h3>
                      <p className="text-[10px] text-[var(--text-muted)]">{selectedMember.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition"
                  >
                    <X className="size-4.5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Bio and Stats */}
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-[var(--axia-gold-light)] flex items-center gap-1.5">
                      <Sparkles className="size-4" />
                      <span>بطاقة الإنجاز والمسؤوليات</span>
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {selectedMember.specialty}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                      <div className="p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-center">
                        <span className="text-[10px] text-[var(--text-muted)] block">القضايا المسؤولة</span>
                        <strong className="text-base font-bold text-[var(--text)]">{assignedMatters.length}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-center">
                        <span className="text-[10px] text-[var(--text-muted)] block">المهام الجارية</span>
                        <strong className="text-base font-bold text-[var(--text)]">{assignedTasks.length}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Cases List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5 border-b border-[var(--border)] pb-2">
                      <BookOpen className="size-4 text-[var(--text-muted)]" />
                      <span>القضايا المسندة للتحضير والمرافعة ({assignedMatters.length})</span>
                    </h4>
                    {assignedMatters.length === 0 ? (
                      <div className="text-center py-4 rounded-xl border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]">
                        لا توجد قضايا مسجلة باسم هذا العضو حالياً
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {assignedMatters.map(m => (
                          <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs">
                            <span className="text-[10px] font-bold text-[var(--axia-gold-light)]">{m.caseNumber}</span>
                            <h5 className="font-semibold text-[var(--text)] mt-1 truncate">{m.title}</h5>
                            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-2">
                              <span>المحكمة: {m.court}</span>
                              <span>الخصم: {m.opponentName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assigned Active Tasks (الرول المخصص) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5 border-b border-[var(--border)] pb-2">
                      <Calendar className="size-4 text-[var(--text-muted)]" />
                      <span>رول المهام والطلبات التنفيذية القائمة ({assignedTasks.length})</span>
                    </h4>
                    {assignedTasks.length === 0 ? (
                      <div className="text-center py-4 rounded-xl border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]">
                        لا توجد طلبات إجرائية معلقة باسم هذا العضو حالياً
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {assignedTasks.map(t => (
                          <div key={t.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-[var(--text)]">{t.title}</span>
                              <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                t.priority.includes("حرجة") ? "bg-red-500/20 text-red-300" : "bg-[var(--accent)] text-[var(--text-muted)]"
                              }`}>
                                {t.priority}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-2.5">
                              <span>الموقع/الجهة: {t.courtOrBailiffOffice}</span>
                              <span>الحالة: {t.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--border)]">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="w-full rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] py-2.5 text-xs font-bold text-[var(--text)] transition border border-[var(--border)]"
                >
                  إغلاق بطاقة الرول
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
