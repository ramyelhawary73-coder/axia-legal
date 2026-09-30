'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ChevronDown, 
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
  X,
  Fingerprint,
  Cpu,
  BadgeDollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  // Authentication states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Registration states
  const [officeName, setOfficeName] = useState('');
  const [founderName, setFounderName] = useState('');
  const [syndicateId, setSyndicateId] = useState('');
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [officeType, setOfficeType] = useState('general');

  // Interactive ROI Calculator states
  const [lawyersCount, setLawyersCount] = useState(5);

  // Marketing Tabs state
  const [activeTab, setActiveTab] = useState<'ai' | 'schedule' | 'finance' | 'security'>('ai');

  // Live Playgrounds State Management
  const [activePlayground, setActivePlayground] = useState<'ai' | 'schedule' | 'finance' | 'security' | null>(null);
  
  // AI Playground states
  const [aiPrompt, setAiPrompt] = useState('فحص ثغرات عقد إيجار تجاري خاضع للقانون ٤ لسنة ١٩٩٦');
  const [aiOutput, setAiOutput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Calendar Playground states
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingTime, setNewMeetingTime] = useState('');
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Financial Playground states
  const [feeAmount, setFeeAmount] = useState(150000);
  const [partnerSplit, setPartnerSplit] = useState(60);

  // Security Playground states
  const [securityLogs, setSecurityLogs] = useState<string[]>([]);
  const [isSimulatingAttack, setIsSimulatingAttack] = useState(false);

  // Real-time calculated ROI stats
  const calculatedStats = useMemo(() => {
    const hoursSavedPerWeek = lawyersCount * 14; 
    const extraCapacityCases = Math.floor(lawyersCount * 3.5);
    const estimatedVatEgp = lawyersCount * 2400; 
    return {
      hoursSavedPerWeek,
      extraCapacityCases,
      estimatedVatEgp
    };
  }, [lawyersCount]);

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Simulate enterprise secure handshake
      await new Promise((resolve) => setTimeout(resolve, 1200));
      router.push('/dashboard');
    });
  };

  // Handle Register Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Simulate workspace setup and security provisioning
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push('/dashboard');
    });
  };

  // Launch Live Simulation Toasts
  const triggerToast = (message: string) => {
    setToastNotification(message);
    setTimeout(() => {
      setToastNotification(null);
    }, 5000);
  };

  // Run AI Simulation Generator
  const runAiSimulation = () => {
    setIsAiGenerating(true);
    setAiOutput('جاري تفعيل محرك راجح للذكاء الاصطناعي السيادي لمطابقة البنود مع أحكام النقض المصرية...');
    
    setTimeout(() => {
      if (aiPrompt.includes('إيجار')) {
        setAiOutput(`[تم التحليل بنجاح وفقاً لأحدث مبادئ الهيئة العامة للمواد المدنية بمحكمة النقض]
⚠️ الثغرة المكتشفة: البند الرابع يغفل تحديد آلية امتداد واضحة، مما قد يخضعه مستقبلاً لأحكام القانون القديم في حال الوفاة أو الإغلاق في غياب شرط الاستغلال الشخصي.
💡 التوصية القانونية: يُنصح بإضافة المادة التالية: "يخضع هذا العقد حصرياً لأحكام القانون رقم ٤ لسنة ١٩٩٦ والمادة ٥٥٨ من القانون المدني، ولا يمتد تحت أي ظرف لورثة المستأجر الأصلي إلا لمرة واحدة وبشرط ممارسة ذات النشاط التجاري."`);
      } else if (aiPrompt.includes('نصب')) {
        setAiOutput(`[تم صياغة الدفوع القانونية وفقاً للمادة ٣٣٦ من قانون العقوبات المصري]
💡 الدفع الأول: انتفاء ركن الاحتيال المادي وخلو الأوراق من أي طرق احتيالية خارجية أو مظاهر خارجية تؤيد ادعاءات المجني عليه.
💡 الدفع الثاني: انتفاء الرابطة السببية بين الطرق الادعائية المفترضة وتسليم المبالغ النقدية؛ حيث تم التسليم طواعية استناداً لمعاملة تجارية مدنية سابقة تخضع لولاية المحاكم المدنية وليس القضاء الجنائي.`);
      } else {
        setAiOutput(`[تحليل البند العقد بموجب القانون المدني وقانون التحكيم المصري رقم ٢٧ لسنة ١٩٩٤]
⚠️ العيب المرصود: بند التحكيم غامض ولا يحدد مركز التحكيم المعتمد أو القانون الإجرائي المطبق.
💡 الصياغة البديلة المقترحة: "أي نزاع ينشأ عن تنفيذ أو تفسير هذا العقد يتم تسويته نهائياً عن طريق التحكيم وفقاً لقواعد مركز القاهرة الإقليمي للتحكيم التجاري الدولي (CRCICA) بواسطة محكم واحد يتم تعيينه باتفاق الطرفين."`);
      }
      setIsAiGenerating(false);
      triggerToast('✨ تم فحص وصياغة المستند بنجاح بمطابقة أحكام النقض!');
    }, 1800);
  };

  // Run Calendar Setup Simulation
  const runCalendarSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle) return;
    triggerToast(`📅 تم جدولة الجلسة: "${newMeetingTitle}" بنجاح ومزامنتها مع تليجرام والموكلين!`);
    setNewMeetingTitle('');
    setNewMeetingDate('');
    setNewMeetingTime('');
  };

  // Run Security Penetration Block Simulation
  const runSecuritySimulation = () => {
    setIsSimulatingAttack(true);
    setSecurityLogs([]);
    const logs = [
      '⚡ بدء محاكاة هجوم اختراق لتجاوز عزل الموكلين (PostgreSQL Tenant Bypass Security Test)...',
      '🔍 محاولة إرسال استعلام مباشر لتسريب جدول (matters) التابع للعملاء الآخرين...',
      '🛠️ الكود البرمجي المهاجم: SELECT * FROM matters WHERE organization_id = \'external_tenant_id\';',
      '🛡️ تفعيل سياسة الحماية الجدارية Row Level Security (RLS) الخاصة بنظام AXIA...',
      '❌ إيقاف العملية فوراً وحظر عنوان المهاجم وحماية عزل الموكل بالكامل.'
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setSecurityLogs(prev => [...prev, log]);
        if (index === logs.length - 1) {
          setIsSimulatingAttack(false);
          triggerToast('🔒 تم اعتراض الهجوم وحظر المتسلل بنجاح بنسبة 100%!');
        }
      }, (index + 1) * 800);
    });
  };

  // Calculated variables for finance simulation
  const computedFinance = useMemo(() => {
    const vat = feeAmount * 0.14;
    const syndicateStamp = feeAmount * 0.015;
    const netProfit = feeAmount - vat - syndicateStamp;
    const partnerAmount = (netProfit * partnerSplit) / 100;
    const associatesAmount = netProfit - partnerAmount;
    return {
      vat: vat.toLocaleString('ar-EG'),
      syndicateStamp: syndicateStamp.toLocaleString('ar-EG'),
      netProfit: netProfit.toLocaleString('ar-EG'),
      partnerAmount: partnerAmount.toLocaleString('ar-EG'),
      associatesAmount: associatesAmount.toLocaleString('ar-EG')
    };
  }, [feeAmount, partnerSplit]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-white selection:bg-amber-500/20 selection:text-amber-200 antialiased font-sans pb-16">
      
      {/* Webkit Autofill Neutralizer Style Block - guarantees transparent background under autocompletes */}
      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }
      `}} />

      {/* GLOBAL SYSTEM BACKGROUND WATERMARKS FOR COMPLETE UNIFIED VISUAL SYMMETRY */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-amber-500/5 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-emerald-500/5 to-transparent blur-[150px]" />
        
        {/* Giant Sovereign Scale Of Justice - Center Floating Background Watermark (Fits everything perfectly) */}
        <div className="fixed inset-0 flex items-center justify-center opacity-[0.04] z-0 pointer-events-none">
          <svg className="w-[750px] h-[750px] text-amber-500" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <path d="M40 85 H60 M50 85 V30" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M15 35 H85" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M15 35 L5 55 M15 35 L25 55" stroke="currentColor" strokeWidth="0.4" />
            <path d="M0 55 Q15 65 30 55 Z" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.03" />
            <path d="M85 35 L75 55 M85 35 L95 55" stroke="currentColor" strokeWidth="0.4" />
            <path d="M70 55 Q85 65 100 55 Z" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.03" />
            <circle cx="50" cy="35" r="1.5" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* TOP FLOATING STICKY HEADER - PERMANENT ACCESS AT TOP-0 WITH ACTIVE BLUR */}
      <header className="sticky top-0 z-50 w-full px-6 py-4 backdrop-blur-xl bg-black/60 border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div onClick={scrollToTop} className="flex items-center gap-3 cursor-pointer">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500/20 to-amber-600/20 border border-amber-500/30">
              <Scale className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="font-bold text-xs tracking-wider text-white">
                AXIA Legal OS
              </div>
              <div className="text-[8px] text-amber-500 tracking-wider font-mono uppercase">
                Egyptian Practice & Intelligence OS
              </div>
            </div>
          </div>

          {/* Unified System Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-6 text-[11px] text-neutral-400">
            <a href="#features-section" className="hover:text-amber-500 transition-colors">مزايا المنظومة</a>
            <a href="#calculator-section" className="hover:text-amber-500 transition-colors">مؤشرات الأداء</a>
            <a href="#compliance-section" className="hover:text-amber-500 transition-colors">السيادة والأمان</a>
          </nav>

          {/* Symmetrical Instant Portal Entry Switcher (Fixes user pathing) */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[8px] font-mono tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              ● متصل سيادياً v1.2
            </span>
            <button 
              onClick={scrollToTop}
              className="text-[11px] bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 rounded-full px-4 py-1.5 transition-all duration-300 cursor-pointer font-bold"
            >
              تسجيل الدخول للمكتب 👤
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEW - NO CLIPPING SYSTEM WITH OPTIMAL DUAL-COLUMN HEIGHTS */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 lg:py-16 flex flex-col justify-center min-h-[calc(100vh-100px)]">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* COLUMN 1: Symmetrical Brand Message Column */}
          <div className="lg:col-span-6 space-y-6 text-right flex flex-col justify-center">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 mr-auto lg:mr-0 ml-auto">
              <Sparkles className="w-3.5 h-3.5" />
              <span>صرح التسيير القضائي والذكاء الاصطناعي الأسرع في مصر</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              مستقبل الممارسة القانونية في مصر
              <span className="block mt-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
                نظام التشغيل القضائي الفائق AXIA
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-xl">
              منظومة سحابية متكاملة مصممة وفقاً لأرفع المقاييس الأمنية والتقنية في وادي السيليكون، تدمج البحث الذكي في أحكام النقض مع إدارة الجلسات، القضايا والتدفقات المالية بمساعدة محرك الذكاء الاصطناعي السيادي «راجح».
            </p>

          </div>

          {/* COLUMN 2: Apple Style Micro-Precision Crystal Auth Card (Perfect Sizing) */}
          <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
            
            <div className="w-full max-w-sm relative">
              <div className="relative backdrop-blur-3xl bg-[#0b0c10]/40 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
                
                {/* iOS-Style Precise Micro Switcher */}
                <div className="relative flex p-1 bg-white/[0.03] rounded-full border border-white/5 mb-6">
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 rounded-full transition-all cursor-pointer ${
                      authMode === 'login' 
                        ? 'bg-amber-500 text-black shadow-md font-extrabold' 
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>تسجيل الدخول</span>
                  </button>
                  
                  <button
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 rounded-full transition-all cursor-pointer ${
                      authMode === 'register' 
                        ? 'bg-amber-500 text-black shadow-md font-extrabold' 
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>تأسيس مكتب</span>
                  </button>
                </div>

                {/* LOGIN FORM - 100% UNBOXED CRYSTAL LINE PATTERN */}
                {authMode === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-6">
                    
                    {/* Username input with crystal bottom border */}
                    <div className="relative border-b border-white/10 hover:border-white/20 focus-within:border-amber-500/80 transition-colors pb-1.5">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="البريد الإلكتروني المهني لمساحة العمل"
                        className="w-full bg-transparent border-none text-xs text-white placeholder-neutral-500 outline-none focus:ring-0 px-0 pb-1 pt-1"
                      />
                      <span className="absolute left-0 bottom-2 text-neutral-600">
                        <Mail className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Password input with crystal bottom border */}
                    <div className="relative border-b border-white/10 hover:border-white/20 focus-within:border-amber-500/80 transition-colors pb-1.5 pt-2">
                      <div className="absolute left-0 top-[-8px] text-[10px] text-neutral-500">
                        <a href="#" className="hover:text-amber-500 transition-colors font-medium">نسيت كلمة المرور؟</a>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="كلمة المرور الأمنية لمساحة العمل"
                        className="w-full bg-transparent border-none text-xs text-white placeholder-neutral-500 outline-none focus:ring-0 pl-12 pr-0 pb-1 pt-1"
                      />
                      <div className="absolute left-0 bottom-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-neutral-600 hover:text-neutral-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <Lock className="w-3.5 h-3.5 text-neutral-600" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-0.5 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-white/10 bg-white/5 text-amber-500 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                        />
                        <span className="text-[10px] text-neutral-400 font-medium">تذكر جلستي</span>
                      </label>
                      <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                        <Shield className="w-2.5 h-2.5" />
                        عزل RLS
                      </span>
                    </div>

                    {/* Apple Style Sleek Pill Button */}
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 hover:border-amber-500/20 text-white font-bold text-xs py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      {isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>الدخول لمساحة العمل</span>
                      )}
                    </button>
                  </form>
                ) : (
                  /* REGISTER OFFICE FORM - 100% UNBOXED CRYSTAL LINE PATTERN */
                  <form onSubmit={handleRegisterSubmit} className="space-y-5">
                    
                    <div className="relative border-b border-white/10 hover:border-white/20 focus-within:border-amber-500/80 transition-colors pb-1.5">
                      <input
                        type="text"
                        required
                        value={officeName}
                        onChange={(e) => setOfficeName(e.target.value)}
                        placeholder="اسم المكتب أو الكيان القانوني الكلي"
                        className="w-full bg-transparent border-none text-xs text-white placeholder-neutral-500 outline-none focus:ring-0 px-0 pb-1 pt-1"
                      />
                    </div>

                    <div className="relative border-b border-white/10 hover:border-white/20 focus-within:border-amber-500/80 transition-colors pb-1.5 pt-1">
                      <input
                        type="text"
                        required
                        value={founderName}
                        onChange={(e) => setFounderName(e.target.value)}
                        placeholder="اسم الشريك المؤسس / المدير المسؤول"
                        className="w-full bg-transparent border-none text-xs text-white placeholder-neutral-500 outline-none focus:ring-0 px-0 pb-1 pt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="relative border-b border-white/10 hover:border-white/20 focus-within:border-amber-500/80 transition-colors pb-1.5">
                        <input
                          type="text"
                          required
                          value={syndicateId}
                          onChange={(e) => setSyndicateId(e.target.value)}
                          placeholder="رقم القيد بالنقابة"
                          className="w-full bg-transparent border-none text-xs text-white placeholder-neutral-500 outline-none focus:ring-0 px-0 pb-1 pt-1"
                        />
                      </div>
                      <div className="relative border-b border-white/10 hover:border-white/20 focus-within:border-amber-500/80 transition-colors pb-1.5">
                        <select
                          value={officeType}
                          onChange={(e) => setOfficeType(e.target.value)}
                          className="w-full bg-transparent border-none text-xs text-neutral-400 outline-none focus:ring-0 px-0 pb-1 pt-1"
                        >
                          <option value="general" className="bg-[#08080A]">قضاء عام وجنائي</option>
                          <option value="corporate" className="bg-[#08080A]">شركات واستثمار</option>
                          <option value="civil" className="bg-[#08080A]">مدني وتعويضات</option>
                          <option value="arbitration" className="bg-[#08080A]">تحكيم وتنازع</option>
                        </select>
                      </div>
                    </div>

                    <div className="relative border-b border-white/10 hover:border-white/20 focus-within:border-amber-500/80 transition-colors pb-1.5 pt-1 flex items-center">
                      <input
                        type="text"
                        required
                        value={workspaceUrl}
                        onChange={(e) => setWorkspaceUrl(e.target.value)}
                        placeholder="رابط مساحة العمل المطلوبة"
                        className="w-full bg-transparent border-none text-xs text-left font-mono text-white placeholder-neutral-600 outline-none focus:ring-0 px-0 pb-1 pt-1"
                      />
                      <span className="absolute left-0 bottom-2 text-[10px] font-mono text-neutral-500 pointer-events-none select-none pl-1">
                        .axia.legal
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 hover:border-amber-500/20 text-white font-bold text-xs py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        {isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>تأسيس صرح المكتب السحابي</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-6 pt-5 border-t border-white/5 text-center">
                  <span className="text-[10px] text-neutral-500 leading-relaxed block">
                    مساحة العمل تخضع كلياً لبروتوكول السرية المتبادلة بموجب لوائح وزارة الاتصالات وتكنولوجيا المعلومات ونقابة المحامين المصرية.
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Scroll indicator with smooth loop down animation */}
        <div className="flex flex-col items-center justify-center py-4 mt-8">
          <a href="#features-section" className="flex flex-col items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors">
            <span>استكشف صرح المزايا والمحاكاة الحية الفورية</span>
            <ChevronDown className="w-4 h-4 text-amber-500 animate-bounce" />
          </a>
        </div>
      </main>

      {/* COMPREHENSIVE OUTSIDE SHOWCASE SECTION (FIXED HEIGHT BUGS REMOVED - h-auto NATURAL FLOW) */}
      <section id="features-section" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
            أقوى الأدوات في خدمة قضيتك وعملائك
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
            انقر على زر <span className="text-amber-500 font-bold">⚡ محاكاة حية</span> بجانب أي تبويب لتجربة واجهة النظام الحقيقية وإطلاق الأتمتة والذكاء بنفسك فوراً!
          </p>
        </div>

        {/* Dynamic Showcase Navigation tabs alongside Interactive Sandbox buttons (Flex height layout) */}
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          
          {/* Tab Selection Panel with trigger buttons */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            
            {/* TAB 1: RAJIH AI */}
            <div className={`p-5 rounded-2xl border transition-all relative ${
              activeTab === 'ai' 
                ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30 shadow-lg' 
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
            }`}>
              <div className="flex items-start justify-between">
                <button 
                  onClick={() => setActiveTab('ai')}
                  className="flex-1 text-right outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Cpu className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-sm text-white">الذكاء القضائي «راجح»</h3>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    فحص ثغرات العقود والمذكرات، استكشاف مواد القوانين وصياغة دفوع قوية مبنية على أحكام النقض الحقيقية.
                  </p>
                </button>
                <button
                  onClick={() => setActivePlayground('ai')}
                  className="mr-3 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-500/20 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ محاكاة حية</span>
                </button>
              </div>
            </div>

            {/* TAB 2: COURT CALENDAR */}
            <div className={`p-5 rounded-2xl border transition-all relative ${
              activeTab === 'schedule' 
                ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30 shadow-lg' 
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
            }`}>
              <div className="flex items-start justify-between">
                <button 
                  onClick={() => setActiveTab('schedule')}
                  className="flex-1 text-right outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-sm text-white">إخطارات قلم الجلسات والمهام</h3>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    مزامنة وتتبع الجلسات وتأجيلات المحاكم مع أتمتة الرسائل الفورية للموكلين لمنع أي تخلف إجرائي.
                  </p>
                </button>
                <button
                  onClick={() => setActivePlayground('schedule')}
                  className="mr-3 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-500/20 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ محاكاة حية</span>
                </button>
              </div>
            </div>

            {/* TAB 3: FINANCE */}
            <div className={`p-5 rounded-2xl border transition-all relative ${
              activeTab === 'finance' 
                ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30 shadow-lg' 
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
            }`}>
              <div className="flex items-start justify-between">
                <button 
                  onClick={() => setActiveTab('finance')}
                  className="flex-1 text-right outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <BadgeDollarSign className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-sm text-white">إيرادات الأتعاب وحوكمة الحسابات</h3>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    تنظيم ودائع الموكلين، مصاريف الخبراء والدمغات القضائية وتوزيع نسب أتعاب الشركاء لحظياً.
                  </p>
                </button>
                <button
                  onClick={() => setActivePlayground('finance')}
                  className="mr-3 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-500/20 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ محاكاة حية</span>
                </button>
              </div>
            </div>

            {/* TAB 4: TENANT SECURITY */}
            <div className={`p-5 rounded-2xl border transition-all relative ${
              activeTab === 'security' 
                ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30 shadow-lg' 
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
            }`}>
              <div className="flex items-start justify-between">
                <button 
                  onClick={() => setActiveTab('security')}
                  className="flex-1 text-right outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-sm text-white">السيادة المطلقة وحماية البيانات (RLS)</h3>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    جدران حماية سحابية صارمة تعزل ملفات موكليك وقضاياك عن أي مكاتب أو هجمات خارجية بشكل تام.
                  </p>
                </button>
                <button
                  onClick={() => setActivePlayground('security')}
                  className="mr-3 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-500/20 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ محاكاة حية</span>
                </button>
              </div>
            </div>

          </div>

          {/* Dynamic Graphic Preview Frame (No fixed height bounds to prevent clipping of inside preview elements) */}
          <div className="w-full lg:w-2/3 h-auto min-h-[420px] rounded-3xl relative backdrop-blur-xl bg-neutral-950/40 border border-white/10 p-6 sm:p-8 flex flex-col justify-between gap-6">
            
            {/* Background aesthetic decor inside the frame */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="text-xs text-neutral-500 font-mono mr-2">AXIA Legal OS Preview Console</span>
              </div>
              <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-md text-amber-400 border border-white/5 font-mono">
                {activeTab === 'ai' ? 'RAJIH_AGENT_V1.2' : activeTab === 'schedule' ? 'CALENDAR_DAEMON' : activeTab === 'finance' ? 'FINANCIAL_ENGINE' : 'SECURITY_POSTURE_OK'}
              </span>
            </div>

            {/* Content Visuals Based on activeTab */}
            <div className="flex-1 flex items-center justify-center py-2 overflow-hidden">
              <AnimatePresence mode="wait">
                
                {/* AI Visual */}
                {activeTab === 'ai' && (
                  <motion.div 
                    key="ai"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-lg space-y-4 text-right"
                  >
                    <div className="bg-white/[0.02] border border-white/10 p-4 rounded-xl font-mono text-[11px] leading-relaxed relative">
                      <div className="text-amber-500 mb-1">{"// استعلام ذكاء اصطناعي سيادي لراجح:"}</div>
                      <div className="text-neutral-300 mb-3">{"RAJIH.analyze_contract(type: 'commercial_lease', laws: ['Law_4_1996']);"}</div>
                      <div className="text-emerald-400 font-bold mb-1">{"[الحالة: تم التحقق والمطابقة مع مبدأ محكمة النقض رقم ٥٤٢ لسنة ٨٢ ق]"}</div>
                      <div className="text-neutral-400">
                        &quot;مبدأ النقض: عقود الإيجار الخاضعة للقانون ٤ لسنة ١٩٩٦ ينتهي بانتهاء مدتها المحددة فيها، ولا تمتد إلا باتفاق مكتوب جديد.&quot;
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setActivePlayground('ai')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 rounded-full text-xs font-bold transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>تشغيل صائغ العقود الفوري</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Calendar Visual */}
                {activeTab === 'schedule' && (
                  <motion.div 
                    key="schedule"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-lg space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                      <div className="bg-white/[0.02] border border-white/10 p-3.5 rounded-xl">
                        <div className="text-xs text-amber-500 font-semibold mb-1">محكمة النقض (الدائرة المدنية)</div>
                        <div className="text-[11px] text-white">استئناف بطلان حكم التعويض</div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-2">الأحد ٢٨ سبتمبر ٢٠٢٦ - الساعة ٠٩:٠٠ ص</div>
                      </div>
                      <div className="bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-xl">
                        <div className="text-xs text-emerald-400 font-semibold mb-1">جلسة محكمة الجنايات</div>
                        <div className="text-[11px] text-white">قضية جنايات التزوير والرشوة</div>
                        <div className="text-[10px] text-emerald-500 font-mono mt-2">الأربعاء ١ أكتوبر ٢٠٢٦ - الساعة ١١:٠٠ ص</div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setActivePlayground('schedule')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 rounded-full text-xs font-bold transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>تأسيس تنبيه جلسة لحظي</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Finance Visual */}
                {activeTab === 'finance' && (
                  <motion.div 
                    key="finance"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-md space-y-3"
                  >
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2.5 text-right text-xs">
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>أتعاب تأسيس وإدراج شركة مساهمة:</span>
                        <span className="text-white font-semibold">١٥٠,٠٠٠ ج.م</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>ضريبة القيمة المضافة المصرية (١٤%):</span>
                        <span className="text-red-400">٢١,٠٠٠ ج.م</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>دمغات ورسوم نقابة المحامين (١.٥%):</span>
                        <span className="text-red-400">٢,٢٥٠ ج.م</span>
                      </div>
                      <div className="border-t border-white/5 pt-2 flex justify-between items-center text-emerald-400 font-bold">
                        <span>صافي الأرباح الموزعة للمكتب:</span>
                        <span>١٢٦,٧٥٠ ج.م</span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setActivePlayground('finance')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 rounded-full text-xs font-bold transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>فتح الحاسبة المالية المتقدمة</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Security Visual */}
                {activeTab === 'security' && (
                  <motion.div 
                    key="security"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-lg space-y-4"
                  >
                    <div className="bg-neutral-900 border border-white/10 p-4 rounded-xl font-mono text-[10px] leading-relaxed text-right text-emerald-400">
                      <div>{"$ axia_security_policy --verify --org-id=zulficar"}</div>
                      <div className="text-white">{"[system] Checking isolation parameters for user claims..."}</div>
                      <div className="text-emerald-500">{"✔ postgres_row_level_security_filter: ENABLED"}</div>
                      <div className="text-emerald-500">{"✔ tenant_isolation_data_crypt_handshake: OK"}</div>
                      <div className="text-white">{"[success] RLS verified. Unauthorized access attempts to database blocked automatically."}</div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setActivePlayground('security')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 rounded-full text-xs font-bold transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>محاكاة هجوم اختراق والتصدي له</span>
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-neutral-500">
              <span>جميع العمليات والمخرجات معزولة ومحمية بالكامل ولا تشارك البيانات مع أي خدمات خارجية.</span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono mt-2 sm:mt-0">
                <CheckCircle2 className="w-3 h-3" />
                تأمين حماية فئة عسكرية SSL/TLS
              </span>
            </div>

          </div>

        </div>

      </section>

      {/* INTERACTIVE VALUE & ROI CALCULATOR SECTION */}
      <section id="calculator-section" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-amber-500/[0.01] to-transparent pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>مؤشرات الكفاءة التشغيلية والمالية للمكتب</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 leading-tight">
              احسب مقدار توفير الوقت والأرباح السحابية لمكتبك الموقر
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-8">
              قم بسحب المؤشر لتحديد عدد المحامين والمستشارين بمكتبك القانوني لتكتشف فوراً حجم المهام الإدارية التي يتولاها محرك AXIA OS ليوفر الوقت الثمين للتفرغ الكامل للتخطيط القضائي وكتابة المذكرات الحساسة.
            </p>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-3">
                  <span className="text-neutral-400">عدد المستشارين والمحامين بالمكتب:</span>
                  <span className="text-amber-400 font-mono text-sm">{lawyersCount} محامين</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={lawyersCount}
                  onChange={(e) => setLawyersCount(parseInt(e.target.value))}
                  className="w-full accent-amber-500 bg-white/10 h-2 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-600 mt-2 font-mono">
                  <span>١ مستشار</span>
                  <span>٢٥ مستشار</span>
                  <span>٥٠ مستشار</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Stat Box 1 */}
            <div className="backdrop-blur-xl bg-white/[0.02] border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">ساعات العمل الموفرة أسبوعياً</span>
                <ClockIcon className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">
                  +{calculatedStats.hoursSavedPerWeek} ساعة
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  أتمتة الجلسات، البحث والمطابقة وتنبيه الموكلين
                </div>
              </div>
            </div>

            {/* Stat Box 2 */}
            <div className="backdrop-blur-xl bg-white/[0.02] border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">طاقة استيعابية لقضايا إضافية</span>
                <Scale className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">
                  +{calculatedStats.extraCapacityCases} قضايا شهرياً
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  زيادة إنتاجية ومعدلات ربح مستدامة للمكتب
                </div>
              </div>
            </div>

            {/* Stat Box 3 */}
            <div className="backdrop-blur-xl bg-white/[0.02] border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">تقديرات القيمة المضافة المحوكمة</span>
                <BadgeDollarSign className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">
                  {calculatedStats.estimatedVatEgp.toLocaleString('ar-EG')} ج.م
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  حوكمة الضرائب والدمغات المستقطعة بدقة برمجية
                </div>
              </div>
            </div>

            {/* Stat Box 4 */}
            <div className="backdrop-blur-xl bg-white/[0.02] border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">الضمان والموثوقية التقنية</span>
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                  99.99%
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  معدل استقرار وضمان الخدمة السحابية المشفرة
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* NATIONAL SOVEREIGN SECURITY & LEGAL COMPLIANCE SEALS (NO CLIPPING, SCROLL NATURAL ROW) */}
      <section id="compliance-section" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="backdrop-blur-2xl bg-neutral-950/40 border border-white/10 rounded-3xl p-8 sm:p-12 relative">
          
          <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-emerald-500/[0.02] blur-[120px]" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                <Shield className="w-4 h-4" />
                <span>الامتثال السيادي والأمن القومي للبيانات</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                مطابقة تامة لكافة التشريعات الرقمية في جمهورية مصر العربية
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                إن خصوصية الموكلين وحماية سرية الدفاع هي الأساس الأخلاقي لمهنة المحاماة. صممت منظومة AXIA Legal OS لتطابق أعلى معايير الخصوصية وعزل البيانات ومكافحة الجريمة المعلوماتية في مصر.
              </p>

              <div className="space-y-3.5 text-xs text-neutral-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white ml-1">قانون حماية البيانات الشخصية رقم ١٥١ لسنة ٢٠٢٠:</span>
                    عزل تام لبيانات الموكلين ببيئة سحابية مشفرة مشروطة بمنح حقوق الولوج وإقرار الخصوصية الفوري لكل مكتب.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white ml-1">قانون مكافحة جرائم تقنية المعلومات رقم ١٧٥ لسنة ٢٠١٨:</span>
                    أنظمة تتبع وتسجيل الأحداث والولوج (Core Audit Tracker) لمنع ورصد أي تلاعب أو استخدام غير مخول للبيانات.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white ml-1">السرية المهنية المعتمدة من نقابة المحامين:</span>
                    المنظومة لا تستخدم ملقمات أو خوادم وسيطة لمشاركة البيانات، بل تعتمد على تشفير مباشر مخصص لكل مساحة عمل.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Badge 1 */}
              <div className="bg-white/[0.02] border border-white/5 hover:border-white/10 p-6 rounded-2xl text-center space-y-3 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-xs text-white">تشفير الهوية الذاتي</h4>
                <p className="text-[10px] text-neutral-500 leading-normal">
                  حماية حساب الشريك والمدير بمفاتيح أمنية مشفرة بالكامل.
                </p>
              </div>

              {/* Badge 2 */}
              <div className="bg-white/[0.02] border border-white/5 hover:border-white/10 p-6 rounded-2xl text-center space-y-3 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
                  <Database className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-xs text-white">عزل قواعد البيانات RLS</h4>
                <p className="text-[10px] text-neutral-500 leading-normal">
                  فصل بيانات المستندات والقضايا لكل منظمة بشكل حتمي وقاطع.
                </p>
              </div>

              {/* Badge 3 */}
              <div className="bg-white/[0.02] border border-white/5 hover:border-white/10 p-6 rounded-2xl text-center space-y-3 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
                  <Activity className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-xs text-white">رصد وسجل التدقيق</h4>
                <p className="text-[10px] text-neutral-500 leading-normal">
                  تسجيل حركات الاستعلام والتأكيد الفوري لمكافحة التسريبات.
                </p>
              </div>

              {/* Badge 4 */}
              <div className="bg-white/[0.02] border border-white/5 hover:border-white/10 p-6 rounded-2xl text-center space-y-3 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-xs text-emerald-400">معايير أمان معتمدة</h4>
                <p className="text-[10px] text-neutral-500 leading-normal">
                  مطابقة لأمن الاتصالات القومية والمعايير العسكرية للتشفير.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* MODERN FLOATING FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-black/60 backdrop-blur-xl py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center">
              <Scale className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="font-bold text-xs text-white tracking-wider block">AXIA Legal OS</span>
              <span className="text-[9px] text-neutral-500 font-mono">The Premium Sovereign AI Platform.</span>
            </div>
          </div>

          <div className="text-center md:text-right text-[10px] text-neutral-500 space-y-1">
            <p>© ٢٠٢٦ مجموعة AXIA الدولية للأنظمة السحابية والحلول القضائية. جميع الحقوق محفوظة.</p>
            <p>المنصة مرخصة ومسجلة طبقاً للوائح الاتصالات والأمن القومي بجمهورية مصر العربية.</p>
          </div>
        </div>
      </footer>

      {/* STATIC TOASTER PORTAL FOR EMITTED PLATFORM NOTIFICATIONS */}
      {toastNotification && (
        <div className="fixed top-24 left-6 z-50 animate-slide-in-left max-w-sm">
          <div className="backdrop-blur-2xl bg-black/85 border border-amber-500/30 p-4 rounded-2xl shadow-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-right">
              <h4 className="text-xs font-bold text-white">إخطار محاكاة AXIA</h4>
              <p className="text-[11px] text-neutral-400 leading-normal">{toastNotification}</p>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED INTERACTIVE SIMULATION PLAYGROUND MODALS (RESPONSIVE HEIGHT FOR PERFECT VIEWPORT FIT) */}
      <AnimatePresence>
        {activePlayground !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Dark glass backdrop layout */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePlayground(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Glass Container - Responsive Height scroll guaranteed */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              
              {/* Header inside the interactive simulator */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Zap className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white">
                      {activePlayground === 'ai' ? 'محاكاة ذكاء راجح القضائي' : activePlayground === 'schedule' ? 'محاكاة قلم الجلسات الذكي' : activePlayground === 'finance' ? 'محاكاة الحسابات والحوكمة الضريبية والشركاء' : 'محاكاة اختبار اختراق RLS'}
                    </h3>
                    <p className="text-[9px] text-neutral-500">تجربة تفاعلية لمحاكاة بيئة النظام الفعلية من الخارج</p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePlayground(null)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dynamic Playground Body Panels (Scroll inner content) */}
              <div className="p-6 overflow-y-auto flex-1 text-right space-y-5">
                
                {/* 1. AI PLAYGROUND PANEL */}
                {activePlayground === 'ai' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-neutral-400">
                        اختر نموذجاً مسبقاً للفحص أو أدخل مستندك المخصص:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          onClick={() => setAiPrompt('فحص ثغرات عقد إيجار تجاري خاضع للقانون ٤ لسنة ١٩٩٦')}
                          className="px-2.5 py-1.5 rounded-xl text-[10px] border border-white/5 bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
                        >
                          ثغرة عقد إيجار تجاري
                        </button>
                        <button
                          onClick={() => setAiPrompt('دفع في جنحة نصب بموجب المادة ٣٣٦ عقوبات')}
                          className="px-2.5 py-1.5 rounded-xl text-[10px] border border-white/5 bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
                        >
                          دفوع جنحة نصب واحتيال
                        </button>
                        <button
                          onClick={() => setAiPrompt('فحص ثغرات شرط تحكيم غامض أو غير مكتمل')}
                          className="px-2.5 py-1.5 rounded-xl text-[10px] border border-white/5 bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
                        >
                          ثغرة شرط التحكيم
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="اكتب مستندك أو دفعك القانوني هنا..."
                        rows={3}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-500/40"
                      />
                    </div>

                    <div className="flex justify-start">
                      <button
                        onClick={runAiSimulation}
                        disabled={isAiGenerating}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-full shadow-lg cursor-pointer"
                      >
                        {isAiGenerating ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>جاري معالجة أحكام النقض...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>إطلاق فحص وصياغة راجح الذكية</span>
                          </>
                        )}
                      </button>
                    </div>

                    {aiOutput && (
                      <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-2 text-right">
                        <div className="flex items-center gap-2 text-amber-500 border-b border-white/5 pb-2">
                          <Terminal className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold font-mono">مخرجات محرك الذكاء القضائي السيادي:</span>
                        </div>
                        <p className="text-[11px] font-mono leading-relaxed text-neutral-300 whitespace-pre-wrap">
                          {aiOutput}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. COURT CALENDAR PLAYGROUND PANEL */}
                {activePlayground === 'schedule' && (
                  <form onSubmit={runCalendarSimulation} className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">عنوان الجلسة أو الإجراء المطلبي</label>
                        <input
                          type="text"
                          required
                          value={newMeetingTitle}
                          onChange={(e) => setNewMeetingTitle(e.target.value)}
                          placeholder="مثال: جلسة المرافعة الختامية في دعوى التعويض الكلي"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">الدائرة القضائية</label>
                        <select className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                          <option>مدني كلي جنوب القاهرة</option>
                          <option>جنايات مستأنف شمال</option>
                          <option>جنح مستعجل الدقي</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">تاريخ الحضور</label>
                        <input
                          type="date"
                          required
                          value={newMeetingDate}
                          onChange={(e) => setNewMeetingDate(e.target.value)}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">توقيت الحضور</label>
                        <input
                          type="time"
                          required
                          value={newMeetingTime}
                          onChange={(e) => setNewMeetingTime(e.target.value)}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-start">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-full shadow-lg cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>إطلاق أتمتة الجلسة وبث الإشعار</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* 3. FINANCE PLAYGROUND PANEL */}
                {activePlayground === 'finance' && (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-neutral-400">قيمة الأتعاب المقررة للقضية:</span>
                          <span className="text-amber-500 font-mono font-bold">{feeAmount.toLocaleString('ar-EG')} ج.م</span>
                        </div>
                        <input
                          type="range"
                          min="10000"
                          max="1000000"
                          step="10000"
                          value={feeAmount}
                          onChange={(e) => setFeeAmount(parseInt(e.target.value))}
                          className="w-full accent-amber-500 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-neutral-400">نسبة التوزيع للشريك المدير:</span>
                          <span className="text-amber-500 font-mono font-bold">%{partnerSplit}</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={partnerSplit}
                          onChange={(e) => setPartnerSplit(parseInt(e.target.value))}
                          className="w-full accent-amber-500 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="bg-[#121216] border border-white/5 p-4 rounded-xl space-y-2 text-xs leading-relaxed">
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>أتعاب الممارسة الكلية:</span>
                        <span className="text-white font-mono font-semibold">{feeAmount.toLocaleString('ar-EG')} ج.م</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>قيمة مضافة مصرية (١٤%):</span>
                        <span className="text-red-400 font-mono">+{computedFinance.vat} ج.م</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>دمغة ورسوم صندوق العلاج (١.٥%):</span>
                        <span className="text-red-400 font-mono">+{computedFinance.syndicateStamp} ج.م</span>
                      </div>
                      <div className="border-t border-white/5 pt-2 flex justify-between items-center text-emerald-400 font-bold">
                        <span>صافي الإيرادات:</span>
                        <span className="font-mono">{computedFinance.netProfit} ج.م</span>
                      </div>
                      <div className="border-t border-white/5 pt-2 flex justify-between items-center text-neutral-400">
                        <span>نصيب الشريك ({partnerSplit}%):</span>
                        <span className="text-white font-mono font-bold">{computedFinance.partnerAmount} ج.م</span>
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <button
                        onClick={() => triggerToast('📈 تم ترحيل الحسابات وتحديث الميزانية بنجاح!')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-full cursor-pointer shadow-lg"
                      >
                        <BadgeDollarSign className="w-3.5 h-3.5" />
                        <span>ترحيل وتحديث الميزانية السحابية</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. SECURITY ATTACK SIMULATION PLAYGROUND PANEL */}
                {activePlayground === 'security' && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      اختبر مدى متانة جدار حماية عزل الموكلين (Row Level Security). ستقوم المحاكاة بإطلاق هجوم استعلام غير مخول من طرف مستخدم غريب لتجاوز حدود البيانات ورؤية كيف تتصدى لها حماية الخادم فورياً.
                    </p>

                    <div className="flex justify-start">
                      <button
                        onClick={runSecuritySimulation}
                        disabled={isSimulatingAttack}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full cursor-pointer shadow-lg"
                      >
                        {isSimulatingAttack ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>جاري تصدي الهجوم...</span>
                          </>
                        ) : (
                          <span>بدء اختبار هجوم الاختراق RLS</span>
                        )}
                      </button>
                    </div>

                    {securityLogs.length > 0 && (
                      <div className="bg-neutral-900 border border-white/10 p-4 rounded-xl space-y-1.5 font-mono text-[10px] text-right">
                        {securityLogs.map((log, index) => (
                          <div 
                            key={index} 
                            className={log.startsWith('❌') ? 'text-red-500 font-bold' : log.startsWith('🛡️') ? 'text-emerald-400' : 'text-neutral-400'}
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Footer within sandbox dialog */}
              <div className="p-4 bg-white/[0.01] border-t border-white/10 flex justify-end shrink-0">
                <button
                  onClick={() => setActivePlayground(null)}
                  className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-full border border-white/10 transition-colors cursor-pointer"
                >
                  إغلاق المحاكاة
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Custom Clock Icon to clear any unused imports
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
