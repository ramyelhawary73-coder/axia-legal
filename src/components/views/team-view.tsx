"use client";

import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { mockTeam } from "@/lib/mock-legal-data";

export function TeamView() {
  const [team] = useState(mockTeam);
  const [notice, setNotice] = useState<string | null>(null);

  const handleAddMember = () => {
    setNotice("سيتم فتح نافذة قيد مستشار أو محام جديد في سجل المكتب");
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
            <Users className="size-4" />
            <span>هيئة الدفاع وفريق العمل</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
            المحامون والمستشارون والمتدربون
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            توزيع الدوائر القضائية، التخصصات الدقيقة، ومتابعة قضايا المتدربين
          </p>
        </div>

        <button
          onClick={handleAddMember}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#a77e16] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110"
        >
          <Plus className="size-4" />
          <span>ضم محامٍ جديد للمكتب</span>
        </button>
      </div>

      {notice && (
        <div className="rounded-xl border border-[var(--axia-gold-light)]/30 bg-[var(--axia-gold)]/10 p-3 text-xs text-[var(--axia-gold-light)]">
          {notice}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {team.map((member) => (
          <div
            key={member.id}
            className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg hover:border-[var(--axia-gold)]/40 hover:bg-[var(--accent-hover)] transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid size-12 place-items-center rounded-2xl border border-[var(--axia-gold-dim)] bg-[var(--axia-gold)]/10 font-bold text-[var(--axia-gold-light)] text-base">
                  {member.avatar}
                </div>
                <span className="rounded-full bg-[var(--accent)] border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
                  {member.experience}
                </span>
              </div>

              <h3 className="mt-4 text-base font-bold text-[var(--text)]">
                {member.name}
              </h3>
              <p className="text-xs font-semibold text-[var(--axia-gold-light)] mt-0.5">
                {member.role}
              </p>

              <div className="mt-4 rounded-xl bg-[var(--accent)] p-3 text-xs text-[var(--text-muted)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block font-semibold">التخصص والدوائر:</span>
                <p className="text-[var(--text)] leading-relaxed">{member.specialty}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--border)] pt-4 flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">
                القضايا الموكلة: <strong className="text-[var(--text)]">{member.casesCount} قضية</strong>
              </span>
              <button className="text-[var(--axia-gold-light)] hover:underline font-semibold">
                عرض الرول المخصص
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
