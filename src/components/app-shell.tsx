"use client";

import { useState, useEffect } from "react";
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
  Search, 
  Bell, 
  Menu,
  ChevronLeft, 
  X,
  Shield,
  PanelRightClose,
  PanelRightOpen,
  Sun,
  Moon,
  type LucideIcon
} from "lucide-react";
import { NavigationTab } from "@/types/legal";

interface AppShellProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  children: React.ReactNode;
  subContext?: string | null;
  onClearSubContext?: () => void;
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

export function AppShell({ activeTab, onNavigate, children, subContext, onClearSubContext }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  
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

          {/* Quick Search - Spotlight Style */}
          <div className="hidden md:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full group">
              <Search className="absolute right-3 top-2.5 size-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--axia-gold)] transition-colors" />
              <input
                type="text"
                placeholder="بحث في النظام..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onNavigate("matters");
                  }
                }}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)]/50 pr-9 pl-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:ring-1 focus:ring-[var(--axia-gold)] focus:outline-none shadow-sm transition-all"
              />
              <div className="absolute left-2 top-2 flex items-center gap-1">
                <kbd className="hidden lg:inline-block rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 text-[10px] font-medium text-[var(--text-muted)]">⌘</kbd>
                <kbd className="hidden lg:inline-block rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 text-[10px] font-medium text-[var(--text-muted)]">K</kbd>
              </div>
            </div>
          </div>

          {/* User & Quick Status */}
          <div className="flex items-center gap-2">
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

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative grid size-8 place-items-center rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 left-1.5 size-1.5 rounded-full bg-red-500 ring-2 ring-[var(--bg)]" />
              </button>

              {showNotifications && (
                <div className="absolute left-0 mt-2 w-72 rounded-xl border border-[var(--border-strong)] bg-[var(--panel-glass)] backdrop-blur-2xl p-3 shadow-[var(--shadow-md)] z-50 text-xs">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-2 font-bold">
                    <span>التنبيهات</span>
                    <span className="text-[10px] text-red-500 font-semibold">٢ عاجل</span>
                  </div>
                  <div className="space-y-1.5">
                    <div 
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate("hearings");
                      }}
                      className="cursor-pointer rounded-lg bg-[var(--axia-gold)]/10 border border-[var(--axia-gold)]/20 p-2 hover:bg-[var(--axia-gold)]/15 transition-colors"
                    >
                      <strong className="text-[var(--axia-gold)] block">جلسة اليوم: رول رقم ٧</strong>
                      <p className="text-[var(--text-muted)] text-[10px] mt-0.5">استئناف الجيزة · دائرة ٩ مدني</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

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

                  {!isSidebarCollapsed && item.badge && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                      item.badge === "اليوم"
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : item.badge === "AI"
                        ? "bg-[var(--axia-gold)]/10 text-[var(--axia-gold)] border border-[var(--axia-gold)]/20"
                        : isActive
                        ? "bg-[var(--text)]/10 text-[var(--text)]"
                        : "bg-[var(--accent)] text-[var(--text-muted)]"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  
                  {isSidebarCollapsed && item.badge && (
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
                      {item.badge && (
                        <span className="rounded bg-[var(--accent)] px-1.5 py-0.5 text-[9px]">
                          {item.badge}
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


          <div className="mx-auto max-w-[1700px] p-4 lg:p-6 animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
