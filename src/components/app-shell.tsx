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
  type LucideIcon 
} from "lucide-react";
import { NavigationTab, LegalTask, Matter, Client, LegalDocument } from "@/types/legal";
import { mockTasks } from "@/lib/mock-legal-data";
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
import { GlobalSearchBar } from "@/components/global-search-bar";

interface AppShellProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  children: React.ReactNode;
  subContext?: string | null;
  onClearSubContext?: () => void;
  tasks?: LegalTask[];
  onToggleTaskStatus?: (taskId: string) => void;
  onCreateTask?: (task: LegalTask) => void;
  matters?: Matter[];
  clients?: Client[];
  documents?: LegalDocument[];
  onSelectMatter?: (matterId: string) => void;
  onSelectClient?: (clientId: string) => void;
  onSelectDocument?: (docId: string) => void;
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
  matters,
  clients,
  documents,
  onSelectMatter,
  onSelectClient,
  onSelectDocument,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [taskCreatedToast, setTaskCreatedToast] = useState<{ id: string; title: string } | null>(null);

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
      setMobileMenuOpen(false);
    },
    onNavigateTab: onNavigate,
  });

  const handleCreateTaskFromModal = (task: LegalTask) => {
    if (onCreateTask) {
      onCreateTask(task);
    }
    setTaskCreatedToast({ id: task.id, title: task.title });
    setTimeout(() => {
      setTaskCreatedToast(null);
    }, 4500);
  };
  
  const activeTasks = tasks || mockTasks;
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
              className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--accent)] lg:hidden"
            >
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>

            <div 
              onClick={() => onNavigate("overview")}
              className="flex cursor-pointer items-center gap-2.5 group"
            >
              <div className="grid size-8 place-items-center rounded-lg border border-[var(--axia-gold-dim)] bg-gradient-to-br from-[var(--axia-gold)]/20 to-transparent text-[var(--axia-gold-light)] shadow-sm group-hover:shadow transition-all">
                <Scale className="size-4" />
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

            {/* Office Profile Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 px-2 py-1 cursor-pointer hover:bg-[var(--accent)] transition-colors">
              <div className="size-6 rounded bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-white font-bold grid place-items-center text-[10px]">
                ر.هـ
              </div>
              <div className="text-right">
                <span className="block text-[11px] font-bold text-[var(--text)]">مكتب د. رامي الهواري</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden w-full bg-[var(--bg)]">
        {/* Sidebar Navigation (Desktop) - Premium Glass Sidebar */}
        <aside 
          className={`hidden shrink-0 border-l border-[var(--border)] bg-[var(--panel-glass)] backdrop-blur-xl transition-all duration-300 ease-in-out lg:flex flex-col z-30 ${
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
              className="fixed inset-0 bg-[var(--accent)] backdrop-blur-sm transition-opacity"
            />
            <div className="relative w-72 bg-[var(--panel)] border-l border-[var(--border)] p-4 shadow-2xl h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Scale className="size-4 text-[var(--axia-gold)]" />
                  <span className="font-bold text-[var(--text)] text-sm">AXIA Legal</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
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
        sourceLabel="اختصار سريع (Ctrl+N)"
      />

      {/* Keyboard Shortcuts Cheat-Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onTriggerNewTask={() => setIsTaskModalOpen(true)}
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
