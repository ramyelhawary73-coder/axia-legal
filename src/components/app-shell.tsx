"use client";

import { useState } from "react";
import { 
  Scale, 
  Gavel, 
  Users, 
  Briefcase, 
  Calendar, 
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
  X,
  Shield,
  ChevronDown
} from "lucide-react";
import { NavigationTab } from "@/types/legal";

interface AppShellProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  children: React.ReactNode;
}

const navItems: { id: NavigationTab; labelAr: string; labelEn: string; icon: any; badge?: string }[] = [
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

export function AppShell({ activeTab, onNavigate, children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--axia-bg)] text-[var(--axia-text)]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a121e]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1700px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid size-9 place-items-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 lg:hidden"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <div 
              onClick={() => onNavigate("overview")}
              className="flex cursor-pointer items-center gap-3"
            >
              <div className="grid size-10 place-items-center rounded-xl border border-[var(--axia-gold-dim)] bg-gradient-to-br from-[var(--axia-gold)]/20 to-[var(--axia-gold)]/5 text-[var(--axia-gold-light)] shadow-sm">
                <Scale className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-white">AXIA Legal</span>
                  <span className="rounded bg-[var(--axia-gold)]/15 border border-[var(--axia-gold)]/30 px-1.5 py-0.5 text-[10px] font-bold text-[var(--axia-gold-light)]">
                    ERP المحاماة
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  منظومة إدارة مكاتب المحاماة والاستشارات · مدعوم بـ <span className="text-[var(--axia-gold-light)] font-semibold">راجح AI</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute right-3.5 top-2.5 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث سريع في القضايا، الموكلين، التوكيلات، أو أحكام النقض..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onNavigate("matters");
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-black/30 pr-10 pl-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[var(--axia-gold)] focus:outline-none transition"
              />
            </div>
          </div>

          {/* User & Quick Status */}
          <div className="flex items-center gap-3">
            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 left-1.5 size-2 rounded-full bg-amber-400" />
              </button>

              {showNotifications && (
                <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[#0d1726] p-4 shadow-2xl z-50 text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 font-bold text-white">
                    <span>تنبيهات الجلسات والمواعيد</span>
                    <span className="text-[10px] text-amber-300 font-semibold">٢ تنبيه عاجل</span>
                  </div>
                  <div className="space-y-2">
                    <div 
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate("hearings");
                      }}
                      className="cursor-pointer rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 hover:bg-amber-500/15"
                    >
                      <strong className="text-amber-300 block">جلسة اليوم: رول رقم ٧</strong>
                      <p className="text-slate-300 text-[11px] mt-0.5">استئناف الجيزة · دائرة ٩ مدني (قضية ٨١٩ لسنة ٢٠٢٤)</p>
                    </div>
                    <div 
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate("tasks");
                      }}
                      className="cursor-pointer rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 hover:bg-red-500/15"
                    >
                      <strong className="text-red-300 block">ميعاد طعن قانوني وشيك</strong>
                      <p className="text-slate-300 text-[11px] mt-0.5">إيداع عريضة استئناف قبل ٢٠٢٦/٠٩/١٧</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Office Profile Pill */}
            <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
              <div className="size-7 rounded-lg bg-[var(--axia-gold)] text-slate-950 font-bold grid place-items-center text-xs">
                ر.هـ
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold text-white">مكتب د. رامي الهواري</span>
                <span className="block text-[10px] text-[var(--axia-gold-light)] font-medium">محام بالنقض والدستورية</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto flex max-w-[1700px]">
        {/* Sidebar Navigation (Desktop) */}
        <aside className="hidden w-72 shrink-0 border-l border-white/10 bg-[#0a1320] p-4 lg:block min-h-[calc(100vh-64px)]">
          <div className="mb-4 px-3 py-2 rounded-xl bg-[var(--axia-gold)]/5 border border-[var(--axia-gold)]/20">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--axia-gold-light)]">
              <Shield className="size-3.5" />
              <span>النسخة الاحترافية للمحاماة</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              جدول المحاكم المصرية · مبادئ النقض
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isRajih = item.id === "rajih";

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-right transition ${
                    isActive
                      ? "bg-gradient-to-r from-[var(--axia-gold)]/20 to-[var(--axia-gold)]/5 text-white font-bold border border-[var(--axia-gold)]/30 shadow-sm"
                      : isRajih
                      ? "text-amber-200/90 hover:bg-amber-400/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`size-4.5 shrink-0 ${
                      isActive 
                        ? "text-[var(--axia-gold-light)]" 
                        : isRajih
                        ? "text-amber-400"
                        : "text-slate-400"
                    }`} />
                    <div>
                      <span className="block text-xs font-medium">{item.labelAr}</span>
                      <span className="block text-[10px] opacity-60 font-sans">{item.labelEn}</span>
                    </div>
                  </div>

                  {item.badge && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      item.badge === "اليوم"
                        ? "bg-amber-400 text-slate-950 animate-pulse"
                        : item.badge === "AI"
                        ? "bg-gradient-to-r from-[var(--axia-gold)] to-amber-500 text-slate-950"
                        : isActive
                        ? "bg-[var(--axia-gold)]/30 text-[var(--axia-gold-light)]"
                        : "bg-white/10 text-slate-300"
                    }`}>
                      {item.badge}
                    </span>
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <div className="relative w-80 bg-[#0a1320] border-l border-white/10 p-5 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Scale className="size-5 text-[var(--axia-gold-light)]" />
                  <span className="font-bold text-white text-sm">أقسام منظومة AXIA Legal</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="grid size-8 place-items-center rounded-lg bg-white/10 text-slate-300"
                >
                  <X className="size-4" />
                </button>
              </div>

              <nav className="space-y-1">
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
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-right transition ${
                        isActive
                          ? "bg-[var(--axia-gold)]/20 text-[var(--axia-gold-light)] font-bold border border-[var(--axia-gold)]/30"
                          : "text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="size-4 text-[var(--axia-gold-light)]" />
                        <div>
                          <span className="block text-xs font-semibold">{item.labelAr}</span>
                          <span className="block text-[10px] text-slate-400">{item.labelEn}</span>
                        </div>
                      </div>
                      {item.badge && (
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
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

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
