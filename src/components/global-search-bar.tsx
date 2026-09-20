"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { 
  Search, 
  X, 
  Briefcase, 
  Building2, 
  FileText, 
  ChevronRight, 
  Eye, 
  Sparkles,
  PlusCircle,
  Gavel,
  Shield,
  Keyboard,
  BookOpen,
  DollarSign,
  Users
} from "lucide-react";
import { Matter, Client, LegalDocument, NavigationTab } from "@/types/legal";
import { loadPersistentClients } from "@/lib/clients-client";
import { loadMattersWorkspace } from "@/lib/matters-client";
import { loadPersistentDocuments } from "@/lib/documents-client";

export type SearchCategoryFilter = "all" | "matters" | "clients" | "documents" | "actions";

interface GlobalSearchBarProps {
  matters?: Matter[];
  clients?: Client[];
  documents?: LegalDocument[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectMatter?: (matterId: string) => void;
  onSelectClient?: (clientId: string) => void;
  onSelectDocument?: (docId: string) => void;
  className?: string;
  isMobileTriggerOnly?: boolean;
  onCreateTaskTrigger?: () => void;
  onOpenShortcutsTrigger?: () => void;
}

interface SearchItem {
  id: string;
  category: "matters" | "clients" | "documents" | "actions";
  title: string;
  subtitle: string;
  badge: string;
  badgeVariant: "gold" | "blue" | "emerald" | "purple" | "neutral" | "red" | "accent";
  details: string;
  meta: string;
  rawItem: Matter | Client | LegalDocument | Record<string, unknown> | null;
}

export function GlobalSearchBar({
  matters: providedMatters,
  clients: providedClients,
  documents: providedDocuments,
  onNavigate,
  onSelectMatter,
  onSelectClient,
  onSelectDocument,
  className = "",
  isMobileTriggerOnly = false,
  onCreateTaskTrigger,
  onOpenShortcutsTrigger,
}: GlobalSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SearchCategoryFilter>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quickPreviewItem, setQuickPreviewItem] = useState<SearchItem | null>(null);
  const [liveMatters, setLiveMatters] = useState<Matter[]>([]);
  const [liveClients, setLiveClients] = useState<Client[]>([]);
  const [liveDocuments, setLiveDocuments] = useState<LegalDocument[]>([]);
  const [searchSyncError, setSearchSyncError] = useState<string | null>(null);

  const matters = providedMatters ?? liveMatters;
  const clients = providedClients ?? liveClients;
  const documents = providedDocuments ?? liveDocuments;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resultsContainerRef = useRef<HTMLDivElement | null>(null);

