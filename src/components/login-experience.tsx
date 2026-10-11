"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  Pause,
  Play,
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
      className={styles.submit}
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />{" "}
          جارٍ تسجيل الدخول…
        </>
      ) : (
        <>
          الدخول إلى مساحة العمل{" "}
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

  return (
    <main
      className={styles.surface}
      dir="rtl"
      data-login-motion={motionPaused ? "paused" : "running"}
    >
      <LoginAtmosphere />
      <div className={styles.shell} dir="ltr">
        <section
          className={styles.formPanel}
          dir="rtl"
          aria-labelledby="login-title"
        >
          <header className={styles.formHead}>
            <AxiaLogo className={styles.mobileBrand} />
            <span className={styles.desktopLabel}>دخول المؤسسات</span>
            <span className={styles.language}>العربية</span>
          </header>
          <div className={styles.formContent}>
            <div className={styles.formBody}>
              <p className={styles.eyebrow}>مساحة العمل</p>
              <h2 id="login-title" className={styles.formTitle}>
                أهلًا بعودتك.
              </h2>
              <p className={styles.formIntro}>
                ادخل إلى مساحة العمل الخاصة بمؤسستك.
              </p>
              {!authConfigured && (
                <p role="status" className={styles.message}>
                  خدمة الدخول غير متاحة حاليًا. يرجى التواصل مع مسؤول النظام
                  لاستكمال إعدادها.
                </p>
              )}
              {errorMessage && (
                <p role="alert" className={`${styles.message} ${styles.error}`}>
                  {errorMessage}
                </p>
              )}

              <form action={login} className={styles.form}>
                <input type="hidden" name="next" value={nextPath} />
                <div className={styles.field}>
                  <label htmlFor="login-email">البريد الإلكتروني</label>
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
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <div className={styles.fieldHead}>
                    <label htmlFor="login-password">كلمة المرور</label>
                    <button
                      type="button"
                      onClick={() =>
                        setNotice(
                          "استعادة كلمة المرور ستتاح بعد تهيئة البريد الآمن. تواصل حاليًا مع مسؤول مؤسستك.",
                        )
                      }
                      className={styles.textButton}
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                  <div className={styles.passwordWrap}>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      autoComplete="current-password"
                      required
                      maxLength={4096}
                      disabled={!authConfigured}
                      className={`${styles.input} ${styles.passwordInput}`}
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                      }
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((shown) => !shown)}
                      className={styles.reveal}
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
                <p className={styles.sharedDevice}>
                  عند استخدام جهاز مشترك، سجّل الخروج بعد الانتهاء.
                </p>
              </form>
              <div className={styles.enrollment}>
                <span>مؤسسة جديدة؟</span>
                <button
                  type="button"
                  onClick={() =>
                    setNotice(
                      "فتح مؤسسات جديدة سيكون متاحًا بعد تجهيز التفعيل والاشتراكات. لا يتم إنشاء حساب أو مؤسسة من هذه الصفحة حاليًا.",
                    )
                  }
                  className={styles.textButton}
                >
                  معلومات التفعيل{" "}
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              {notice && (
                <p role="status" className={styles.message}>
                  {notice}
                </p>
              )}
            </div>
          </div>
          <footer className={styles.formFooter}>
            <span dir="ltr">AXIA Legal</span>
            <span>للممارسة القانونية الحديثة</span>
          </footer>
        </section>

        <section
          className={styles.hero}
          dir="rtl"
          aria-labelledby="axia-intro-title"
        >
          <LoginBrandScene />
          <header className={styles.heroHead}>
            <AxiaLogo className={styles.heroBrand} />
            <span className={styles.mobileHeroLabel}>
              الممارسة القانونية، بمنظور جديد.
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
              <span>{motionPaused ? "تشغيل الحركة" : "إيقاف الحركة"}</span>
            </button>
          </header>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>وضوح الرؤية. قوة القرار.</p>
            <h1 id="axia-intro-title">
              القانون،
              <br />
              <span>بوضوحٍ أكبر.</span>
            </h1>
            <p className={styles.heroDescription}>
              قضاياك وجلساتك ومستنداتك، في مساحة عمل واحدة.
              <br className={styles.desktopBreak} /> صُمّمت لتمنحك التركيز على
              ما يصنع الفارق.
            </p>
          </div>
          <div className={styles.rajih}>
            <span className={styles.rajihIcon}>
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2>
                راجح <span dir="ltr">RAJIH AI</span>
              </h2>
              <p>للبحث والصياغة القانونية. المراجعة والقرار المهني بيدك.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
