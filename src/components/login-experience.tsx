"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Pause,
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { login } from "@/app/login/actions";
import { AxiaLogo } from "@/components/axia-logo";
import {
  LoginAtmosphere,
  LoginBrandScene,
} from "@/components/login-atmosphere";
import styles from "./login-atmosphere.module.css";

function LoginSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#d8b978] px-5 py-3 text-sm font-semibold text-[#152329] transition hover:bg-[#e8cc92] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b978] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />{" "}
          جارٍ تسجيل الدخول…
        </>
      ) : (
        <>
          الدخول إلى مساحة العمل
          <ArrowLeft aria-hidden="true" className="size-4" />
        </>
      )}
    </button>
  );
}

export function LoginExperience({
  nextPath,
  errorMessage,
  authConfigured,
}: {
  nextPath: string;
  errorMessage: string | null;
  authConfigured: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const inputClass =
    "mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-white/[0.035] px-4 text-sm text-[#f5f2eb] placeholder:text-[#839298] focus:border-[#d8b978] focus:outline-none focus:ring-2 focus:ring-[#d8b978]/20 disabled:opacity-50";

  return (
    <main
      className={`relative bg-[#101c23] text-[#f5f2eb] ${styles.surface}`}
      dir="rtl"
      data-login-motion={motionPaused ? "paused" : "running"}
    >
      <LoginAtmosphere />
      <div className="relative mx-auto flex min-h-dvh max-w-[1440px] flex-col px-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between gap-6 border-b border-white/[0.08] py-6 sm:py-8">
          <AxiaLogo className="text-[#d8b978]" />
          <div className="flex items-center gap-4">
            <span className="hidden text-xs tracking-wide text-[#aab6bb] md:block">
              مساحة عمل قانونية · AXIA Legal
            </span>
            <button
              type="button"
              aria-pressed={motionPaused}
              onClick={() => setMotionPaused((paused) => !paused)}
              className={styles.motionControl}
            >
              {motionPaused ? (
                <Play className="size-3.5" aria-hidden="true" />
              ) : (
                <Pause className="size-3.5" aria-hidden="true" />
              )}
              {motionPaused ? "تشغيل الحركة" : "إيقاف الحركة"}
            </button>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-2 lg:gap-20 lg:py-12">
          <section className="order-2 max-w-xl lg:order-1">
            <LoginBrandScene />
            <div className="mb-6 flex items-center gap-2 text-xs font-medium tracking-wide text-[#d8b978]">
              <span className="h-px w-8 bg-[#d8b978]/60" /> للممارسة القانونية
              الحديثة
            </div>
            <h1 className="text-4xl font-semibold leading-[1.4] tracking-tight sm:text-5xl">
              وضوح في كل قضية.
              <br />
              <span className="text-[#d8b978]">ثقة في كل خطوة.</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-8 text-[#aab6bb] sm:text-base">
              مساحة واحدة لتنظيم عمل مكتبك، ومتابعة القضايا والجلسات والمستندات،
              بمساعدة راجح.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#bbc6ca]">
              <span className="inline-flex items-center gap-2">
                <Scale className="size-4 text-[#d8b978]" aria-hidden="true" />{" "}
                إدارة الممارسة القانونية
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  className="size-4 text-[#d8b978]"
                  aria-hidden="true"
                />{" "}
                وصول بحسب الصلاحيات
              </span>
            </div>
            <div className="mt-10 max-w-md rounded-2xl border border-[#d8b978]/15 bg-[#d8b978]/[0.035] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Sparkles
                  className="size-5 text-[#d8b978]"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-semibold">
                  RAJIH AI{" "}
                  <span className="mr-2 font-normal text-[#d8b978]">راجح</span>
                </h2>
              </div>
              <p className="mt-3 text-xs leading-7 text-[#aab6bb]">
                مساعدك للبحث والصياغة القانونية داخل مساحة العمل. تبقى مراجعة
                النتائج والقرار المهني بيد المحامي.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="login-title"
            className={`order-1 mx-auto w-full max-w-md rounded-3xl p-7 sm:p-10 lg:order-2 ${styles.loginCard}`}
          >
            <span className="mb-6 inline-flex size-11 items-center justify-center rounded-xl border border-[#d8b978]/20 bg-[#d8b978]/[0.06]">
              <LockKeyhole
                className="size-5 text-[#d8b978]"
                aria-hidden="true"
              />
            </span>
            <h2 id="login-title" className="text-2xl font-semibold">
              مرحبًا بعودتك
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#aab6bb]">
              سجّل الدخول بحسابك للوصول إلى مساحة عمل مؤسستك.
            </p>

            {!authConfigured && (
              <p
                role="status"
                className="mt-6 rounded-xl border border-[#d8b978]/25 bg-[#d8b978]/10 p-4 text-sm leading-7 text-[#e8cc92]"
              >
                خدمة الدخول غير متاحة حاليًا. يرجى التواصل مع مسؤول النظام
                لاستكمال إعدادها.
              </p>
            )}
            {errorMessage && (
              <p
                role="alert"
                className="mt-6 rounded-xl border border-red-300/20 bg-red-300/[0.06] p-4 text-sm leading-7 text-red-200"
              >
                {errorMessage}
              </p>
            )}

            <form action={login} className="mt-7 space-y-5">
              <input type="hidden" name="next" value={nextPath} />
              <div>
                <label
                  htmlFor="login-email"
                  className="text-xs font-medium text-[#c9d2d6]"
                >
                  البريد الإلكتروني
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  dir="ltr"
                  autoComplete="username"
                  inputMode="email"
                  required
                  maxLength={320}
                  disabled={!authConfigured}
                  placeholder="name@yourfirm.com"
                  className={inputClass}
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="login-password"
                    className="text-xs font-medium text-[#c9d2d6]"
                  >
                    كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNotice(
                        "استعادة كلمة المرور ستتاح بعد تهيئة البريد الآمن. تواصل حاليًا مع مسؤول مؤسستك.",
                      )
                    }
                    className="text-xs text-[#d8b978] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b978]"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    autoComplete="current-password"
                    required
                    maxLength={4096}
                    disabled={!authConfigured}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-3 flex size-10 items-center justify-center rounded-lg text-[#aab6bb] hover:text-white focus-visible:outline-2 focus-visible:outline-[#d8b978]"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <LoginSubmit disabled={!authConfigured} />
              <p className="text-center text-[11px] leading-6 text-[#839298]">
                عند استخدام جهاز مشترك، سجّل الخروج بعد الانتهاء.
              </p>
            </form>

            <div className="mt-7 border-t border-white/10 pt-6 text-center">
              <span className="text-xs text-[#aab6bb]">مؤسسة جديدة؟ </span>
              <button
                type="button"
                onClick={() =>
                  setNotice(
                    "فتح مؤسسات جديدة سيكون متاحًا بعد تجهيز التفعيل والاشتراكات. لا يتم إنشاء حساب أو مؤسسة من هذه الصفحة حاليًا.",
                  )
                }
                className="text-xs font-medium text-[#d8b978] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b978]"
              >
                معلومات التفعيل
              </button>
            </div>
            {notice && (
              <p
                role="status"
                className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-7 text-[#c9d2d6]"
              >
                {notice}
              </p>
            )}
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] py-6 text-[11px] text-[#839298]">
          <span dir="ltr">AXIA Legal · RAJIH AI</span>
          <span>صُمّم للمكاتب القانونية. والقرار لك.</span>
        </footer>
      </div>
    </main>
  );
}
