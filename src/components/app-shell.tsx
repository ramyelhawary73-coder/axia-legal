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
  Download,
  type LucideIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NavigationTab, LegalTask, Matter, Client, LegalDocument, Hearing } from "@/types/legal";
import { logout } from "@/app/login/actions";
import { AxiaSymbolSvg } from "@/components/axia-brand-logo";
import { loadAdministrationWorkspace, type AdministrationWorkspace } from "@/lib/administration-client";
import { PlatformAccessLink } from "@/components/platform-access-link";
import { NotificationsPopover } from "@/components/notifications-popover";
import { getUpcomingDeadlineTasks, getHighPriorityTasksDueWithinHour } from "@/lib/task-utils";
import { PwaInstallLink, PwaInstallPromotion } from "@/components/pwa-install-promotion";
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
  hearings?: Hearing[];
  notificationDataReady?: boolean;
  notificationDataError?: boolean;
  notificationScope?: string;
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
  onOpenSnapshotManager?: () => void;
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
  id, activeTab, onNavigate, upcomingTasksCount, collapsed = false, mobile = false,
}: {
  id?: string;
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  upcomingTasksCount: number;
  collapsed?: boolean;
  mobile?: boolean;
}) {
  const renderItem = ({ id, labelAr, labelEn, icon: Icon }: OfficeNavItem) => {
    const isActive = activeTab === id;
    const badge = id === "rajih" ? "AI" : id === "tasks" && upcomingTasksCount > 0 ? String(upcomingTasksCount) : null;
    return <li key={id} className="axia-nav-entry">
      <button type="button" onClick={() => onNavigate(id)} aria-label={labelAr}
        aria-current={isActive ? "page" : undefined} title={collapsed ? `${labelAr} — ${labelEn}` : undefined}
        className={`relative flex min-h-[52px] w-full items-center gap-3 rounded-[16px] border-s-2 py-2.5 text-start motion-safe:transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--axia-gold)] ${collapsed ? "justify-center px-0" : "px-2.5"} ${isActive ? "border-[var(--axia-gold)] bg-[var(--axia-gold-dim)]" : "border-transparent hover:bg-[var(--accent)]"}`}>
        <Icon aria-hidden="true" data-nav-icon={id} className={`axia-nav-icon size-6 shrink-0 ${isActive || id === "rajih" ? "text-[var(--axia-gold)]" : "text-[var(--text-muted)]"}`}/>
        {!collapsed && <span className={`axia-nav-label min-w-0 flex-1 text-base leading-6 text-[var(--text)] ${isActive ? "font-bold" : "font-medium"}`}>{labelAr}</span>}
        {badge && <span aria-hidden="true" className={`axia-nav-badge ${collapsed ? "absolute end-1.5 top-1.5 size-1.5 rounded-full bg-[var(--axia-gold)]" : `shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-4 tabular-nums text-[var(--text)] ${id === "rajih" ? "bg-[var(--axia-gold-dim)]" : "bg-[var(--accent-hover)]"}`}`}>{!collapsed && badge}</span>}
      </button>
    </li>;
  };
  return <nav id={id} aria-label="أقسام المكتب" className={`axia-office-navigation min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 ${mobile ? "axia-mobile-navigation" : "space-y-3"}`}>
    {mobile ? <ul className="axia-mobile-nav-grid">{navItems.map(renderItem)}</ul> : navSections.map(({title,items},index)=><div key={title} role="group" aria-label={title} className={index ? "border-t border-[var(--border)] pt-2" : undefined}>
      {!collapsed && <p className="axia-nav-group-title px-3 pb-1 text-sm font-semibold leading-6 text-[var(--text-muted)]">{title}</p>}
      <ul className="space-y-1">{items.map(renderItem)}</ul>
    </div>)}
  </nav>;
}

