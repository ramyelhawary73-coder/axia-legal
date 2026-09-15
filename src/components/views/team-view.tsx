"use client";

import { useState } from "react";
import { Users, Award, Briefcase, GraduationCap, Plus, Mail, Phone } from "lucide-react";
import { mockTeam } from "@/lib/mock-legal-data";

export function TeamView() {
  const [team, setTeam] = useState(mockTeam);

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold-light)]">
            <Users className="size-4" />
            <span>هيئة الدفاع وفريق العمل</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            المحامون والمستشارون والمتدربون
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            توزيع الدوائر القضائية، التخصصات الدقيقة، ومتابعة قضايا المتدربين
          </p>
        </div>

        <button
          onClick={() => {
            alert("نموذج إضافة مستشار قانوني أو محام متدرب جديد");
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#a77e16] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110"
        >
          <Plus className="size-4" />
          <span>ضم محامٍ جديد للمكتب</span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {team.map((member) => (
          <div
            key={member.id}
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0d1726] p-6 shadow-lg hover:border-[var(--axia-gold)]/40 hover:bg-[#111e33] transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid size-12 place-items-center rounded-2xl border border-[var(--axia-gold-dim)] bg-[var(--axia-gold)]/10 font-bold text-[var(--axia-gold-light)] text-base">
                  {member.avatar}
                </div>
                <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                  {member.experience}
                </span>
              </div>

              <h3 className="mt-4 text-base font-bold text-white">
                {member.name}
              </h3>
              <p className="text-xs font-semibold text-[var(--axia-gold-light)] mt-0.5">
                {member.role}
              </p>

              <div className="mt-4 rounded-xl bg-black/20 p-3 text-xs text-slate-300 space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold">التخصص والدوائر:</span>
                <p className="text-slate-200 leading-relaxed">{member.specialty}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                القضايا الموكلة: <strong className="text-white">{member.casesCount} قضية</strong>
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
