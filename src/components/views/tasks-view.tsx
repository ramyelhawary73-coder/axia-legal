"use client";

import { useState } from "react";
import { 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Search, 
  User, 
  Building2, 
  X,
  FileCheck
} from "lucide-react";
import { mockTasks } from "@/lib/mock-legal-data";
import { LegalTask } from "@/types/legal";

export function TasksView() {
  const [tasks, setTasks] = useState<LegalTask[]>(mockTasks);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // New task form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<LegalTask["category"]>("قلم المحضرين");
  const [matterCaseNumber, setMatterCaseNumber] = useState("");
  const [courtOrBailiffOffice, setCourtOrBailiffOffice] = useState("");
  const [assignedTo, setAssignedTo] = useState("أ. مروان هاني (محام متدرب)");
  const [deadline, setDeadline] = useState("2026-09-18");
  const [priority, setPriority] = useState<LegalTask["priority"]>("عاجلة");

  const handleToggleTaskStatus = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            status: t.status === "مكتملة" ? "قيد التنفيذ" : "مكتملة",
          };
        }
        return t;
      })
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !courtOrBailiffOffice) return;

    const newTask: LegalTask = {
      id: `TSK-${Date.now()}`,
      title,
      category,
      matterCaseNumber: matterCaseNumber || "عام بالمكتب",
      courtOrBailiffOffice,
      assignedTo,
      deadline,
      priority,
      status: "قيد التنفيذ",
    };

    setTasks([newTask, ...tasks]);
    setIsNewTaskOpen(false);
    setTitle("");
    setCourtOrBailiffOffice("");
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterCategory === "all") return true;
    return t.category === filterCategory;
  });

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
            <AlertTriangle className="size-4" />
            <span>قلم المحضرين والمواعيد الإجرائية</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            مواعيد السقوط والمهام القضائية
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            تتبع تسليم إعلانات المحضرين، مواعيد الطعن القانونية الصارمة، وسداد رسوم الخبراء
          </p>
        </div>

        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110"
        >
          <Plus className="size-4" />
          <span>تكليف بمهمة إجرائية جديدة</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {[
          { id: "all", label: `كافة المهام (${tasks.length})` },
          { id: "قلم المحضرين", label: "أعمال قلم المحضرين" },
          { id: "ميعاد طعن قانوني", label: "مواعيد سقوط الطعون" },
          { id: "سداد رسوم", label: "الخزينة ورسوم الخبراء" },
          { id: "إيداع مذكرات", label: "إيداع المذكرات القضائية" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filterCategory === tab.id
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3.5">
        {filteredTasks.map((task) => {
          const isCritical = task.priority.includes("حرجة");
          const isCompleted = task.status === "مكتملة";

          return (
            <div
              key={task.id}
              className={`rounded-2xl border p-4.5 transition ${
                isCompleted
                  ? "border-emerald-500/20 bg-emerald-950/10 opacity-75"
                  : isCritical
                  ? "border-red-500/30 bg-[#1a141b]/90 shadow-md"
                  : "border-white/10 bg-[#0d1726] hover:border-white/20"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => handleToggleTaskStatus(task.id)}
                    className={`mt-1 grid size-5 shrink-0 place-items-center rounded border transition ${
                      isCompleted
                        ? "border-emerald-400 bg-emerald-400 text-slate-950"
                        : "border-white/30 hover:border-white"
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="size-4" />}
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        isCritical ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-slate-300"
                      }`}>
                        {task.priority}
                      </span>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                        {task.category}
                      </span>
                      {task.matterCaseNumber && (
                        <span className="text-xs font-semibold text-[var(--axia-gold-light)]">
                          {task.matterCaseNumber}
                        </span>
                      )}
                    </div>

                    <h3 className={`mt-2 text-sm font-semibold ${
                      isCompleted ? "line-through text-slate-400" : "text-white"
                    }`}>
                      {task.title}
                    </h3>

                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span>الجهة: <strong className="text-slate-200">{task.courtOrBailiffOffice}</strong></span>
                      <span>المسؤول: <strong className="text-slate-200">{task.assignedTo}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                    isCritical ? "bg-red-500/20 text-red-300" : "bg-white/10 text-slate-300"
                  }`}>
                    <Clock className="size-3.5" />
                    <span>ميعاد أقصى: {task.deadline}</span>
                  </div>
                  <button
                    onClick={() => handleToggleTaskStatus(task.id)}
                    className="text-[11px] font-medium text-slate-400 hover:text-white"
                  >
                    {isCompleted ? "إلغاء الإكمال" : "تحديد كمكتمل"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--axia-gold-dim)] bg-[#0d1726] p-6 lg:p-8 shadow-2xl">
            <button
              onClick={() => setIsNewTaskOpen(false)}
              className="absolute left-6 top-6 grid size-8 place-items-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
              <Plus className="size-4" />
              <span>إسناد مهمة إجرائية وميعاد قانوني</span>
            </div>
            
            <h2 className="mt-1 text-xl font-bold text-white">إضافة مهمة إجرائية</h2>
            
            <form onSubmit={handleCreateTask} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">بيان المهمة والإجراء المطلوب</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تسليم أصل صحيفة الاستئناف معلنة لقلم كتاب المحكمة"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-red-400 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">التصنيف الإجرائي</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LegalTask["category"])}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-red-400 focus:outline-none"
                  >
                    <option value="قلم المحضرين">قلم المحضرين</option>
                    <option value="ميعاد طعن قانوني">ميعاد طعن قانوني (سقوط)</option>
                    <option value="سداد رسوم">سداد رسوم / أمانة خبير</option>
                    <option value="إيداع مذكرات">إيداع مذكرات</option>
                    <option value="استخراج شهادة">استخراج شهادة / صورة رسمية</option>
                    <option value="تنفيذ حكم">تنفيذ حكم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">درجة الأهمية والميعاد</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as LegalTask["priority"])}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-red-400 focus:outline-none"
                  >
                    <option value="حرجة للغاية (ميعاد سقوط)">حرجة للغاية (ميعاد سقوط)</option>
                    <option value="عاجلة">عاجلة</option>
                    <option value="عادية">عادية</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">المقر أو المحكمة المعنية</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: قلم محضرين العجوزة"
                    value={courtOrBailiffOffice}
                    onChange={(e) => setCourtOrBailiffOffice(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-red-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">رقم القضية المرتبطة</label>
                  <input
                    type="text"
                    placeholder="مثال: ٣٨٢ لسنة ٢٠٢٥ تجاري"
                    value={matterCaseNumber}
                    onChange={(e) => setMatterCaseNumber(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-red-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">تاريخ الميعاد الأقصى</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-red-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">المحامي / الموظف المكلف</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-white focus:border-red-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="rounded-xl bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/15"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-red-500 to-rose-700 px-5 py-2 font-bold text-white hover:brightness-110"
                >
                  حفظ وتكليف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