export function AppShell({
  activeTab,
  onNavigate,
  children,
  subContext,
  onClearSubContext,
  tasks,
  hearings = [],
  notificationDataReady = false,
  notificationDataError = false,
  notificationScope,
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
  onOpenSnapshotManager,
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
  const [officeIdentity, setOfficeIdentity] = useState<AdministrationWorkspace | null>(null);
  const [identityError, setIdentityError] = useState(false);
  const [identityRevision, setIdentityRevision] = useState(0);
  const officeName = officeIdentity?.organization.name?.trim() || "مساحة المكتب الحالية";
  const accountLabel = officeIdentity?.currentUser.label?.trim() || taskAssigneeLabel;

  useEffect(() => {
    let cancelled = false;
    void loadAdministrationWorkspace().then((workspace) => {
      if (typeof workspace?.organization?.name !== "string" || typeof workspace?.currentUser?.label !== "string"
        || typeof workspace?.currentUser?.roleLabel !== "string") throw new Error("INVALID_OFFICE_IDENTITY");
      if (cancelled) return;
      setOfficeIdentity(workspace);
      setIdentityError(false);
    }).catch(() => {
      if (cancelled) return;
      setOfficeIdentity(null);
      setIdentityError(true);
    });
    return () => { cancelled = true; };
  }, [identityRevision]);

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

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="axia-workspace h-dvh w-full flex flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--axia-gold-dim)] selection:text-[var(--text)]">
      {/* Top Navbar - Premium Apple-like compact header */}
      <header className="axia-toolbar shrink-0 z-40 border-b border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 w-full flex-wrap items-center justify-between gap-y-2 px-4 py-2 sm:min-h-16 lg:flex-nowrap sm:py-0 lg:px-6">
          {/* Brand & Mobile Hamburger */}
          <div className="flex w-full min-w-0 items-center gap-3 lg:w-auto lg:flex-none">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="فتح قائمة التنقل"
              aria-expanded={mobileMenuOpen}
              aria-controls="office-mobile-menu"
              aria-haspopup="dialog"
              className="grid size-11 shrink-0 place-items-center rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent)] lg:hidden"
            >
              <Menu aria-hidden="true" className="size-5" />
            </button>

            <button type="button" aria-label="AXIA Legal — النظرة العامة"
              onClick={() => onNavigate("overview")}
              className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2.5 group"
            >
              <div className="grid size-10 place-items-center rounded-[14px] border border-[var(--axia-gold-dim)] bg-gradient-to-br from-[var(--axia-gold)]/20 to-transparent text-[var(--axia-gold-light)] shadow-sm group-hover:shadow transition-all">
                <AxiaSymbolSvg className="size-5" idPrefix="axia-shell-header" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="whitespace-nowrap text-base font-bold tracking-tight">AXIA Legal</span>
                  <span className="rounded bg-[var(--axia-gold)]/10 border border-[var(--axia-gold)]/20 px-1 py-0.5 text-[9px] font-bold text-[var(--axia-gold)]">
                    ERP
                  </span>
                </div>
              </div>
            </button>
            <PwaInstallLink />
          </div>

          {/* Global Omni-Search Bar (Matters, Clients, Documents) */}
          <div className="hidden lg:flex min-w-0 flex-1 max-w-xl mx-4 xl:mx-6">
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
          <div className="axia-toolbar-actions flex w-full flex-wrap items-center justify-between gap-1 lg:w-auto lg:flex-nowrap lg:justify-start sm:gap-2">
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
              className="inline-flex min-h-11 min-w-11 justify-center items-center gap-1.5 rounded-xl border border-[var(--axia-gold)]/40 bg-[var(--axia-gold)]/10 px-2.5 py-1 text-xs font-bold text-[var(--axia-gold-light)] hover:bg-[var(--axia-gold)]/20 shadow-sm transition"
              aria-label="مهمة جديدة" title="إسناد مهمة إجرائية جديدة (Ctrl+N أو Alt+N)"
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
              className="hidden sm:grid size-11 place-items-center rounded-[14px] border border-[var(--border)] bg-[var(--panel)]/50 text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
              title="دليل اختصارات لوحة المفاتيح (Ctrl+/)"
            >
              <Keyboard className="size-4" />
            </button>

            {/* Voice Control (Web Speech API) */}
            <div className="hidden 2xl:block"><VoiceControlTrigger
              onNavigate={onNavigate}
              onCreateTask={onCreateTask}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            /></div>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="grid size-11 place-items-center rounded-[14px] border border-[var(--border)] bg-[var(--panel)]/50 text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
                title="تبديل المظهر"
              >
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            )}

            {/* Notifications Popover */}
            <NotificationsPopover
              scope={notificationScope}
              tasks={activeTasks}
              hearings={hearings}
              dataReady={notificationDataReady}
              dataError={notificationDataError}
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
                className="flex min-h-11 min-w-11 justify-center items-center gap-2 rounded-[14px] border border-[var(--border)] bg-[var(--panel)]/50 px-1.5 py-1.5 sm:px-2.5 cursor-pointer hover:bg-[var(--accent)] hover:border-[var(--axia-gold-light)]/40 transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--axia-gold)]"
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
                <div className="text-right hidden xl:block max-w-[160px]">
                  <span title={officeName} className="block text-sm font-bold text-[var(--text)] truncate leading-tight">
                    {officeName}
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5 truncate leading-tight">
                    {accountLabel}
                  </span>
                </div>
                <ChevronLeft className={`hidden size-3 text-[var(--text-muted)] transition-transform duration-200 sm:block ${isProfileOpen ? "-rotate-90" : ""}`} />
              </button>

              {/* The dropdown panel - Premium UI matching Apple/Google accounts view */}
              {isProfileOpen && (
                <div
                  id="profile-dropdown-menu"
                  className="fixed inset-x-4 top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto sm:absolute sm:inset-x-auto sm:left-0 sm:top-auto sm:mt-2 sm:max-h-[calc(100dvh-5rem)] sm:w-[min(24rem,calc(100vw-2rem))] origin-top-left rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  dir="rtl"
                >
                  {/* Header: User Profile Card */}
                  <div className="flex items-start gap-3 border-b border-[var(--border)] pb-3">
                    <div className="size-12 rounded-xl bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-white font-bold grid place-items-center text-lg shadow-md ring-2 ring-[var(--axia-gold-dim)] shrink-0">
                      <Users className="size-6" aria-hidden="true" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-[var(--text)] truncate">{accountLabel}</h4>
                      </div>
                      <p className="text-[10px] text-[var(--axia-gold-light)] font-semibold leading-relaxed">
                        {officeIdentity?.currentUser.roleLabel || "الحساب الحالي"}
                      </p>
                      <PlatformAccessLink />
                    </div>
                  </div>

                  <div className="py-3 border-b border-[var(--border)] space-y-3">
                    <p className="text-sm font-semibold text-[var(--text-muted)]">المكتب الحالي</p>
                    <div className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                      <Building2 aria-hidden="true" className="size-4 shrink-0 text-[var(--axia-gold)]" />
                      <span className="min-w-0 break-words text-sm font-semibold text-[var(--text)]">{officeName}</span>
                    </div>
                    {identityError && (
                      <div role="status" className="text-sm text-[var(--text-muted)]">
                        <p>تعذر تحميل بيانات الحساب والمكتب.</p>
                        <button type="button" className="mt-1 min-h-11 underline" onClick={() => {
                          setIdentityError(false);
                          setIdentityRevision((revision) => revision + 1);
                        }}>إعادة تحميل بيانات المكتب</button>
                      </div>
                    )}
                    {onOpenSnapshotManager && (
                      <button type="button" onClick={() => {
                        setIsProfileOpen(false);
                        onOpenSnapshotManager();
                      }} className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--accent)]">
                        <Download aria-hidden="true" className="size-4 shrink-0" />
                        اللقطة اليومية المحلية
                      </button>
                    )}
                    <Link href="/install" prefetch={false} onClick={() => setIsProfileOpen(false)} className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--accent)]">
                      <Download aria-hidden="true" className="size-4 shrink-0" />
                      تثبيت AXIA على جهازك
                    </Link>
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
          data-collapsed={isSidebarCollapsed}
          className={`axia-sidebar hidden shrink-0 flex-col border-e border-[var(--border)] bg-[var(--panel)] motion-safe:transition-[width] motion-safe:duration-200 ${isFocusMode ? "" : "lg:flex"} ${isSidebarCollapsed ? "w-16" : "w-[19rem] xl:w-80"}`}
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
          <div className="axia-mobile-sidebar flex h-full w-[calc(100%_-_1rem)] max-w-[28rem] flex-col border-e border-[var(--border)] bg-[var(--panel)] shadow-2xl">
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
            <OfficeNavigation mobile activeTab={activeTab} onNavigate={(tab) => { onNavigate(tab); setMobileMenuOpen(false); }} upcomingTasksCount={upcomingTasksCount} />
          </div>
        </dialog>

        {/* Main Content Area - Apple-like canvas */}
        <main className="axia-canvas flex-1 min-w-0 flex flex-col overflow-y-auto relative z-0 scroll-smooth bg-[var(--bg)] custom-scrollbar">

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
            <PwaInstallPromotion />
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
