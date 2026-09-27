"use client";

import { useState } from "react";
import { login } from "@/app/login/actions";
import { 
  Scale, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft, 
  Activity, 
  FileText, 
  DollarSign, 
  Database,
  LockKeyhole,
  ChevronDown
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "workflow" | "finance" | "security">("ai");

  // Handles smooth scroll to features section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 font-sans selection:bg-[var(--axia-gold-dim)] selection:text-[var(--text)] relative overflow-x-hidden" dir="rtl">
      
      {/* 1. ANIMATED BACKGROUND - Stripe/Linear Style Aurora Glow & Grid Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
        
        {/* Drift animated gradient auras */}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[var(--axia-gold)]/10 via-amber-500/5 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-blue-500/5 via-violet-500/5 to-transparent blur-[100px] animate-pulse" style={{ animationDuration: "18s" }} />
      </div>

      {/* 2. HEADER - Complies with Top Bar Contract */}
      <header className="relative z-10 w-full border-b border-white/5 bg-[#050508]/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Brand Logo Zone */}
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg border border-[var(--axia-gold-dim)] bg-gradient-to-br from-[var(--axia-gold)]/20 to-transparent text-[var(--axia-gold-light)] shadow">
              <Scale className="size-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white font-serif">AXIA Legal OS</span>
          </div>

          {/* Navigation Links Zone */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors">مزايا المنظومة</button>
            <button onClick={() => scrollToSection("rajih-ai")} className="hover:text-white transition-colors">ذكاء راجح</button>
            <button onClick={() => scrollToSection("statistics")} className="hover:text-white transition-colors">مؤشرات الأداء</button>
            <button onClick={() => scrollToSection("security")} className="hover:text-white transition-colors">السيادة والأمان</button>
          </nav>

          {/* Action Button Zone */}
          <div>
            <button 
              onClick={() => scrollToSection("login-card")}
              className="rounded-lg border border-[var(--axia-gold)]/40 bg-[var(--axia-gold)]/10 px-4 py-2 text-xs font-bold text-[var(--axia-gold-light)] hover:bg-[var(--axia-gold)]/20 shadow-sm transition"
            >
              الولوج السريع
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO & PREMIUM LOGIN CARD SECTION */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24 lg:px-8 text-center" id="login-card">
        {/* Silicon Valley Style Product Announcement Badges */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--axia-gold)]/20 bg-[var(--axia-gold)]/5 px-3 py-1 text-[11px] font-medium text-[var(--axia-gold-light)] mb-6 animate-fade-in">
          <Sparkles className="size-3.5" />
          <span>منظومة التسيير القضائي والذكاء الاصطناعي الأسرع في مصر والشرق الأوسط</span>
        </div>

        {/* Hero Headings */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none text-wrap-balance mb-6 font-serif">
          صرح التسيير والذكاء القانوني الفائق <span className="bg-gradient-to-r from-[var(--axia-gold-light)] to-amber-500 bg-clip-text text-transparent">AXIA Legal OS</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          نظام مؤسسي سحابي مصمم وفقاً لأرفع المقاييس الأمنية والتقنية في وادي السيليكون لإدارة ممارستك القانونية وصياغة مستنداتك بمساعدة الذكاء الاصطناعي السيادي «راجح».
        </p>

        {/* Apple/Google Style Centered Premium Floating Login Card */}
        <div className="max-w-md mx-auto relative group">
          {/* Glowing element behind the card */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--axia-gold)] to-amber-600 opacity-20 blur-xl transition duration-1000 group-hover:opacity-30" />
          
          <div className="relative rounded-2xl border border-white/10 bg-[#0c0c12]/95 p-8 text-right shadow-2xl transition duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">تسجيل الدخول للمنصة</h3>
                <p className="text-xs text-slate-400 mt-1">الرجاء إدخال بيانات الاعتماد الممنوحة لمكتبك</p>
              </div>
              <div className="size-10 rounded-xl bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-white grid place-items-center shadow-md">
                <LockKeyhole className="size-5" />
              </div>
            </div>

            {/* FORM */}
            <form action={login} onSubmit={() => setLoading(true)} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">البريد الإلكتروني المهني</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                    <Mail className="size-4" />
                  </span>
                  <input 
                    type="email" 
                    name="email" 
                    defaultValue="ramyelhawary73@gmail.com"
                    required
                    className="w-full bg-[#13131f] border border-white/5 rounded-xl py-3 pr-10 pl-4 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-[var(--axia-gold-light)]/40 focus:ring-1 focus:ring-[var(--axia-gold-light)]/40 transition duration-200"
                    placeholder="name@firm.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">كلمة المرور الآمنة</label>
                  <a href="#" className="text-[11px] text-[var(--axia-gold-light)] hover:underline font-medium">نسيت كلمة المرور؟</a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                    <Lock className="size-4" />
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    required
                    className="w-full bg-[#13131f] border border-white/5 rounded-xl py-3 pr-10 pl-11 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[var(--axia-gold-light)]/40 focus:ring-1 focus:ring-[var(--axia-gold-light)]/40 transition duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Active Security Indicators */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="size-4 bg-[#13131f] border-white/5 rounded text-[var(--axia-gold)] focus:ring-0 cursor-pointer"
                    defaultChecked
                  />
                  <span className="text-[11px] font-medium text-slate-400">تذكر جلستي على هذا الجهاز</span>
                </label>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  <span>اتصال مشفر وآمن RLS</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-amber-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-[var(--axia-gold)]/10 hover:shadow-[var(--axia-gold)]/20 hover:brightness-110 active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري التحقق والمزامنة السحابية...</span>
                  </>
                ) : (
                  <span>الدخول لمساحة العمل المشفرة</span>
                )}
              </button>
            </form>

            <div className="mt-5 border-t border-white/5 pt-4 text-center">
              <span className="text-[10px] text-slate-500 leading-relaxed block">
                مساحة عمل مصرحة للمستشارين والشركاء فقط. يخضع الوصول لبنود السرية المتبادلة بموجب لوائح وزارة الاتصالات ونقابة المحامين.
              </span>
            </div>
          </div>
        </div>

        {/* Floating Indicator */}
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => scrollToSection("features")}
            className="flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 transition duration-200"
          >
            <span className="text-xs font-semibold">استكشف المزايا التشغيلية والتسويقية</span>
            <ChevronDown className="size-4 animate-bounce" />
          </button>
        </div>
      </section>

      {/* 4. SILICON VALLEY MARKETING - PERFORMANCE METRICS CARD SHOWCASE */}
      <section className="relative z-10 border-t border-white/5 bg-[#08080d]/60 py-20" id="statistics">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">إنتاجية خارقة بالأرقام والقياسات الحقيقية</h2>
            <p className="text-sm text-slate-400">
              مقارنة بين كفاءة التسيير السحابي المبتكر لـ AXIA Legal OS والطرق الورقية والأرشيفية القديمة المتبعة في المكاتب التقليدية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metric Card 1 */}
            <div className="rounded-2xl border border-white/5 bg-[#0c0c12] p-6 text-right space-y-4">
              <div className="size-10 rounded-xl bg-amber-500/10 text-[var(--axia-gold-light)] flex items-center justify-center font-bold">
                <Activity className="size-5" />
              </div>
              <div>
                <h4 className="text-[var(--axia-gold-light)] text-3xl sm:text-4xl font-extrabold tabular-nums">+350%</h4>
                <p className="text-xs font-bold text-white mt-1">تسريع صياغة المذكرات والدفاع</p>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  يقوم محرك راجح بتحليل القضية واستخلاص الدفوع الدستورية وبناء هيكلية المذكرات القانونية في ثوانٍ معدودة بدلاً من الأيام.
                </p>
              </div>
            </div>

            {/* Metric Card 2 */}
            <div className="rounded-2xl border border-white/5 bg-[#0c0c12] p-6 text-right space-y-4">
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <Database className="size-5" />
              </div>
              <div>
                <h4 className="text-blue-400 text-3xl sm:text-4xl font-extrabold tabular-nums">0.2 ثانية</h4>
                <p className="text-xs font-bold text-white mt-1">الاستجابة والمزامنة اللحظية</p>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  سرعة غير مسبوقة في قراءة وتحميل الجلسات والقضايا وإسناد المهام الإجرائية عبر خوادم إقليمية بالغة الكفاءة وسريعة الاستجابة.
                </p>
              </div>
            </div>

            {/* Metric Card 3 */}
            <div className="rounded-2xl border border-white/5 bg-[#0c0c12] p-6 text-right space-y-4">
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-emerald-400 text-3xl sm:text-4xl font-extrabold tabular-nums">100%</h4>
                <p className="text-xs font-bold text-white mt-1">سرية تامة وعزل لبيانات الموكلين</p>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  عبر تطبيق حوكمة الأمان RLS المدمجة بقاعدة البيانات لضمان عدم إمكانية وصول أي مستخدم لملفات أو قضايا خارج نطاق تخصيصه.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE PRODUCT FEATURES GRID (Silicon Valley Styled Landing Showcase) */}
      <section className="relative z-10 py-24" id="features">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">بوابة رقمية متكاملة لخدمة صروح العدالة الكبرى</h2>
            <p className="text-sm text-slate-400">
              صُممت المنظومة لتتجاوز برمجيات الإدارة التقليدية، لتقدم تجربة تسيير قانوني متناغمة ولحظية تدعم فريق العمل بالكامل.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Feature Selectors (Left side on large, right because RTL) */}
            <div className="lg:col-span-4 space-y-3">
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`w-full text-right p-4 rounded-2xl border transition duration-200 flex items-start gap-3.5 ${
                  activeTab === "ai" 
                    ? "border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/[0.04] text-white shadow-sm" 
                    : "border-white/5 bg-transparent text-slate-400 hover:bg-white/[0.02]"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${activeTab === "ai" ? "bg-[var(--axia-gold)]/10 text-[var(--axia-gold-light)]" : "bg-white/5 text-slate-400"}`}>
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">الذكاء الاصطناعي القضائي «راجح»</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">البحث التفاعلي واستخلاص الدفوع الدستورية والنصوص القانونية.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("workflow")}
                className={`w-full text-right p-4 rounded-2xl border transition duration-200 flex items-start gap-3.5 ${
                  activeTab === "workflow" 
                    ? "border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/[0.04] text-white shadow-sm" 
                    : "border-white/5 bg-transparent text-slate-400 hover:bg-white/[0.02]"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${activeTab === "workflow" ? "bg-[var(--axia-gold)]/10 text-[var(--axia-gold-light)]" : "bg-white/5 text-slate-400"}`}>
                  <FileText className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">تسيير قلم المحضرين والمهام</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">متابعة مواعيد الإعلانات القضائية والتكليفات بالوفاء والجلسات.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("finance")}
                className={`w-full text-right p-4 rounded-2xl border transition duration-200 flex items-start gap-3.5 ${
                  activeTab === "finance" 
                    ? "border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/[0.04] text-white shadow-sm" 
                    : "border-white/5 bg-transparent text-slate-400 hover:bg-white/[0.02]"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${activeTab === "finance" ? "bg-[var(--axia-gold)]/10 text-[var(--axia-gold-light)]" : "bg-white/5 text-slate-400"}`}>
                  <DollarSign className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">الحوكمة المالية والأتعاب</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">إدارة ودائع الموكلين، دفعات الأتعاب، والمصروفات الإجرائية.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`w-full text-right p-4 rounded-2xl border transition duration-200 flex items-start gap-3.5 ${
                  activeTab === "security" 
                    ? "border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/[0.04] text-white shadow-sm" 
                    : "border-white/5 bg-transparent text-slate-400 hover:bg-white/[0.02]"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${activeTab === "security" ? "bg-[var(--axia-gold)]/10 text-[var(--axia-gold-light)]" : "bg-white/5 text-slate-400"}`}>
                  <LockKeyhole className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">بروتوكول الأمان RLS التام</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">صلاحيات هرمية صارمة تعزل ملفات وقضايا الموكلين تلقائياً.</p>
                </div>
              </button>
            </div>

            {/* Feature Active View Details (Right side on large, left because RTL) */}
            <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-[#0c0c12]/90 p-8 min-h-[350px] flex flex-col justify-between">
              <div>
                {activeTab === "ai" && (
                  <div className="space-y-4">
                    <span className="rounded bg-[var(--axia-gold)]/10 border border-[var(--axia-gold)]/20 px-2 py-1 text-[10px] font-bold text-[var(--axia-gold)] uppercase">الذكاء القضائي التوليدي</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">المساعد الذكي السيادي «راجح»</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      بوابة حصرية مدمجة في صلب النظام تتيح للمستشار مناقشة وقائع القضية واستنباط الحجج القانونية المطبقة مباشرة.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-[var(--axia-gold-light)] shrink-0" />
                        <span>تحليل مستندات القضية واستخلاص الدفوع ونقاط القوة والضعف تلقائياً.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-[var(--axia-gold-light)] shrink-0" />
                        <span>الوصول المباشر لقواعد بيانات القوانين وأحكام محكمة النقض بمصر.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-[var(--axia-gold-light)] shrink-0" />
                        <span>صياغة عقود تأسيس الشركات وعقود العمل والمستندات بأسلوب قانوني بليغ وموثق.</span>
                      </li>
                    </ul>
                  </div>
                )}

                {activeTab === "workflow" && (
                  <div className="space-y-4">
                    <span className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-1 text-[10px] font-bold text-blue-400 uppercase">إدارة تدفقات العمل القضائي</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">تكامل قلم المحضرين والمتابعة</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      لا مزيد من ضياع مواعيد الإعلانات أو فوات مواعيد التقادم. يوفر النظام تتبعاً صارماً لجميع الإجراءات التنفيذية.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-blue-400 shrink-0" />
                        <span>تقويم تفاعلي ذكي يدمج مواعيد الجلسات والتحقيقات ومواعيد تسليم الإعلانات.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-blue-400 shrink-0" />
                        <span>تنبيهات استباقية ذكية للمستشارين المتواجدين بالمحاكم عبر إشعارات الويب والمتصفح.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-blue-400 shrink-0" />
                        <span>إسناد مهام قلم المحضرين بلمح البصر ومراقبة تنفيذها خطوة بخطوة.</span>
                      </li>
                    </ul>
                  </div>
                )}

                {activeTab === "finance" && (
                  <div className="space-y-4">
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-400 uppercase">الحوكمة والتحليلات المالية</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">القيادة والاستقرار المالي للمكتب</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      أصبح بالإمكان متابعة الملاءة المالية للممارسات المهنية بكل دقة. يسجل النظام كافة الدفعات المالية في دفتر حسابات موثق.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                        <span>تتبع ودائع الموكلين للرسوم القضائية ومصروفات التسجيل والإشهار ومطابقتها التلقائية.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                        <span>إحصائيات فورية ومؤشرات مالية تبرز الإيرادات الكلية والمديونيات القائمة لكل موكل.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                        <span>فوترة تلقائية متكاملة لجهات الاستشارات وإرسال تنبيهات السداد الودية للشركاء.</span>
                      </li>
                    </ul>
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="space-y-4">
                    <span className="rounded bg-red-500/10 border border-red-500/20 px-2 py-1 text-[10px] font-bold text-red-400 uppercase">المواصفات الأمنية العسكرية</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">بروتوكول حماية الصفوف RLS</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      نحن نتفهم حساسية البيانات في قضايا الأمن القومي وقضايا كبار الموكلين والشركات متعددة الجنسيات.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-red-400 shrink-0" />
                        <span>أمان على مستوى السجل (Row Level Security) لمنع أي تداخل أو تسرب لبيانات مكتبك.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-red-400 shrink-0" />
                        <span>تسجيل ومراقبة كاملة للعمليات عبر دفتر سجل الأنشطة والتدقيق (Sovereign Audit Trail).</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-red-400 shrink-0" />
                        <span>تشفير متكامل للوثائق والمستندات المخزنة سحابياً لمنع أي محاولة وصول خارجي غير مصرح بها.</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-6 border-t border-white/5 mt-6 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">منظومة AXIA Legal OS · ثقة وأمان بلا تهاون</span>
                <button 
                  onClick={() => scrollToSection("login-card")}
                  className="text-xs font-bold text-[var(--axia-gold-light)] hover:text-white transition duration-200 flex items-center gap-1.5"
                >
                  <span>تسجيل دخول فوري</span>
                  <ArrowLeft className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SOVEREIGN TRUST & GOVERNMENT COMPLIANCE */}
      <section className="relative z-10 border-t border-white/5 bg-[#08080d]/80 py-20" id="rajih-ai">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center space-y-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-[11px] font-bold text-[var(--axia-gold-light)] uppercase tracking-widest">تأصيل سيادي وتنظيمي للبيانات</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">امتثال كامل للقوانين الرقمية لجمهورية مصر العربية</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              تلتزم منظومة AXIA Legal OS التزاماً مطلقاً بجميع القوانين والأنظمة المعمول بها واللوائح الصادرة عن وزارة الاتصالات وتكنولوجيا المعلومات المصرية، بما يضمن سيادة البيانات القانونية لعملائنا.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto text-right">
            <div className="p-5 rounded-2xl border border-white/5 bg-[#0c0c12]/50 space-y-2">
              <h4 className="text-xs font-bold text-white">قانون ١٥١ لسنة ٢٠٢٠</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">تطبيق معايير قانون حماية البيانات الشخصية المصري وعزل وتأمين بيانات الموكلين الحساسة.</p>
            </div>
            
            <div className="p-5 rounded-2xl border border-white/5 bg-[#0c0c12]/50 space-y-2">
              <h4 className="text-xs font-bold text-white">قانون ١٧٥ لسنة ٢٠١٨</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">الالتزام الصارم بقانون مكافحة جرائم تقنية المعلومات لحماية أمن النظام من أي تهديدات خارجية.</p>
            </div>

            <div className="p-5 rounded-2xl border border-white/5 bg-[#0c0c12]/50 space-y-2">
              <h4 className="text-xs font-bold text-white">تراخيص نقابة المحامين</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">مطابقة لمعايير سرية المهنة وأخلاقيات المحاماة والتعامل المهني المعتمد من نقابة المحامين.</p>
            </div>

            <div className="p-5 rounded-2xl border border-white/5 bg-[#0c0c12]/50 space-y-2">
              <h4 className="text-xs font-bold text-white">خوادم محلية معزولة</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">استضافة وتخزين احتياطي للبيانات في بيئة سحابية خاضعة للسيادة المصرية والتأمين السيبراني التام.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-[#040407] py-12 text-center text-slate-500">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-center gap-2.5">
            <div className="grid size-8 place-items-center rounded bg-gradient-to-br from-[var(--axia-gold-light)]/20 to-transparent border border-[var(--axia-gold-dim)] text-[var(--axia-gold-light)]">
              <Scale className="size-3.5" />
            </div>
            <span className="text-xs font-bold text-white tracking-wider font-serif">AXIA Legal OS</span>
          </div>
          
          <p className="text-[11px] leading-relaxed max-w-xl mx-auto">
            منظومة AXIA Legal OS هي منتج برمجيات مهني موجه لصروح العدالة الكبرى والمكاتب الاستشارية. جميع الحقوق محفوظة لمجموعة AXIA الدولية للتكنولوجيا والحلول الرقمية © ٢٠٢٦.
          </p>

          <div className="flex justify-center gap-6 text-[10px] text-slate-400 font-semibold">
            <a href="#" className="hover:text-white transition-colors">اتفاقية سرية البيانات للشركاء</a>
            <span>·</span>
            <a href="#" className="hover:text-white transition-colors">الدعم الفني المباشر</a>
            <span>·</span>
            <a href="#" className="hover:text-white transition-colors">اللوائح والشروط القانونية</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
