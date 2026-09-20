"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Briefcase, 
  X,
  ArrowUpRight,
  ChevronDown,
  Download,
  FileText,
  Users,
  Phone,
  Mail,
  UserPlus,
  Trash2,
  Copy,
  Check,
  BarChart3,
  PieChart as PieChartIcon,
  Grid,
  TrendingUp,
  GripVertical,
  RefreshCw
} from "lucide-react";
import { 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { mockTasks } from "@/lib/mock-legal-data";
import {
  createPersistentMatter,
  loadMattersWorkspace,
  type MatterClientOption,
} from "@/lib/matters-client";
import { Matter, CourtCategory } from "@/types/legal";
import { LegalPdfReportModal } from "@/components/legal-pdf-report-modal";

const getCategoryStyle = (cat: "مدني" | "جنائي" | "عمالي" | "تجاري" | "إداري" | "أسرة" | string) => {
  switch (cat) {
    case "مدني":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
    case "جنائي":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
    case "عمالي":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
    case "تجاري":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    case "إداري":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
    case "أسرة":
      return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20";
    default:
      return "bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-500/20";
  }
};

interface MattersViewProps {
  selectedMatterId?: string | null;
  onCloseMatterModal?: () => void;
  onMatterCreated?: () => void;
}

export function MattersView({
  selectedMatterId,
  onCloseMatterModal,
  onMatterCreated,
}: MattersViewProps) {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [matterClients, setMatterClients] = useState<MatterClientOption[]>([]);
  const [mattersLoading, setMattersLoading] = useState(true);
  const [mattersError, setMattersError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadMattersWorkspace()
      .then((workspace) => {
        if (cancelled) return;
        setMatters(workspace.matters);
        setMatterClients(workspace.clients);
        setMattersError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMattersError(
          error instanceof Error ? error.message : "تعذر تحميل القضايا الحقيقية.",
        );
      })
      .finally(() => {
        if (!cancelled) setMattersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [activeTab, setActiveTab] = useState<"list" | "dashboard">("list");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Drag and Drop layout states for Dashboard widgets
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("axia_dashboard_widget_order");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return ["kpis", "status-chart", "category-chart", "court-chart"];
  });
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedWidgetId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverWidgetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId === targetId) return;

    const currentOrder = [...widgetOrder];
    const draggedIdx = currentOrder.indexOf(draggedId);
    const targetIdx = currentOrder.indexOf(targetId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      currentOrder.splice(draggedIdx, 1);
      currentOrder.splice(targetIdx, 0, draggedId);
      setWidgetOrder(currentOrder);
      try {
        localStorage.setItem("axia_dashboard_widget_order", JSON.stringify(currentOrder));
      } catch {}
    }
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  
  // PDF Export Modal state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfSelectedMatter, setPdfSelectedMatter] = useState<Matter | null>(null);
  
  // Selected matter for viewing dossier
  const [localActiveMatterId, setLocalActiveMatterId] = useState<string | null>(null);
  const effectiveMatterId = selectedMatterId ?? localActiveMatterId;
  const activeMatter = effectiveMatterId ? matters.find((m) => m.id === effectiveMatterId) || null : null;

  // New contact form states
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState<"شاهد" | "خصم" | "خبير" | "أخرى">("شاهد");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAddContact = (matterId: string) => {
    if (!contactName || !contactPhone) return;

    const newContact = {
      id: `con-${Date.now()}`,
      name: contactName,
      role: contactRole,
      phone: contactPhone,
      email: contactEmail || undefined,
      notes: contactNotes || undefined,
    };

    setMatters((prevMatters) =>
      prevMatters.map((m) => {
        if (m.id === matterId) {
          return {
            ...m,
            contacts: [...(m.contacts || []), newContact],
          };
        }
        return m;
      })
    );

    // Reset inputs
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setContactNotes("");
  };

  const handleRemoveContact = (matterId: string, contactId: string) => {
    setMatters((prevMatters) =>
      prevMatters.map((m) => {
        if (m.id === matterId) {
          return {
            ...m,
            contacts: (m.contacts || []).filter((c) => c.id !== contactId),
          };
        }
        return m;
      })
    );
  };

  // Modal for new case
  const [isNewMatterOpen, setIsNewMatterOpen] = useState(false);
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCourt, setNewCourt] = useState<CourtCategory>("محكمة النقض");
  const [newCategory, setNewCategory] = useState<"مدني" | "جنائي" | "عمالي" | "تجاري" | "إداري" | "أسرة">("مدني");
  const [newTitle, setNewTitle] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [isCreatingMatter, setIsCreatingMatter] = useState(false);
  const [createMatterError, setCreateMatterError] = useState<string | null>(null);

  const handleCreateMatter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber.trim() || !newTitle.trim() || !newClientId || isCreatingMatter) return;

    setCreateMatterError(null);
    setIsCreatingMatter(true);

    try {
      const newMatter = await createPersistentMatter({
        caseNumber: newCaseNumber,
        title: newTitle,
        court: newCourt,
        category: newCategory,
        clientId: newClientId,
      });

      setMatters((current) => [newMatter, ...current]);
      setIsNewMatterOpen(false);
      setNewCaseNumber("");
      setNewTitle("");
      setNewClientId("");
      setNewCategory("مدني");
      onMatterCreated?.();
    } catch (error) {
      setCreateMatterError(
        error instanceof Error ? error.message : "تعذر قيد القضية.",
      );
    } finally {
      setIsCreatingMatter(false);
    }
  };

  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredMatters = matters.filter((matter) => {
    const matchesSearch =
      matter.caseNumber.includes(searchQuery) ||
      matter.title.includes(searchQuery) ||
      matter.clientName.includes(searchQuery) ||
      matter.opponentName.includes(searchQuery);

    const matchesCourt = courtFilter === "all" || matter.court === courtFilter;
    const matchesStage = stageFilter === "all" || matter.stage === stageFilter;
    const matchesCategory = categoryFilter === "all" || matter.category === categoryFilter;

    return matchesSearch && matchesCourt && matchesStage && matchesCategory;
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--panel)] p-0.5 shadow-sm ml-2">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "list"
                  ? "bg-[var(--text)] text-[var(--bg)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Grid className="size-3.5" />
              <span>سجل القضايا</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-[var(--text)] text-[var(--bg)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <BarChart3 className="size-3.5" />
              <span>لوحة التحليلات</span>
            </button>
          </div>

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

      {mattersError && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
          {mattersError}
        </div>
      )}
      {mattersLoading && (
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-xs text-[var(--text-muted)]">
          جارٍ تحميل القضايا المحفوظة...
        </div>
      )}

      {activeTab === "list" ? (
        <>
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

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none rounded-md border border-[var(--border)] bg-[var(--panel)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
              >
                <option value="all">كافة التصنيفات</option>
                <option value="مدني">مدنية</option>
                <option value="جنائي">جنائية</option>
                <option value="عمالي">عمالية</option>
                <option value="تجاري">تجارية</option>
                <option value="إداري">إدارية</option>
                <option value="أسرة">أسرة</option>
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
                        <div className="font-semibold text-[var(--text)] mb-1">{matter.caseNumber}</div>
                        {matter.category && (
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold leading-none ${getCategoryStyle(matter.category)}`}>
                            {matter.category}
                          </span>
                        )}
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
        </>
      ) : (
        /* Dashboard view */
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-6 py-4 animate-in fade-in duration-200 custom-scrollbar">
          {/* Draggable Info & Reset Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--text-muted)] bg-[var(--panel)] border border-[var(--border)] px-4 py-2.5 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <GripVertical className="size-4 text-[var(--axia-gold)] shrink-0" />
              <span>بإمكانك إعادة ترتيب هذه اللوحات والرسوم البيانية؛ اسحب مقبض <span className="font-bold text-[var(--text)]">«ترتيب»</span> الموجود في رأس كل لوحة وأسقطها في المكان المناسب لتخصيص بيئة عملك.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const defaultOrder = ["kpis", "status-chart", "category-chart", "court-chart"];
                setWidgetOrder(defaultOrder);
                try {
                  localStorage.setItem("axia_dashboard_widget_order", JSON.stringify(defaultOrder));
                } catch {}
              }}
              className="inline-flex items-center gap-1.5 hover:text-[var(--text)] text-[var(--axia-gold)] font-bold transition cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>إعادة ضبط الترتيب الافتراضي</span>
            </button>
          </div>

          {/* Unified Draggable Grid */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {widgetOrder.map((widgetId) => {
              if (widgetId === "kpis") {
                return (
                  <div
                    key="kpis"
                    draggable
                    onDragStart={(e) => handleDragStart(e, "kpis")}
                    onDragOver={(e) => handleDragOver(e, "kpis")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "kpis")}
                    onDragEnd={handleDragEnd}
                    className={`col-span-1 md:col-span-2 relative group rounded-xl border p-4 shadow-sm transition-all duration-300 bg-[var(--panel)] ${
                      draggedWidgetId === "kpis" ? "opacity-30 border-dashed border-[var(--axia-gold)] scale-[0.99]" : "border-[var(--border)]"
                    } ${
                      dragOverWidgetId === "kpis" ? "border-[var(--axia-gold)] bg-[var(--accent)]/40 ring-1 ring-[var(--axia-gold)]" : ""
                    }`}
                  >
                    {/* Header with drag handle */}
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border)]/50">
                      <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                        <Grid className="size-4 text-[var(--axia-gold)]" />
                        <span>المؤشرات الرئيسية للأداء القانوني</span>
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] cursor-grab active:cursor-grabbing px-2 py-1 rounded hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors select-none">
                        <GripVertical className="size-3.5" />
                        <span>ترتيب</span>
                      </div>
                    </div>

                    {/* Hero KPI Cards */}
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4 shadow-sm">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                          <Briefcase className="size-3 text-[var(--axia-gold)]" />
                          <span>إجمالي القضايا والمنازعات</span>
                        </span>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-black tracking-tight text-[var(--text)]">{matters.length}</span>
                          <span className="text-[9px] bg-[var(--axia-gold)]/10 text-[var(--axia-gold)] px-1.5 py-0.5 rounded-full font-bold">ملف نشط</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4 shadow-sm">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                          <TrendingUp className="size-3 text-emerald-500" />
                          <span>الدعاوى المتداولة</span>
                        </span>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-black tracking-tight text-emerald-500">
                            {matters.filter(m => m.stage === "متداولة").length}
                          </span>
                          <span className="text-[9px] text-emerald-500 font-bold">
                            {matters.length > 0 ? Math.round((matters.filter(m => m.stage === "متداولة").length / matters.length) * 100) : 0}% من الكل
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4 shadow-sm">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                          <FileText className="size-3 text-purple-500" />
                          <span>محجوزة للحكم</span>
                        </span>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-black tracking-tight text-purple-500">
                            {matters.filter(m => m.stage === "حجز للحكم").length}
                          </span>
                          <span className="text-[9px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded-full font-bold">جلسة قريبة</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4 shadow-sm">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                          <Check className="size-3 text-slate-500" />
                          <span>قضايا محكوم فيها</span>
                        </span>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-black tracking-tight text-slate-500">
                            {matters.filter(m => m.stage === "محكوم فيها").length}
                          </span>
                          <span className="text-[9px] bg-slate-500/10 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">مغلقة نهائياً</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (widgetId === "status-chart") {
                return (
                  <div
                    key="status-chart"
                    draggable
                    onDragStart={(e) => handleDragStart(e, "status-chart")}
                    onDragOver={(e) => handleDragOver(e, "status-chart")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "status-chart")}
                    onDragEnd={handleDragEnd}
                    className={`col-span-1 relative group rounded-xl border p-4 shadow-sm transition-all duration-300 bg-[var(--panel)] ${
                      draggedWidgetId === "status-chart" ? "opacity-30 border-dashed border-[var(--axia-gold)] scale-[0.99]" : "border-[var(--border)]"
                    } ${
                      dragOverWidgetId === "status-chart" ? "border-[var(--axia-gold)] bg-[var(--accent)]/40 ring-1 ring-[var(--axia-gold)]" : ""
                    }`}
                  >
                    {/* Header with drag handle */}
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border)]/50">
                      <h3 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                        <PieChartIcon className="size-4 text-[var(--axia-gold)]" />
                        <span>توزيع القضايا حسب المرحلة والدور القضائي</span>
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] cursor-grab active:cursor-grabbing px-2 py-1 rounded hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors select-none">
                        <GripVertical className="size-3.5" />
                        <span>ترتيب</span>
                      </div>
                    </div>

                    <div className="w-full flex items-center justify-center">
                      {mounted ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: "متداولة", value: matters.filter(m => m.stage === "متداولة").length, color: "#10b981" },
                                { name: "حجز للحكم", value: matters.filter(m => m.stage === "حجز للحكم").length, color: "#8b5cf6" },
                                { name: "محكوم فيها", value: matters.filter(m => m.stage === "محكوم فيها").length, color: "#64748b" },
                                { name: "أخرى/مؤجلة", value: matters.filter(m => m.stage !== "متداولة" && m.stage !== "حجز للحكم" && m.stage !== "محكوم فيها").length, color: "#f59e0b" },
                              ].filter(d => d.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {[
                                { name: "متداولة", value: matters.filter(m => m.stage === "متداولة").length, color: "#10b981" },
                                { name: "حجز للحكم", value: matters.filter(m => m.stage === "حجز للحكم").length, color: "#8b5cf6" },
                                { name: "محكوم فيها", value: matters.filter(m => m.stage === "محكوم فيها").length, color: "#64748b" },
                                { name: "أخرى/مؤجلة", value: matters.filter(m => m.stage !== "متداولة" && m.stage !== "حجز للحكم" && m.stage !== "محكوم فيها").length, color: "#f59e0b" },
                              ].filter(d => d.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                direction: 'rtl',
                                textAlign: 'right',
                                backgroundColor: 'var(--panel)',
                                borderColor: 'var(--border)',
                                borderRadius: '8px',
                                color: 'var(--text)',
                                fontSize: '11px'
                              }}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              iconType="circle"
                              formatter={(value) => <span className="text-[10px] font-semibold text-[var(--text)]">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[240px] flex items-center justify-center text-xs text-[var(--text-muted)]">جاري تحميل الرسم البياني...</div>
                      )}
                    </div>
                  </div>
                );
              }

              if (widgetId === "category-chart") {
                return (
                  <div
                    key="category-chart"
                    draggable
                    onDragStart={(e) => handleDragStart(e, "category-chart")}
                    onDragOver={(e) => handleDragOver(e, "category-chart")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "category-chart")}
                    onDragEnd={handleDragEnd}
                    className={`col-span-1 relative group rounded-xl border p-4 shadow-sm transition-all duration-300 bg-[var(--panel)] ${
                      draggedWidgetId === "category-chart" ? "opacity-30 border-dashed border-[var(--axia-gold)] scale-[0.99]" : "border-[var(--border)]"
                    } ${
                      dragOverWidgetId === "category-chart" ? "border-[var(--axia-gold)] bg-[var(--accent)]/40 ring-1 ring-[var(--axia-gold)]" : ""
                    }`}
                  >
                    {/* Header with drag handle */}
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border)]/50">
                      <h3 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                        <BarChart3 className="size-4 text-[var(--axia-gold)]" />
                        <span>توزيع القضايا حسب التصنيفات القانونية</span>
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] cursor-grab active:cursor-grabbing px-2 py-1 rounded hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors select-none">
                        <GripVertical className="size-3.5" />
                        <span>ترتيب</span>
                      </div>
                    </div>

                    <div className="w-full flex items-center justify-center">
                      {mounted ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart
                            data={[
                              { name: "مدني", value: matters.filter(m => m.category === "مدني").length, color: "#3b82f6" },
                              { name: "جنائي", value: matters.filter(m => m.category === "جنائي").length, color: "#ef4444" },
                              { name: "عمالي", value: matters.filter(m => m.category === "عمالي").length, color: "#10b981" },
                              { name: "تجاري", value: matters.filter(m => m.category === "تجاري").length, color: "#f59e0b" },
                              { name: "إداري", value: matters.filter(m => m.category === "إداري").length, color: "#8b5cf6" },
                              { name: "أسرة", value: matters.filter(m => m.category === "أسرة").length, color: "#ec4899" },
                            ]}
                            barSize={20}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                            />
                            <Tooltip
                              cursor={{ fill: 'var(--accent)', opacity: 0.15 }}
                              contentStyle={{
                                direction: 'rtl',
                                textAlign: 'right',
                                backgroundColor: 'var(--panel)',
                                borderColor: 'var(--border)',
                                borderRadius: '8px',
                                color: 'var(--text)',
                                fontSize: '11px'
                              }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {[
                                { name: "مدني", value: matters.filter(m => m.category === "مدني").length, color: "#3b82f6" },
                                { name: "جنائي", value: matters.filter(m => m.category === "جنائي").length, color: "#ef4444" },
                                { name: "عمالي", value: matters.filter(m => m.category === "عمالي").length, color: "#10b981" },
                                { name: "تجاري", value: matters.filter(m => m.category === "تجاري").length, color: "#f59e0b" },
                                { name: "إداري", value: matters.filter(m => m.category === "إداري").length, color: "#8b5cf6" },
                                { name: "أسرة", value: matters.filter(m => m.category === "أسرة").length, color: "#ec4899" },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[240px] flex items-center justify-center text-xs text-[var(--text-muted)]">جاري تحميل الرسم البياني...</div>
                      )}
                    </div>
                  </div>
                );
              }

              if (widgetId === "court-chart") {
                return (
                  <div
                    key="court-chart"
                    draggable
                    onDragStart={(e) => handleDragStart(e, "court-chart")}
                    onDragOver={(e) => handleDragOver(e, "court-chart")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "court-chart")}
                    onDragEnd={handleDragEnd}
                    className={`col-span-1 md:col-span-2 relative group rounded-xl border p-4 shadow-sm transition-all duration-300 bg-[var(--panel)] ${
                      draggedWidgetId === "court-chart" ? "opacity-30 border-dashed border-[var(--axia-gold)] scale-[0.99]" : "border-[var(--border)]"
                    } ${
                      dragOverWidgetId === "court-chart" ? "border-[var(--axia-gold)] bg-[var(--accent)]/40 ring-1 ring-[var(--axia-gold)]" : ""
                    }`}
                  >
                    {/* Header with drag handle */}
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border)]/50">
                      <h3 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                        <TrendingUp className="size-4 text-[var(--axia-gold)]" />
                        <span>كثافة وتواجد القضايا عبر المحاكم والجهات المختلفة</span>
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] cursor-grab active:cursor-grabbing px-2 py-1 rounded hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors select-none">
                        <GripVertical className="size-3.5" />
                        <span>ترتيب</span>
                      </div>
                    </div>

                    <div className="w-full flex items-center justify-center">
                      {mounted ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart
                            data={(() => {
                              const courtCounts: Record<string, number> = {};
                              matters.forEach(m => {
                                courtCounts[m.court] = (courtCounts[m.court] || 0) + 1;
                              });
                              return Object.entries(courtCounts).map(([name, value]) => ({
                                name: name.replace("محكمة ", ""),
                                value
                              })).sort((a, b) => b.value - a.value);
                            })()}
                            layout="vertical"
                            barSize={12}
                            margin={{ right: 20, left: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                            <XAxis
                              type="number"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                            />
                            <YAxis
                              dataKey="name"
                              type="category"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
                              width={120}
                            />
                            <Tooltip
                              cursor={{ fill: 'var(--accent)', opacity: 0.1 }}
                              contentStyle={{
                                direction: 'rtl',
                                textAlign: 'right',
                                backgroundColor: 'var(--panel)',
                                borderColor: 'var(--border)',
                                borderRadius: '8px',
                                color: 'var(--text)',
                                fontSize: '11px'
                              }}
                            />
                            <Bar dataKey="value" fill="var(--axia-gold)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[260px] flex items-center justify-center text-xs text-[var(--text-muted)]">جاري تحميل الرسم البياني...</div>
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* Dossier Modal / View details */}
      {activeMatter && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-2xl overflow-y-auto rounded-t-[28px] sm:rounded-2xl border-t sm:border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
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
            
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-[var(--text)]">
                {activeMatter.caseNumber}
              </h2>
              {activeMatter.category && (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getCategoryStyle(activeMatter.category)}`}>
                  {activeMatter.category}
                </span>
              )}
            </div>
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

            {/* Case Linked Contacts Segment */}
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 p-4 text-xs">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-3">
                <div className="flex items-center gap-1.5 text-[var(--text)]">
                  <Users className="size-4 text-[var(--axia-gold)]" />
                  <span className="font-bold text-sm">جهات الاتصال المرتبطة بالدعوى</span>
                </div>
                <span className="text-[10px] bg-[var(--axia-gold)]/10 text-[var(--axia-gold)] px-2 py-0.5 rounded-full font-bold">
                  {(activeMatter.contacts || []).length} جهات اتصال
                </span>
              </div>

              {/* List of Linked Contacts */}
              <div className="space-y-2 mb-4">
                {(!activeMatter.contacts || activeMatter.contacts.length === 0) ? (
                  <p className="text-[11px] text-[var(--text-muted)] text-center py-2">
                    لا توجد جهات اتصال (شهود، خصوم، خبراء) مرتبطة بملف هذه القضية حالياً.
                  </p>
                ) : (
                  activeMatter.contacts.map((contact) => (
                    <div 
                      key={contact.id} 
                      className="flex items-start justify-between p-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)]"
                    >
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-[var(--text)]">{contact.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            contact.role === "شاهد"
                              ? "bg-blue-500/10 text-blue-500"
                              : contact.role === "خصم"
                              ? "bg-rose-500/10 text-rose-500"
                              : contact.role === "خبير"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-stone-500/10 text-stone-500"
                          }`}>
                            {contact.role}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Phone className="size-2.5" />
                            <span className="font-mono">{contact.phone}</span>
                          </span>
                          {contact.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="size-2.5" />
                              <span className="font-mono">{contact.email}</span>
                            </span>
                          )}
                        </div>
                        {contact.notes && (
                          <p className="text-[10px] text-[var(--text-muted)] bg-[var(--accent)]/50 p-1.5 rounded-md mt-1 leading-relaxed">
                            {contact.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(contact.phone);
                            setCopiedId(contact.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          className="p-1 rounded bg-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)] transition"
                          title="نسخ الرقم"
                        >
                          {copiedId === contact.id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(activeMatter.id, contact.id)}
                          className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition"
                          title="حذف الارتباط"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Contact Form */}
              <div className="border-t border-[var(--border)] pt-3 mt-3">
                <h4 className="font-bold text-[11px] text-[var(--text)] mb-2 flex items-center gap-1">
                  <UserPlus className="size-3 text-[var(--axia-gold)]" />
                  <span>ربط جهة اتصال جديدة بالملف</span>
                </h4>
                
                <div className="grid gap-2 sm:grid-cols-2 mb-2">
                  <div>
                    <input
                      type="text"
                      placeholder="الاسم الكامل لجهة الاتصال"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 text-[11px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)]"
                    />
                  </div>
                  <div>
                    <select
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value as "شاهد" | "خصم" | "خبير" | "أخرى")}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 text-[11px] text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)]"
                    >
                      <option value="شاهد">شاهد إثبات / نفي</option>
                      <option value="خصم">الخصم المباشر / ممثله</option>
                      <option value="خبير">خبير المحكمة المنتدب</option>
                      <option value="أخرى">صفة أخرى</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 mb-2">
                  <div>
                    <input
                      type="text"
                      placeholder="رقم الهاتف والاتصال"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 text-[11px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)]"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="البريد الإلكتروني (اختياري)"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 text-[11px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)]"
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="ملاحظات توضيحية لجهة الاتصال"
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 text-[11px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleAddContact(activeMatter.id)}
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[var(--text)] text-[var(--bg)] font-bold text-[11px] hover:opacity-90 transition cursor-pointer"
                >
                  <Plus className="size-3" />
                  <span>تأكيد ربط جهة الاتصال بالقضية</span>
                </button>
              </div>
            </div>

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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-2xl overflow-y-auto rounded-t-[28px] sm:rounded-2xl border-t sm:border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
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
              <div className="grid gap-4 sm:grid-cols-3">
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
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">تصنيف القضية</label>
                  <div className="relative">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as "مدني" | "جنائي" | "عمالي" | "تجاري" | "إداري" | "أسرة")}
                      className="appearance-none w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                    >
                      <option value="مدني">مدنية</option>
                      <option value="جنائي">جنائية</option>
                      <option value="عمالي">عمالية</option>
                      <option value="تجاري">تجارية</option>
                      <option value="إداري">إدارية</option>
                      <option value="أسرة">أسرة</option>
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

              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">
                  الموكل المرتبط بالقضية
                </label>
                <select
                  required
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                >
                  <option value="">
                    {matterClients.length ? "اختر موكلاً محفوظاً..." : "لا يوجد موكلون محفوظون في هذه المؤسسة"}
                  </option>
                  {matterClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  في هذه المرحلة يتم حفظ الحقول الأساسية فقط: رقم القضية، الموضوع، المحكمة، التصنيف والموكل.
                </p>
              </div>

              {createMatterError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  {createMatterError}
                </div>
              )}

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
                  disabled={isCreatingMatter || matterClients.length === 0}
                  className="rounded-md bg-[var(--text)] px-4 py-2 font-medium text-[var(--bg)] hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingMatter ? "جارٍ الحفظ..." : "حفظ الدعوى"}
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
