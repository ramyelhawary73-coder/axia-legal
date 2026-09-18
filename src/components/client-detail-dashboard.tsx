"use client";

import { useState, useMemo } from "react";
import { 
  ArrowRight, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileCheck, 
  ShieldCheck, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Download, 
  ChevronDown, 
  Gavel, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  FileText, 
  X,
  Printer,
  Copy,
  Check
} from "lucide-react";
import { Client, Matter, CourtCategory } from "@/types/legal";
import { LegalPdfReportModal } from "@/components/legal-pdf-report-modal";
import { LegalTemplateGeneratorModal } from "@/components/legal-template-generator-modal";
import { legalTemplatesCollection } from "@/lib/legal-templates-data";

interface ClientDetailDashboardProps {
  client: Client;
  clients: Client[];
  matters: Matter[];
  onSelectClient: (client: Client) => void;
  onBack: () => void;
  onAddNewMatter?: (matter: Matter) => void;
}

export function ClientDetailDashboard({
  client,
  clients,
  matters,
  onSelectClient,
  onBack,
  onAddNewMatter,
}: ClientDetailDashboardProps) {
  // Filters & State
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"cases" | "timeline" | "credentials">("cases");

  // Modals state
  const [selectedMatterForDossier, setSelectedMatterForDossier] = useState<Matter | null>(null);
  const [isAddMatterModalOpen, setIsAddMatterModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // New Matter Form State
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCourt, setNewCourt] = useState<CourtCategory>("ابتدائية كلي");
  const [newCircuit, setNewCircuit] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newClientRole, setNewClientRole] = useState<Matter["clientRole"]>("مدعي");
  const [newOpponentName, setNewOpponentName] = useState("");
  const [newAssignedLawyer, setNewAssignedLawyer] = useState("د. رامي الهواري");
  const [newHearingDate, setNewHearingDate] = useState("2026-10-15");
  const [newHearingGoal, setNewHearingGoal] = useState("جلسة افتتاحية وتقديم المستندات");
  const [newAgreedFees, setNewAgreedFees] = useState("١٥٠,٠٠٠ ج.م");
  const [newClaimAmount, setNewClaimAmount] = useState("");

  // Filter matters strictly belonging to this client
  const clientMatters = useMemo(() => {
    return matters.filter((m) => {
      const matchId = m.clientId && m.clientId === client.id;
      const matchName = m.clientName && (
        m.clientName.includes(client.name) || client.name.includes(m.clientName)
      );
      return matchId || matchName;
    });
  }, [matters, client]);

  // Derived statistics
  const openMatters = useMemo(() => {
    return clientMatters.filter((m) => m.status === "مفتوحة" || (!m.status && m.stage !== "محكوم فيها"));
  }, [clientMatters]);

  const closedMatters = useMemo(() => {
    return clientMatters.filter((m) => m.status === "مغلقة" || m.stage === "محكوم فيها");
  }, [clientMatters]);

  const winCount = useMemo(() => {
    return closedMatters.filter((m) => 
      !m.verdictResult || m.verdictResult.includes("كسب") || m.verdictResult.includes("صالح") || m.verdictResult.includes("صلح")
    ).length;
  }, [closedMatters]);

  const winRate = closedMatters.length > 0 ? Math.round((winCount / closedMatters.length) * 100) : 100;

  // Filtered matters for display
  const displayedMatters = useMemo(() => {
    return clientMatters.filter((matter) => {
      const isClosed = matter.status === "مغلقة" || matter.stage === "محكوم فيها";
      const isOpen = !isClosed;

      if (statusFilter === "open" && !isOpen) return false;
      if (statusFilter === "closed" && !isClosed) return false;

      if (courtFilter !== "all" && matter.court !== courtFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = 
          matter.caseNumber.toLowerCase().includes(q) ||
          matter.title.toLowerCase().includes(q) ||
          matter.circuit.toLowerCase().includes(q) ||
          matter.opponentName.toLowerCase().includes(q) ||
          matter.court.toLowerCase().includes(q) ||
          (matter.verdict && matter.verdict.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [clientMatters, statusFilter, courtFilter, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCreateMatter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber || !newTitle || !newOpponentName) return;

    const newMatter: Matter = {
      id: `MAT-${Date.now()}`,
      caseNumber: newCaseNumber,
      year: new Date().getFullYear(),
      court: newCourt,
      circuit: newCircuit || "الدائرة المختصة",
      title: newTitle,
      clientName: client.name,
      clientId: client.id,
      clientRole: newClientRole,
      opponentName: newOpponentName,
      assignedLawyer: newAssignedLawyer,
      nextHearingDate: newHearingDate,
      nextHearingGoal: newHearingGoal,
      stage: "متداولة",
      status: "مفتوحة",
      filingDate: new Date().toISOString().split("T")[0],
      agreedFees: newAgreedFees || "١٠٠,٠٠٠ ج.م",
      paidFees: "٥٠,٠٠٠ ج.م",
      claimAmount: newClaimAmount || "غير مقدر القيمة",
      notes: `تم قيد الدعوى مباشرة لصالح الموكل ${client.name} بموجب التوكيل ${client.poaNumber}.`,
    };

    if (onAddNewMatter) {
      onAddNewMatter(newMatter);
    }
    setIsAddMatterModalOpen(false);
    setSelectedMatterForDossier(newMatter);
  };

  return (
    <div className="flex flex-col h-full max-w-[1450px] mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Client Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent)] hover:border-[var(--axia-gold)] transition shadow-sm"
          >
            <ArrowRight className="size-4 text-[var(--axia-gold)]" />
            <span>العودة لسجل الموكلين</span>
          </button>

          <div className="h-5 w-px bg-[var(--border)] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] hidden md:inline">تبديل الموكل:</span>
            <div className="relative">
              <select
                value={client.id}
                onChange={(e) => {
                  const targetClient = clients.find((c) => c.id === e.target.value);
                  if (targetClient) onSelectClient(targetClient);
                }}
                className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--panel)] pr-3 pl-8 py-1.5 text-xs font-bold text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none shadow-sm cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === "شركة / مؤسسة" ? "شركة" : "فرد"})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute left-2.5 top-2.5 size-3 text-[var(--text-muted)] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--axia-gold)]/40 bg-[var(--axia-gold)]/10 px-3 py-1.5 text-xs font-bold text-[var(--axia-gold-light)] hover:bg-[var(--axia-gold)]/20 shadow-sm transition"
          >
            <FileText className="size-3.5 text-[var(--axia-gold)]" />
            <span>صياغة وثيقة من قالب رسمي</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] shadow-sm transition"
          >
            <Download className="size-3.5" />
            <span>تصدير ملف قضايا الموكل (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddMatterModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--axia-gold)] px-3.5 py-1.5 text-xs font-bold text-black shadow-md hover:bg-[var(--axia-gold-light)] transition"
          >
            <Plus className="size-4" />
            <span>قيد دعوى جديدة للموكل</span>
          </button>
        </div>
      </div>

      {/* Main Client Profile Hero Header */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--axia-gold)]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Client Identity */}
          <div className="flex items-start gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--axia-gold-dim)] border border-[var(--axia-gold)]/40 text-[var(--axia-gold)] shadow-inner">
              {client.type === "شركة / مؤسسة" ? (
                <Building2 className="size-7" />
              ) : (
                <User className="size-7" />
              )}
            </div>
            
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
                  {client.name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text)]">
                  {client.type}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-500">
                  <ShieldCheck className="size-3" />
                  توكيل موثق وساري
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[var(--text-muted)]">
                <span className="font-mono text-[var(--text)] flex items-center gap-1">
                  <FileText className="size-3.5 text-[var(--axia-gold)]" />
                  <span>{client.nationalIdOrCr}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" />
                  <span dir="ltr" className="font-mono">{client.phone}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  <span>{client.email}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  <span>{client.address}</span>
                </span>
              </div>
            </div>
          </div>

          {/* POA Badge & Official Authority */}
          <div className="rounded-xl border border-[var(--axia-gold)]/30 bg-[var(--bg)]/60 p-3.5 min-w-[280px] lg:max-w-xs space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1 font-semibold text-[var(--axia-gold)]">
                <FileCheck className="size-3.5" />
                سند الوكالة الرسمي
              </span>
              <button
                type="button"
                onClick={() => handleCopy(client.poaNumber)}
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-0.5"
                title="نسخ رقم التوكيل"
              >
                {copiedText === client.poaNumber ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                <span>{copiedText === client.poaNumber ? "تم النسخ" : "نسخ"}</span>
              </button>
            </div>
            <div className="font-bold text-[var(--text)] text-xs font-mono">{client.poaNumber}</div>
            <div className="text-[11px] text-[var(--text-muted)]">{client.poaOffice}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {client.poaExpiry}
            </div>
          </div>
        </div>

        {/* Quick KPI Stat Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-[var(--border)]">
          {/* Total Cases */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 shadow-sm">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <Briefcase className="size-3 text-[var(--axia-gold)]" />
              إجمالي القضايا
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-[var(--text)]">{clientMatters.length}</span>
              <span className="text-[10px] text-[var(--text-muted)]">دعاوى مسجلة</span>
            </div>
          </div>

          {/* Open Cases */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 shadow-sm">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
              </span>
              القضايا المفتوحة
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-500">{openMatters.length}</span>
              <span className="text-[10px] text-[var(--text-muted)]">متداولة بالمحاكم</span>
            </div>
          </div>

          {/* Closed Cases */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 shadow-sm">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <CheckCircle2 className="size-3 text-purple-500" />
              القضايا المغلقة
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-purple-500">{closedMatters.length}</span>
              <span className="text-[10px] text-[var(--text-muted)]">محكوم ومحسوم</span>
            </div>
          </div>

          {/* Litigation Win Rate */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 shadow-sm">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <TrendingUp className="size-3 text-emerald-500" />
              نسبة كسب الدعاوى
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-500">{winRate}٪</span>
              <span className="text-[10px] text-[var(--text-muted)]">أحكام صالحة للموكل</span>
            </div>
          </div>

          {/* Financial Balance */}
          <div className="col-span-2 sm:col-span-1 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 shadow-sm">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <DollarSign className="size-3 text-[var(--axia-gold)]" />
              الموقف المالي
            </span>
            <div className="mt-1 flex items-baseline justify-between text-xs font-semibold">
              <span className="text-emerald-500">{client.totalPaid}</span>
              <span className="text-[10px] text-[var(--text-muted)]">المسدد</span>
            </div>
            <div className="text-[10px] text-amber-500 flex justify-between mt-0.5">
              <span>المتبقي:</span>
              <span className="font-bold">{client.balanceDue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Cases History vs. Procedural Timeline vs. Full Credentials) */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("cases")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "cases"
                ? "bg-[var(--text)] text-[var(--bg)] shadow"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]"
            }`}
          >
            <Briefcase className="size-3.5" />
            <span>تاريخ وسجل القضايا ({clientMatters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "timeline"
                ? "bg-[var(--text)] text-[var(--bg)] shadow"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]"
            }`}
          >
            <Clock className="size-3.5" />
            <span>المسار الزمني والمحطات القضائية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("credentials")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "credentials"
                ? "bg-[var(--text)] text-[var(--bg)] shadow"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]"
            }`}
          >
            <FileCheck className="size-3.5" />
            <span>بيانات التوكيل والتعاقد</span>
          </button>
        </div>

        <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
          مكتب أكسيا للمحاماة والتحكيم · ملف الموكل رقم {client.id}
        </span>
      </div>

      {/* TAB 1: CASES HISTORY (OPEN & CLOSED) */}
      {activeTab === "cases" && (
        <div className="space-y-4">
          {/* Filters Bar: Status Tabs (All / Open / Closed) + Court + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--panel)] p-3.5 rounded-xl border border-[var(--border)] shadow-sm">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  statusFilter === "all"
                    ? "bg-[var(--text)] text-[var(--bg)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                كافة القضايا ({clientMatters.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("open")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition ${
                  statusFilter === "open"
                    ? "bg-emerald-500 text-black shadow-sm"
                    : "text-[var(--text-muted)] hover:text-emerald-500"
                }`}
              >
                <span className="size-1.5 rounded-full bg-emerald-400"></span>
                <span>القضايا المفتوحة ({openMatters.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("closed")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition ${
                  statusFilter === "closed"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-purple-400"
                }`}
              >
                <CheckCircle2 className="size-3" />
                <span>القضايا المغلقة والمحسومة ({closedMatters.length})</span>
              </button>
            </div>

            {/* Search & Court Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 sm:flex-none">
                <Search className="absolute right-2.5 top-2 size-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="بحث برقم الدعوى، الخصم، أو المحكمة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] pr-8 pl-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>

              <div className="relative">
                <select
                  value={courtFilter}
                  onChange={(e) => setCourtFilter(e.target.value)}
                  className="appearance-none rounded-md border border-[var(--border)] bg-[var(--bg)] pr-3 pl-8 py-1.5 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none cursor-pointer"
                >
                  <option value="all">كافة المحاكم</option>
                  <option value="محكمة النقض">محكمة النقض</option>
                  <option value="المحكمة الاقتصادية">المحكمة الاقتصادية</option>
                  <option value="مجلس الدولة (القضاء الإداري)">مجلس الدولة</option>
                  <option value="استئناف عالي">استئناف عالي</option>
                  <option value="ابتدائية كلي">ابتدائية كلي</option>
                  <option value="جزئية">جزئية</option>
                </select>
                <ChevronDown className="absolute left-2.5 top-2.5 size-3 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Matters List Grid */}
          <div className="space-y-3">
            {displayedMatters.map((matter) => {
              const isClosed = matter.status === "مغلقة" || matter.stage === "محكوم فيها";
              
              return (
                <div
                  key={matter.id}
                  className={`rounded-2xl border transition-all p-5 shadow-sm hover:shadow-md ${
                    isClosed
                      ? "border-purple-500/30 bg-gradient-to-r from-[var(--panel)] via-[var(--panel)] to-purple-950/10 hover:border-purple-500/60"
                      : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--axia-gold)]/50"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Main Case Info */}
                    <div className="space-y-2 flex-1">
                      {/* Badge bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status badge */}
                        {isClosed ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[11px] font-bold text-purple-400">
                            <CheckCircle2 className="size-3" />
                            <span>قضية مغلقة ومحسومة</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>قضية متداولة (مفتوحة)</span>
                          </span>
                        )}

                        {/* Court Badge */}
                        <span className="rounded-md bg-[var(--accent)] border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium text-[var(--text)]">
                          {matter.court}
                        </span>

                        {/* Circuit */}
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {matter.circuit}
                        </span>

                        {/* Client Role */}
                        <span className="rounded bg-[var(--text)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--text)]">
                          صفة الموكل: {matter.clientRole}
                        </span>
                      </div>

                      {/* Title & Case Number */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--axia-gold)]">
                            {matter.caseNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(matter.caseNumber)}
                            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text)]"
                            title="نسخ رقم الدعوى"
                          >
                            {copiedText === matter.caseNumber ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                        <h3 className="text-base font-bold text-[var(--text)] mt-0.5">
                          {matter.title}
                        </h3>
                      </div>

                      {/* Opponent & Attorney */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="text-[var(--text-muted)]">
                          <span className="font-medium text-[var(--text)]">الخصم: </span>
                          <span>{matter.opponentName}</span>
                          {matter.opponentLawyer && (
                            <span className="text-[10px] block text-[var(--text-muted)]">
                              محامي الخصم: {matter.opponentLawyer}
                            </span>
                          )}
                        </div>
                        <div className="text-[var(--text-muted)]">
                          <span className="font-medium text-[var(--text)]">المحامي المسؤول: </span>
                          <span className="text-[var(--text)] font-semibold">{matter.assignedLawyer}</span>
                        </div>
                      </div>

                      {/* CLOSED MATTERS SPECIAL HIGHLIGHT: Verdict, Award, and Execution */}
                      {isClosed && (
                        <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-950/15 p-3.5 space-y-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-2">
                            <span className="font-bold text-purple-300 flex items-center gap-1.5">
                              <Gavel className="size-4 text-purple-400" />
                              <span>منطوق الحكم القضائي القطعي ({matter.verdictDate || "تاريخ الحكم"})</span>
                            </span>
                            
                            {matter.verdictResult && (
                              <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                                {matter.verdictResult}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[var(--text)] font-medium leading-relaxed italic pr-1">
                            «{matter.verdict || "قضت المحكمة بإلزام الخصم بالطلبات الختامية وإيداع تقرير الخبير الحسابي المودع."}»
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[var(--text-muted)]">
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <ShieldCheck className="size-3.5" />
                              موقف التنفيذ: {matter.executionStatus || "تم التنفيذ واستلام السند"}
                            </span>
                            {matter.finalAwardAmount && (
                              <span className="font-bold text-[var(--text)]">
                                المحكوم به: <span className="text-[var(--axia-gold)]">{matter.finalAwardAmount}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* OPEN MATTERS SPECIAL HIGHLIGHT: Next Hearing & Stage */}
                      {!isClosed && (
                        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 p-3 space-y-1.5 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-[var(--axia-gold)]" />
                                الجلسة القادمة: <span className="text-[var(--axia-gold)] font-mono">{matter.nextHearingDate}</span>
                              </span>
                              <span className="rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold">
                                {matter.stage}
                              </span>
                            </div>

                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              قيدت بتاريخ: {matter.filingDate || "٢٠٢٥"}
                            </span>
                          </div>

                          <div className="text-[11px] text-[var(--text-muted)]">
                            <span className="font-semibold text-[var(--text)]">المطلوب بالجلسة: </span>
                            <span>{matter.nextHearingGoal}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Left Actions & Financial Details Column */}
                    <div className="flex flex-col justify-between items-end gap-3 lg:border-r lg:border-[var(--border)] lg:pr-5 shrink-0 min-w-[200px]">
                      <div className="space-y-1 text-left w-full">
                        <div className="text-[10px] text-[var(--text-muted)]">الأتعاب والماليات</div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[var(--text-muted)]">المتفق عليها:</span>
                          <span className="font-bold text-[var(--text)]">{matter.agreedFees}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[var(--text-muted)]">المحصل:</span>
                          <span className="font-bold text-emerald-500">{matter.paidFees}</span>
                        </div>
                        {matter.claimAmount && (
                          <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
                            قيمة المطالبة: <span className="font-mono text-[var(--text)]">{matter.claimAmount}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full mt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMatterForDossier(matter)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--text)] px-3 py-1.5 text-xs font-semibold text-[var(--bg)] hover:opacity-90 transition shadow-sm"
                        >
                          <FileText className="size-3.5" />
                          <span>عرض ملف القضية (Dossier)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMatterForDossier(matter);
                            setIsPdfModalOpen(true);
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--axia-gold)] transition"
                        >
                          <Printer className="size-3.5 text-[var(--axia-gold)]" />
                          <span>تصدير بطاقة الدعوى</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {displayedMatters.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel)] p-12 text-center space-y-3">
                <Briefcase className="size-10 mx-auto text-[var(--text-muted)] opacity-50" />
                <h3 className="text-base font-bold text-[var(--text)]">لا توجد قضايا مطابقة للشروط المحددة</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                  لم يتم العثور على قضايا للموكل ضمن التصنيف المحدد. يمكنك تغيير التصفية أو قيد دعوى جديدة مباشرة.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setCourtFilter("all");
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--border)] transition"
                >
                  إعادة ضبط التصفية
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROCEDURAL TIMELINE */}
      {activeTab === "timeline" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
              <Clock className="size-4 text-[var(--axia-gold)]" />
              <span>المسار الزمني والمحطات الإجرائية لقضايا الموكل</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              تسلسل زمني يوثق قيد الدعاوى، صدور الأحكام، الجلسات القادمة، وسداد الأتعاب
            </p>
          </div>

          <div className="relative border-r-2 border-[var(--border)] mr-3 sm:mr-6 pr-6 space-y-8">
            {/* Timeline Item 1: Next Hearing (if any open matter) */}
            {openMatters.length > 0 && (
              <div className="relative group">
                <div className="absolute -right-[31px] top-1 grid size-6 place-items-center rounded-full bg-emerald-500 text-black shadow-md ring-4 ring-[var(--panel)]">
                  <Calendar className="size-3" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400">استحقاق قادم</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {openMatters[0].nextHearingDate}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text)]">
                    جلسة قضائية في: {openMatters[0].title}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    {openMatters[0].court} · {openMatters[0].circuit} — المطلوب: {openMatters[0].nextHearingGoal}
                  </p>
                </div>
              </div>
            )}

            {/* Timeline Items for Closed Matters (Victories & Settlements) */}
            {closedMatters.map((matter) => (
              <div key={matter.id} className="relative group">
                <div className="absolute -right-[31px] top-1 grid size-6 place-items-center rounded-full bg-purple-500 text-white shadow-md ring-4 ring-[var(--panel)]">
                  <Gavel className="size-3" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold">
                      حكم نهائي محسوم
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {matter.verdictDate || "٢٠٢٤"}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text)]">
                    {matter.title} ({matter.caseNumber})
                  </h4>
                  <p className="text-xs text-[var(--text)] italic bg-[var(--bg)] p-2 rounded-lg border border-[var(--border)]">
                    «{matter.verdict}»
                  </p>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="size-3.5" />
                    <span>موقف التنفيذ: {matter.executionStatus}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Timeline Item: POA Registration */}
            <div className="relative group">
              <div className="absolute -right-[31px] top-1 grid size-6 place-items-center rounded-full bg-[var(--axia-gold)] text-black shadow-md ring-4 ring-[var(--panel)]">
                <FileCheck className="size-3" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--axia-gold)]">توثيق الوكالة الرسمية</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">ساري</span>
                </div>
                <h4 className="text-sm font-bold text-[var(--text)]">
                  إيداع التوكيل رقم {client.poaNumber}
                </h4>
                <p className="text-xs text-[var(--text-muted)]">
                  صادر من {client.poaOffice} بالصلاحيات القضائية الشاملة والتمثيل أمام كافة درجات التقاضي.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CREDENTIALS & CONTRACT */}
      {activeTab === "credentials" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card 1: Official Representation & POA */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <FileCheck className="size-4 text-[var(--axia-gold)]" />
              <span>بيانات التوكيل الرسمي المودع بالمكتب</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">رقم التوكيل وحرفه:</span>
                <span className="font-bold text-[var(--text)] font-mono">{client.poaNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">مكتب التوثيق (الشهر العقاري):</span>
                <span className="font-medium text-[var(--text)]">{client.poaOffice}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">حالة السريان والصلاحيات:</span>
                <span className="font-bold text-emerald-500">{client.poaExpiry}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">نطاق الوكالة القضائية:</span>
                <span className="font-medium text-[var(--text)]">
                  المحاكم المدنية والتجارية، النقض، مجلس الدولة، والتحكيم
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[var(--text-muted)]">حق الإقرار والصلح والتنازل:</span>
                <span className="font-medium text-emerald-500">مشروط بموافقة كتابية مسبقة</span>
              </div>
            </div>
          </div>

          {/* Card 2: Legal Contacts & Billing Account */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <DollarSign className="size-4 text-[var(--axia-gold)]" />
              <span>الحساب المالي والمقر المختار</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">إجمالي الأتعاب المقيدة:</span>
                <span className="font-bold text-[var(--text)]">
                  {clientMatters.reduce((acc, m) => {
                    const clean = parseInt(m.agreedFees.replace(/[^0-9]/g, "")) || 0;
                    return acc + clean;
                  }, 0).toLocaleString("ar-EG")} ج.م
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">إجمالي المسدد:</span>
                <span className="font-bold text-emerald-500">{client.totalPaid}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">الرصيد المتبقي بذمة الموكل:</span>
                <span className="font-bold text-amber-500">{client.balanceDue}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">المقر القانوني المختار:</span>
                <span className="font-medium text-[var(--text)] text-left">{client.address}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[var(--text-muted)]">المفوض بالاتصال والمتابعة:</span>
                <span className="font-medium text-[var(--text)]">{client.name}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOSSIER MODAL: Detailed View of a Matter */}
      {selectedMatterForDossier && !isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar space-y-5">
            <button
              onClick={() => setSelectedMatterForDossier(null)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition"
            >
              <X className="size-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold)]">
                <Briefcase className="size-4" />
                <span>ملف القضية القضائي المستقل (Dossier)</span>
              </div>
              <h2 className="text-xl font-bold text-[var(--text)] mt-1">
                {selectedMatterForDossier.title}
              </h2>
              <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                {selectedMatterForDossier.caseNumber} · {selectedMatterForDossier.court}
              </div>
            </div>

            {/* Matter Detail Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)]">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">الجهة القضائية والدائرة:</span>
                <span className="font-bold text-[var(--text)]">{selectedMatterForDossier.court}</span>
                <span className="text-[11px] block text-[var(--text-muted)]">{selectedMatterForDossier.circuit}</span>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">الحالة الراهنة:</span>
                <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold mt-0.5 ${
                  selectedMatterForDossier.status === "مغلقة"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {selectedMatterForDossier.status === "مغلقة" ? "محكوم فيها ومغلقة" : selectedMatterForDossier.stage}
                </span>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">الموكل وصِفته:</span>
                <span className="font-bold text-[var(--text)]">{selectedMatterForDossier.clientName}</span>
                <span className="text-[10px] text-[var(--text-muted)] block">الصفة: {selectedMatterForDossier.clientRole}</span>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">الخصم ومحاميه:</span>
                <span className="font-bold text-[var(--text)]">{selectedMatterForDossier.opponentName}</span>
                {selectedMatterForDossier.opponentLawyer && (
                  <span className="text-[10px] text-[var(--text-muted)] block">الوكيل: {selectedMatterForDossier.opponentLawyer}</span>
                )}
              </div>

              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">المحامي المترافع:</span>
                <span className="font-bold text-[var(--text)]">{selectedMatterForDossier.assignedLawyer}</span>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">تاريخ القيد بالجداول:</span>
                <span className="font-mono text-[var(--text)]">{selectedMatterForDossier.filingDate || "٢٠٢٥"}</span>
              </div>
            </div>

            {/* Verdict or Hearing goal */}
            {selectedMatterForDossier.status === "مغلقة" ? (
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <Gavel className="size-4" />
                    منطوق الحكم الرسمي
                  </span>
                  <span className="text-[11px] font-mono">{selectedMatterForDossier.verdictDate}</span>
                </div>
                <p className="text-xs text-[var(--text)] italic leading-relaxed">
                  «{selectedMatterForDossier.verdict}»
                </p>
                <div className="pt-2 border-t border-purple-500/20 flex justify-between text-[11px] text-[var(--text-muted)]">
                  <span>موقف التنفيذ: <strong className="text-emerald-400">{selectedMatterForDossier.executionStatus}</strong></span>
                  {selectedMatterForDossier.finalAwardAmount && (
                    <span>المحكوم به: <strong className="text-[var(--axia-gold)]">{selectedMatterForDossier.finalAwardAmount}</strong></span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-1.5 text-xs">
                <div className="font-bold text-[var(--text)] flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-[var(--axia-gold)]" />
                  الجلسة القادمة: <span className="text-[var(--axia-gold)] font-mono">{selectedMatterForDossier.nextHearingDate}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  المطلوب بالجلسة: {selectedMatterForDossier.nextHearingGoal}
                </p>
              </div>
            )}

            {/* Notes */}
            {selectedMatterForDossier.notes && (
              <div className="text-xs text-[var(--text-muted)] bg-[var(--panel)] p-3 rounded-lg border border-[var(--border)]">
                <span className="font-bold text-[var(--text)] block mb-1">ملاحظات التحضير والدفوع:</span>
                {selectedMatterForDossier.notes}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[var(--border)] flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--axia-gold)] px-4 py-2 text-xs font-bold text-black shadow hover:bg-[var(--axia-gold-light)] transition"
              >
                <Download className="size-3.5" />
                <span>تصدير ملف الدعوى (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMatterForDossier(null)}
                className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent)] transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW MATTER MODAL FOR THIS CLIENT */}
      {isAddMatterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => setIsAddMatterModalOpen(false)}
              className="absolute left-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--axia-gold)]">
              <Plus className="size-4" />
              <span>قيد دعوى قضائية جديدة للموكل</span>
            </div>
            
            <h2 className="text-xl font-bold text-[var(--text)] mt-1">
              {client.name}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 border-b border-[var(--border)] pb-3">
              بموجب التوكيل الرسمي: {client.poaNumber}
            </p>

            <form onSubmit={handleCreateMatter} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">رقم القضية والجدول الرسمي</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ٥٤٢ لسنة ٢٠٢٦ تجاري كلي استئناف"
                  value={newCaseNumber}
                  onChange={(e) => setNewCaseNumber(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">موضوع الدعوى والطلبات الختامية</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دعوى فسخ عقد توريد ومطالبة بتعويض وغرامات تأخير"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">الجهة القضائية</label>
                  <select
                    value={newCourt}
                    onChange={(e) => setNewCourt(e.target.value as CourtCategory)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                  >
                    <option value="محكمة النقض">محكمة النقض</option>
                    <option value="المحكمة الاقتصادية">المحكمة الاقتصادية</option>
                    <option value="مجلس الدولة (القضاء الإداري)">مجلس الدولة (القضاء الإداري)</option>
                    <option value="استئناف عالي">استئناف عالي</option>
                    <option value="ابتدائية كلي">ابتدائية كلي</option>
                    <option value="جزئية">جزئية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">الدائرة المختصة</label>
                  <input
                    type="text"
                    placeholder="مثال: الدائرة ٤ استثماري"
                    value={newCircuit}
                    onChange={(e) => setNewCircuit(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">صفة الموكل في الدعوى</label>
                  <select
                    value={newClientRole}
                    onChange={(e) => setNewClientRole(e.target.value as Matter["clientRole"])}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                  >
                    <option value="مدعي">مدعي</option>
                    <option value="مدعى عليه">مدعى عليه</option>
                    <option value="طاعن">طاعن</option>
                    <option value="مطعون ضده">مطعون ضده</option>
                    <option value="مستأنف">مستأنف</option>
                    <option value="مستأنف ضده">مستأنف ضده</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">اسم الخصم / الشركة المشكو في حقها</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شركة النور للملاحة والتخليص"
                    value={newOpponentName}
                    onChange={(e) => setNewOpponentName(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">تاريخ الجلسة الافتتاحية</label>
                  <input
                    type="date"
                    value={newHearingDate}
                    onChange={(e) => setNewHearingDate(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">المطلوب بالجلسة (الهدف الإجرائي)</label>
                  <input
                    type="text"
                    placeholder="مثال: تقديم أصل الصحيفة وإعلان الخصوم"
                    value={newHearingGoal}
                    onChange={(e) => setNewHearingGoal(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">المحامي المسؤول</label>
                  <select
                    value={newAssignedLawyer}
                    onChange={(e) => setNewAssignedLawyer(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                  >
                    <option value="د. رامي الهواري">د. رامي الهواري (نقض)</option>
                    <option value="أ. طارق الشريف">أ. طارق الشريف (استئناف عالي)</option>
                    <option value="أ. نرمين جلال">أ. نرمين جلال (مجلس دولة)</option>
                    <option value="أ. خالد النمر">أ. خالد النمر (مدني واستئناف)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-medium">قيمة المطالبة المالية</label>
                  <input
                    type="text"
                    placeholder="مثال: ٣,٥٠٠,٠٠٠ ج.م"
                    value={newClaimAmount}
                    onChange={(e) => setNewClaimAmount(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-medium">الأتعاب المقدرة</label>
                <input
                  type="text"
                  placeholder="مثال: ١٨٠,٠٠٠ ج.م"
                  value={newAgreedFees}
                  onChange={(e) => setNewAgreedFees(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMatterModalOpen(false)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent)] transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--axia-gold)] px-4 py-2 text-xs font-bold text-black shadow-md hover:bg-[var(--axia-gold-light)] transition"
                >
                  قيد الدعوى وحفظ السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      <LegalPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        defaultReportType={selectedMatterForDossier ? "single-matter" : "matters"}
        matters={clientMatters}
        tasks={[]}
        selectedMatter={selectedMatterForDossier}
      />

      {/* Legal Template Generator Modal */}
      {isTemplateModalOpen && (
        <LegalTemplateGeneratorModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          template={legalTemplatesCollection[0]}
          clients={clients}
          matters={matters}
          preSelectedClientId={client.id}
        />
      )}
    </div>
  );
}