  const quickSuggestions = useMemo(
    () =>
      [
        matters[0]
          ? {
              label: matters[0].caseNumber,
              category: "matters",
              queryText: matters[0].caseNumber,
            }
          : null,
        clients[0]
          ? {
              label: clients[0].name,
              category: "clients",
              queryText: clients[0].name,
            }
          : null,
        documents[0]
          ? {
              label: documents[0].title,
              category: "documents",
              queryText: documents[0].title,
            }
          : null,
      ].filter(
        (
          item,
        ): item is { label: string; category: string; queryText: string } =>
          Boolean(item),
      ),
    [matters, clients, documents],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (providedMatters && providedClients && providedDocuments) return;

    let cancelled = false;

    void Promise.all([loadPersistentClients(), loadMattersWorkspace()])
      .then(async ([loadedClients, matterWorkspace]) => {
        if (cancelled) return;
        setLiveClients(loadedClients);
        setLiveMatters(matterWorkspace.matters);

        const loadedDocuments = await loadPersistentDocuments(
          matterWorkspace.matters,
          loadedClients,
        );
        if (cancelled) return;
        setLiveDocuments(loadedDocuments);
        setSearchSyncError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSearchSyncError(
          error instanceof Error ? error.message : "تعذر تحديث بيانات البحث.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, providedMatters, providedClients, providedDocuments]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 50);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Index and normalize items for search including action commands
  const allItems: SearchItem[] = useMemo(() => {
    const list: SearchItem[] = [];

    // 0. Quick Command Actions
    const actionsList: SearchItem[] = [
      {
        id: "action-create-task",
        category: "actions",
        title: "إضافة مهمة قضائية جديدة / إعلان محضرين",
        subtitle: "اختصار Alt+N — فتح نافذة تسجيل مواعيد سقوط الطعن والمهام الفورية",
        badge: "إجراء سريع",
        badgeVariant: "accent",
        details: "إرسال وتعيين المهمة إلى أحد أعضاء الفريق فوراً مع خيار المزامنة",
        meta: "تشغيل",
        rawItem: { description: "فتح نافذة إضافة مهمة جديدة" }
      },
      {
        id: "action-open-rajih",
        category: "actions",
        title: "مساعد الذكاء الاصطناعي راجح (RAJIH AI CoPilot)",
        subtitle: "صياغة المذكرات والدفوع القانونية واستخلاص المبادئ القضائية",
        badge: "ذكاء اصطناعي",
        badgeVariant: "gold",
        details: "استشارات وبحوث قانونية متقدمة بدعم كامل للهجة المصرية الفصحى",
        meta: "انتقال",
        rawItem: { description: "فتح صفحة المساعد الذكي" }
      },
      {
        id: "action-open-hearings",
        category: "actions",
        title: "فتح جدول الجلسات اليومي والتقويم القضائي",
        subtitle: "متابعة رول المحكمة وحضور الدفاع وتأجيلات الجلسات الاستراتيجية",
        badge: "الأجندة والتقويم",
        badgeVariant: "blue",
        details: "إدارة رول الجلسات وتأجيلات القضايا",
        meta: "انتقال",
        rawItem: { description: "فتح الأجندة" }
      },
      {
        id: "action-open-admin",
        category: "actions",
        title: "إدارة الصلاحيات والتحكم بالأدوار (RBAC Controls)",
        subtitle: "حجب البيانات الحساسة وعزل القوائم المالية وتعديل هويات المكتب",
        badge: "الإدارة والصلاحيات",
        badgeVariant: "red",
        details: "محاكاة الأدوار في الوقت الحقيقي (Admin, Lawyer, Intern)",
        meta: "انتقال",
        rawItem: { description: "فتح صفحة الإدارة" }
      },
      {
        id: "action-open-shortcuts",
        category: "actions",
        title: "عرض دليل اختصارات لوحة المفاتيح",
        subtitle: "اختصار Ctrl+/ لفتح الدليل الفوري لتصفح المنظومة بالكامل بالكي بورد",
        badge: "دليل المساعدة",
        badgeVariant: "neutral",
        details: "تصفح قائمة الاختصارات المتاحة لزيادة سرعة وسلاسة الاستخدام",
        meta: "عرض",
        rawItem: { description: "فتح نافذة الاختصارات" }
      },
      {
        id: "action-open-library",
        category: "actions",
        title: "فتح المكتبة القانونية وأحكام محكمة النقض",
        subtitle: "موسوعة المبادئ القانونية، المدونات القضائية والطعون المعتمدة",
        badge: "المكتبة والكتب",
        badgeVariant: "purple",
        details: "البحث في مئات الآلاف من المبادئ القضائية الفورية بدقة بالغة",
        meta: "انتقال",
        rawItem: { description: "فتح المكتبة" }
      },
      {
        id: "action-open-documents",
        category: "actions",
        title: "صياغة عقد أو مستند أو توكيل قانوني جديد",
        subtitle: "استخدام النماذج القانونية الذكية المعتمدة وتوليد المستند فورا",
        badge: "محرر العقود والمستندات",
        badgeVariant: "purple",
        details: "فتح الأرشيف الخاص ومحرر المسودات القانونية",
        meta: "انتقال",
        rawItem: { description: "فتح محرر المستندات" }
      },
      {
        id: "action-open-finance",
        category: "actions",
        title: "عرض الإدارة المالية والأتعاب وسندات القبض",
        subtitle: "تسجيل المقبوضات والأمانات المسددة ومطالبات الأتعاب والتدفقات",
        badge: "المالية والأتعاب",
        badgeVariant: "emerald",
        details: "لوحة تحكم تفصيلية بالتدفقات المالية للمكتب",
        meta: "انتقال",
        rawItem: { description: "فتح لوحة المالية" }
      },
      {
        id: "action-open-team",
        category: "actions",
        title: "عرض فريق العمل ومحامي المكتب",
        subtitle: "إدارة المحامين المقيدين والمتدربين وتوزيع مأموريات قلم المحضرين",
        badge: "فريق العمل",
        badgeVariant: "blue",
        details: "صلاحيات الأعضاء ومستندات التعيين الفورية",
        meta: "انتقال",
        rawItem: { description: "فتح فريق العمل" }
      },
      {
        id: "action-open-reports",
        category: "actions",
        title: "عرض التقارير والتحليلات البيانية والـ KPIs",
        subtitle: "متابعة كفاءة هيئة الدفاع ومؤشرات الأداء ومعدل كسب القضايا",
        badge: "التقارير والإحصائيات",
        badgeVariant: "gold",
        details: "رسومات بيانية ذكية ومؤشرات الأداء",
        meta: "انتقال",
        rawItem: { description: "فتح التقارير" }
      }
    ];

    list.push(...actionsList);

    // 1. Matters
    matters.forEach((m) => {
      list.push({
        id: `matter-${m.id}`,
        category: "matters",
        title: `${m.caseNumber} — ${m.title}`,
        subtitle: `الموكل: ${m.clientName} | الخصم: ${m.opponentName}`,
        badge: m.court,
        badgeVariant: "gold",
        details: `المحامي: ${m.assignedLawyer} | الجلسة القادمة: ${m.nextHearingDate}`,
        meta: m.stage,
        rawItem: m,
      });
    });

    // 2. Clients
    clients.forEach((c) => {
      list.push({
        id: `client-${c.id}`,
        category: "clients",
        title: c.name,
        subtitle: `التوكيل: ${c.poaNumber} (${c.poaOffice})`,
        badge: c.type,
        badgeVariant: c.type === "شركة / مؤسسة" ? "blue" : "emerald",
        details: `الهاتف: ${c.phone} | ${c.nationalIdOrCr}`,
        meta: `${c.activeMattersCount} دعاوى مسجلة`,
        rawItem: c,
      });
    });

    // 3. Documents
    documents.forEach((d) => {
      list.push({
        id: `doc-${d.id}`,
        category: "documents",
        title: d.title,
        subtitle: `الموكل: ${d.clientName} ${d.caseNumber ? `| قضية: ${d.caseNumber}` : ""}`,
        badge: d.type,
        badgeVariant: "purple",
        details: `التاريخ: ${d.date} | الحجم: ${d.fileSize}`,
        meta: d.status,
        rawItem: d,
      });
    });

    return list;
  }, [matters, clients, documents]);

  // Filtered Results
  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // If we are looking at specific categories, return items in that category when query is empty, especially for Actions!
      if (categoryFilter !== "all") {
        return allItems.filter(item => item.category === categoryFilter);
      }
      return [];
    }

    return allItems.filter((item) => {
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
      if (!matchCategory) return false;

      // Deep text match across title, subtitle, details, badge, and rawItem properties
      const titleMatch = item.title.toLowerCase().includes(trimmed);
      const subMatch = item.subtitle.toLowerCase().includes(trimmed);
      const detailsMatch = item.details.toLowerCase().includes(trimmed);
      const badgeMatch = item.badge.toLowerCase().includes(trimmed);
      const metaMatch = item.meta.toLowerCase().includes(trimmed);

      // Raw object extra fields (notes, verdict, phone, address, etc.)
      let rawMatch = false;
      if (item.category === "matters") {
        const m = item.rawItem as Matter;
        rawMatch = Boolean(
          (m.circuit && m.circuit.toLowerCase().includes(trimmed)) ||
          (m.notes && m.notes.toLowerCase().includes(trimmed)) ||
          (m.verdict && m.verdict.toLowerCase().includes(trimmed)) ||
          (m.claimAmount && m.claimAmount.toLowerCase().includes(trimmed))
        );
      } else if (item.category === "clients") {
        const c = item.rawItem as Client;
        rawMatch = Boolean(
          (c.address && c.address.toLowerCase().includes(trimmed)) ||
          (c.email && c.email.toLowerCase().includes(trimmed)) ||
          (c.phone && c.phone.includes(trimmed))
        );
      } else if (item.category === "documents") {
        const d = item.rawItem as LegalDocument;
        rawMatch = Boolean(
          (d.caseNumber && d.caseNumber.toLowerCase().includes(trimmed)) ||
          (d.clientName && d.clientName.toLowerCase().includes(trimmed))
        );
      } else if (item.category === "actions") {
        rawMatch = item.subtitle.toLowerCase().includes(trimmed);
      }

      return titleMatch || subMatch || detailsMatch || badgeMatch || metaMatch || rawMatch;
    });
  }, [allItems, query, categoryFilter]);

  // Counts for each category tab
  const counts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return {
        all: allItems.length,
        matters: allItems.filter((i) => i.category === "matters").length,
        clients: allItems.filter((i) => i.category === "clients").length,
        documents: allItems.filter((i) => i.category === "documents").length,
        actions: allItems.filter((i) => i.category === "actions").length,
      };
    }
    const matches = allItems.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(trimmed);
      const subMatch = item.subtitle.toLowerCase().includes(trimmed);
      const detailsMatch = item.details.toLowerCase().includes(trimmed);
      const badgeMatch = item.badge.toLowerCase().includes(trimmed);
      const metaMatch = item.meta.toLowerCase().includes(trimmed);
      return titleMatch || subMatch || detailsMatch || badgeMatch || metaMatch;
    });

    return {
      all: matches.length,
      matters: matches.filter((i) => i.category === "matters").length,
      clients: matches.filter((i) => i.category === "clients").length,
      documents: matches.filter((i) => i.category === "documents").length,
      actions: matches.filter((i) => i.category === "actions").length,
    };
  }, [allItems, query]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Handle item selection
  const handleSelectItem = useCallback((item: SearchItem) => {
    setIsOpen(false);
    if (item.category === "actions") {
      const actionId = item.id;
      if (actionId === "action-create-task" && onCreateTaskTrigger) {
        onCreateTaskTrigger();
      } else if (actionId === "action-open-shortcuts" && onOpenShortcutsTrigger) {
        onOpenShortcutsTrigger();
      } else if (actionId === "action-open-overview") {
        onNavigate("overview");
      } else if (actionId === "action-open-matters") {
        onNavigate("matters");
      } else if (actionId === "action-open-hearings") {
        onNavigate("hearings");
      } else if (actionId === "action-open-clients") {
        onNavigate("clients");
      } else if (actionId === "action-open-tasks") {
        onNavigate("tasks");
      } else if (actionId === "action-open-documents") {
        onNavigate("documents");
      } else if (actionId === "action-open-finance") {
        onNavigate("finance");
      } else if (actionId === "action-open-library") {
        onNavigate("library");
      } else if (actionId === "action-open-rajih") {
        onNavigate("rajih");
      } else if (actionId === "action-open-team") {
        onNavigate("team");
      } else if (actionId === "action-open-reports") {
        onNavigate("reports");
      } else if (actionId === "action-open-admin") {
        onNavigate("administration");
      }
    } else if (item.category === "matters") {
      const matter = item.rawItem as Matter;
      if (onSelectMatter) {
        onSelectMatter(matter.id);
      } else {
        onNavigate("matters");
      }
    } else if (item.category === "clients") {
      const client = item.rawItem as Client;
      if (onSelectClient) {
        onSelectClient(client.id);
      } else {
        onNavigate("clients");
      }
    } else if (item.category === "documents") {
      const doc = item.rawItem as LegalDocument;
      if (onSelectDocument) {
        onSelectDocument(doc.id);
      } else {
        onNavigate("documents");
      }
    }
  }, [onNavigate, onSelectMatter, onSelectClient, onSelectDocument, onCreateTaskTrigger, onOpenShortcutsTrigger]);

  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      } else if (query.trim()) {
        // Default jump to matters with search query
        onNavigate("matters");
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Render Category Icon
  const renderCategoryIcon = (category: SearchItem["category"], itemId?: string) => {
    switch (category) {
      case "matters":
        return <Briefcase className="size-4 text-[var(--axia-gold)] shrink-0" />;
      case "clients":
        return <Building2 className="size-4 text-blue-400 shrink-0" />;
      case "documents":
        return <FileText className="size-4 text-purple-400 shrink-0" />;
      case "actions":
        if (itemId === "action-create-task") return <PlusCircle className="size-4 text-emerald-400 shrink-0" />;
        if (itemId?.includes("rajih")) return <Sparkles className="size-4 text-[var(--axia-gold)] shrink-0" />;
        if (itemId?.includes("shortcuts")) return <Keyboard className="size-4 text-zinc-400 shrink-0" />;
        if (itemId?.includes("hearings")) return <Gavel className="size-4 text-[var(--axia-gold-light)] shrink-0" />;
        if (itemId?.includes("admin")) return <Shield className="size-4 text-red-400 shrink-0" />;
        if (itemId?.includes("finance")) return <DollarSign className="size-4 text-emerald-500 shrink-0" />;
        if (itemId?.includes("library")) return <BookOpen className="size-4 text-purple-400 shrink-0" />;
        if (itemId?.includes("team") || itemId?.includes("clients")) return <Users className="size-4 text-blue-400 shrink-0" />;
        return <Sparkles className="size-4 text-[var(--axia-gold)] shrink-0" />;
    }
  };

  // Render Badge Style
  const renderBadge = (badge: string, variant: SearchItem["badgeVariant"]) => {
    const base = "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap";
    switch (variant) {
      case "gold":
        return <span className={`${base} bg-[var(--axia-gold-dim)] text-[var(--axia-gold-light)] border-[var(--axia-gold)]/30`}>{badge}</span>;
      case "blue":
        return <span className={`${base} bg-blue-500/15 text-blue-400 border-blue-500/30`}>{badge}</span>;
      case "emerald":
        return <span className={`${base} bg-emerald-500/15 text-emerald-400 border-emerald-500/30`}>{badge}</span>;
      case "purple":
        return <span className={`${base} bg-purple-500/15 text-purple-400 border-purple-500/30`}>{badge}</span>;
      case "red":
        return <span className={`${base} bg-red-500/15 text-red-400 border-red-500/30`}>{badge}</span>;
      case "accent":
        return <span className={`${base} bg-[var(--axia-gold-dim)] text-[var(--axia-gold-light)] border-[var(--axia-gold)]/30`}>{badge}</span>;
      default:
        return <span className={`${base} bg-[var(--panel)] text-[var(--text-muted)] border-[var(--border)]`}>{badge}</span>;
    }
  };

  // Highlight matched substrings
  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-[var(--axia-gold)]/25 text-[var(--axia-gold-light)] font-bold rounded-xs px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // If this is mobile trigger button only
  if (isMobileTriggerOnly) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 80);
          }}
          className="grid size-8 place-items-center rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors md:hidden"
          title="البحث الشامل في القضايا والموكلين والمستندات (Ctrl+K)"
        >
          <Search className="size-4" />
        </button>

        {/* Mobile Fullscreen Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md p-3 sm:p-4 md:hidden animate-in fade-in duration-150">
            <div 
              ref={containerRef}
              className="flex flex-col h-full max-h-[92vh] w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden"
            >
              {/* Mobile Top Bar */}
              <div className="flex items-center gap-2 border-b border-[var(--border)] p-3 bg-[var(--bg)]/50">
                <Search className="size-4 text-[var(--axia-gold)] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="ابحث برقم القضية، الموكل، أو اسم المستند..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <X className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[var(--text)]"
                >
                  إلغاء
                </button>
              </div>

              {/* Mobile Category Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--border)] p-2 bg-[var(--panel)] text-xs scrollbar-none">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition ${
                    categoryFilter === "all"
                      ? "bg-[var(--axia-gold)] text-black"
                      : "bg-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  الكل ({counts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("actions")}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition ${
                    categoryFilter === "actions"
                      ? "bg-[var(--axia-gold)] text-black"
                      : "bg-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <Sparkles className="size-3" />
                  <span>الإجراءات ({counts.actions})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("matters")}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition ${
                    categoryFilter === "matters"
                      ? "bg-[var(--axia-gold)] text-black"
                      : "bg-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <Briefcase className="size-3" />
                  <span>القضايا ({counts.matters})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("clients")}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition ${
                    categoryFilter === "clients"
                      ? "bg-blue-500 text-white"
                      : "bg-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <Building2 className="size-3" />
                  <span>الموكلون ({counts.clients})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("documents")}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition ${
                    categoryFilter === "documents"
                      ? "bg-purple-600 text-white"
                      : "bg-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <FileText className="size-3" />
                  <span>المستندات ({counts.documents})</span>
                </button>
              </div>

              {/* Mobile Results Body */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                {query.trim() === "" ? (
                  <div className="p-4 text-center space-y-4">
                    <p className="text-xs text-[var(--text-muted)]">اقتراحات بحث سريعة:</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {quickSuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setQuery(sug.queryText);
                            setCategoryFilter(sug.category as SearchCategoryFilter);
                          }}
                          className="rounded-lg border border-[var(--border)] bg-[var(--accent)] px-3 py-1.5 text-xs text-[var(--text)] hover:border-[var(--axia-gold)] transition"
                        >
                          {sug.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                    لا توجد نتائج مطابقة لـ &quot;{query}&quot;
                  </div>
                ) : (
                  filteredResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-right active:bg-[var(--accent)]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {renderCategoryIcon(item.category, item.id)}
                          <span className="text-xs font-bold text-[var(--text)]">{item.title}</span>
                        </div>
                        {renderBadge(item.badge, item.badgeVariant)}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)]">{item.subtitle}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-[var(--border)] pt-1.5">
                        <span>{item.details}</span>
                        <span className="font-semibold text-[var(--axia-gold)]">{item.meta}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop Header Spotlight Search Bar
  return (
    <div ref={containerRef} className={`relative flex-1 max-w-xl mx-4 lg:mx-6 ${className}`}>
      {/* Input Field Container */}
      <div 
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`relative flex items-center w-full rounded-xl border transition-all shadow-sm ${
          isOpen
            ? "border-[var(--axia-gold)] bg-[var(--panel)] ring-2 ring-[var(--axia-gold)]/20 shadow-md"
            : "border-[var(--border)] bg-[var(--panel)]/70 hover:border-[var(--axia-gold)]/50 hover:bg-[var(--panel)]"
        }`}
      >
        <div className="absolute right-3 top-2.5 flex items-center pointer-events-none">
          <Search className={`size-4 transition-colors ${isOpen ? "text-[var(--axia-gold)]" : "text-[var(--text-muted)]"}`} />
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder="بحث شامل في القضايا، الموكلين، والمستندات..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent pr-9 pl-20 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />

        {/* Right side controls (Clear / Keyboard Shortcut Badge) */}
        <div className="absolute left-2.5 top-2 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuery("");
                inputRef.current?.focus();
              }}
              className="grid size-5 place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
              title="مسح البحث"
            >
              <X className="size-3" />
            </button>
          ) : null}

          <div className="hidden sm:flex items-center gap-0.5">
            <kbd className="inline-flex items-center justify-center rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--text-muted)] shadow-xs">
              Ctrl+K
            </kbd>
          </div>
        </div>
      </div>

      {/* Spotlight Dropdown Palette */}
      {isOpen && (
        <div className="absolute top-full right-0 left-0 mt-2 z-50 flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 backdrop-blur-md">
          {/* Category Filter Tabs */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/40 px-3 py-2 text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  categoryFilter === "all"
                    ? "bg-[var(--axia-gold)] text-black shadow-xs"
                    : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
                }`}
              >
                الكل {query.trim() && `(${counts.all})`}
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter("actions")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  categoryFilter === "actions"
                    ? "bg-[var(--axia-gold)] text-black shadow-xs"
                    : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
                }`}
              >
                <Sparkles className="size-3" />
                <span>الإجراءات السريعة {query.trim() && `(${counts.actions})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter("matters")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  categoryFilter === "matters"
                    ? "bg-[var(--axia-gold)] text-black shadow-xs"
                    : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
                }`}
              >
                <Briefcase className="size-3" />
                <span>القضايا {query.trim() && `(${counts.matters})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter("clients")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  categoryFilter === "clients"
                    ? "bg-blue-500 text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
                }`}
              >
                <Building2 className="size-3" />
                <span>الموكلين {query.trim() && `(${counts.clients})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter("documents")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  categoryFilter === "documents"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
                }`}
              >
                <FileText className="size-3" />
                <span>المستندات {query.trim() && `(${counts.documents})`}</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span>اختر</span>
              <kbd className="rounded bg-[var(--bg)] border border-[var(--border)] px-1 font-mono">↵</kbd>
              <span>تنقل</span>
              <kbd className="rounded bg-[var(--bg)] border border-[var(--border)] px-1 font-mono">↑↓</kbd>
              <span>إغلاق</span>
              <kbd className="rounded bg-[var(--bg)] border border-[var(--border)] px-1 font-mono">Esc</kbd>
            </div>
          </div>

          {/* Results List */}
          <div 
            ref={resultsContainerRef}
            className="max-h-[380px] overflow-y-auto p-2 space-y-1 custom-scrollbar text-right"
          >
            {query.trim() === "" ? (
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--axia-gold)] mb-2.5">
                  <Sparkles className="size-3.5" />
                  <span>عمليات بحث سريعة ومقترحة:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setQuery(sug.queryText);
                        setCategoryFilter(sug.category as SearchCategoryFilter);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:border-[var(--axia-gold)] hover:bg-[var(--axia-gold-dim)] transition shadow-xs"
                    >
                      {sug.category === "matters" && <Briefcase className="size-3 text-[var(--axia-gold)]" />}
                      {sug.category === "clients" && <Building2 className="size-3 text-blue-400" />}
                      {sug.category === "documents" && <FileText className="size-3 text-purple-400" />}
                      <span>{sug.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>يمكنك إدخال رقم أي قضية، اسم موكل، رقم توكيل، أو محكمة</span>
                  <span className="font-semibold text-[var(--text)]">مكتب أكسيا للحلول القانونية</span>
                </div>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <p className="text-xs font-medium text-[var(--text)] mb-1">
                  لم يتم العثور على أي نتائج تطابق &quot;{query}&quot;
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  جرّب البحث باسم الموكل، جزء من رقم الدعوى (مثل: ١٤٢٠ أو ٩٣ ق)، أو اسم المحكمة.
                </p>
              </div>
            ) : (
              filteredResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    data-index={index}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => handleSelectItem(item)}
                    className={`group relative flex items-start justify-between gap-3 rounded-xl p-2.5 transition cursor-pointer border ${
                      isSelected
                        ? "bg-[var(--accent-hover)] border-[var(--axia-gold)]/40 shadow-xs"
                        : "border-transparent hover:bg-[var(--accent)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="mt-0.5 grid size-7 place-items-center rounded-lg border border-[var(--border)] bg-[var(--bg)] shrink-0 group-hover:border-[var(--axia-gold)]/50 transition">
                        {renderCategoryIcon(item.category, item.id)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-[var(--text)] truncate">
                            {highlightMatch(item.title, query)}
                          </h4>
                          {renderBadge(item.badge, item.badgeVariant)}
                        </div>

                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                          {highlightMatch(item.subtitle, query)}
                        </p>

                        <div className="mt-1 flex items-center gap-3 text-[10px] text-[var(--text-muted)] flex-wrap">
                          <span>{highlightMatch(item.details, query)}</span>
                          <span className="font-semibold text-[var(--axia-gold)]">
                            {item.meta}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons on the left */}
                    <div className="flex items-center gap-1 shrink-0 self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickPreviewItem(item);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition grid size-7 place-items-center rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--axia-gold)]"
                        title="معاينة سريعة"
                      >
                        <Eye className="size-3.5" />
                      </button>

                      <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[11px] font-bold text-[var(--text)] group-hover:border-[var(--axia-gold)] group-hover:text-[var(--axia-gold)] transition shadow-xs">
                        <span>فتح</span>
                        <ChevronRight className="size-3" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Footer info bar */}
          <div className="border-t border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-[10px] text-[var(--text-muted)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>إجمالي النتائج: {filteredResults.length}</span>
              {categoryFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className="font-semibold text-[var(--axia-gold)] hover:underline"
                >
                  عرض كافة الأقسام
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span>البحث الشامل في نظام AXIA Legal ERP</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Preview Modal for Item (Matter / Client / Document) */}
      {quickPreviewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setQuickPreviewItem(null)}
        >
          <div 
            className="relative h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-xl overflow-y-auto rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--axia-gold-dim)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-right custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQuickPreviewItem(null)}
              className="absolute left-5 top-5 grid size-8 place-items-center rounded-full bg-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              {renderCategoryIcon(quickPreviewItem.category, quickPreviewItem.id)}
              <span className="text-xs font-bold text-[var(--axia-gold)]">
                معاينة سريعة — {quickPreviewItem.category === "matters" ? "ملف قضية" : quickPreviewItem.category === "clients" ? "بيانات موكل" : "مستند قانوني"}
              </span>
              {renderBadge(quickPreviewItem.badge, quickPreviewItem.badgeVariant)}
            </div>

            <h3 className="text-lg font-bold text-[var(--text)] border-b border-[var(--border)] pb-3">
              {quickPreviewItem.title}
            </h3>

            {/* Content Preview details based on category */}
            <div className="mt-4 space-y-3 text-xs">
              {quickPreviewItem.category === "matters" && (() => {
                const m = quickPreviewItem.rawItem as Matter;
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">المحكمة والدائرة:</span>
                        <span className="font-semibold text-[var(--text)]">{m.court} — {m.circuit}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">المرحلة والحالة:</span>
                        <span className="font-semibold text-[var(--axia-gold)]">{m.stage} ({m.status || "مفتوحة"})</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">الموكل وصفته:</span>
                        <span className="font-semibold text-[var(--text)]">{m.clientName} ({m.clientRole})</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">الخصم ومحاميه:</span>
                        <span className="font-semibold text-[var(--text)]">{m.opponentName}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                      <span className="text-[var(--text-muted)] block text-[11px] mb-1">المحامي المسؤول والجلسة القادمة:</span>
                      <div className="flex items-center justify-between font-semibold text-[var(--text)]">
                        <span>{m.assignedLawyer}</span>
                        <span className="text-amber-500 font-mono">{m.nextHearingDate}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">المطلوب: {m.nextHearingGoal}</p>
                    </div>

                    {m.notes && (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-[11px] leading-relaxed text-[var(--text)]">
                        <strong className="text-[var(--text-muted)] block mb-1">ملاحظات الملف:</strong>
                        {m.notes}
                      </div>
                    )}
                  </div>
                );
              })()}

              {quickPreviewItem.category === "clients" && (() => {
                const c = quickPreviewItem.rawItem as Client;
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">النوع والتصنيف:</span>
                        <span className="font-semibold text-[var(--text)]">{c.type}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">الرقم القومي / السجل:</span>
                        <span className="font-semibold text-[var(--text)] font-mono">{c.nationalIdOrCr}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">رقم الهاتف:</span>
                        <span className="font-semibold text-[var(--text)] font-mono">{c.phone}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">البريد الإلكتروني:</span>
                        <span className="font-semibold text-[var(--text)] font-mono">{c.email}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                      <span className="text-[var(--text-muted)] block text-[11px] mb-1">بيانات التوكيل الرسمي:</span>
                      <div className="font-semibold text-[var(--text)]">{c.poaNumber}</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{c.poaOffice} — سريان: {c.poaExpiry}</div>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 flex justify-between items-center text-[11px]">
                      <span>القضايا المسجلة: <strong className="text-[var(--text)]">{c.activeMattersCount}</strong></span>
                      <span>المسدد: <strong className="text-emerald-500">{c.totalPaid}</strong></span>
                      <span>المتبقي: <strong className="text-amber-500">{c.balanceDue}</strong></span>
                    </div>
                  </div>
                );
              })()}

              {quickPreviewItem.category === "documents" && (() => {
                const d = quickPreviewItem.rawItem as LegalDocument;
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">نوع الوثيقة:</span>
                        <span className="font-semibold text-[var(--text)]">{d.type}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">الحالة:</span>
                        <span className="font-semibold text-emerald-500">{d.status}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">الموكل المرتبط:</span>
                        <span className="font-semibold text-[var(--text)]">{d.clientName}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">رقم القضية:</span>
                        <span className="font-semibold text-[var(--text)]">{d.caseNumber || "توثيق عام"}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 flex justify-between items-center text-[11px]">
                      <span>تاريخ الإصدار: <strong className="text-[var(--text)]">{d.date}</strong></span>
                      <span>حجم الملف: <strong className="text-[var(--text)]">{d.fileSize}</strong></span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => setQuickPreviewItem(null)}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent)]"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={() => {
                  const item = quickPreviewItem;
                  setQuickPreviewItem(null);
                  handleSelectItem(item);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--axia-gold)] px-5 py-2 text-xs font-bold text-black shadow-md hover:bg-[var(--axia-gold-light)] transition"
              >
                <span>الانتقال إلى الملف الكامل</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
