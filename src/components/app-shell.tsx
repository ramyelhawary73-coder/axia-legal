"use client";

import { useState, useEffect, useMemo } from "react";
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
  BadgeCheck,
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

const navItems: { id: NavigationTab; labelAr: string; labelEn: string; icon: LucideIcon; badge?: string }[] = [
  { id: "overview", labelAr: "نظرة عامة", labelEn: "Overview", icon: Scale },
  { id: "matters", labelAr: "القضايا والملفات", labelEn: "Matters & Dossiers", icon: Briefcase, badge: "٥" },
  { id: "hearings", labelAr: "الجلسات والتقويم", labelEn: "Hearings & Roll", icon: Gavel, badge: "اليوم" },
  { id: "clients", labelAr: "الموكلين والتوكيلات", labelEn: "Clients & POA", icon: Users, badge: "٥" },
  { id: "tasks", labelAr: "قلم المحضرين والمهام", labelEn: "Bailiff & Deadlines", icon: CheckSquare, badge: "٣" },
  { id: "documents", labelAr: "العقود والمستندات", labelEn: "Contracts & Docs", icon: FileText },
  { id: "finance", labelAr: "المالية والأتعاب", labelEn: "Legal Finance", icon: DollarSign },
  { id: "library", labelAr: "المكتبة وأحكام النقض", labelEn: "Precedents & Laws", icon: BookOpen },
  { id: "rajih", labelAr: "راجح الذكاء الاصطناعي", labelEn: "RAJIH AI Copilot", icon: Sparkles, badge: "AI" },
  { id: "team", labelAr: "فريق العمل والمتدربون", labelEn: "Legal Team", icon: Users },
  { id: "reports", labelAr: "التقارير والإحصائيات", labelEn: "Analytics & KPIs", icon: BarChart3 },
  { id: "administration", labelAr: "إدارة المكتب والترخيص", labelEn: "Administration", icon: Settings },
];

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [taskCreatedToast, setTaskCreatedToast] = useState<{ id: string; title: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<"cairo" | "alexandria" | "corp">("cairo");

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
        <div className="mx-auto flex h-14 w-full items-center justify-between px-4 lg:px-6">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="فتح قائمة التنقل"
              aria-expanded={mobileMenuOpen}
              className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--accent)] lg:hidden"
            >
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>

            <div 
              onClick={() => onNavigate("overview")}
              className="flex cursor-pointer items-center gap-2.5 group"
            >
              <div className="grid size-8 place-items-center rounded-lg border border-[var(--axia-gold-dim)] bg-gradient-to-br from-[var(--axia-gold)]/20 to-transparent text-[var(--axia-gold-light)] shadow-sm group-hover:shadow transition-all">
                <AxiaSymbolSvg className="size-5" idPrefix="axia-shell-header" />
              </div>
              <div className="hidden sm:block">
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
          <div className="flex items-center gap-2">
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
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)]/50 px-2.5 py-1.5 cursor-pointer hover:bg-[var(--accent)] hover:border-[var(--axia-gold-light)]/40 transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--axia-gold)]"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="relative size-6 shrink-0 rounded bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-white font-bold grid place-items-center text-[10px] shadow-sm">
                  ر.هـ
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
                    د. رامي الهواري
                  </span>
                </div>
                <ChevronLeft className={`size-3 text-[var(--text-muted)] transition-transform duration-200 ${isProfileOpen ? "-rotate-90" : ""}`} />
              </button>

              {/* The dropdown panel - Premium UI matching Apple/Google accounts view */}
              {isProfileOpen && (
                <div 
                  id="profile-dropdown-menu"
                  className="absolute left-0 mt-2 w-80 sm:w-96 origin-top-left rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  dir="rtl"
                >
                  {/* Header: User Profile Card */}
                  <div className="flex items-start gap-3 border-b border-[var(--border)] pb-3">
                    <div className="size-12 rounded-xl bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-white font-bold grid place-items-center text-lg shadow-md ring-2 ring-[var(--axia-gold-dim)] shrink-0">
                      ر.هـ
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-[var(--text)] truncate">د. رامي الهواري</h4>
                        <span title="مستشار معتمد ومقيد بالنقابة">
                          <BadgeCheck className="size-4 text-emerald-500 shrink-0" />
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] font-medium leading-none truncate">ramyelhawary73@gmail.com</p>
                      <p className="text-[10px] text-[var(--axia-gold-light)] font-semibold leading-relaxed">
                        المستشار العام والنائب الأول لنقابة المحامين (شريك مؤسس)
                      </p>
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
        {/* Sidebar Navigation (Desktop) - Premium Glass Sidebar */}
        <aside 
          className={`hidden shrink-0 border-l border-[var(--border)] bg-[var(--panel-glass)] backdrop-blur-xl transition-all duration-300 ease-in-out ${isFocusMode ? "lg:hidden" : "lg:flex"} flex-col z-30 ${
            isSidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          {/* Header & Toggle */}
          <div className="flex items-center justify-between p-3 border-b border-[var(--border)] h-12">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                <Shield className="size-3 shrink-0" />
                <span className="truncate">النسخة الاحترافية</span>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)] transition-colors ${isSidebarCollapsed ? 'mx-auto' : ''}`}
            >
              {isSidebarCollapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-0.5 p-2 custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isRajih = item.id === "rajih";
              const currentBadge = item.id === "tasks" 
                ? (upcomingTasksCount > 0 ? String(upcomingTasksCount) : undefined) 
                : item.badge;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={isSidebarCollapsed ? `${item.labelAr} - ${item.labelEn}` : undefined}
                  className={`w-full flex items-center rounded-lg transition-all relative group ${
                    isSidebarCollapsed ? "justify-center p-2.5" : "justify-between px-2.5 py-2"
                  } ${
                    isActive
                      ? "bg-[var(--accent-hover)] text-[var(--text)] shadow-sm border border-[var(--border)]"
                      : isRajih
                      ? "text-[var(--axia-gold)] hover:bg-[var(--axia-gold-dim)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
                  }`}
                >
                  <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-2.5"}`}>
                    <Icon className={`size-4 shrink-0 transition-colors ${
                      isActive 
                        ? (isRajih ? "text-[var(--axia-gold-light)]" : "text-[var(--text)]") 
                        : "group-hover:text-[var(--text)]"
                    }`} />
                    {!isSidebarCollapsed && (
                      <div className="text-right">
                        <span className={`block text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.labelAr}</span>
                      </div>
                    )}
                  </div>

                  {!isSidebarCollapsed && currentBadge && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                      currentBadge === "اليوم" || (item.id === "tasks" && upcomingTasksCount > 0)
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : currentBadge === "AI"
                        ? "bg-[var(--axia-gold)]/10 text-[var(--axia-gold)] border border-[var(--axia-gold)]/20"
                        : isActive
                        ? "bg-[var(--text)]/10 text-[var(--text)]"
                        : "bg-[var(--accent)] text-[var(--text-muted)]"
                    }`}>
                      {currentBadge}
                    </span>
                  )}
                  
                  {isSidebarCollapsed && currentBadge && (
                     <div className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div 
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            />
            <div className="relative w-72 bg-[var(--panel)] border-l border-[var(--border)] p-4 shadow-2xl h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <AxiaSymbolSvg className="size-5" idPrefix="axia-shell-mobile" />
                  <span className="font-bold text-[var(--text)] text-sm">AXIA Legal</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="إغلاق قائمة التنقل"
                  className="grid size-7 place-items-center rounded-lg bg-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  <X className="size-4" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const currentBadge = item.id === "tasks" 
                    ? (upcomingTasksCount > 0 ? String(upcomingTasksCount) : undefined) 
                    : item.badge;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-right transition-colors ${
                        isActive
                          ? "bg-[var(--accent-hover)] text-[var(--text)] font-semibold border border-[var(--border)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`size-4 ${isActive ? 'text-[var(--text)]' : ''}`} />
                        <span className="text-xs">{item.labelAr}</span>
                      </div>
                      {currentBadge && (
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          currentBadge === "اليوم" || (item.id === "tasks" && upcomingTasksCount > 0)
                            ? "bg-red-500/15 text-red-500"
                            : "bg-[var(--accent)] text-[var(--text-muted)]"
                        }`}>
                          {currentBadge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

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
