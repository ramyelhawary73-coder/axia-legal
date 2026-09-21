"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  loadPersistentTeam,
  type TeamMemberRecord,
  type TeamRole,
} from "@/lib/team-client";

type TeamFilter =
  | "all"
  | "management"
  | "lawyer"
  | "trainee"
  | "staff"
  | "viewer";

function initials(name: string) {
  if (!name || name === "غير مسجل") return "—";
  return name
    .trim()
    .split(/s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function matchesFilter(role: TeamRole, filter: TeamFilter) {
  if (filter === "all") return true;
  if (filter === "management") return role === "owner" || role === "admin";
  return role === filter;
}

export function TeamView() {
  const [team, setTeam] = useState<TeamMemberRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TeamFilter>("all");
  const [selectedMember, setSelectedMember] =
    useState<TeamMemberRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadPersistentTeam()
      .then((members) => {
        if (cancelled) return;
        setTeam(members);
        setSyncError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSyncError(
          error instanceof Error
            ? error.message
            : "تعذر تحميل أعضاء المؤسسة.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTeam = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return team.filter((member) => {
      if (!matchesFilter(member.role, activeTab)) return false;
      if (!query) return true;

      return (
        member.name.toLowerCase().includes(query) ||
        member.roleLabel.toLowerCase().includes(query)
      );
    });
  }, [activeTab, searchQuery, team]);

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
            <Users className="size-4" />
            <span>فريق المؤسسة الحقيقي</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
            أعضاء المؤسسة والأدوار
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            البيانات المعروضة من عضوية المؤسسة الفعلية وصلاحيات Supabase RLS.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs text-[var(--text-muted)]">
          <UserPlus className="size-4 text-[var(--axia-gold)]" />
          <span>دعوة عضو جديد تحتاج Invitation/Auth Phase مستقلة</span>
        </div>
      </div>

      {syncError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
          {syncError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-xs text-[var(--text-muted)]">
          جارٍ تحميل أعضاء المؤسسة...
        </div>
      )}

      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: `الكل (${team.length})` },
              { id: "management", label: "المالك والإدارة" },
              { id: "lawyer", label: "المحامون" },
              { id: "trainee", label: "المتدربون" },
              { id: "staff", label: "الموظفون" },
              { id: "viewer", label: "القراءة فقط" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-[var(--axia-gold)] text-black shadow-sm"
                  : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3.5 top-2.5 size-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو الدور..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] py-2.5 pl-3.5 pr-10 text-xs text-[var(--text)] outline-none focus:border-[var(--axia-gold)]"
          />
        </div>
      </div>

      {!isLoading && filteredTeam.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] p-12 text-center text-[var(--text-muted)]">
          <Users className="mb-3 size-10 opacity-30" />
          <span className="text-sm font-semibold">
            لا يوجد أعضاء مطابقون للبحث الحالي.
          </span>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeam.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-11 place-items-center rounded-2xl border border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/10 font-bold text-[var(--axia-gold-light)]">
                  {initials(member.name)}
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--accent)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)]">
                  {member.roleLabel}
                </span>
              </div>

              <h3 className="mt-4 text-base font-bold text-[var(--text)]">
                {member.name}
              </h3>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                عضو منذ {member.joinedAt.slice(0, 10)}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-center">
                  <span className="block text-[10px] text-[var(--text-muted)]">
                    قضايا مسندة
                  </span>
                  <strong className="text-lg">{member.assignedMatters.length}</strong>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-center">
                  <span className="block text-[10px] text-[var(--text-muted)]">
                    مهام مسندة
                  </span>
                  <strong className="text-lg">{member.assignedTasks.length}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMember(member)}
                className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--text)] hover:bg-[var(--accent)]"
              >
                عرض التكليفات الحقيقية
                <ChevronLeft className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-[var(--text-muted)]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
        <p>
          أسماء الأعضاء لا تُقرأ إلا داخل نفس المؤسسة. تغيير الأدوار أو إضافة
          مستخدمين غير متاح من هذه الشاشة.
        </p>
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="text-sm font-bold">{selectedMember.name}</h3>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {selectedMember.roleLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--accent)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="mb-3 flex items-center gap-1.5 border-b border-[var(--border)] pb-2 text-xs font-bold">
                  <BookOpen className="size-4 text-[var(--axia-gold)]" />
                  القضايا المسندة ({selectedMember.assignedMatters.length})
                </h4>
                <div className="space-y-2">
                  {selectedMember.assignedMatters.map((matter) => (
                    <div
                      key={matter.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs"
                    >
                      <div className="font-bold text-[var(--axia-gold-light)]">
                        {matter.caseNumber}
                      </div>
                      <div className="mt-1 font-semibold">{matter.title}</div>
                      <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                        {matter.court} — مستوى الوصول: {matter.accessLevel}
                      </div>
                    </div>
                  ))}
                  {selectedMember.assignedMatters.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
                      لا توجد قضايا مسندة عبر matter_members.
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h4 className="mb-3 flex items-center gap-1.5 border-b border-[var(--border)] pb-2 text-xs font-bold">
                  <Calendar className="size-4 text-[var(--axia-gold)]" />
                  المهام المسندة ({selectedMember.assignedTasks.length})
                </h4>
                <div className="space-y-2">
                  {selectedMember.assignedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs"
                    >
                      <div className="font-semibold">{task.title}</div>
                      <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                        {task.courtOrOffice} — {task.deadline} — {task.status}
                      </div>
                    </div>
                  ))}
                  {selectedMember.assignedTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
                      لا توجد مهام مسندة لهذا العضو.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
