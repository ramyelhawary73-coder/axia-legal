"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { 
  Scale, 
  Gavel, 
  Users, 
  Briefcase, 
  CheckSquare, 
  FileText, 
  DollarSign, 
  BookOpen, 
  Sparkles, 
  BarChart3, 
  Settings, 
  Menu, 
  ChevronLeft, 
  X, 
  Shield, 
  PanelRightClose, 
  PanelRightOpen, 
  Sun, 
  Moon, 
  Plus, 
  Keyboard, 
  CheckCircle2, 
  LogOut,
  Building2,
  Server,
  MapPin,
  CreditCard,
  Check,
  type LucideIcon 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { NavigationTab, LegalTask, Matter, Client, LegalDocument } from "@/types/legal";
import { logout } from "@/app/login/actions";
import { AxiaSymbolSvg } from "@/components/axia-brand-logo";
import { PlatformAccessLink } from "@/components/platform-access-link";
import { NotificationsPopover } from "@/components/notifications-popover";
import { getUpcomingDeadlineTasks, getHighPriorityTasksDueWithinHour } from "@/lib/task-utils";
import { 
  sendTaskDeadlineBrowserNotification, 
  getNotificationPermissionStatus 
} from "@/lib/browser-notifications";
import { UrgentDeadlineBanner } from "@/components/urgent-deadline-banner";
import { VoiceControlTrigger } from "@/components/voice-control-trigger";
import { useGlobalKeyboardShortcuts } from "@/hooks/use-global-keyboard-shortcuts";
import { TaskCreationModal } from "@/components/task-creation-modal";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { VoiceCommandModal } from "@/components/voice-command-modal";
import { GlobalSearchBar } from "@/components/global-search-bar";
import type { TaskAssigneeOption, TaskMatterOption } from "@/lib/tasks-client";

interface AppShellProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  children: React.ReactNode;
  subContext?: string | null;
  onClearSubContext?: () => void;
  tasks?: LegalTask[];
  onToggleTaskStatus?: (taskId: string) => void;
  onCreateTask?: (task: LegalTask) => boolean | void | Promise<boolean | void>;
  taskMatterOptions?: TaskMatterOption[];
  taskAssigneeLabel?: string;
  taskAssignees?: TaskAssigneeOption[];
  matters?: Matter[];
  clients?: Client[];
  documents?: LegalDocument[];
  onSelectMatter?: (matterId: string) => void;
  onSelectClient?: (clientId: string) => void;
  onSelectDocument?: (docId: string) => void;
  isFocusMode?: boolean;
}

type OfficeNavItem = { id: NavigationTab; labelAr: string; labelEn: string; icon: LucideIcon };

const navSections: { title: string; items: OfficeNavItem[] }[] = [
  {
    title: "العمل اليومي",
    items: [
      { id: "overview", labelAr: "نظرة عامة", labelEn: "Overview", icon: Scale },
      { id: "matters", labelAr: "القضايا والملفات", labelEn: "Matters & Dossiers", icon: Briefcase },
      { id: "hearings", labelAr: "الجلسات والتقويم", labelEn: "Hearings & Roll", icon: Gavel },
      { id: "clients", labelAr: "الموكلين والتوكيلات", labelEn: "Clients & POA", icon: Users },
      { id: "tasks", labelAr: "قلم المحضرين والمهام", labelEn: "Bailiff & Deadlines", icon: CheckSquare },
      { id: "documents", labelAr: "العقود والمستندات", labelEn: "Contracts & Docs", icon: FileText },
      { id: "finance", labelAr: "المالية والأتعاب", labelEn: "Legal Finance", icon: DollarSign },
    ],
  },
  {
    title: "المعرفة والمساعدة",
    items: [
      { id: "library", labelAr: "المكتبة وأحكام النقض", labelEn: "Precedents & Laws", icon: BookOpen },
      { id: "rajih", labelAr: "راجح الذكاء الاصطناعي", labelEn: "RAJIH AI Copilot", icon: Sparkles },
    ],
  },
  {
    title: "إدارة المكتب",
    items: [
      { id: "team", labelAr: "فريق العمل والمتدربون", labelEn: "Legal Team", icon: Users },
      { id: "reports", labelAr: "التقارير والإحصائيات", labelEn: "Analytics & KPIs", icon: BarChart3 },
      { id: "administration", labelAr: "إدارة المكتب والترخيص", labelEn: "Administration", icon: Settings },
    ],
  },
];
const navItems = navSections.flatMap(({ items }) => items);

