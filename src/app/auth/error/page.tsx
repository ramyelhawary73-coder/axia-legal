export default function AuthErrorPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--axia-bg)] px-5 text-[var(--axia-text)]">
      <div className="max-w-lg rounded-3xl border border-rose-300/20 bg-rose-300/5 p-7">
        <h1 className="text-2xl font-semibold">تعذر إتمام المصادقة</h1>
        <p className="mt-3 text-sm leading-7 text-white/60">
          لم يتم إنشاء جلسة صالحة. ارجع إلى صفحة تسجيل الدخول وحاول مرة أخرى.
        </p>
      </div>
    </main>
  );
}
