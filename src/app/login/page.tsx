import { redirect } from "next/navigation";
import { login } from "./actions";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const messages: Record<string, string> = {
  missing_credentials: "أدخل البريد الإلكتروني وكلمة المرور.",
  invalid_credentials: "بيانات الدخول غير صحيحة.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const config = getSupabasePublicConfig();

  if (config) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (!error && data?.claims) redirect("/");
  }

  const errorMessage = params.error ? messages[params.error] : null;

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-5 py-10 text-[var(--text)]" dir="rtl">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-7 shadow-2xl">
        <p className="text-xs font-semibold tracking-[0.28em] text-[var(--axia-gold-light)]">AXIA LEGAL</p>
        <h1 className="mt-3 text-3xl font-semibold">تسجيل الدخول</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          دخول مصرح فقط. لا يوجد تسجيل عام للحسابات في هذه المرحلة.
        </p>

        {!config ? (
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-200">
            بيئة التشغيل غير مربوطة بإعدادات Supabase العامة اللازمة لتسجيل الدخول.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-300/5 p-4 text-sm text-rose-200">
            {errorMessage}
          </div>
        ) : null}

        <form action={login} className="mt-7 grid gap-4">
          <input type="hidden" name="next" value={params.next ?? "/"} />
          <label className="grid gap-2 text-sm">
            <span className="text-[var(--text-muted)]">البريد الإلكتروني</span>
            <input
              className="rounded-xl border border-[var(--border)] bg-[var(--accent)] px-4 py-3 outline-none ring-[var(--axia-gold)]/30 focus:ring-2 disabled:opacity-50"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={!config}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-[var(--text-muted)]">كلمة المرور</span>
            <input
              className="rounded-xl border border-[var(--border)] bg-[var(--accent)] px-4 py-3 outline-none ring-[var(--axia-gold)]/30 focus:ring-2 disabled:opacity-50"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={!config}
            />
          </label>
          <button
            className="mt-2 rounded-xl bg-[var(--axia-gold)] px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            type="submit"
            disabled={!config}
          >
            دخول
          </button>
        </form>
      </section>
    </main>
  );
}
