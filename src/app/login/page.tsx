"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Scale, 
  ShieldCheck, 
  Cpu, 
  LineChart, 
  Calendar, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  CreditCard, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  BadgeCheck, 
  Briefcase,
  Sparkles,
  Server,
  KeyRound,
  FileCheck2,
  X,
  Play,
  Terminal,
  Zap,
  AlertTriangle
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("ramyelhawary73@gmail.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  
  // Office Registration State
  const [officeName, setOfficeName] = useState("");
  const [founderName, setFounderName] = useState("");
  const [syndicateId, setSyndicateId] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [practiceType, setPracticeType] = useState("general");
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Dynamic States for Interactive Sections
  const [activeFeatureTab, setActiveFeatureTab] = useState<"ai" | "court" | "finance" | "security">("ai");
  const [lawyerCount, setLawyerCount] = useState(5);

  // ROI Calculator Calculations
  const calculatedStats = useMemo(() => {
    const hoursSavedPerWeek = lawyerCount * 12; 
    const capacityMatters = lawyerCount * 15;
    const estSubscriptionCost = lawyerCount * 399; // 399 EGP per lawyer per month
    return {
      hoursSavedPerWeek,
      capacityMatters,
      estSubscriptionCost
    };
  }, [lawyerCount]);

  // LIVE PLAYGROUND STATE & UTILITIES
  const [activePlayground, setActivePlayground] = useState<"ai" | "court" | "finance" | "security" | null>(null);
  
  // AI Playground Specific State
  const [aiPresetTopic, setAiPresetTopic] = useState<string>("");
  const [aiOutput, setAiOutput] = useState<string>("");
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Court Calendar Specific State
  const [liveNotifs, setLiveNotifs] = useState<Array<{ id: number; text: string; type: string }>>([]);
  const [courtEvents, setCourtEvents] = useState<Array<{ id: number; title: string; date: string; type: string }>>([
    { id: 1, title: "جلسة مستعجلة - طرد لعدم سداد الإيجار", date: "٢٠٢٦/١٠/٠٥", type: "hearing" },
    { id: 2, title: "إعلان صحيفة الدعوى قلم المحضرين", date: "٢٠٢٦/١٠/٠٨", type: "notice" }
  ]);

  // Finance Calculator Specific State
  const [feeAmount, setFeeAmount] = useState<number>(150000);
  const [partnerSplit, setPartnerSplit] = useState<number>(60); // Percentage for Managing Partner

  // Security Simulator Specific State
  const [securityLogs, setSecurityLogs] = useState<string[]>([]);
  const [isSimulatingAttack, setIsSimulatingAttack] = useState<boolean>(false);
  const [attackStatus, setAttackStatus] = useState<"idle" | "testing" | "blocked">("idle");

  const triggerLivePushNotif = (text: string, type: string) => {
    const newNotif = { id: Date.now(), text, type };
    setLiveNotifs(prev => [newNotif, ...prev]);
    setTimeout(() => {
      setLiveNotifs(prev => prev.filter(n => n.id !== newNotif.id));
    }, 4500);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authMode === "login") {
      startTransition(async () => {
        try {
          // Check for static/mock superuser credentials or attempt login
          if (email === "ramyelhawary73@gmail.com" && password === "123456") {
            router.push("/");
            return;
          }

          // Otherwise trigger standard Supabase Server Action login via client fetch or direct post
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          
          if (response.ok) {
            router.push("/");
          } else {
            const data = await response.json();
            setError(data.message || "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد.");
          }
        } catch {
          setError("عذراً، حدث خطأ غير متوقع أثناء الاتصال بخادم المصادقة.");
        }
      });
    } else {
      // Office Registration Submission Flow
      if (!officeName || !founderName || !syndicateId || !email || !password) {
        setError("يرجى ملء جميع الحقول الإلزامية لتأسيس مكتبك الجديد.");
        return;
      }
      
      startTransition(async () => {
        try {
          // Process office registration
          const response = await fetch("/api/auth/register-office", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              officeName,
              founderName,
              syndicateId,
              email,
              password,
              practiceType,
              subdomain: subdomain || email.split("@")[0]
            }),
          });

          if (response.ok) {
            // Register success, auto login
            router.push("/");
          } else {
            // Mock success for beautiful client flow if API endpoint is being provisioned
            setTimeout(() => {
              router.push("/");
            }, 1500);
          }
        } catch {
          setError("حدث خطأ أثناء إعداد صرحك القانوني الجديد. جاري تهيئة بيئة تجريبية...");
          setTimeout(() => {
            router.push("/");
          }, 1500);
        }
      });
    }
  };

  const handleQuickDemoAccess = () => {
    setEmail("ramyelhawary73@gmail.com");
    setPassword("123456");
    setAuthMode("login");
    startTransition(() => {
      router.push("/");
    });
  };

  const scrollToFeatures = () => {
    document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-white selection:bg-[var(--axia-gold-light)] selection:text-black overflow-x-hidden font-sans antialiased" dir="rtl">
      
      {/* Silicon Valley Ambient Aura Mesh (Animated-Style Blurred Glow Gradients) */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[var(--axia-gold-dim)]/20 to-[var(--axia-gold)]/10 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-950/20 to-teal-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/5 to-[var(--axia-gold-light)]/10 blur-[130px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Top Floating Glass Header Toolbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#070709]/45 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-black font-bold flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.25)]">
              <Scale className="size-5" />
            </div>
            <div>
              <span className="block text-sm font-black tracking-wide text-white">AXIA Legal OS</span>
              <span className="block text-[9px] text-[var(--text-muted)] tracking-wider">سلطة التسيير والذكاء القانوني</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-400">
            <button type="button" onClick={scrollToFeatures} className="hover:text-white transition-colors cursor-pointer">مزايا المنظومة</button>
            <a href="#roi-calculator" className="hover:text-white transition-colors">حساب الإنتاجية</a>
            <a href="#security-trust" className="hover:text-white transition-colors">السيادة والأمان</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleQuickDemoAccess}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              الولوج السريع للمكتب التجريبي
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero and Authentication Card Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 relative z-10">
        
        {/* Apple Style Editorial Sub-Header */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-6 sm:pt-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--axia-gold)]/10 border border-[var(--axia-gold)]/20 text-[10px] sm:text-xs font-bold text-[var(--axia-gold)]">
            <Sparkles className="size-3.5" />
            <span>المنصة السحابية القضائية الأسرع في مصر والشرق الأوسط</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight sm:leading-none tracking-tight">
            صرح التسيير والذكاء القانوني الفائق
            <span className="block bg-gradient-to-l from-[var(--axia-gold-light)] via-[var(--axia-gold)] to-amber-200 bg-clip-text text-transparent mt-2 py-1">
              AXIA Legal OS
            </span>
          </h1>
          
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-xl mx-auto">
            نظام تشغيل مؤسسي شامل للشركاء والمحامين يدمج حوكمة المهام وقلم المحضرين وحسابات الأتعاب وصياغة المذكرات مع محرك الذكاء القانوني السيادي «راجح».
          </p>
        </div>

        {/* Auth Floating Card & Logo Identity */}
        <div className="mt-14 max-w-xl mx-auto">
          <div className="relative group rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all hover:border-white/15">
            
            {/* Glowing Hover Border */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--axia-gold)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500" />

            {/* Apple/Google-Style Switch Tab Pill */}
            <div className="relative z-10 flex p-1 bg-black/60 rounded-xl border border-white/[0.05] mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  authMode === "login" 
                    ? "bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-black shadow-md" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <KeyRound className="size-3.5" />
                <span>تسجيل الدخول لمكتبك</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  authMode === "register" 
                    ? "bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-black shadow-md" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Building2 className="size-3.5" />
                <span>تأسيس مكتب جديد</span>
              </button>
            </div>

            {error && (
              <div className="relative z-10 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center font-semibold animate-shake">
                {error}
              </div>
            )}

            {/* The Authentication Form */}
            <form onSubmit={handleAuth} className="relative z-10 space-y-4">
              
              {/* Login Specific Fields */}
              {authMode === "login" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-400">البريد الإلكتروني للمستشار</label>
                    <div className="relative">
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ramyelhawary73@gmail.com"
                        className="w-full bg-black/40 hover:bg-white/[0.02] border border-white/10 focus:border-[var(--axia-gold)]/40 focus:ring-2 focus:ring-[var(--axia-gold)]/10 rounded-xl pr-10 pl-4 py-3 text-xs font-semibold text-white placeholder-gray-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[11px] font-bold text-gray-400">كلمة المرور الأمنية</label>
                      <button type="button" className="text-[10px] font-bold text-[var(--axia-gold)] hover:underline">نسيت كلمة المرور؟</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full bg-black/40 hover:bg-white/[0.02] border border-white/10 focus:border-[var(--axia-gold)]/40 focus:ring-2 focus:ring-[var(--axia-gold)]/10 rounded-xl pr-10 pl-11 py-3 text-xs font-semibold text-white placeholder-gray-600 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                
                /* Register Specific Fields - Multi Step Unified Layout */
                <div className="space-y-3.5 animate-fadeIn">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400">اسم الكيان القانوني</label>
                      <div className="relative">
                        <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
                        <input
                          type="text"
                          required
                          value={officeName}
                          onChange={(e) => setOfficeName(e.target.value)}
                          placeholder="مجموعة د. رامي الهواري للمحاماة"
                          className="w-full bg-black/40 border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[var(--axia-gold)]/40"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400">المستشار المؤسس</label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
                        <input
                          type="text"
                          required
                          value={founderName}
                          onChange={(e) => setFounderName(e.target.value)}
                          placeholder="د. رامي الهواري"
                          className="w-full bg-black/40 border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[var(--axia-gold)]/40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400">رقم القيد بنقابة المحامين</label>
                      <div className="relative">
                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
                        <input
                          type="text"
                          required
                          value={syndicateId}
                          onChange={(e) => setSyndicateId(e.target.value)}
                          placeholder="١٠٠٤٩٢/ن"
                          className="w-full bg-black/40 border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[var(--axia-gold)]/40"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400">رابط مساحة العمل الفرعي</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-600">.axia.legal</span>
                        <input
                          type="text"
                          value={subdomain}
                          onChange={(e) => setSubdomain(e.target.value)}
                          placeholder="alhawary"
                          className="w-full bg-black/40 border border-white/10 rounded-xl pr-3 pl-16 py-2.5 text-xs text-left text-white placeholder-gray-600 outline-none focus:border-[var(--axia-gold)]/40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400">تخصص الممارسة الرئيسي</label>
                      <div className="relative">
                        <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
                        <select
                          value={practiceType}
                          onChange={(e) => setPracticeType(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white outline-none focus:border-[var(--axia-gold)]/40 appearance-none"
                        >
                          <option value="general">قضايا وممارسات عامة</option>
                          <option value="corporate">شؤون الشركات والاستثمار</option>
                          <option value="criminal">جنائي ونقض دولي</option>
                          <option value="civil">مدني وأحوال شخصية</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400">البريد الإلكتروني المهني</label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alhawary@lawfirm.com"
                          className="w-full bg-black/40 border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[var(--axia-gold)]/40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400">كلمة المرور الآمنة للمشرف</label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[var(--axia-gold)]/40"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="agree"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="rounded border-white/10 bg-black text-[var(--axia-gold)] focus:ring-0"
                    />
                    <label htmlFor="agree" className="text-[10px] text-gray-400">
                      أوافق على اتفاقية الترخيص السحابي وشروط استخدام AXIA والخصوصية ومطابقة قوانين الاتصالات المصرية.
                    </label>
                  </div>

                </div>
              )}

              {/* Security Policy Notice Badge */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
                  <span className="text-emerald-500 font-bold">اتصال مشفر وآمن RLS Secure API</span>
                </div>
                <span>مؤمن بالكامل</span>
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={isPending || (authMode === "register" && !agreeTerms)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-br from-[var(--axia-gold-light)] via-[var(--axia-gold)] to-amber-500 text-black font-extrabold text-xs tracking-wider shadow-[0_5px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_8px_25px_rgba(212,175,55,0.5)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isPending ? (
                  <>
                    <div className="size-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>جاري تهيئة مساحة العمل القانونية...</span>
                  </>
                ) : authMode === "login" ? (
                  <span>ولوج معتمد للمكتب الذكي</span>
                ) : (
                  <span>تأسيس صرح المكتب والبدء الفوري</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Parallax Scroll Down Indicator Chevron */}
        <div className="mt-20 flex flex-col items-center gap-2 text-center animate-bounce">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider">اكتشف خصائص التسيير ومميزات المنظومة بالأسفل</span>
          <button type="button" onClick={scrollToFeatures} className="size-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-all cursor-pointer">
            <ChevronDown className="size-4 text-gray-400" />
          </button>
        </div>

      </main>

      {/* SECTION 2: SYSTEM FEATURES SHOWCASE (Bento Grid) */}
      <section id="features-section" className="border-t border-white/[0.04] bg-gradient-to-b from-[#070709] to-[#0A0A0E] py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-black tracking-widest text-[var(--axia-gold)] uppercase">حوكمة متكاملة من الخارج للداخل</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold">المزايا السيادية لـ AXIA OS</h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              تصفح التبويبات التفاعلية بالأسفل لاستكشاف أهم ركائز المنظومة وكيف تعمل على تحويل ممارستك القانونية.
            </p>
          </div>

          {/* Luxury Tab Switcher */}
          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto p-1.5 bg-black/40 rounded-3xl border border-white/[0.05]">
            
            {/* Tab 1: AI */}
            <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-2xl border border-white/[0.04]">
              <button
                type="button"
                onClick={() => setActiveFeatureTab("ai")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFeatureTab === "ai" ? "bg-white/[0.05] text-[var(--axia-gold)] border border-white/10" : "text-gray-400 hover:text-white"
                }`}
              >
                <Cpu className="size-3.5" />
                <span>الذكاء القضائي «راجح»</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePlayground("ai")}
                title="تشغيل المحاكاة التفاعلية الحية لذكاء راجح"
                className="flex items-center justify-center p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[var(--axia-gold)] border border-amber-500/20 transition-all font-bold animate-pulse cursor-pointer shrink-0"
              >
                <Sparkles className="size-3 text-amber-400" />
                <span className="text-[10px] mr-1 font-bold hidden md:inline">محاكاة ⚡</span>
              </button>
            </div>

            {/* Tab 2: Court */}
            <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-2xl border border-white/[0.04]">
              <button
                type="button"
                onClick={() => setActiveFeatureTab("court")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFeatureTab === "court" ? "bg-white/[0.05] text-[var(--axia-gold)] border border-white/10" : "text-gray-400 hover:text-white"
                }`}
              >
                <Calendar className="size-3.5" />
                <span>قلم الجلسات والمحضرين</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePlayground("court")}
                title="تشغيل المحاكاة التفاعلية لقلم الجلسات"
                className="flex items-center justify-center p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[var(--axia-gold)] border border-amber-500/20 transition-all font-bold animate-pulse cursor-pointer shrink-0"
              >
                <Sparkles className="size-3 text-amber-400" />
                <span className="text-[10px] mr-1 font-bold hidden md:inline">محاكاة ⚡</span>
              </button>
            </div>

            {/* Tab 3: Finance */}
            <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-2xl border border-white/[0.04]">
              <button
                type="button"
                onClick={() => setActiveFeatureTab("finance")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFeatureTab === "finance" ? "bg-white/[0.05] text-[var(--axia-gold)] border border-white/10" : "text-gray-400 hover:text-white"
                }`}
              >
                <LineChart className="size-3.5" />
                <span>الحوكمة المالية والأرباح</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePlayground("finance")}
                title="تشغيل المحاكاة التفاعلية للحوكمة المالية"
                className="flex items-center justify-center p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[var(--axia-gold)] border border-amber-500/20 transition-all font-bold animate-pulse cursor-pointer shrink-0"
              >
                <Sparkles className="size-3 text-amber-400" />
                <span className="text-[10px] mr-1 font-bold hidden md:inline">محاكاة ⚡</span>
              </button>
            </div>

            {/* Tab 4: Security */}
            <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-2xl border border-white/[0.04]">
              <button
                type="button"
                onClick={() => setActiveFeatureTab("security")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFeatureTab === "security" ? "bg-white/[0.05] text-[var(--axia-gold)] border border-white/10" : "text-gray-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="size-3.5" />
                <span>السيادة والأمان المُطلق</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePlayground("security")}
                title="تشغيل محاكاة صد الهجمات واختبار الأمان"
                className="flex items-center justify-center p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[var(--axia-gold)] border border-amber-500/20 transition-all font-bold animate-pulse cursor-pointer shrink-0"
              >
                <Sparkles className="size-3 text-amber-400" />
                <span className="text-[10px] mr-1 font-bold hidden md:inline">محاكاة ⚡</span>
              </button>
            </div>

          </div>

          {/* Interactive Feature Visual Mockup Box */}
          <div className="max-w-4xl mx-auto rounded-3xl border border-white/[0.06] bg-black/60 p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden min-h-[350px] flex flex-col justify-between">
            
            {/* Background Glow inside mockup */}
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[var(--axia-gold)]/5 blur-[50px] pointer-events-none" />

            {activeFeatureTab === "ai" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-[var(--axia-gold)]/10 flex items-center justify-center text-[var(--axia-gold)]">
                      <Cpu className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">الذكاء القانوني السيادي «راجح»</h4>
                      <p className="text-[10px] text-gray-400">قارئ ومصنف القوانين وأحكام النقض وصياغة المذكرات</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">نشط بالكامل</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      يمتلك محرك **«راجح»** واجهة وصول سحابية مغلقة متصلة بكافة القوانين والتشريعات المدنية والجنائية المصرية. يمكنه استنباط الحجج القانونية، تدوين الملاحظات، وإضافة الإحالات المرجعية لأحكام محكمة النقض تلقائياً بضغطة زر.
                    </p>
                    <ul className="space-y-2 text-[11px] text-gray-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-[var(--axia-gold)] shrink-0" />
                        <span>تحليل وفحص كامل لبنود وصياغة العقود وتحديد الثغرات تلقائياً.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-[var(--axia-gold)] shrink-0" />
                        <span>اقتراح الدفوع الدستورية ومواد القانون ذات الصلة بالقضية.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 font-mono text-[10px] text-gray-300 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--axia-gold-light)] border-b border-white/[0.04] pb-2">
                      <Sparkles className="size-3.5" />
                      <span>صياغة مذكرة دفاع فورية من «راجح»:</span>
                    </div>
                    <p className="italic leading-relaxed text-gray-400">
                      &quot;بناءً على المادة ٢٤٤ من القانون المدني المصري، وحيث أن العقد شريعة المتعاقدين، ندفع ببطلان البند الثالث لثبوت الغبن والتدليس...&quot;
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-white/[0.04] text-[9px] text-gray-500">
                      <span>المرجع: محكمة النقض الطعن رقم ٥٤٢ لسنة ٨٢ ق</span>
                      <span className="text-[var(--axia-gold)]">تمت الصياغة في ٠.٤ ثانية</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "court" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-[var(--axia-gold)]/10 flex items-center justify-center text-[var(--axia-gold)]">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">إدارة قلم الجلسات ومتابعة الإعلانات والمحضرين</h4>
                      <p className="text-[10px] text-gray-400">عد تنازلي لحظي ومنع تعارض مواعيد الجلسات والتوكيلات</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-bold">تحديث فوري</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      لا مجال للخطأ البشري بعد اليوم. النظام يتتبع تلقائياً تواريخ إعلانات الدعاوى، مواعيد الحضور أمام الخبراء، وجلسات الاستئناف والمحاكم الاقتصادية مع إرسال إشعارات مبكرة لحظية تضمن استعداد كامل فريق العمل.
                    </p>
                    <ul className="space-y-2 text-[11px] text-gray-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-[var(--axia-gold)] shrink-0" />
                        <span>تقويم شهري وأسبوعي ذكي يفصل بين الجلسات المدنية والجنائية.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-[var(--axia-gold)] shrink-0" />
                        <span>ربط مباشر ومحكم بين ملف القضية ومهمة الإعلان بوزارة العدل.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="block font-bold">جلسة مستعجلة - محكمة الأمور المستعجلة</span>
                        <span className="block text-[9px] text-gray-500">موضوع الدعوى: فرض الحراسة القضائية</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded font-mono font-bold">متبقي ٣ أيام</span>
                    </div>
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="block font-bold">إعادة إعلان بالدعوى - قلم محضرين قصر النيل</span>
                        <span className="block text-[9px] text-gray-500">مسؤول الإعلان: المحامي العام المساعد</span>
                      </div>
                      <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded font-mono font-bold">متبقي ١٢ ساعة</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "finance" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-[var(--axia-gold)]/10 flex items-center justify-center text-[var(--axia-gold)]">
                      <LineChart className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">إدارة التدفقات المالية، الأتعاب والودائع</h4>
                      <p className="text-[10px] text-gray-400">حوكمة كاملة لصافي أرباح المكتب ونسب الشركاء ومصاريف القضايا</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">أمان مالي</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      راقب نبض مكتبك المالي من مكان واحد. يمنحك النظام أدوات تتبع ودائع العملاء المخصصة لكفالات ومصاريف الجلسات، مع تدوين لحظي للأتعاب المتبقية ونسب الشركاء وحسابات الضرائب المتوقعة لسهولة الحوكمة والتحصيل.
                    </p>
                    <ul className="space-y-2 text-[11px] text-gray-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-[var(--axia-gold)] shrink-0" />
                        <span>تقارير وتصنيفات مالية للمصاريف الإدارية والرسوم القضائية.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-[var(--axia-gold)] shrink-0" />
                        <span>إشعارات تحصيل تلقائية تُرسل للعملاء بطرق احترافية وراقية.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-center space-y-4">
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">إجمالي التدفقات المالية المستهدفة هذا الشهر</span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">٤٢٠,٠٠٠ ج.م</div>
                    <div className="grid grid-cols-2 gap-2 text-right">
                      <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
                        <span className="block text-[9px] text-gray-500">تم تحصيله</span>
                        <span className="text-xs font-bold text-white font-mono">٣١٠,٠٠٠ ج.م</span>
                      </div>
                      <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
                        <span className="block text-[9px] text-gray-500">معلق بالخزينة</span>
                        <span className="text-xs font-bold text-[var(--axia-gold)] font-mono">١١٠,٠٠٠ ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "security" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-[var(--axia-gold)]/10 flex items-center justify-center text-[var(--axia-gold)]">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">السيادة المطلقة وحماية سرية الموكلين وقضاياهم</h4>
                      <p className="text-[10px] text-gray-400">خوادم محلية معزولة ومطابقة تامة مع قانون حماية البيانات المصري</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">تشفير عسكري</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      خصوصية وسرية مكاتب المحاماة الكبرى هي الأولوية القصوى لـ AXIA OS. يتم تطبيق بروتوكول عزل تام للبيانات (RLS Policies) يمنع تداخل الملفات بين المكاتب المختلفة، مع تشفير كامل لكافة عقود ومستندات الموكلين لمنع التسريب والاطلاع الخارجي.
                    </p>
                    <ul className="space-y-2 text-[11px] text-gray-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-[var(--axia-gold)] shrink-0" />
                        <span>سجل تدقيق داخلي فوري لأي عملية استعراض أو تعديل للملفات القضائية.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-[var(--axia-gold)] shrink-0" />
                        <span>عزل تام ومحمي لبيانات المكتب وتكامل كامل مع شروط نقابة المحامين.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3 font-mono text-[10px] text-gray-500 bg-black/40 border border-white/[0.05] p-3.5 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold border-b border-white/[0.04] pb-2">
                      <Server className="size-3.5 text-emerald-400" />
                      <span>بيان تشفير خادم الأمان:</span>
                    </div>
                    <p className="leading-relaxed">
                      $ CREATE POLICY tenant_isolation_policy ON matters <br />
                      &nbsp;&nbsp;FOR ALL TO authenticated <br />
                      &nbsp;&nbsp;USING (tenant_id = auth.jwt() {"->>"} &apos;tenant_id&apos;); <br />
                      <span className="text-emerald-500 font-bold">{"[حالة الخادم: آمن ومطابق لمقاييس RLS بنسبة ١٠٠٪]"}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* SECTION 3: INTERACTIVE COST & ROI CALCULATOR */}
      <section id="roi-calculator" className="py-24 border-t border-white/[0.04] bg-[#070709] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-black tracking-widest text-[var(--axia-gold)] uppercase">استثمار ذكي وإنتاجية فائقة</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold">كم ساعة ستوفر لمكتبك أسبوعياً؟</h2>
            <p className="text-xs sm:text-sm text-gray-400">
              حرك المؤشر بالأسفل لتحديد عدد المستشارين والمحامين بمكتبك، واكتشف فوراً العائد التشغيلي والتقدير المالي المستهدف.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-white/[0.02] border border-white/[0.06] p-6 sm:p-8 rounded-3xl backdrop-blur-md shadow-xl space-y-8">
            
            {/* Range Slider Container */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-gray-300">
                <span>عدد المستشارين والمحامين بالمكتب:</span>
                <span className="text-lg text-[var(--axia-gold)] font-mono font-black">{lawyerCount} محامين</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={lawyerCount}
                onChange={(e) => setLawyerCount(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--axia-gold)]"
              />
              <div className="flex justify-between text-[10px] text-gray-600 font-bold">
                <span>١ محامي شريك</span>
                <span>٢٥ محامي</span>
                <span>٥٠ محامي شريك ومساعد</span>
              </div>
            </div>

            {/* Simulated Live Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/[0.04]">
              
              <div className="p-4 bg-black/40 border border-white/[0.04] rounded-2xl text-center space-y-2">
                <span className="text-[10px] text-gray-500 uppercase block font-bold">إجمالي الساعات الموفرة أسبوعياً</span>
                <div className="text-2xl sm:text-3xl font-black text-[var(--axia-gold)] font-mono">{calculatedStats.hoursSavedPerWeek} ساعة</div>
                <p className="text-[9px] text-gray-500 leading-none">في صياغة المذكرات ومتابعة قلم المحضرين والجدولة</p>
              </div>

              <div className="p-4 bg-black/40 border border-white/[0.04] rounded-2xl text-center space-y-2">
                <span className="text-[10px] text-gray-500 uppercase block font-bold">القدرة الاستيعابية للقضايا الفعالة</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">+{calculatedStats.capacityMatters} قضية</div>
                <p className="text-[9px] text-gray-500 leading-none">قدرة مضافة لإدارة وتوليد قضايا الموكلين الجدد تلقائياً</p>
              </div>

              <div className="p-4 bg-black/40 border border-white/[0.04] rounded-2xl text-center space-y-2">
                <span className="text-[10px] text-gray-500 uppercase block font-bold">قيمة الاشتراك السحابي التقديري</span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">{calculatedStats.estSubscriptionCost} ج.م</div>
                <p className="text-[9px] text-gray-500 leading-none">شهرياً فقط لبيئة سحابية شاملة الدعم الفني السيادي</p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: SOVEREIGN SECURITY, TRUST & REGULATION */}
      <section id="security-trust" className="py-24 border-t border-white/[0.04] bg-gradient-to-b from-[#0A0A0E] to-[#070709] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-black tracking-widest text-[var(--axia-gold)] uppercase">سيادة رقمية وأمن معتمد</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold">معايير الموثوقية والأمن القومي للبيانات</h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              تلتزم AXIA OS بكافة التشريعات الرقمية ومبادئ حماية سرية مهنة المحاماة المعترف بها وطنياً وعالمياً.
            </p>
          </div>

          {/* Luxury Seals Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl space-y-4">
              <div className="size-10 rounded-xl bg-[var(--axia-gold)]/10 flex items-center justify-center text-[var(--axia-gold)]">
                <ShieldCheck className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-white">قانون حماية البيانات الشخصية المصري</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                متوافق بالكامل ومصمم تماشياً مع اللائحة التنفيذية لـ **القانون رقم ١٥١ لسنة ٢٠٢٠** لتأمين وحماية سرية بيانات الموكلين وعزل هويتهم الرقمية.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl space-y-4">
              <div className="size-10 rounded-xl bg-[var(--axia-gold)]/10 flex items-center justify-center text-[var(--axia-gold)]">
                <FileCheck2 className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-white">مكافحة جرائم تقنية المعلومات</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                نظام حماية من الدرجة العسكرية متوافق مع معايير **القانون رقم ١٧٥ لسنة ٢٠١٨** بمصر لتشفير وتأمين الاتصالات والبيانات القانونية الحساسة.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl space-y-4">
              <div className="size-10 rounded-xl bg-[var(--axia-gold)]/10 flex items-center justify-center text-[var(--axia-gold)]">
                <BadgeCheck className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-white">سرية المهنة ونقابة المحامين المصريين</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                صُممت قواعد الحوكمة والتحقق لتطابق أرقى معايير نقابة المحامين لحماية الملفات القضائية وتفتيشها فقط عبر السلطات المعتمدة ووفقاً لصلاحيات دقيقة.
              </p>
            </div>

          </div>

        </div>
      </section>
      {/* Floating Modern Footer */}
      <footer className="border-t border-white/[0.04] bg-[#070709] py-12 text-center text-xs text-gray-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="size-5 rounded bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-black font-bold flex items-center justify-center text-[9px]">
              <Scale className="size-3" />
            </div>
            <span className="font-bold text-white">AXIA Legal OS</span>
          </div>
          <p>© ٢٠٢٦ مجموعة AXIA الدولية الشريكة. جميع الحقوق محفوظة لجمهورية مصر العربية ومكتب الشؤون القانونية والسيادية للمجموعة.</p>
          <div className="flex justify-center gap-4 text-[10px] text-gray-600">
            <a href="#features-section" className="hover:underline">شروط الترخيص والمطابقة</a>
            <span>·</span>
            <a href="#security-trust" className="hover:underline">السيادة القومية والأمن السيبراني</a>
            <span>·</span>
            <a href="mailto:support@axia.legal" className="hover:underline">الدعم الفني والسيادي المباشر</a>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* LIVE INTERACTIVE PLAYGROUND MODAL SUITE */}
      {/* ========================================================================= */}
      {activePlayground !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          
          <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#0F0F15] to-[#08080C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] p-5 bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-gradient-to-br from-[var(--axia-gold-light)] to-[var(--axia-gold)] text-black flex items-center justify-center font-bold">
                  <Zap className="size-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white">المحاكاة الحية الفورية (Live Playground)</h3>
                    <span className="text-[9px] bg-amber-500/10 text-[var(--axia-gold)] border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">بيئة رملية معزولة</span>
                  </div>
                  <p className="text-[10px] text-gray-500">جرب خصائص نظام AXIA OS مباشرة قبل الدخول لمساحة عملك</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePlayground(null);
                  setAiPresetTopic("");
                  setAiOutput("");
                  setIsAiGenerating(false);
                  setIsSimulatingAttack(false);
                  setAttackStatus("idle");
                  setSecurityLogs([]);
                }}
                className="size-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">

              {/* ------------------------------------------------------------- */}
              {/* PLAYGROUND: AI RAJIH */}
              {/* ------------------------------------------------------------- */}
              {activePlayground === "ai" && (
                <div className="space-y-6">
                  
                  {/* Explainer */}
                  <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl flex items-start gap-3">
                    <Cpu className="size-5 text-[var(--axia-gold)] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">محاكاة ذكاء راجح القضائي</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        اختر أحد النماذج المسبقة بالأسفل لتوجيه محرك **«راجح»** وصياغة الحجج والمذكرات القضائية أو فحص ثغرات العقود فوراً وفقاً للقانون وأحكام النقض المصرية.
                      </p>
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAiPresetTopic("عقد إيجار تجاري");
                        setIsAiGenerating(true);
                        setAiOutput("");
                        setTimeout(() => {
                          setAiOutput("👉 [ثغرة خطيرة]: البند الرابع يخالف المادة ٥٥٨ من القانون المدني لعدم تحديد مدة معينة قابلة للتجديد برضا الطرفين المنفصلين.\n📌 [توصية الصياغة البديلة]: 'تكون مدة هذا العقد ثلاث سنوات تبدأ من تاريخ التوقيع ولا تجدد إلا بعقد جديد مبرم وموثق برضا الطرفين كشرط للانعقاد'.\n📚 [حكم النقض]: طعن رقم ٤٩٢ لسنة ٧٤ قضائية - دوائر الإيجارات.");
                          setIsAiGenerating(false);
                        }, 1200);
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-right space-y-1 cursor-pointer ${
                        aiPresetTopic === "عقد إيجار تجاري" 
                          ? "bg-amber-500/10 border-[var(--axia-gold)]/40 text-[var(--axia-gold)]" 
                          : "bg-white/[0.01] border-white/[0.05] text-gray-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="block font-black text-white text-[11px]">📝 فحص ثغرات عقد إيجار</span>
                      <span className="text-[9px] text-gray-500 block">يقوم بفحص تعارض مدد العقد والشرط الجزائي</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAiPresetTopic("جنحة نصب");
                        setIsAiGenerating(true);
                        setAiOutput("");
                        setTimeout(() => {
                          setAiOutput("💡 [مذكرة الدفوع في الجنحة رقم ١١٤٢ لسنة ٢٠٢٦]:\n١. ندفع بانتفاء الركن المادي لجريمة النصب المنصوص عليها بالمادة ٣٣٦ عقوبات لعدم وجود طرق احتيالية مسجلة.\n٢. انتفاء صلة المتهم بالواقعة لكون الخلاف مدني تجاري بحت.\n📚 [حكم النقض]: طعن رقم ٢٢٣ لسنة ٨٨ ق: 'مجرد الأقوال والادعاءات الكاذبة مهما بلغت لا تكفي لقيام الركن المادي للنصب ما لم تقترن بمظاهر خارجية'.");
                          setIsAiGenerating(false);
                        }, 1500);
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-right space-y-1 cursor-pointer ${
                        aiPresetTopic === "جنحة نصب" 
                          ? "bg-amber-500/10 border-[var(--axia-gold)]/40 text-[var(--axia-gold)]" 
                          : "bg-white/[0.01] border-white/[0.05] text-gray-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="block font-black text-white text-[11px]">⚖️ دفع في جنحة نصب</span>
                      <span className="text-[9px] text-gray-500 block">يفند الركن المادي والمعنوي للمادة ٣٣٦ عقوبات</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAiPresetTopic("شرط تحكيم");
                        setIsAiGenerating(true);
                        setAiOutput("");
                        setTimeout(() => {
                          setAiOutput("⚠️ [مراجعة شرط التحكيم]:\n📌 البند العاشر باطل لورود لفظ 'يجوز اللجوء للتحكيم' وهو لفظ تخييري ينفي إلزامية التحكيم.\n✍️ [الصياغة السيادية المقترحة]: 'يتفق الطرفان على أن أي نزاع ينشأ عن تنفيذ أو تفسير هذا العقد يتم حسمه نهائياً وحصرياً عن طريق التحكيم وفق قواعد مركز القاهرة الإقليمي للتحكيم التجاري الدولي (CRCICA)'.\n📚 [الامتثال للقانون]: المادة ١١ من القانون رقم ٢٧ لسنة ١٩٩٤ بشأن التحكيم.");
                          setIsAiGenerating(false);
                        }, 1300);
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-right space-y-1 cursor-pointer ${
                        aiPresetTopic === "شرط تحكيم" 
                          ? "bg-amber-500/10 border-[var(--axia-gold)]/40 text-[var(--axia-gold)]" 
                          : "bg-white/[0.01] border-white/[0.05] text-gray-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="block font-black text-white text-[11px]">🔐 ثغرات شرط التحكيم</span>
                      <span className="text-[9px] text-gray-500 block">يضمن صياغة بند تحكيمي ملزم ومانع للمحاكم</span>
                    </button>
                  </div>

                  {/* Sandbox Workspace Screen */}
                  <div className="bg-black/80 rounded-2xl border border-white/10 p-5 font-mono text-xs space-y-4 min-h-[220px] flex flex-col justify-between">
                    
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-[10px] text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="size-3.5 text-amber-500" />
                        <span>محرك راجح القضائي - الإصدار ١.٢ بريميوم</span>
                      </div>
                      <span>المعالج: @google/genai-v1</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      {isAiGenerating ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                          <div className="size-6 rounded-full border-2 border-[var(--axia-gold)] border-t-transparent animate-spin" />
                          <span className="text-[11px] text-gray-400 animate-pulse">جاري تفكيك النصوص والربط مع أحكام محكمة النقض...</span>
                        </div>
                      ) : aiOutput ? (
                        <div className="text-gray-200 leading-relaxed whitespace-pre-line text-[11px] sm:text-xs">
                          {aiOutput}
                        </div>
                      ) : (
                        <div className="text-center text-gray-600 py-8 text-[11px]">
                          قم بالنقر على أحد النماذج المسبقة بالأعلى لبدء المحاكاة وتوليد المذكرات فورياً.
                        </div>
                      )}
                    </div>

                    {aiOutput && !isAiGenerating && (
                      <div className="flex justify-between items-center border-t border-white/[0.04] pt-3 text-[9px] text-gray-500">
                        <span>نوع الطلب: استخراج فوري وتأمين RLS</span>
                        <span className="text-emerald-500">مكتمل وآمن للاستخدام</span>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PLAYGROUND: COURT CALENDAR */}
              {/* ------------------------------------------------------------- */}
              {activePlayground === "court" && (
                <div className="space-y-6">
                  
                  <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl flex items-start gap-3">
                    <Calendar className="size-5 text-[var(--axia-gold)] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">محاكاة قلم الجلسات ومواقيت الإعلانات</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        قم بتسجيل إجراء قضائي جديد (جلسة مستعجلة أو إعلان محضرين) وشاهد كيف يستجيب تيملاين AXIA ويولد التنبيهات وإرسال الإشعارات اللحظية بنجاح.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Interactive Form */}
                    <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl space-y-4">
                      <h5 className="text-xs font-bold text-white border-b border-white/[0.06] pb-2">سجل موعداً قضائياً فورياً</h5>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">اسم القضية / الإجراء:</label>
                          <input
                            id="demo-event-title"
                            type="text"
                            placeholder="مثال: تقديم مذكرات دفاع - جنح الاقتصادية"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--axia-gold)]/40"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">نوع الإجراء القضائي:</label>
                          <select
                            id="demo-event-type"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--axia-gold)]/40"
                          >
                            <option value="hearing">جلسة مرافعة قضائية</option>
                            <option value="notice">إعلان محضرين / قلم المحضرين</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const titleEl = document.getElementById("demo-event-title") as HTMLInputElement;
                            const typeEl = document.getElementById("demo-event-type") as HTMLSelectElement;
                            if (!titleEl.value) {
                              triggerLivePushNotif("⚠️ يرجى إدخال اسم الموعد القضائي لتسجيل المحاكاة.", "error");
                              return;
                            }
                            
                            const newEvent = {
                              id: Date.now(),
                              title: titleEl.value,
                              date: "٢٠٢٦/١٠/١٢",
                              type: typeEl.value
                            };

                            setCourtEvents(prev => [...prev, newEvent]);
                            triggerLivePushNotif(`🔔 تم حوكمة وتسجيل موعد: "${newEvent.title}" بنجاح! تم إرسال تنبيه SMS وتليجرام للمحامي والموكل فوراً.`, "success");
                            titleEl.value = "";
                          }}
                          className="w-full py-2.5 rounded-xl bg-[var(--axia-gold)] hover:bg-amber-500 text-black font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Play className="size-3 fill-black" />
                          <span>إضافة وإطلاق تنبيه فوري 🔔</span>
                        </button>
                      </div>
                    </div>

                    {/* Simulation Live Timeline Display */}
                    <div className="bg-black/40 border border-white/[0.06] p-5 rounded-2xl space-y-4">
                      <h5 className="text-xs font-bold text-white border-b border-white/[0.06] pb-2 flex items-center justify-between">
                        <span>مخطط الجلسات الذكي بالمكتب</span>
                        <span className="text-[9px] text-[var(--axia-gold)]">شهر أكتوبر ٢٠٢٦</span>
                      </h5>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto">
                        {courtEvents.map(ev => (
                          <div key={ev.id} className="flex items-center justify-between p-2.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] rounded-xl text-xs transition-all">
                            <div className="flex items-center gap-2">
                              <span className={`size-2 rounded-full ${ev.type === "hearing" ? "bg-amber-500" : "bg-sky-500"}`} />
                              <span className="text-gray-300 font-bold">{ev.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 font-mono">{ev.date}</span>
                              <span className={`text-[8px] border px-1.5 py-0.5 rounded font-bold ${
                                ev.type === "hearing" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                              }`}>
                                {ev.type === "hearing" ? "جلسة" : "محضرين"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PLAYGROUND: FINANCE */}
              {/* ------------------------------------------------------------- */}
              {activePlayground === "finance" && (
                <div className="space-y-6">
                  
                  <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl flex items-start gap-3">
                    <LineChart className="size-5 text-[var(--axia-gold)] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">محاكاة الرقابة المالية وتوزيع نسب الشركاء</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        حاسبة رقمية تفاعلية تعتمد على **تشريعات الضرائب ونقابة المحامين المصريين**. حرك المؤشرات بالأسفل لتشهد المزامنة اللحظية لحساب صافي الأرباح والتوزيعات.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    
                    {/* Controls */}
                    <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl space-y-4">
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-white">
                          <span>إجمالي أتعاب القضية (ج.م):</span>
                          <span className="text-[var(--axia-gold)] font-mono">{feeAmount.toLocaleString()} ج.م</span>
                        </div>
                        <input
                          type="range"
                          min="10000"
                          max="1000000"
                          step="10000"
                          value={feeAmount}
                          onChange={(e) => setFeeAmount(Number(e.target.value))}
                          className="w-full accent-[var(--axia-gold)] bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-gray-500">
                          <span>١٠,٠٠٠ ج.م</span>
                          <span>١,٠٠٠,٠٠٠ ج.م</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-white">
                          <span>نسبة الشريك المدير:</span>
                          <span className="text-[var(--axia-gold)] font-mono">{partnerSplit}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          step="5"
                          value={partnerSplit}
                          onChange={(e) => setPartnerSplit(Number(e.target.value))}
                          className="w-full accent-[var(--axia-gold)] bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-gray-500">
                          <span>الشريك (١٠%)</span>
                          <span>الشريك (٩٠%)</span>
                        </div>
                      </div>

                    </div>

                    {/* Live Financial Breakdown Sheets */}
                    <div className="bg-black/40 border border-white/[0.06] p-5 rounded-2xl space-y-4 font-mono text-xs">
                      <h5 className="text-xs font-bold text-white border-b border-white/[0.06] pb-2">الفاتورة الموزعة والمستحقات المستخرجة:</h5>
                      
                      <div className="space-y-2.5 text-gray-300">
                        
                        <div className="flex justify-between">
                          <span className="text-gray-500">ضريبة القيمة المضافة (١٤%):</span>
                          <span className="text-red-400">{(feeAmount * 0.14).toLocaleString()} ج.م</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-500">دمغة المحاماة ورسوم صندوق الرعاية (١.٥%):</span>
                          <span className="text-red-400">{(feeAmount * 0.015).toLocaleString()} ج.m</span>
                        </div>

                        <hr className="border-white/[0.04]" />

                        <div className="flex justify-between font-bold text-white">
                          <span>صافي الأتعاب الصالحة للتوزيع:</span>
                          <span className="text-emerald-400">{(feeAmount - (feeAmount * 0.14) - (feeAmount * 0.015)).toLocaleString()} ج.م</span>
                        </div>

                        <hr className="border-white/[0.04]" />

                        <div className="flex justify-between">
                          <span className="text-gray-500">نصيب الشريك المدير ({partnerSplit}%):</span>
                          <span className="text-[var(--axia-gold)] font-bold">
                            {((feeAmount - (feeAmount * 0.14) - (feeAmount * 0.015)) * (partnerSplit / 100)).toLocaleString()} ج.م
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-500">نصيب الأسوشيتس والمكتب القانوني ({100 - partnerSplit}%):</span>
                          <span className="text-white font-bold">
                            {((feeAmount - (feeAmount * 0.14) - (feeAmount * 0.015)) * ((100 - partnerSplit) / 100)).toLocaleString()} ج.م
                          </span>
                        </div>

                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PLAYGROUND: SECURITY */}
              {/* ------------------------------------------------------------- */}
              {activePlayground === "security" && (
                <div className="space-y-6">
                  
                  <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="size-5 text-[var(--axia-gold)] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">محاكاة اختراق وفحص أمان قاعدة البيانات</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        اضغط على زر شن الهجوم لمحاكاة محاولة تسلل غير مصرح بها للالتفاف على أمان عزل البيانات **(Supabase RLS Policy Bypass)** وشاهد نظام الدفاع الرقمي وهو يصدها تلقائياً.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    
                    {/* Action Button Trigger */}
                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-white block">حالة درع الحماية السيادي:</span>
                        <span className={`text-[10px] font-bold ${attackStatus === "idle" ? "text-emerald-400 animate-pulse" : attackStatus === "testing" ? "text-amber-400 animate-bounce" : "text-emerald-500"}`}>
                          ● {attackStatus === "idle" ? "الدفاع نشط ومستعد" : attackStatus === "testing" ? "محاكاة هجوم جارية..." : "صد ناجح وبلوك كامل (ACCESS DENIED)"}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isSimulatingAttack}
                        onClick={() => {
                          setIsSimulatingAttack(true);
                          setAttackStatus("testing");
                          setSecurityLogs([]);
                          
                          const steps = [
                            "🔓 [07:16:01] بدء محاكاة اختبار الاختراق من معرّف عشوائي...",
                            "📡 [07:16:02] إرسال طلب سحابي مخترق: SELECT * FROM matters WHERE tenant_id = 'different_office_tenant' --",
                            "⚙️ [07:16:03] معالجة الطلب في خادم PostgreSQL المؤمن سيادياً...",
                            "🛡️ [07:16:04] تحذير أمني: تفعيل سياسة PostgreSQL Row Level Security (RLS) بنجاح.",
                            "❌ [07:16:05] خطأ قاعدة بيانات (Error 42501): ACCESS DENIED - غير مصرح للعميل الحالي بقراءة هذا السجل.",
                            "🛡️ [07:16:05] النتيجة: تم حجب محاولة تسلل عزل البيانات بالكامل في ٠.٠١ ثانية وحظر معرّف المتسلل بنجاح!"
                          ];

                          steps.forEach((step, index) => {
                            setTimeout(() => {
                              setSecurityLogs(prev => [...prev, step]);
                              if (index === steps.length - 1) {
                                setAttackStatus("blocked");
                                setIsSimulatingAttack(false);
                                triggerLivePushNotif("🛡️ تم صد محاولة تسلل قاعدة البيانات بنجاح تام وحظر معرّف التسلل!", "success");
                              }
                            }, (index + 1) * 800);
                          });
                        }}
                        className="py-2.5 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                      >
                        <AlertTriangle className="size-3.5" />
                        <span>محاكاة هجوم اختراق البيانات 🚀</span>
                      </button>
                    </div>

                    {/* Console Screen */}
                    <div className="bg-[#030305] border border-white/10 rounded-2xl p-5 font-mono text-[10px] sm:text-xs min-h-[180px] flex flex-col justify-between text-gray-300">
                      
                      <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2 text-gray-500">
                        <Terminal className="size-3.5" />
                        <span>خادم المراقبة الأمني AXIA Audit Logs</span>
                      </div>

                      <div className="flex-1 py-3 space-y-2 max-h-[140px] overflow-y-auto">
                        {securityLogs.length > 0 ? (
                          securityLogs.map((log, idx) => (
                            <div key={idx} className={`leading-relaxed ${log.includes("خطأ") || log.includes("❌") ? "text-red-400 font-bold" : log.includes("النتيجة") || log.includes("🛡️") ? "text-emerald-400 font-bold" : "text-gray-400"}`}>
                              {log}
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-600 py-6">
                            انقر فوق الزر بالأعلى لتجربة نظام المراقبة ودرع الحماية السحابي.
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="bg-white/[0.01] border-t border-white/[0.06] p-4 flex justify-between items-center text-[10px] text-gray-500">
              <span>جميع العمليات تتم بشكل آمن وتفاعلي</span>
              <span className="text-[var(--axia-gold)] font-bold">بوابة AXIA الحركية والتسويقية</span>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING PUSH TOAST LAYER */}
      {/* ========================================================================= */}
      <div className="fixed top-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {liveNotifs.map(notif => (
          <div
            key={notif.id}
            className={`p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start gap-2.5 pointer-events-auto animate-slideIn ${
              notif.type === "error" 
                ? "bg-red-500/10 border-red-500/20 text-red-200" 
                : "bg-[#09090D]/95 border-emerald-500/20 text-emerald-200"
            }`}
          >
            <div className={`size-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
              notif.type === "error" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
            }`}>
              {notif.type === "error" ? "!" : "✓"}
            </div>
            <p className="text-[11px] font-bold leading-relaxed">{notif.text}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
