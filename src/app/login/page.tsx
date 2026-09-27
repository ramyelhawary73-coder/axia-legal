"use client";

import { useState } from "react";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Scale, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  ChevronLeft,
  Server
} from "lucide-react";
import { login } from "./actions";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFormSubmit = () => {
    setIsLoading(true);
    setErrorMsg(null);
  };

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#08080a] text-[#ededed] overflow-hidden select-none" dir="rtl">
      
      {/* LEFT CANVAS: Premium Brand Heritage Panel (Hidden on Mobile) */}
      <section className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative flex-col justify-between p-12 bg-gradient-to-br from-[#0a0b10] via-[#11121b] to-[#040507] border-l border-white/5 overflow-hidden">
        
        {/* Subtle Animated Background Grid Lines & Glow Orbs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] size-[600px] rounded-full bg-[var(--axia-gold)]/10 blur-[150px]" />
          <div className="absolute bottom-[-10%] right-[-10%] size-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
              backgroundSize: "24px 24px"
            }}
          />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-white shadow-lg">
            <Scale className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white font-serif">AXIA Legal OS</span>
              <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-bold text-[var(--axia-gold)]">
                v1.2-PREMIUM
              </span>
            </div>
            <p className="text-[10px] text-white/40 leading-none mt-0.5">Egyptian Practice & Intelligence OS</p>
          </div>
        </div>

        {/* Cinematic Slogan & Identity Centerpiece */}
        <div className="relative z-10 my-auto space-y-6 max-w-md">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--axia-gold-light)]">
              <Sparkles className="size-3" />
              الذكاء الإجرائي القانوني الفائق
            </span>
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight text-white text-wrap balance font-serif">
              مستقبل الممارسة القانونية في مصر.
            </h1>
            <p className="text-sm text-white/60 leading-relaxed">
              منصة سحابية متكاملة تدمج البحث التشريعي في أحكام النقض مع إدارة الجلسات وقلم المحضرين، مدعومة بمحرك الذكاء الاصطناعي السيادي «راجح».
            </p>
          </div>

          {/* Premium Core Value Badges */}
          <div className="grid gap-3 pt-2">
            <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm transition hover:bg-white/[0.04]">
              <div className="grid size-8 place-items-center rounded-lg bg-[var(--axia-gold-dim)] text-[var(--axia-gold-light)] shrink-0">
                <Sparkles className="size-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">محرك راجح القانوني السيادي</h4>
                <p className="text-[11px] text-white/50 leading-relaxed">تحليل العقود، استنباط الحجج القانونية، واستدعاء المواد الدستورية فورياً.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm transition hover:bg-white/[0.04]">
              <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">حماية أمنية وتدقيق متكامل (RLS)</h4>
                <p className="text-[11px] text-white/50 leading-relaxed">تشفير كامل لقضايا الموكلين، سجل رقابي للنشاطات، ومطابقة لقوانين حماية البيانات.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Footer Information */}
        <div className="relative z-10 pt-6 border-t border-white/5 flex items-center justify-between text-[11px] text-white/30">
          <div className="flex items-center gap-1.5">
            <Server className="size-3 text-emerald-500 animate-pulse" />
            <span>متصل بنظام التشفير السيادي للعدالة</span>
          </div>
          <span>© ٢٠٢٦ مجموعة AXIA الدولية.</span>
        </div>
      </section>

      {/* RIGHT CANVAS: Ultra-Polished Interactive Login Panel */}
      <section className="flex-1 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative">
        
        {/* Mobile Brand Top Bar */}
        <div className="flex lg:hidden items-center justify-between pb-6 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-[var(--axia-gold)] text-white shadow">
              <Scale className="size-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">AXIA Legal OS</span>
          </div>
          <span className="text-[10px] text-white/40">v1.2</span>
        </div>

        {/* Central Card Container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-8 py-8">
          
          {/* Executive Corporate Geometric Logo Frame */}
          <div className="space-y-4 text-center lg:text-right">
            <div className="inline-flex relative size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12131a] to-[#1a1b26] border border-white/10 shadow-2xl p-3 shrink-0">
              {/* Premium Scale & Alpha intersecting vector identity */}
              <svg className="size-full text-[var(--axia-gold-light)] animate-pulse" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 15L85 75H15L50 15Z" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="50" cy="48" r="14" stroke="currentColor" strokeWidth="5" fill="#12131a"/>
                <line x1="50" y1="15" x2="50" y2="75" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                <line x1="30" y1="52" x2="70" y2="52" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-serif">تسجيل الدخول للمنصة</h2>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                مرحباً بك مجدداً في نظام الممارسة السيادي. يرجى إدخال بيانات الاعتماد الممنوحة لك للولوج لمساحة عمل المكتب.
              </p>
            </div>
          </div>

          {/* Form Action Container */}
          <form 
            action={login} 
            onSubmit={handleFormSubmit}
            className="space-y-5"
          >
            <input type="hidden" name="next" value="/" />

            {/* Email Field with Premium Micro-interaction */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-wide block">
                البريد الإلكتروني المصرح
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-white/30 group-focus-within:text-[var(--axia-gold-light)] transition">
                  <Mail className="size-4" />
                </div>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="ramyelhawary73@gmail.com"
                  className="w-full text-right rounded-xl border border-white/10 bg-white/[0.02] py-3.5 pr-10 pl-4 text-xs text-white placeholder-white/20 outline-none transition duration-200 hover:bg-white/[0.04] hover:border-white/20 focus:bg-[#0c0c12] focus:border-[var(--axia-gold)]/60 focus:ring-4 focus:ring-[var(--axia-gold)]/10"
                />
              </div>
            </div>

            {/* Password Field with Toggle Ability */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wide block">
                  كلمة المرور الأمنية
                </label>
                <a href="#" className="text-[10px] font-bold text-[var(--axia-gold-light)] hover:underline">
                  هل نسيت كلمة المرور؟
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-white/30 group-focus-within:text-[var(--axia-gold-light)] transition">
                  <Lock className="size-4" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-right rounded-xl border border-white/10 bg-white/[0.02] py-3.5 pr-10 pl-11 text-xs text-white placeholder-white/20 outline-none transition duration-200 hover:bg-white/[0.04] hover:border-white/20 focus:bg-[#0c0c12] focus:border-[var(--axia-gold)]/60 focus:ring-4 focus:ring-[var(--axia-gold)]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/30 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Box */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-white/60 hover:text-white transition select-none">
                <input 
                  type="checkbox" 
                  className="rounded border-white/10 bg-white/5 text-[var(--axia-gold)] focus:ring-[var(--axia-gold)] focus:ring-offset-0"
                />
                <span>تذكر جلستي على هذا الجهاز</span>
              </label>
              
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <ShieldCheck className="size-3.5" />
                <span>اتصال مشفر وآمن RLS</span>
              </div>
            </div>

            {/* Error Message Layout */}
            {errorMsg && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Premium Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative mt-2 overflow-hidden rounded-xl bg-gradient-to-r from-[var(--axia-gold-light)] to-[var(--axia-gold)] hover:from-[#d5a730] hover:to-[#b38719] py-3.5 text-xs font-bold text-white transition-all shadow-xl hover:shadow-[var(--axia-gold)]/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin size-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>جاري التحقق من الهوية المهنية...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>الدخول لمساحة العمل المشفرة</span>
                  <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                </div>
              )}
            </button>
          </form>

          {/* Quick Sandbox Assistant Banner */}
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-center text-[10px] text-white/40 leading-relaxed">
            مساحة عمل مصرحة للمستشارين والشركاء فقط. لإجراء استعلامات عامة أو تفعيل تراخيص جديدة، يرجى مراجعة إدارة الترخيص بوزارة الاتصالات ونقابة المحامين.
          </div>
        </div>

        {/* Global Footer Help Contact */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/30 border-t border-white/5 pt-6 mt-8">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="size-3.5" />
            <span>هل تواجه صعوبة في تسجيل الدخول؟</span>
            <a href="#" className="text-[var(--axia-gold-light)] hover:underline font-bold">الدعم الفني المباشر</a>
          </div>
          <div className="flex items-center gap-1.5">
            <span>مدعوم بقوانين حماية الخصوصية المصرية للاتصالات</span>
          </div>
        </div>
      </section>

    </main>
  );
}