function OfficeNavigation({
  id, activeTab, onNavigate, upcomingTasksCount, collapsed = false,
}: {
  id?: string;
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  upcomingTasksCount: number;
  collapsed?: boolean;
}) {
  return (
    <nav id={id} aria-label="أقسام المكتب" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-2 py-3">
      {navSections.map(({ title, items }, index) => (
        <div key={title} role="group" aria-label={title} className={index ? "border-t border-[var(--border)] pt-2" : undefined}>
          {!collapsed && <p className="px-3 pb-1 text-xs font-semibold leading-6 text-[var(--text-muted)]">{title}</p>}
          <ul className="space-y-1">
            {items.map(({ id, labelAr, labelEn, icon: Icon }) => {
              const isActive = activeTab === id;
              const badge = id === "rajih" ? "AI" : id === "tasks" && upcomingTasksCount > 0 ? String(upcomingTasksCount) : null;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(id)}
                    aria-label={labelAr}
                    aria-current={isActive ? "page" : undefined}
                    title={collapsed ? `${labelAr} — ${labelEn}` : undefined}
                    className={`relative flex min-h-11 w-full items-center gap-2.5 rounded-lg border-s-2 py-2 text-start motion-safe:transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--axia-gold)] ${collapsed ? "justify-center px-0" : "px-2.5"} ${isActive ? "border-[var(--axia-gold)] bg-[var(--axia-gold-dim)]" : "border-transparent hover:bg-[var(--accent)]"}`}
                  >
                    <Icon aria-hidden="true" className={`size-[18px] shrink-0 ${isActive || id === "rajih" ? "text-[var(--axia-gold)]" : "text-[var(--text-muted)]"}`} />
                    {!collapsed && <span className={`min-w-0 flex-1 text-sm leading-5 text-[var(--text)] ${isActive ? "font-bold" : "font-medium"}`}>{labelAr}</span>}
                    {badge && (
                      <span
                        aria-hidden="true"
                        className={`${collapsed ? "absolute end-1.5 top-1.5 size-1.5 rounded-full bg-[var(--axia-gold)]" : `shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-4 tabular-nums text-[var(--text)] ${id === "rajih" ? "bg-[var(--axia-gold-dim)]" : "bg-[var(--accent-hover)]"}`}`}
                      >{!collapsed && badge}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ 
  activeTab, 
  onNavigate, 
  children, 
  subContext, 
  onClearSubContext,
  tasks,
  onToggleTaskStatus,
  onCreateTask,
  taskMatterOptions = [],
  taskAssigneeLabel = "المستخدم الحالي",
  taskAssignees = [],
  matters,
  clients,
  documents,
  onSelectMatter,
  onSelectClient,
  onSelectDocument,
  isFocusMode = false,
}: AppShellProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenu = useRef<HTMLDialogElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [taskCreatedToast, setTaskCreatedToast] = useState<{ id: string; title: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<"cairo" | "alexandria" | "corp">("cairo");

  useEffect(() => {
    const dialog = mobileMenu.current;
    if (!dialog) return;
    if (!mobileMenuOpen) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [mobileMenuOpen]);

  // Click outside to close profile dropdown
  useEffect(() => {
    if (!isProfileOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#profile-dropdown-trigger") && !target.closest("#profile-dropdown-menu")) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isProfileOpen]);


  // Global Keyboard Shortcuts Listener (Ctrl+N / Alt+N for tasks, Ctrl+K for search, Esc, Ctrl+/)
  useGlobalKeyboardShortcuts({
    onNewTask: () => {
      setIsTaskModalOpen(true);
    },
    onSearchFocus: () => {
      // Dispatches shortcut event or handled via Ctrl+K listener in GlobalSearchBar
    },
    onToggleHelp: () => {
      setIsShortcutsModalOpen((prev) => !prev);
    },
    onCloseModals: () => {
      setIsTaskModalOpen(false);
      setIsShortcutsModalOpen(false);
      setIsVoiceModalOpen(false);
      setMobileMenuOpen(false);
    },
    onNavigateTab: onNavigate,
  });

  const handleCreateTaskFromModal = async (task: LegalTask) => {
    if (!onCreateTask) return false;

    const result = await onCreateTask(task);
    if (result === false) return false;

    setTaskCreatedToast({ id: task.id, title: task.title });
    setTimeout(() => {
      setTaskCreatedToast(null);
    }, 4500);
    return true;
  };
  
  const activeTasks = useMemo(() => tasks ?? [], [tasks]);
  const upcomingTasksCount = getUpcomingDeadlineTasks(activeTasks).length;
  
  // High-priority legal tasks due within <= 1 hour
  const urgentTasksDueWithinHour = useMemo(() => {
    return getHighPriorityTasksDueWithinHour(activeTasks);
  }, [activeTasks]);

  // Background monitor: alert user via Browser Notification API when a high-priority task is due within 1 hour
  useEffect(() => {
    const checkAndAlertUrgentDeadlines = () => {
      const dueWithinHour = getHighPriorityTasksDueWithinHour(activeTasks);
      if (dueWithinHour.length > 0 && getNotificationPermissionStatus() === "granted") {
        dueWithinHour.forEach((item) => {
          sendTaskDeadlineBrowserNotification({
            task: item.task,
            diffHours: item.diffHours,
            onClick: () => onNavigate("tasks"),
          });
        });
      }
    };

    // Check immediately on mount or active tasks change
    checkAndAlertUrgentDeadlines();

    // Check periodically every 30 seconds
    const interval = setInterval(checkAndAlertUrgentDeadlines, 30000);
    return () => clearInterval(interval);
  }, [activeTasks, onNavigate]);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--axia-gold-dim)] selection:text-[var(--text)]">
      {/* Top Navbar - Premium Apple-like compact header */}
      <header className="shrink-0 z-40 border-b border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 w-full flex-wrap items-center justify-between gap-y-2 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0 lg:px-6">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="فتح قائمة التنقل"
              aria-expanded={mobileMenuOpen}
              aria-controls="office-mobile-menu"
              aria-haspopup="dialog"
              className="grid size-10 place-items-center rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent)] lg:hidden"
            >
              <Menu aria-hidden="true" className="size-5" />
            </button>

            <div 
              onClick={() => onNavigate("overview")}
              className="flex cursor-pointer items-center gap-2.5 group"
            >
              <div className="grid size-8 place-items-center rounded-lg border border-[var(--axia-gold-dim)] bg-gradient-to-br from-[var(--axia-gold)]/20 to-transparent text-[var(--axia-gold-light)] shadow-sm group-hover:shadow transition-all">
                <AxiaSymbolSvg className="size-5" idPrefix="axia-shell-header" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight">AXIA Legal</span>
                  <span className="rounded bg-[var(--axia-gold)]/10 border border-[var(--axia-gold)]/20 px-1 py-0.5 text-[9px] font-bold text-[var(--axia-gold)]">
                    ERP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Global Omni-Search Bar (Matters, Clients, Documents) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-6">
            <GlobalSearchBar
              matters={matters}
              clients={clients}
              documents={documents}
              onNavigate={onNavigate}
              onSelectMatter={onSelectMatter}
              onSelectClient={onSelectClient}
              onSelectDocument={onSelectDocument}
              onCreateTaskTrigger={() => setIsTaskModalOpen(true)}
              onOpenShortcutsTrigger={() => setIsShortcutsModalOpen(true)}
            />
          </div>

          {/* User & Quick Status */}
          <div className="flex w-full flex-wrap items-center justify-between gap-1 sm:w-auto sm:flex-nowrap sm:justify-start sm:gap-2">
            {/* Mobile Search Trigger Button */}
            <GlobalSearchBar
              isMobileTriggerOnly
              matters={matters}
              clients={clients}
              documents={documents}
              onNavigate={onNavigate}
              onSelectMatter={onSelectMatter}
              onSelectClient={onSelectClient}
              onSelectDocument={onSelectDocument}
              onCreateTaskTrigger={() => setIsTaskModalOpen(true)}
              onOpenShortcutsTrigger={() => setIsShortcutsModalOpen(true)}
            />

            {/* Quick Task Button with Ctrl+N shortcut indicator */}
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--axia-gold)]/40 bg-[var(--axia-gold)]/10 px-2.5 py-1 text-xs font-bold text-[var(--axia-gold-light)] hover:bg-[var(--axia-gold)]/20 shadow-sm transition"
              title="إسناد مهمة إجرائية جديدة (Ctrl+N أو Alt+N)"
            >
              <Plus className="size-3.5 text-[var(--axia-gold)]" />
              <span className="hidden sm:inline">مهمة جديدة</span>
              <kbd className="hidden md:inline-block rounded bg-[var(--bg)]/90 border border-[var(--axia-gold)]/30 px-1 py-0.2 text-[9px] font-mono font-bold text-[var(--axia-gold)]">
                Ctrl+N
              </kbd>
            </button>

            {/* Keyboard Shortcuts Guide Button */}
            <button
              type="button"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="grid size-8 place-items-center rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
              title="دليل اختصارات لوحة المفاتيح (Ctrl+/)"
            >
              <Keyboard className="size-4" />
            </button>

            {/* Voice Control (Web Speech API) */}
            <VoiceControlTrigger 
              onNavigate={onNavigate} 
              onCreateTask={onCreateTask} 
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            />

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="grid size-8 place-items-center rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
                title="تبديل المظهر"
              >
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            )}

            {/* Notifications Popover */}
            <NotificationsPopover
              tasks={activeTasks}
              onToggleTaskStatus={onToggleTaskStatus}
              onNavigate={onNavigate}
            />

            {/* Office Profile Pill & Professional Google/Apple-Style Accounts Switcher */}
            <div className="relative">
              <button
                type="button"
                id="profile-dropdown-trigger"
                aria-label="قائمة الحساب والمكتب"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)]/50 px-1.5 py-1.5 sm:px-2.5 cursor-pointer hover:bg-[var(--accent)] hover:border-[var(--axia-gold-light)]/40 transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--axia-gold)]"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="relative size-6 shrink-0 rounded bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-white font-bold grid place-items-center text-[10px] shadow-sm">
                  <Users className="size-3.5" aria-hidden="true" />
                  <span className="absolute -top-0.5 -left-0.5 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="text-right hidden sm:block max-w-[125px]">
                  <span className="block text-[11px] font-bold text-[var(--text)] truncate leading-none">
                    {activeWorkspace === "cairo" 
                      ? "مكتب القاهرة (الرئيسي)" 
                      : activeWorkspace === "alexandria" 
                      ? "مكتب الإسكندرية" 
                      : "شؤون الشركات والاستثمار"}
                  </span>
                  <span className="block text-[9px] text-[var(--text-muted)] mt-0.5 truncate leading-none">
                    {taskAssigneeLabel}
                  </span>
                </div>
                <ChevronLeft className={`hidden size-3 text-[var(--text-muted)] transition-transform duration-200 sm:block ${isProfileOpen ? "-rotate-90" : ""}`} />
              </button>

              {/* The dropdown panel - Premium UI matching Apple/Google accounts view */}
              {isProfileOpen && (
                <div 
                  id="profile-dropdown-menu"
                  className="absolute left-0 mt-2 w-[min(24rem,calc(100vw-2rem))] origin-top-left rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  dir="rtl"
                >
                  {/* Header: User Profile Card */}
                  <div className="flex items-start gap-3 border-b border-[var(--border)] pb-3">
                    <div className="size-12 rounded-xl bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-white font-bold grid place-items-center text-lg shadow-md ring-2 ring-[var(--axia-gold-dim)] shrink-0">
                      <Users className="size-6" aria-hidden="true" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-[var(--text)] truncate">{taskAssigneeLabel}</h4>
                      </div>
                      <p className="text-[10px] text-[var(--axia-gold-light)] font-semibold leading-relaxed">
                        الحساب الحالي
                      </p>
                      <PlatformAccessLink />
                    </div>
                  </div>

                  {/* Body: Active Workspace Indicator & Info */}
                  <div className="py-3 border-b border-[var(--border)] space-y-2">
                    <span className="block text-[10px] font-bold text-[var(--text-muted)] tracking-wider uppercase">
                      مساحة العمل والترخيص النشط
                    </span>
                    
                    <div className="rounded-xl border border-[var(--axia-gold)]/20 bg-[var(--axia-gold)]/[0.03] p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="size-4 text-[var(--axia-gold)] shrink-0" />
                          <span className="text-xs font-bold text-[var(--text)] truncate">
                            {activeWorkspace === "cairo" 
                              ? "مجموعة د. رامي الهواري للمحاماة والاستشارات" 
                              : activeWorkspace === "alexandria" 
                              ? "مكتب د. رامي الهواري - فرع الإسكندرية" 
                              : "إدارة الشؤون القانونية للشركات والكيانات الكبرى"}
                          </span>
                        </div>
                        <span className="rounded bg-[var(--axia-gold)]/10 border border-[var(--axia-gold)]/20 px-1.5 py-0.5 text-[9px] font-bold text-[var(--axia-gold)] shrink-0">
                          النسخة الكاملة
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]/60">
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="size-3 text-[var(--axia-gold-light)] shrink-0" />
                          <span className="truncate">
                            {activeWorkspace === "cairo" ? "الزمالك، القاهرة" : activeWorkspace === "alexandria" ? "سموحة، الإسكندرية" : "مصر الجديدة، القاهرة"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <CreditCard className="size-3 text-[var(--axia-gold-light)] shrink-0" />
                          <span className="truncate">قيد النقابة: ١٠٠٤٩٢/ن</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive: Switch Workspace (Slack/Google Style) */}
                  <div className="py-3 border-b border-[var(--border)] space-y-2">
                    <span className="block text-[10px] font-bold text-[var(--text-muted)] tracking-wider uppercase">
                      التبديل بين مساحات العمل للمكتب
                    </span>

                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveWorkspace("cairo");
                        }}
                        className={`w-full flex items-center justify-between rounded-lg p-2 text-right transition ${
                          activeWorkspace === "cairo" 
                            ? "bg-[var(--accent)] text-[var(--text)] font-semibold border border-[var(--border)]" 
                            : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold grid place-items-center shrink-0">ق</div>
                          <div className="text-right min-w-0">
                            <span className="block text-xs truncate">مكتب القاهرة (الرئيسي)</span>
                            <span className="block text-[9px] text-[var(--text-muted)] leading-none truncate">مساحة العمل والملفات النشطة</span>
                          </div>
                        </div>
                        {activeWorkspace === "cairo" && <Check className="size-3 text-[var(--axia-gold)] shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveWorkspace("alexandria");
                        }}
                        className={`w-full flex items-center justify-between rounded-lg p-2 text-right transition ${
                          activeWorkspace === "alexandria" 
                            ? "bg-[var(--accent)] text-[var(--text)] font-semibold border border-[var(--border)]" 
                            : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-5 rounded bg-sky-500/10 text-sky-500 text-[10px] font-bold grid place-items-center shrink-0">س</div>
                          <div className="text-right min-w-0">
                            <span className="block text-xs truncate">مكتب الإسكندرية (سموحة)</span>
                            <span className="block text-[9px] text-[var(--text-muted)] leading-none truncate">ملفات قضايا وجهات بحري</span>
                          </div>
                        </div>
                        {activeWorkspace === "alexandria" && <Check className="size-3 text-[var(--axia-gold)] shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveWorkspace("corp");
                        }}
                        className={`w-full flex items-center justify-between rounded-lg p-2 text-right transition ${
                          activeWorkspace === "corp" 
                            ? "bg-[var(--accent)] text-[var(--text)] font-semibold border border-[var(--border)]" 
                            : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold grid place-items-center shrink-0">ش</div>
                          <div className="text-right min-w-0">
                            <span className="block text-xs truncate">إدارة شؤون الشركات والاستثمار</span>
                            <span className="block text-[9px] text-[var(--text-muted)] leading-none truncate">العقود وتأسيس الشركات الأجنبية</span>
                          </div>
                        </div>
                        {activeWorkspace === "corp" && <Check className="size-3 text-[var(--axia-gold)] shrink-0" />}
                      </button>
                    </div>
                  </div>

                  {/* Metadata and Stats */}
                  <div className="py-2.5 flex items-center justify-between text-[10px] text-[var(--text-muted)] border-b border-[var(--border)]">
                    <div className="flex items-center gap-1.5">
                      <Server className="size-3 text-emerald-500 animate-pulse" />
                      <span>قاعدة البيانات: مؤمنة ومتصلة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>٥ قضايا</span>
                      <span>·</span>
                      <span>٥ عملاء</span>
                      <span>·</span>
                      <span>١١ مستنداً</span>
                    </div>
                  </div>

                  {/* Actions: Sign out */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsProfileOpen(false);
                        try {
                          await logout();
                        } catch {
                          // Fallback for mock client state or deployment redirect
                          router.push("/login");
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition duration-200"
                    >
                      <LogOut className="size-4" />
                      <span>تسجيل خروج آمن من النظام</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden w-full bg-[var(--bg)]">
        {/* Desktop navigation */}
        <aside
          className={`hidden shrink-0 flex-col border-e border-[var(--border)] bg-[var(--panel)] motion-safe:transition-[width] motion-safe:duration-200 ${isFocusMode ? "" : "lg:flex"} ${isSidebarCollapsed ? "w-16" : "w-[17rem] xl:w-72"}`}
        >
          <div className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] px-3">
            {!isSidebarCollapsed && (
              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <Shield aria-hidden="true" className="size-4 shrink-0 text-[var(--axia-gold)]" />
                <span>مساحة المكتب</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(value => !value)}
              aria-label={isSidebarCollapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
              aria-expanded={!isSidebarCollapsed}
              aria-controls="office-desktop-nav"
              className={`grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] ${isSidebarCollapsed ? "mx-auto" : ""}`}
            >
              {isSidebarCollapsed ? <PanelRightOpen aria-hidden="true" className="size-[18px]" /> : <PanelRightClose aria-hidden="true" className="size-[18px]" />}
            </button>
          </div>
          <OfficeNavigation id="office-desktop-nav" activeTab={activeTab} onNavigate={onNavigate} upcomingTasksCount={upcomingTasksCount} collapsed={isSidebarCollapsed} />
        </aside>

        {/* A native modal keeps keyboard focus inside the mobile menu. */}
        <dialog
          ref={mobileMenu}
          id="office-mobile-menu"
          aria-labelledby="office-mobile-menu-title"
          onClose={() => setMobileMenuOpen(false)}
          onClick={(event) => { if (event.target === event.currentTarget) setMobileMenuOpen(false); }}
          className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-[var(--text)] backdrop:bg-black/60"
        >
          <div className="flex h-full w-76 max-w-[calc(100%_-_1rem)] flex-col border-e border-[var(--border)] bg-[var(--panel)] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2">
              <div className="flex items-center gap-2">
                <AxiaSymbolSvg className="size-6" idPrefix="axia-shell-mobile" />
                <span id="office-mobile-menu-title" className="text-base font-bold">أقسام المكتب</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="إغلاق قائمة التنقل"
                className="grid size-11 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-[var(--text)] hover:bg-[var(--accent-hover)]"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <OfficeNavigation activeTab={activeTab} onNavigate={(tab) => { onNavigate(tab); setMobileMenuOpen(false); }} upcomingTasksCount={upcomingTasksCount} />
          </div>
        </dialog>

        {/* Main Content Area - Apple-like canvas */}
        <main className="flex-1 min-w-0 flex flex-col overflow-y-auto relative z-0 scroll-smooth bg-[var(--bg)] custom-scrollbar">

          {/* Breadcrumb Navigation */}
          {!isFocusMode && (
            <div className="flex items-center gap-1.5 px-4 pt-4 lg:px-6 text-[11px] font-medium text-[var(--text-muted)] animate-in fade-in duration-300">
              <span 
                className="cursor-pointer hover:text-[var(--text)] transition-colors"
                onClick={() => {
                  if (activeTab !== "overview") onNavigate("overview");
                  if (onClearSubContext) onClearSubContext();
                }}
              >
                الرئيسية
              </span>
              {activeTab !== "overview" && (
                <>
                  <ChevronLeft className="size-3 opacity-50" />
                  <span 
                    className={`${!subContext ? 'text-[var(--text)] font-semibold' : 'cursor-pointer hover:text-[var(--text)] transition-colors'}`}
                    onClick={() => {
                      if (subContext && onClearSubContext) onClearSubContext();
                    }}
                  >
                    {navItems.find((i) => i.id === activeTab)?.labelAr}
                  </span>
                </>
              )}
              {subContext && (
                <>
                  <ChevronLeft className="size-3 opacity-50" />
                  <span className="text-[var(--text)] font-semibold truncate max-w-[200px] sm:max-w-xs">{subContext}</span>
                </>
              )}
            </div>
          )}


          <div className="w-full px-4 md:px-6 lg:px-8 xl:px-10 py-4 lg:py-6 animate-in fade-in duration-300">
            {/* Urgent Deadline Banner for High-Priority Tasks due within 1 hour */}
            <UrgentDeadlineBanner 
              urgentTasks={urgentTasksDueWithinHour} 
              onNavigate={onNavigate} 
              onToggleTaskStatus={onToggleTaskStatus} 
            />
            {children}
          </div>
        </main>
      </div>

      {/* Global Task Creation Modal (triggered via Ctrl+N, Alt+N, header button, or voice) */}
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={handleCreateTaskFromModal}
        matterOptions={taskMatterOptions}
        assigneeLabel={taskAssigneeLabel}
        assigneeOptions={taskAssignees}
        sourceLabel="اختصار سريع (Ctrl+N)"
      />

      {/* Keyboard Shortcuts Cheat-Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onTriggerNewTask={() => setIsTaskModalOpen(true)}
      />

      {/* Voice Control Command Center Modal */}
      <VoiceCommandModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onNavigate={onNavigate}
        onCreateTask={(task) => {
          void handleCreateTaskFromModal(task);
        }}
      />

      {/* Quick Floating Toast on Task Creation */}
      {taskCreatedToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-[var(--panel)] p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="size-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-[var(--text)]">تم إسناد المهمة بنجاح</p>
            <p className="text-[11px] text-[var(--text-muted)] max-w-xs truncate">{taskCreatedToast.title}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onNavigate("tasks");
              setTaskCreatedToast(null);
            }}
            className="mr-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-2.5 py-1 text-xs font-bold text-[var(--axia-gold-light)] transition"
          >
            عرض المهام
          </button>
        </div>
      )}
    </div>
  );
}
