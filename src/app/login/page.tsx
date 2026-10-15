"use client";

import React, { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  Calendar,
  Scale,
  TrendingUp,
  CheckCircle2,
  Database,
  Activity,
  Award,
  Terminal,
  Zap,
  Play,
  Fingerprint,
  Cpu,
  BadgeDollarSign,
  Building2,
  Users,
  FileText,
  Gavel,
  Briefcase,
  CheckSquare,
  BookOpen,
  BarChart3,
  Settings,
  Sun,
  Moon,
  ArrowUpLeft,
  AlertCircle,
  KeyRound,
  Check,
  Copy,
  Layers,
  ChevronLeft,
} from "lucide-react";
import { login } from "@/app/login/actions";
import { AxiaBrandLogo, AxiaSymbolSvg } from "@/components/axia-brand-logo";

type ShowcaseTab = "rajih" | "hearings" | "finance" | "security";
type AuthTab = "signin" | "request_license";

interface RajihScenario {
  id: string;
  label: string;
  courtBadge: string;
  query: string;
  summary: string;
  legalBasis: string;
  recommendation: string;
}

const RAJIH_SCENARIOS: RajihScenario[] = [
  {
    id: "arbitration",
    label: "طعن بالنقض — بطلان شرط التحكيم",
    courtBadge: "محكمة النقض · الدائرة التجارية",
    query:
      "فحص مدى صحة الدفع ببطلان شرط التحكيم لعدم تفويض الموقع على العقد تفويضاً خاصاً بالتحكيم طبقاً للمادة ٧٠٢ مدني والمادة ١٠ من قانون التحكيم ٢٧ لسنة ١٩٩٤.",
    summary:
      "الاتفاق على التحكيم من أعمال التصرف التي تستلزم وكالة خاصة أو تفويضاً صريحاً لمن يبرمه نيابة عن الشخص الاعتباري أو الطبيعي، وإلا وقع الشرط باطلاً بطلاناً يمس أصل ولاية القضاء.",
    legalBasis:
      "المادة (٧٠٢/١) من القانون المدني المصري · المواد (١٠، ١١، ٥٣/١-أ) من قانون التحكيم رقم ٢٧ لسنة ١٩٩٤ · استقرار قضاء محكمة النقض (الطعن رقم ١٤٢٠ لسنة ٩٣ ق).",
    recommendation:
      "التمسك في صدر المذكرة الختامية ببطلان مشارطة التحكيم وانعدام أثرها القانوني، مع طلب ضم أصل السجل التجاري والنظام الأساسي للشركة لإثبات حدود سلطة التوقيع وقت الإبرام.",
  },
  {
    id: "lease",
    label: "عقد إيجار تجاري — قانون ٤ لسنة ١٩٩٦",
    courtBadge: "استئناف عالي · إيجارات كلي",
    query:
      "مراجعة بند المدة والتجديد التلقائي في عقد إيجار مقر تجاري لتفادي شبهة التأبيد أو الامتداد غير المقصود.",
    summary:
      "البند الحالي يربط التجديد بمحض إرادة المستأجر وحده بعبارة «يتجدد تلقائياً ما دام المستأجر قائماً بسداد الأجرة»، مما يثير نزاعاً قضائياً حول تحديد سقف زمني للعقد.",
    legalBasis:
      "القانون رقم ٤ لسنة ١٩٩٦ · المواد (٥٥٨، ٥٦٣) من القانون المدني · مبادئ الهيئة العامة للمواد المدنية والتجارية بمحكمة النقض بشأن العقود غير محددة المدة.",
    recommendation:
      "تعديل الصياغة لتنص صراحةً على: «تنتهي مدة هذا العقد حكماً في تاريخ محدد دون حاجة إلى تنبيه أو إنذار، ولا يتجدد إلا بعقد مكتوب مستقل موقع من الطرفين وبأجرة يتفق عليها حينئذٍ».",
  },
  {
    id: "admin_court",
    label: "مجلس الدولة — وقف تنفيذ قرار إداري",
    courtBadge: "محكمة القضاء الإداري · دوائر الاستثمار",
    query:
      "صياغة ركني الجدية والاستعجال في دعوى وقف تنفيذ وإلغاء قرار سحب تخصيص أرض صناعية رغم سداد الأقساط وتقديم تراخيص البناء.",
    summary:
      "متى ثبت التزام المتعاقد أو المخصص له بالجدول الزمني وسداد المستحقات، وتقاعست الجهة الإدارية عن تسليم المرافق، فإن قرار السحب يفتقد ركن السبب ويترتب على تنفيذه نتائج يتعذر تداركها.",
    legalBasis:
      "المادة (٤٩) من قانون مجلس الدولة رقم ٤٧ لسنة ١٩٧٢ · قضاء المحكمة الإدارية العليا في منازعات التخصيص الصناعي والتوازن المالي للعقد الإداري.",
    recommendation:
      "إرفاق حافظة مستندات تتضمن إيصالات السداد البنكية المعتمدة ومحاضر المعاينة الهندسية، وتقديم طلب عاجل بوقف تنفيذ القرار السلبي لحين الفصل في موضوع الدعوى.",
  },
];

const LIVE_HEARINGS_SAMPLE = [
  {
    id: "H-01",
    caseNumber: "١٤٢٠ لسنة ٩٣ ق — نقض مدني",
    title: "طعن بالنقض في حكم بطلان شرط التحكيم والإلزام بالتعويض",
    court: "محكمة النقض · دار القضاء العالي",
    circuit: "دائرة المواد المدنية والتجارية الأولى",
    date: "اليوم · ٠٩:٣٠ ص",
    roll: "رول ١٤",
    status: "today",
    statusLabel: "جلسة اليوم",
    decision: "إيداع مذكرة الرد على تقرير نيابة النقض وحافظة مستندات تكميلية",
  },
  {
    id: "H-02",
    caseNumber: "٣٨٢ لسنة ٢٠٢٥ تجاري كلي القاهرة",
    title: "منازعة شريك وتنفيذ عقد بيع أسهم وفسخ ملحق الشراكة",
    court: "المحكمة الاقتصادية بالقاهرة",
    circuit: "الدائرة الرابعة الابتدائية استثماري",
    date: "غداً · ١١:٠٠ ص",
    roll: "رول ٠٨",
    status: "upcoming",
    statusLabel: "مجدولة",
    decision: "مناقشة تقرير الخبير الحسابي المودع وإبداء الدفوع المحاسبية",
  },
  {
    id: "H-03",
    caseNumber: "٨١٩ لسنة ٢٠٢٤ مدني مستأنف الجيزة",
    title: "استئناف حكم تعويض عن الإخلال بعقد توريد معدات طبية",
    court: "محكمة استئناف عالي الجيزة",
    circuit: "الدائرة ٩ مدني كلي",
    date: "١٨ أكتوبر ٢٠٢٦",
    roll: "رول ٢١",
    status: "judgment",
    statusLabel: "محجوزة للحكم",
    decision: "محجوزة للنطق بالحكم مع التصريح بمذكرات في أسبوعين",
  },
];

const SYSTEM_MODULES = [
  {
    icon: Scale,
    titleAr: "نظرة عامة وغرفة القيادة",
    titleEn: "Executive Overview",
    desc: "لوحة قيادة لحظية تعرض الجلسات العاجلة، المواعيد الحتمية، ومؤشرات الأداء المالي والقضائي للمكتب.",
    tag: "مباشر",
  },
  {
    icon: Briefcase,
    titleAr: "سجل القضايا والملفات القضائية",
    titleEn: "Matters & Dossiers",
    desc: "إدارة شاملة لدورة حياة القضية من القيد الابتدائي حتى النقض، مع ربط الخصوم، الدوائر، ومراحل التقاضي.",
    tag: "Core ERP",
  },
  {
    icon: Gavel,
    titleAr: "رول الجلسات والتقويم القضائي",
    titleEn: "Hearings & Court Roll",
    desc: "تتبع يومي للرول والقرارات وتأجيلات المحاكم مع سحب وإفلات ذكي للمواعيد ووضع تركيز خاص ليوم الجلسة.",
    tag: "تفاعلي",
  },
  {
    icon: Sparkles,
    titleAr: "محرك الذكاء القضائي «راجح»",
    titleEn: "RAJIH AI Copilot",
    desc: "مساعد ذكي مقيد بالمصادر الرسمية يبحث في التشريعات وأحكام النقض ويربط التحليل بملف القضية الفعلي.",
    tag: "AI سيادي",
  },
  {
    icon: Users,
    titleAr: "الموكلون وسجل التوكيلات",
    titleEn: "Clients & POA Registry",
    desc: "ملفات متكاملة للشركات والأفراد مع تتبع أرقام التوكيلات الرسمية، مكاتب التوثيق، وتنبيهات انتهاء الصلاحية.",
    tag: "موثق",
  },
  {
    icon: CheckSquare,
    titleAr: "قلم المحضرين والمواعيد الحتمية",
    titleEn: "Bailiff & Deadlines",
    desc: "حماية المكتب من سقوط المواعيد الإجرائية (الاستئناف، النقض، الإعلانات) عبر تنبيهات فورية ومهام مرتبطة بالقضايا.",
    tag: "تنبيهات ذكية",
  },
  {
    icon: FileText,
    titleAr: "العقود والأرشيف السحابي المشفر",
    titleEn: "Encrypted Document Vault",
    desc: "خزينة مستندات خاصة لكل مكتب مع تحقق من البصمة الرقمية (SHA-256) وروابط تنزيل موقعة ومؤقتة.",
    tag: "Storage خاص",
  },
  {
    icon: BadgeDollarSign,
    titleAr: "المالية والأتعاب والدمغات",
    titleEn: "Legal Finance & Accounting",
    desc: "إدارة الدفعات، أمانات الخبراء، الرسوم القضائية، وضريبة القيمة المضافة مع صلاحيات مخصصة للشركاء والإدارة.",
    tag: "حوكمة مالية",
  },
  {
    icon: BookOpen,
    titleAr: "مكتبة التشريعات وأحكام النقض",
    titleEn: "Egyptian Legal Corpus",
    desc: "قاعدة معرفية مهيكلة للقوانين المصرية ومبادئ محكمة النقض والمحكمة الإدارية العليا مع بحث دلالي دقيق.",
    tag: "مصر EG",
  },
  {
    icon: Users,
    titleAr: "فريق العمل وتوزيع القضايا",
    titleEn: "Legal Team & ACL",
    desc: "تنظيم صلاحيات الشركاء، المحامين بالاستئناف والنقض، الجدول العام، والمتدربين مع عزل الوصول على مستوى كل قضية.",
    tag: "RBAC + ACL",
  },
  {
    icon: BarChart3,
    titleAr: "التقارير التنفيذية وتصدير PDF",
    titleEn: "Analytics & Official Reports",
    desc: "تقارير أداء مبنية على البيانات الفعلية للمكتب مع تصدير تقارير قانونية ومالية منسقة باللغة العربية.",
    tag: "تقارير حية",
  },
  {
    icon: Settings,
    titleAr: "إدارة المكتب وسجل التدقيق",
    titleEn: "Administration & Audit Trail",
    desc: "سجل تدقيق إلزامي على مستوى قاعدة البيانات يرصد كافة عمليات الإضافة والتعديل لضمان النزاهة والمساءلة.",
    tag: "Audit Trail",
  },
];

function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-l from-[var(--axia-gold)] via-[var(--axia-gold-light)] to-[var(--axia-gold)] px-5 py-3.5 text-xs font-extrabold text-black shadow-lg shadow-[var(--axia-gold)]/20 transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {pending ? (
          <>
            <span className="size-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
            <span>جارٍ التحقق من الهوية وفتح مساحة العمل المعزولة...</span>
          </>
        ) : (
          <>
            <KeyRound className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span>الدخول الآمن إلى مساحة العمل</span>
            <ArrowUpLeft className="size-4 opacity-80 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
          </>
        )}
      </span>
    </button>
  );
}

function sanitizeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

function LoginPortalContent() {
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const authErrorParam = searchParams.get("error");
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const authErrorMessage = useMemo(() => {
    if (authErrorParam === "missing_credentials") {
      return "يرجى إدخال البريد الإلكتروني المهني وكلمة المرور للمتابعة.";
    }
    if (authErrorParam === "invalid_credentials") {
      return "بيانات الدخول غير صحيحة أو أن الحساب غير مخول بالوصول إلى مساحة العمل.";
    }
    return null;
  }, [authErrorParam]);

  // Auth capsule states
  const [authTab, setAuthTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Office License / Demo Request states (Controlled onboarding per Roadmap 5.1 & 9.1)
  const [firmName, setFirmName] = useState("");
  const [managingPartner, setManagingPartner] = useState("");
  const [barRegistrationNo, setBarRegistrationNo] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [practiceSpecialty, setPracticeSpecialty] = useState("corporate");
  const [seatTier, setSeatTier] = useState("5-15");
  const [licenseRequestCode, setLicenseRequestCode] = useState<string | null>(null);
  const [copiedRequestCode, setCopiedRequestCode] = useState(false);

  // Interactive Showcase Console states
  const [activeShowcase, setActiveShowcase] = useState<ShowcaseTab>("rajih");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("arbitration");
  const [isAnalyzingScenario, setIsAnalyzingScenario] = useState(false);
  const [hearingFilter, setHearingFilter] = useState<"all" | "today" | "judgment">("all");
  const [hearingTaskGeneratedId, setHearingTaskGeneratedId] = useState<string | null>(null);

  // Interactive Legal Finance Calculator states
  const [caseFeeAmount, setCaseFeeAmount] = useState(250000);
  const [partnerSharePercent, setPartnerSharePercent] = useState(65);

  // Interactive Security Audit Verifier states
  const [securityStep, setSecurityStep] = useState(4);
  const [isRunningSecurityCheck, setIsRunningSecurityCheck] = useState(false);

  // ROI Calculator states
  const [lawyersCount, setLawyersCount] = useState(8);
  const [firmProfile, setFirmProfile] = useState<"corporate" | "litigation" | "arbitration">("corporate");

  const activeScenario = useMemo(
    () => RAJIH_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? RAJIH_SCENARIOS[0],
    [selectedScenarioId],
  );

  const filteredHearings = useMemo(() => {
    if (hearingFilter === "all") return LIVE_HEARINGS_SAMPLE;
    return LIVE_HEARINGS_SAMPLE.filter((h) => h.status === hearingFilter);
  }, [hearingFilter]);

  const financeBreakdown = useMemo(() => {
    const vatAmount = Math.round(caseFeeAmount * 0.14);
    const barStampAmount = Math.round(caseFeeAmount * 0.015);
    const netDistributable = caseFeeAmount - vatAmount - barStampAmount;
    const partnerPayout = Math.round((netDistributable * partnerSharePercent) / 100);
    const officeReserve = netDistributable - partnerPayout;
    return {
      vatAmount,
      barStampAmount,
      netDistributable,
      partnerPayout,
      officeReserve,
    };
  }, [caseFeeAmount, partnerSharePercent]);

  const roiMetrics = useMemo(() => {
    const multiplier = firmProfile === "arbitration" ? 1.25 : firmProfile === "corporate" ? 1.15 : 1.0;
    const weeklyHoursSaved = Math.round(lawyersCount * 11.5 * multiplier);
    const monthlyExtraMatters = Math.max(2, Math.round(lawyersCount * 2.8 * multiplier));
    const annualEfficiencyValueEgp = Math.round(lawyersCount * 145000 * multiplier);
    return {
      weeklyHoursSaved,
      monthlyExtraMatters,
      annualEfficiencyValueEgp,
    };
  }, [lawyersCount, firmProfile]);

  const scrollToSection = (sectionId: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (sectionId === "top") {
      container.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const target = container.querySelector(`#${sectionId}`);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleTriggerScenarioAnalysis = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setIsAnalyzingScenario(true);
    setTimeout(() => {
      setIsAnalyzingScenario(false);
    }, 450);
  };

  const handleRunSecurityCheck = () => {
    setIsRunningSecurityCheck(true);
    setSecurityStep(1);
    const timers = [
      setTimeout(() => setSecurityStep(2), 350),
      setTimeout(() => setSecurityStep(3), 700),
      setTimeout(() => {
        setSecurityStep(4);
        setIsRunningSecurityCheck(false);
      }, 1050),
    ];
    return () => timers.forEach(clearTimeout);
  };

  const handleLicenseRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim() || !workEmail.trim()) return;
    const suffix = String(
      (firmName.trim().length * 137 + workEmail.trim().length * 53) % 9000 + 1000,
    );
    setLicenseRequestCode(`AXIA-EG-${suffix}`);
  };

  const handleCopyRequestCode = async () => {
    if (!licenseRequestCode) return;
    try {
      await navigator.clipboard.writeText(
        `طلب ترخيص AXIA Legal OS | رقم المرجع: ${licenseRequestCode} | المكتب: ${firmName} | البريد: ${workEmail}`,
      );
      setCopiedRequestCode(true);
      setTimeout(() => setCopiedRequestCode(false), 2500);
    } catch {
      setCopiedRequestCode(false);
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className="relative h-screen w-full overflow-y-auto overflow-x-hidden scroll-smooth bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--axia-gold)]/20 selection:text-[var(--axia-gold-light)]"
    >
      {/* Ambient Sovereign Architectural Backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-gradient-to-bl from-[var(--axia-gold)]/12 via-amber-500/5 to-transparent blur-[130px]" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-emerald-500/8 via-[var(--axia-gold)]/5 to-transparent blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* Subtle Watermark Emblem */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] dark:opacity-[0.035]">
          <AxiaSymbolSvg className="h-[680px] w-[680px]" monochrome idPrefix="axia-bg-watermark" />
        </div>
      </div>

      {/* Top Sticky Command Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => scrollToSection("top")}
            className="group flex items-center gap-3 text-right outline-none cursor-pointer"
          >
            <AxiaBrandLogo mode="lockup" size="md" animated />
          </button>

          {/* Quick Section Navigation */}
          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--panel)]/60 p-1 text-xs font-semibold text-[var(--text-muted)]">
            <button
              type="button"
              onClick={() => scrollToSection("top")}
              className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-[var(--accent-hover)] hover:text-[var(--text)] cursor-pointer"
            >
              بوابة الدخول والعرض الحي
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("modules-section")}
              className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-[var(--accent-hover)] hover:text-[var(--text)] cursor-pointer"
            >
              وحدات النظام (١٢ وحدة)
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("roi-section")}
              className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-[var(--accent-hover)] hover:text-[var(--text)] cursor-pointer"
            >
              حاسبة العائد للمكتب
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("security-section")}
              className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-[var(--accent-hover)] hover:text-[var(--text)] cursor-pointer"
            >
              السيادة والأمان (RLS)
            </button>
          </nav>

          {/* Status, Theme Switcher & CTA */}
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-bold text-emerald-500">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              عزل سيادي RLS نشط
            </span>

            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="grid size-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--text-muted)] transition-colors hover:border-[var(--axia-gold)]/40 hover:text-[var(--text)] cursor-pointer"
                title="تبديل المظهر (ليلي / نهاري)"
                aria-label="تبديل المظهر"
              >
                {theme === "dark" ? <Sun className="size-4 text-[var(--axia-gold-light)]" /> : <Moon className="size-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setAuthTab(authTab === "signin" ? "request_license" : "signin");
                scrollToSection("top");
              }}
              className="rounded-xl border border-[var(--axia-gold)]/35 bg-[var(--axia-gold)]/12 px-3.5 py-2 text-xs font-bold text-[var(--axia-gold-light)] transition-all hover:bg-[var(--axia-gold)] hover:text-black cursor-pointer"
            >
              {authTab === "signin" ? "طلب ترخيص مكتب" : "دخول الأعضاء"}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION: SPLIT-SCREEN ENTERPRISE LOGIN + INTERACTIVE SYSTEM SHOWCASE */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:px-8 lg:pt-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* RIGHT COLUMN (RTL Primary — 5 Columns): THE ENTERPRISE AUTH CAPSULE */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--panel)]/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
              {/* Top Golden Accent Line */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-transparent via-[var(--axia-gold-light)] to-transparent" />

              {/* Animated AXIA Brand Header inside the Auth Card */}
              <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
                <AxiaBrandLogo mode="hero" animated />
              </div>

              {/* Mode Switcher: Authorized Login vs. Office License Request */}
              <div
                role="tablist"
                aria-label="وضع البوابة"
                className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-1.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={authTab === "signin"}
                  onClick={() => setAuthTab("signin")}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
                    authTab === "signin"
                      ? "bg-gradient-to-l from-[var(--axia-gold)] to-[var(--axia-gold-light)] text-black shadow-md"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <Lock className="size-3.5" />
                  <span>دخول الأعضاء</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authTab === "request_license"}
                  onClick={() => setAuthTab("request_license")}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
                    authTab === "request_license"
                      ? "bg-gradient-to-l from-[var(--axia-gold)] to-[var(--axia-gold-light)] text-black shadow-md"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <Building2 className="size-3.5" />
                  <span>طلب ترخيص مكتب</span>
                </button>
              </div>

              {/* TAB 1: REAL SUPABASE SSR LOGIN FORM */}
              {authTab === "signin" ? (
                <form action={login} className="space-y-4">
                  <input type="hidden" name="next" value={nextPath} />

                  {/* Error Banner from Server Action Redirect (?error=...) */}
                  {authErrorMessage && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-2xl border border-red-500/35 bg-red-500/10 p-3.5 text-right text-xs font-semibold text-red-400"
                    >
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
                      <div className="space-y-0.5">
                        <p className="font-bold">تعذر تسجيل الدخول</p>
                        <p className="text-[11px] opacity-90">{authErrorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Protected Destination Indicator when ?next= is non-root */}
                  {nextPath !== "/" && (
                    <div className="flex items-center justify-between rounded-xl border border-[var(--axia-gold)]/25 bg-[var(--axia-gold)]/8 px-3 py-2 text-[11px]">
                      <span className="text-[var(--text-muted)]">سيتم توجيهك بعد الدخول إلى:</span>
                      <code className="font-mono font-bold text-[var(--axia-gold-light)]" dir="ltr">
                        {nextPath}
                      </code>
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="axia-login-email"
                      className="block text-xs font-bold text-[var(--text)]"
                    >
                      البريد الإلكتروني المهني
                    </label>
                    <div className="relative flex items-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] px-3.5 py-2.5 transition-colors focus-within:border-[var(--axia-gold)]">
                      <Mail className="ml-2.5 size-4 shrink-0 text-[var(--text-muted)]" />
                      <input
                        id="axia-login-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="partner@lawfirm.eg"
                        className="w-full bg-transparent text-left font-mono text-xs text-[var(--text)] placeholder-[var(--text-muted)]/60 outline-none"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="axia-login-password"
                        className="block text-xs font-bold text-[var(--text)]"
                      >
                        كلمة المرور الأمنية
                      </label>
                      <span className="text-[10px] font-medium text-[var(--text-muted)]">
                        محمية بتشفير الجلسات SSR
                      </span>
                    </div>
                    <div className="relative flex items-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] px-3.5 py-2.5 transition-colors focus-within:border-[var(--axia-gold)]">
                      <Lock className="ml-2.5 size-4 shrink-0 text-[var(--text-muted)]" />
                      <input
                        id="axia-login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        dir="ltr"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-transparent text-left font-mono text-xs text-[var(--text)] placeholder-[var(--text-muted)]/60 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="mr-2 text-[var(--text-muted)] transition-colors hover:text-[var(--text)] cursor-pointer"
                        aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Primary Submit Button wired to Server Action */}
                  <div className="pt-1">
                    <LoginSubmitButton />
                  </div>

                  {/* Security Assurance Footer */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border)] text-center">
                    <div className="rounded-xl bg-[var(--accent)] px-2 py-2">
                      <span className="block font-mono text-[10px] font-bold text-emerald-500">
                        RLS Isolated
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)]">عزل تام للمكتب</span>
                    </div>
                    <div className="rounded-xl bg-[var(--accent)] px-2 py-2">
                      <span className="block font-mono text-[10px] font-bold text-[var(--axia-gold-light)]">
                        SSR Cookies
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)]">جلسات خادم مشفرة</span>
                    </div>
                    <div className="rounded-xl bg-[var(--accent)] px-2 py-2">
                      <span className="block font-mono text-[10px] font-bold text-[var(--text)]">
                        Audit Log
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)]">توثيق كافة الحركات</span>
                    </div>
                  </div>
                </form>
              ) : (
                /* TAB 2: CONTROLLED OFFICE LICENSE / DEMO REQUEST (Preserves "No Public Self-Registration" Security Boundary) */
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--axia-gold)]/25 bg-[var(--axia-gold)]/8 p-3.5 text-xs leading-relaxed text-[var(--text-muted)]">
                    حفاظاً على السرية المهنية وعزل قواعد البيانات، لا يُتاح التسجيل العشوائي العام؛ يتم تأسيس مساحات العمل المستقلة للمكاتب بعد مراجعة رقم القيد بالنقابة وتخصيص نطاق معزول (`organization_id`).
                  </div>

                  {licenseRequestCode ? (
                    <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-right">
                      <div className="flex items-center gap-2.5 text-emerald-400">
                        <CheckCircle2 className="size-5 shrink-0" />
                        <h4 className="text-sm font-extrabold">
                          تم تجهيز مسودة طلب الترخيص محليًا
                        </h4>
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                        هذه مسودة محلية لمكتب <strong className="text-[var(--text)]">{firmName}</strong> لم يتم إرسالها أو حفظها على الخادم أو إنشاء مساحة عمل. انسخ التفاصيل للتواصل مع إدارة النظام.
                      </p>
                      <div className="flex items-center justify-between rounded-xl border border-[var(--border-strong)] bg-[var(--panel)] px-3.5 py-2.5">
                        <span className="font-mono text-xs font-extrabold text-[var(--axia-gold-light)]">
                          {licenseRequestCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyRequestCode}
                          className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-hover)] px-2.5 py-1 text-[10px] font-bold text-[var(--text)] hover:bg-[var(--axia-gold)] hover:text-black transition-colors cursor-pointer"
                        >
                          {copiedRequestCode ? (
                            <>
                              <Check className="size-3" />
                              <span>تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              <span>نسخ المرجع</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setLicenseRequestCode(null);
                            setAuthTab("signin");
                          }}
                          className="flex-1 rounded-xl bg-[var(--axia-gold)] py-2.5 text-xs font-extrabold text-black cursor-pointer"
                        >
                          العودة لتسجيل الدخول
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleLicenseRequestSubmit} className="space-y-3.5">
                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-[var(--text)]">
                          اسم مكتب المحاماة أو المجموعة القانونية
                        </label>
                        <input
                          type="text"
                          required
                          value={firmName}
                          onChange={(e) => setFirmName(e.target.value)}
                          placeholder="مثال: مجموعة النيل للاستشارات القانونية والتحكيم"
                          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)]/60 outline-none focus:border-[var(--axia-gold)]"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold text-[var(--text)]">
                            اسم الشريك المؤسس / المدير
                          </label>
                          <input
                            type="text"
                            required
                            value={managingPartner}
                            onChange={(e) => setManagingPartner(e.target.value)}
                            placeholder="الاسم الثلاثي والدرجة القضائية"
                            className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)]/60 outline-none focus:border-[var(--axia-gold)]"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-bold text-[var(--text)]">
                            رقم القيد بنقابة المحامين
                          </label>
                          <input
                            type="text"
                            required
                            value={barRegistrationNo}
                            onChange={(e) => setBarRegistrationNo(e.target.value)}
                            placeholder="مثال: ١٠٠٤٩٢ / نقض"
                            className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)]/60 outline-none focus:border-[var(--axia-gold)]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold text-[var(--text)]">
                            التخصص الغالب للمكتب
                          </label>
                          <select
                            value={practiceSpecialty}
                            onChange={(e) => setPracticeSpecialty(e.target.value)}
                            className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--axia-gold)]"
                          >
                            <option value="corporate">شركات واستثمار ومحاكم اقتصادية</option>
                            <option value="cassation">نقض مدني وجنائي وتقاضٍ عالٍ</option>
                            <option value="admin">قضاء إداري ومجلس الدولة</option>
                            <option value="arbitration">تحكيم دولي وعقود كبرى</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-bold text-[var(--text)]">
                            عدد مقاعد المحامين المطلوبة
                          </label>
                          <select
                            value={seatTier}
                            onChange={(e) => setSeatTier(e.target.value)}
                            className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--axia-gold)]"
                          >
                            <option value="1-5">١ – ٥ مستشارين ومحامين</option>
                            <option value="5-15">٥ – ١٥ مستشاراً ومحامياً</option>
                            <option value="15-50">١٥ – ٥٠ مستشاراً ومحامياً</option>
                            <option value="50+">أكثر من ٥٠ (مؤسسة كبرى)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-[var(--text)]">
                          البريد المهني للتواصل وتفعيل النطاق
                        </label>
                        <input
                          type="email"
                          required
                          dir="ltr"
                          value={workEmail}
                          onChange={(e) => setWorkEmail(e.target.value)}
                          placeholder="managing.partner@firm.eg"
                          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] px-3.5 py-2.5 text-left font-mono text-xs text-[var(--text)] placeholder-[var(--text-muted)]/60 outline-none focus:border-[var(--axia-gold)]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-gradient-to-l from-[var(--axia-gold)] to-[var(--axia-gold-light)] py-3 text-xs font-extrabold text-black shadow-lg transition-all hover:brightness-110 cursor-pointer"
                      >
                        إرسال طلب تأسيس المكتب وحجز العرض التنفيذي
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LEFT COLUMN (RTL Showcase — 7 Columns): INTERACTIVE PRODUCT MARKETING & LIVE OS PREVIEW */}
          <div className="lg:col-span-7 space-y-6">
            {/* Value Proposition Hero Header */}
            <div className="space-y-4 text-right">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/10 px-3.5 py-1.5 text-xs font-bold text-[var(--axia-gold-light)]">
                <Sparkles className="size-3.5" />
                <span>أول نظام تشغيل قضائي سحابي متكامل للمكاتب القانونية في مصر</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight leading-[1.2] sm:text-4xl lg:text-[42px]">
                أدِر مكتبك القانوني بدقة المؤسسات العالمية{" "}
                <span className="bg-gradient-to-l from-[var(--axia-gold-light)] via-amber-400 to-[var(--axia-gold)] bg-clip-text text-transparent">
                  وبذكاء «راجح» القضائي
                </span>
              </h1>

              <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">
                منصة <strong className="text-[var(--text)]">AXIA Legal OS</strong> تجمع إدارة القضايا، رول الجلسات، التوكيلات، العقود المشفرة، وحوكمة الأتعاب مع محرك الذكاء الاصطناعي <strong className="text-[var(--axia-gold-light)]">«راجح»</strong> المقيد بأحكام محكمة النقض والتشريعات المصرية، داخل بيئة سحابية معزولة بالكامل لكل مكتب.
              </p>

              {/* Key Trust Metrics Bar */}
              <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]/80 p-3.5">
                  <span className="block font-mono text-lg font-black text-[var(--axia-gold-light)]">
                    ١٢ وحدة
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                    تشغيلية وقانونية متكاملة
                  </span>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]/80 p-3.5">
                  <span className="block font-mono text-lg font-black text-emerald-500">
                    100% RLS
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                    عزل بيانات الموكلين والقضايا
                  </span>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]/80 p-3.5">
                  <span className="block font-mono text-lg font-black text-[var(--text)]">
                    RAJIH AI
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                    استشهاد موثق بأحكام النقض
                  </span>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]/80 p-3.5">
                  <span className="block font-mono text-lg font-black text-[var(--axia-gold-light)]">
                    ٦ مسارات
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                    تدقيق إلزامي (Audit Triggers)
                  </span>
                </div>
              </div>
            </div>

            {/* LIVE INTERACTIVE PRODUCT CONSOLE (Try the 4 Core Pillars right on the Login Screen) */}
            <div className="overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--panel)]/95 shadow-2xl backdrop-blur-xl">
              {/* Console Window Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg)]/70 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-red-500/70" />
                  <span className="size-2.5 rounded-full bg-amber-500/70" />
                  <span className="size-2.5 rounded-full bg-emerald-500/70" />
                  <span className="mr-2 font-mono text-[11px] font-bold text-[var(--text-muted)]">
                    AXIA Interactive System Preview — جرب النظام الآن
                  </span>
                </div>
                <span className="rounded-md border border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[var(--axia-gold-light)]">
                  {activeShowcase === "rajih"
                    ? "RAJIH_COPILOT_ENGINE"
                    : activeShowcase === "hearings"
                    ? "COURT_ROLL_MANAGER"
                    : activeShowcase === "finance"
                    ? "EGYPT_LEGAL_FINANCE"
                    : "TENANT_RLS_GUARD"}
                </span>
              </div>

              {/* 4 Pillar Selector Tabs */}
              <div className="grid grid-cols-2 gap-1.5 border-b border-[var(--border)] bg-[var(--bg)]/40 p-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setActiveShowcase("rajih")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    activeShowcase === "rajih"
                      ? "bg-[var(--panel)] text-[var(--axia-gold-light)] shadow-sm border border-[var(--axia-gold)]/35"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <Cpu className="size-3.5" />
                  <span>ذكاء «راجح» القضائي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShowcase("hearings")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    activeShowcase === "hearings"
                      ? "bg-[var(--panel)] text-[var(--axia-gold-light)] shadow-sm border border-[var(--axia-gold)]/35"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <Calendar className="size-3.5" />
                  <span>رول الجلسات والمحاكم</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShowcase("finance")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    activeShowcase === "finance"
                      ? "bg-[var(--panel)] text-[var(--axia-gold-light)] shadow-sm border border-[var(--axia-gold)]/35"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <BadgeDollarSign className="size-3.5" />
                  <span>حوكمة الأتعاب والضرائب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShowcase("security")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    activeShowcase === "security"
                      ? "bg-[var(--panel)] text-[var(--axia-gold-light)] shadow-sm border border-[var(--axia-gold)]/35"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <Shield className="size-3.5" />
                  <span>العزل السيادي RLS</span>
                </button>
              </div>

              {/* Interactive Console Body */}
              <div className="p-5 sm:p-6">
                <AnimatePresence mode="wait">
                  {/* PILLAR 1: RAJIH AI INTERACTIVE SIMULATION */}
                  {activeShowcase === "rajih" && (
                    <motion.div
                      key="rajih-tab"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--text-muted)]">
                          اختر قضية أو استشارة لتجربة تحليل «راجح» المدعوم بأحكام النقض:
                        </span>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                          مقيد بالمصادر التشريعية المعتمدة
                        </span>
                      </div>

                      {/* Scenario Pills */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {RAJIH_SCENARIOS.map((sc) => {
                          const isSelected = sc.id === selectedScenarioId;
                          return (
                            <button
                              key={sc.id}
                              type="button"
                              onClick={() => handleTriggerScenarioAnalysis(sc.id)}
                              className={`rounded-xl border p-3 text-right transition-all cursor-pointer ${
                                isSelected
                                  ? "border-[var(--axia-gold)] bg-[var(--axia-gold)]/12 text-[var(--text)] shadow-sm"
                                  : "border-[var(--border)] bg-[var(--bg)]/60 text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                              }`}
                            >
                              <span className="block text-[10px] font-bold text-[var(--axia-gold-light)]">
                                {sc.courtBadge}
                              </span>
                              <span className="mt-1 block text-xs font-extrabold">{sc.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Query & Structured Legal Output */}
                      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg)] p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-[var(--axia-gold-light)]">
                              الاستعلام القانوني محل الفحص:
                            </span>
                            <p className="text-xs font-semibold text-[var(--text)] leading-relaxed">
                              {activeScenario.query}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTriggerScenarioAnalysis(activeScenario.id)}
                            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[var(--axia-gold)]/15 border border-[var(--axia-gold)]/35 px-2.5 py-1.5 text-[10px] font-bold text-[var(--axia-gold-light)] hover:bg-[var(--axia-gold)] hover:text-black transition-colors cursor-pointer"
                          >
                            <Play className="size-3" />
                            <span>إعادة الفحص</span>
                          </button>
                        </div>

                        {isAnalyzingScenario ? (
                          <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-[var(--axia-gold-light)]">
                            <span className="size-4 rounded-full border-2 border-[var(--axia-gold-light)] border-t-transparent animate-spin" />
                            <span>جارٍ مطابقة النصوص التشريعية ومبادئ محكمة النقض...</span>
                          </div>
                        ) : (
                          <div className="space-y-3 text-xs leading-relaxed">
                            <div className="rounded-xl bg-[var(--panel)] p-3 border border-[var(--border)]">
                              <span className="block text-[11px] font-extrabold text-emerald-500 mb-1">
                                ١. الخلاصة القانونية:
                              </span>
                              <p className="text-[var(--text)]">{activeScenario.summary}</p>
                            </div>

                            <div className="rounded-xl bg-[var(--panel)] p-3 border border-[var(--border)]">
                              <span className="block text-[11px] font-extrabold text-[var(--axia-gold-light)] mb-1">
                                ٢. الأساس القانوني وأحكام النقض:
                              </span>
                              <p className="text-[var(--text-muted)] font-medium">
                                {activeScenario.legalBasis}
                              </p>
                            </div>

                            <div className="rounded-xl bg-[var(--axia-gold)]/8 p-3 border border-[var(--axia-gold)]/25">
                              <span className="block text-[11px] font-extrabold text-[var(--axia-gold-light)] mb-1">
                                ٣. التوصية الإجرائية للمحامي المسؤول (تتطلب اعتماد بشري):
                              </span>
                              <p className="text-[var(--text)]">{activeScenario.recommendation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* PILLAR 2: COURT ROLL & HEARINGS SIMULATION */}
                  {activeShowcase === "hearings" && (
                    <motion.div
                      key="hearings-tab"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--text-muted)]">
                          غرفة عمليات الجلسات الحية — تصفية حسب حالة الرول:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {[
                            { id: "all", label: "كل الجلسات (٣)" },
                            { id: "today", label: "جلسات اليوم" },
                            { id: "judgment", label: "محجوزة للحكم" },
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() =>
                                setHearingFilter(f.id as "all" | "today" | "judgment")
                              }
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                                hearingFilter === f.id
                                  ? "bg-[var(--axia-gold)] text-black"
                                  : "bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]"
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {filteredHearings.map((hearing) => (
                          <div
                            key={hearing.id}
                            className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg)] p-4 transition-all hover:border-[var(--axia-gold)]/40"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-extrabold text-[var(--axia-gold-light)]">
                                    {hearing.caseNumber}
                                  </span>
                                  <span className="rounded-md bg-[var(--panel)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
                                    {hearing.roll}
                                  </span>
                                </div>
                                <h4 className="mt-1 text-xs font-extrabold text-[var(--text)]">
                                  {hearing.title}
                                </h4>
                                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                                  {hearing.court} · {hearing.circuit}
                                </p>
                              </div>

                              <div className="text-left">
                                <span
                                  className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                    hearing.status === "today"
                                      ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                      : hearing.status === "judgment"
                                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  }`}
                                >
                                  {hearing.statusLabel}
                                </span>
                                <span className="mt-1 block font-mono text-[10px] text-[var(--text-muted)]">
                                  {hearing.date}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-2.5 text-[11px]">
                              <span className="text-[var(--text-muted)]">
                                <strong className="text-[var(--text)]">المطلوب بالجلسة:</strong>{" "}
                                {hearing.decision}
                              </span>
                              <button
                                type="button"
                                onClick={() => setHearingTaskGeneratedId(hearing.id)}
                                className="rounded-lg border border-[var(--axia-gold)]/35 bg-[var(--axia-gold)]/10 px-2.5 py-1 text-[10px] font-bold text-[var(--axia-gold-light)] hover:bg-[var(--axia-gold)] hover:text-black transition-colors cursor-pointer"
                              >
                                {hearingTaskGeneratedId === hearing.id
                                  ? "✓ تم إسناد المهمة لقلم المحضرين"
                                  : "+ تحويل لقرار ومهمة إجرائية"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* PILLAR 3: LEGAL FINANCE & EGYPTIAN TAX GOVERNANCE */}
                  {activeShowcase === "finance" && (
                    <motion.div
                      key="finance-tab"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-[var(--text-muted)]">دفعة الأتعاب المحصلة:</span>
                              <span className="font-mono text-[var(--axia-gold-light)]">
                                {caseFeeAmount.toLocaleString("ar-EG")} ج.م
                              </span>
                            </div>
                            <input
                              type="range"
                              min={25000}
                              max={1000000}
                              step={25000}
                              value={caseFeeAmount}
                              onChange={(e) => setCaseFeeAmount(Number(e.target.value))}
                              className="w-full accent-[var(--axia-gold)] cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-[var(--text-muted)]">نسبة الشريك المسؤول:</span>
                              <span className="font-mono text-[var(--axia-gold-light)]">
                                {partnerSharePercent}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={20}
                              max={85}
                              step={5}
                              value={partnerSharePercent}
                              onChange={(e) => setPartnerSharePercent(Number(e.target.value))}
                              className="w-full accent-[var(--axia-gold)] cursor-pointer"
                            />
                          </div>

                          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                            يحتسب النظام تلقائياً مخصصات ضريبة القيمة المضافة والدمغات النقابية، مع قصر الاطلاع والتعديل المالي على دوري <code className="font-mono text-[var(--axia-gold-light)]">owner</code> و<code className="font-mono text-[var(--axia-gold-light)]">admin</code>.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg)] p-4 space-y-2.5 text-xs">
                          <div className="flex justify-between py-1">
                            <span className="text-[var(--text-muted)]">إجمالي الدفعة المسجلة:</span>
                            <span className="font-mono font-bold text-[var(--text)]">
                              {caseFeeAmount.toLocaleString("ar-EG")} ج.م
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-[var(--text-muted)]">
                              مخصص القيمة المضافة (١٤٪):
                            </span>
                            <span className="font-mono font-semibold text-red-400">
                              -{financeBreakdown.vatAmount.toLocaleString("ar-EG")} ج.م
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-[var(--text-muted)]">
                              دمغة النقابة والعلاج (١.٥٪):
                            </span>
                            <span className="font-mono font-semibold text-red-400">
                              -{financeBreakdown.barStampAmount.toLocaleString("ar-EG")} ج.م
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-[var(--border)] pt-2 font-extrabold text-emerald-500">
                            <span>صافي العائد القابل للتوزيع:</span>
                            <span className="font-mono">
                              {financeBreakdown.netDistributable.toLocaleString("ar-EG")} ج.م
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 text-[11px]">
                            <span className="text-[var(--text-muted)]">
                              حصة الشريك ({partnerSharePercent}%):
                            </span>
                            <span className="font-mono font-bold text-[var(--axia-gold-light)]">
                              {financeBreakdown.partnerPayout.toLocaleString("ar-EG")} ج.م
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--text-muted)]">احتياطي وتشغيل المكتب:</span>
                            <span className="font-mono font-bold text-[var(--text)]">
                              {financeBreakdown.officeReserve.toLocaleString("ar-EG")} ج.م
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* PILLAR 4: TENANT RLS & AUDIT ARCHITECTURE */}
                  {activeShowcase === "security" && (
                    <motion.div
                      key="security-tab"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--text-muted)]">
                          طبقات الحماية الأربع المطبقة فعلياً في قاعدة بيانات AXIA Legal:
                        </span>
                        <button
                          type="button"
                          onClick={handleRunSecurityCheck}
                          disabled={isRunningSecurityCheck}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-[11px] font-extrabold text-emerald-400 hover:bg-emerald-500 hover:text-black transition-colors cursor-pointer"
                        >
                          <Terminal className="size-3.5" />
                          <span>
                            {isRunningSecurityCheck
                              ? "جارٍ فحص سياسات العزل..."
                              : "تشغيل فحص العزل السيادي RLS"}
                          </span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {[
                          {
                            step: 1,
                            title: "١. التحقق من الهوية عبر الجلسات المشفرة",
                            code: "supabase.auth.getClaims() → resolveWorkspace()",
                            desc: "حظر أي وصول لغير الأعضاء المسجلين في جدول organization_members وعدم استخدام Service Role في المسارات العادية.",
                          },
                          {
                            step: 2,
                            title: "٢. عزل القضايا بصلاحيات خاصة (Matter ACL)",
                            code: "private.can_access_matter(matter_id)",
                            desc: "فحص عضوية المكتب ومستوى الوصول للقضية داخل مخطط private المحمي في PostgreSQL.",
                          },
                          {
                            step: 3,
                            title: "٣. قيود المفاتيح المركبة للمستأجرين",
                            code: "matters_client_tenant_fkey (organization_id)",
                            desc: "منع ربط أي مستند أو جلسة أو معاملة مالية بملف ينتمي لمكتب آخر على مستوى قاعدة البيانات.",
                          },
                          {
                            step: 4,
                            title: "٤. سجل التدقيق الإلزامي (Core Audit Triggers)",
                            code: "private.audit_core_row() → public.audit_logs",
                            desc: "توثيق تلقائي لكل عملية إنشاء أو تعديل على الموكلين والقضايا والجلسات والمهام والمالية والمستندات.",
                          },
                        ].map((item) => {
                          const active = securityStep >= item.step;
                          return (
                            <div
                              key={item.step}
                              className={`rounded-2xl border p-3.5 transition-all ${
                                active
                                  ? "border-emerald-500/35 bg-emerald-500/[0.05]"
                                  : "border-[var(--border)] bg-[var(--bg)] opacity-50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-extrabold text-[var(--text)]">
                                  {item.title}
                                </span>
                                <CheckCircle2
                                  className={`size-4 shrink-0 ${
                                    active ? "text-emerald-500" : "text-[var(--text-muted)]"
                                  }`}
                                />
                              </div>
                              <code
                                dir="ltr"
                                className="mt-1.5 block rounded bg-[var(--panel)] px-2 py-1 text-left font-mono text-[10px] text-[var(--axia-gold-light)]"
                              >
                                {item.code}
                              </code>
                              <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
                                {item.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* SECTION 2: 12-MODULE ECOSYSTEM BENTO SHOWCASE */}
      <section
        id="modules-section"
        className="relative z-10 border-t border-[var(--border)] bg-[var(--panel)]/40 py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/10 px-3.5 py-1 text-xs font-bold text-[var(--axia-gold-light)]">
              <Layers className="size-3.5" />
              <span>البنية الوظيفية الكاملة لنظام AXIA Legal</span>
            </div>
            <h2 className="text-2xl font-black sm:text-3xl">
              ١٢ وحدة تشغيلية وقانونية تغطي كافة احتياجات المكتب العصري
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              صُممت كل وحدة لتعمل بترابط كامل مع بقية وحدات النظام، بحيث ينعكس إضافة أي جلسة أو مستند أو دفعة مالية فوراً في التقارير، البحث الشامل (`Ctrl+K`)، وسجل التدقيق.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SYSTEM_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.titleEn}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--axia-gold)]/45 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="grid size-10 place-items-center rounded-xl border border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/10 text-[var(--axia-gold-light)] transition-colors group-hover:bg-[var(--axia-gold)] group-hover:text-black">
                      <Icon className="size-5" />
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[var(--axia-gold-light)]">
                      {mod.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-[var(--text)]">{mod.titleAr}</h3>
                  <span className="block font-mono text-[10px] text-[var(--text-muted)] mb-2">
                    {mod.titleEn}
                  </span>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)]">{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE FIRM ROI & CAPACITY CALCULATOR */}
      <section
        id="roi-section"
        className="relative z-10 border-t border-[var(--border)] py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/10 px-3.5 py-1 text-xs font-bold text-[var(--axia-gold-light)]">
                <TrendingUp className="size-3.5" />
                <span>جدوى التحول الرقمي للمكتب القانوني</span>
              </div>

              <h2 className="text-2xl font-black leading-tight sm:text-3xl">
                احسب الوفر الزمني والطاقة الاستيعابية الإضافية لمكتبك
              </h2>

              <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">
                يقضي المحامي تقليدياً ساعات طويلة أسبوعياً في البحث اليدوي عن أحكام النقض، مطابقة المواعيد الإجرائية، وإعداد تقارير الموكلين. حدد حجم مكتبك وتخصصه لمعاينة الأثر التشغيلي المباشر لنظام AXIA Legal:
              </p>

              <div className="rounded-3xl border border-[var(--border-strong)] bg-[var(--panel)] p-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-[var(--text-muted)]">
                      عدد الشركاء والمستشارين والمحامين بالمكتب:
                    </span>
                    <span className="rounded-lg bg-[var(--axia-gold)]/15 px-3 py-1 font-mono text-sm font-black text-[var(--axia-gold-light)]">
                      {lawyersCount} محامياً
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={lawyersCount}
                    onChange={(e) => setLawyersCount(Number(e.target.value))}
                    className="w-full accent-[var(--axia-gold)] cursor-pointer"
                  />
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-[var(--text-muted)]">
                    <span>١ محامٍ</span>
                    <span>٢٥ محامياً</span>
                    <span>٥٠ محامياً</span>
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs font-bold text-[var(--text-muted)]">
                    طبيعة القضايا الغالبة في المكتب:
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {[
                      { id: "corporate", label: "شركات ومحاكم اقتصادية" },
                      { id: "litigation", label: "تقاضٍ عام ونقض وجنايات" },
                      { id: "arbitration", label: "تحكيم دولي وعقود كبرى" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setFirmProfile(p.id as "corporate" | "litigation" | "arbitration")
                        }
                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                          firmProfile === p.id
                            ? "border-[var(--axia-gold)] bg-[var(--axia-gold)] text-black"
                            : "border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[var(--border-strong)] bg-[var(--panel)] p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    ساعات العمل الموفرة أسبوعياً
                  </span>
                  <Zap className="size-5 text-[var(--axia-gold-light)]" />
                </div>
                <div className="my-4">
                  <span className="font-mono text-3xl font-black text-[var(--axia-gold-light)]">
                    +{roiMetrics.weeklyHoursSaved} ساعة
                  </span>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    توفير وقت البحث في أحكام النقض، صياغة المسودات، وجدولة الرول
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--border-strong)] bg-[var(--panel)] p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    طاقة استيعابية لقضايا إضافية
                  </span>
                  <Scale className="size-5 text-[var(--axia-gold-light)]" />
                </div>
                <div className="my-4">
                  <span className="font-mono text-3xl font-black text-[var(--text)]">
                    +{roiMetrics.monthlyExtraMatters} ملفاً / شهر
                  </span>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    إدارة ملفات أكثر بنفس الفريق بفضل أتمتة المتابعة الإجرائية
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--border-strong)] bg-[var(--panel)] p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    القيمة التشغيلية السنوية المقدرة
                  </span>
                  <BadgeDollarSign className="size-5 text-emerald-500" />
                </div>
                <div className="my-4">
                  <span className="font-mono text-2xl font-black text-emerald-500">
                    {roiMetrics.annualEfficiencyValueEgp.toLocaleString("ar-EG")} ج.م
                  </span>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    عائد مباشر من رفع إنتاجية المحامين وضبط التحصيل المالي
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--axia-gold)]/35 bg-gradient-to-br from-[var(--axia-gold)]/15 via-[var(--panel)] to-[var(--panel)] p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-extrabold text-[var(--axia-gold-light)]">
                    جاهز لنقل مكتبك إلى الجيل القادم؟
                  </span>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                    احصل على مساحة عمل معزولة بالكامل لمكتبك مع تفعيل محرك «راجح» واستيراد سجل القضايا.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("request_license");
                    scrollToSection("top");
                  }}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--axia-gold)] px-4 py-2.5 text-xs font-extrabold text-black transition-all hover:brightness-110 cursor-pointer"
                >
                  <span>اطلب ترخيص مكتبك الآن</span>
                  <ChevronLeft className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: SOVEREIGN SECURITY & EGYPTIAN LEGAL COMPLIANCE */}
      <section
        id="security-section"
        className="relative z-10 border-t border-[var(--border)] bg-[var(--panel)]/40 py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[var(--border-strong)] bg-[var(--panel)] p-8 sm:p-12">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-500">
                  <Shield className="size-4" />
                  <span>معمارية الأمان والسرية المهنية</span>
                </div>

                <h2 className="text-2xl font-black leading-tight sm:text-3xl">
                  حماية سيادية مصممة خصيصاً لسرية ملفات الموكلين في مصر
                </h2>

                <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">
                  التزاماً بأصول السرية المهنية للمحاماة ومتطلبات التشريعات الرقمية المصرية، بُنيت منظومة AXIA Legal على مبدأ <strong className="text-[var(--text)]">انعدام الثقة الافتراضية (Zero-Trust Tenant Isolation)</strong> بحيث يستحيل تقنياً تداخل بيانات مكتب مع آخر أو إرسال مستندات الموكلين السرية لأي نماذج عامة غير معزولة.
                </p>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <div>
                      <strong className="text-[var(--text)]">
                        التوافق مع مبادئ قانون حماية البيانات الشخصية رقم ١٥١ لسنة ٢٠٢٠:
                      </strong>{" "}
                      <span className="text-[var(--text-muted)]">
                        تحديد صارم لنطاق معالجة البيانات وربط كل سجل بمالكه التنظيمي (`organization_id`) مع منع الحذف العشوائي غير الموثق.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <div>
                      <strong className="text-[var(--text)]">
                        التوافق مع متطلبات الأدلة الرقمية وأمن المعلومات (قانون ١٧٥ لسنة ٢٠١٨):
                      </strong>{" "}
                      <span className="text-[var(--text-muted)]">
                        توليد بصمة رقمية (`content_hash`) للمستندات المرفوعة مع سجل تدقيق آلي غير قابل للتزوير على مستوى قاعدة البيانات.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <div>
                      <strong className="text-[var(--text)]">
                        حوكمة الذكاء الاصطناعي (RAJIH Safety Policy):
                      </strong>{" "}
                      <span className="text-[var(--text-muted)]">
                        أدوات «راجح» مقيدة بالقراءة فقط (`Read-Only Tools`) ولا تملك صلاحية تعديل أو حذف أي سجل قضائي دون مراجعة واعتماد بشري صريح من المحامي.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 space-y-2.5">
                  <div className="grid size-10 place-items-center rounded-xl bg-[var(--axia-gold)]/12 text-[var(--axia-gold-light)]">
                    <Fingerprint className="size-5" />
                  </div>
                  <h4 className="text-xs font-extrabold text-[var(--text)]">
                    مصادقة خادم آمنة (SSR Auth)
                  </h4>
                  <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                    إدارة الجلسات عبر ملفات تعريف ارتباط محمية من الخادم (`@supabase/ssr`) دون كشف أي مفاتيح إدارية في المتصفح.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 space-y-2.5">
                  <div className="grid size-10 place-items-center rounded-xl bg-[var(--axia-gold)]/12 text-[var(--axia-gold-light)]">
                    <Database className="size-5" />
                  </div>
                  <h4 className="text-xs font-extrabold text-[var(--text)]">
                    عزل متعدد المستويات (Org + Matter ACL)
                  </h4>
                  <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                    عزل مزدوج على مستوى المكتب وعلى مستوى القضية الواحدة عبر دوال `private.can_access_matter`.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 space-y-2.5">
                  <div className="grid size-10 place-items-center rounded-xl bg-[var(--axia-gold)]/12 text-[var(--axia-gold-light)]">
                    <Activity className="size-5" />
                  </div>
                  <h4 className="text-xs font-extrabold text-[var(--text)]">
                    سجل تدقيق إلزامي (Core Audit)
                  </h4>
                  <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                    ستة مشغلات قاعدة بيانات (`Triggers`) تسجل تلقائياً الحقول المعدلة وهوية المستخدم وتوقيت العملية.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 space-y-2.5">
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/12 text-emerald-500">
                    <Award className="size-5" />
                  </div>
                  <h4 className="text-xs font-extrabold text-[var(--text)]">
                    حماية السجلات من الحذف الفوري
                  </h4>
                  <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                    منع صلاحيات `DELETE` المباشرة على السجلات القانونية والمالية لحماية أرشيف المكتب من الفقدان العرضي.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--panel)] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <AxiaBrandLogo mode="lockup" size="sm" />

          <div className="text-center sm:text-left text-[11px] text-[var(--text-muted)] space-y-1">
            <p className="font-semibold text-[var(--text)]">
              AXIA Legal OS — منظومة الإدارة القضائية والذكاء الاصطناعي للمكاتب القانونية
            </p>
            <p>
              جميع الحقوق محفوظة © ٢٠٢٦ · مصمم ومطور للعمل وفق معايير العزل السيادي وأمن البيانات.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[var(--bg)] text-[var(--text)]">
          <div className="flex flex-col items-center gap-3">
            <AxiaSymbolSvg className="size-12 animate-pulse" idPrefix="axia-suspense" />
            <span className="text-xs font-bold text-[var(--text-muted)]">
              جارٍ تهيئة بوابة AXIA Legal OS...
            </span>
          </div>
        </div>
      }
    >
      <LoginPortalContent />
    </Suspense>
  );
}
