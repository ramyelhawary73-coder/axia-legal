const stats = [
  ["العملاء النشطون", "Clients", "—"],
  ["القضايا المفتوحة", "Open matters", "—"],
  ["جلسات اليوم", "Hearings today", "—"],
  ["المواعيد الحرجة", "Critical deadlines", "—"],
] as const;

const modules = [
  ["Matter Workspace", "مساحة عمل موحدة لكل قضية تشمل الأطراف والجلسات والمواعيد والمستندات والبحث."],
  ["Legal Library", "طبقة معرفة قانونية مهيأة للإصدارات الزمنية والمصادر الرسمية والتحقق."],
  ["RAJIH AI", "مساعد قانوني قائم على المصادر. الربط الفعلي بالذكاء الاصطناعي مؤجل لمرحلة معتمدة لاحقًا."],
] as const;

export function FoundationDashboard() {
  return (
    <div className="px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-7 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1 text-xs text-cyan-200">
            <span className="size-1.5 rounded-full bg-cyan-300" />
            Phase 1A · Foundation
          </div>
          <h2 className="max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl">
            منصة تشغيل الممارسة القانونية المصرية
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50 sm:text-base">
            بنية أولية عربية RTL، متعددة المستأجرين، ومصممة لتوسيع آمن نحو إدارة القضايا والمستندات والمصادر القانونية وراجح AI.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/55">
          Development foundation · No client data
        </div>
      </header>

      <section className="grid gap-3 py-7 sm:grid-cols-2 xl:grid-cols-4" aria-label="مؤشرات تمهيدية">
        {stats.map(([ar, en, value]) => (
          <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5" key={en}>
            <p className="text-sm text-white/60">{ar}</p>
            <p className="mt-1 text-xs text-white/30">{en}</p>
            <p className="mt-5 text-3xl font-semibold text-white/80">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Foundation map</p>
              <h3 className="mt-1 text-xl font-semibold">النطاق الأساسي</h3>
            </div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/5 px-3 py-1 text-xs text-emerald-200">
              UI shell only
            </span>
          </div>

          <div className="grid gap-3">
            {modules.map(([title, body]) => (
              <article className="rounded-2xl border border-white/8 bg-black/10 p-5" key={title}>
                <h4 className="font-semibold text-cyan-100">{title}</h4>
                <p className="mt-2 text-sm leading-6 text-white/50">{body}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-cyan-300/15 bg-gradient-to-b from-cyan-300/[0.08] to-transparent p-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-cyan-200">RAJIH AI — راجح</p>
          <h3 className="mt-3 text-2xl font-semibold">Legal intelligence layer</h3>
          <p className="mt-3 text-sm leading-7 text-white/50">
            هذه المساحة تحجز مكان طبقة راجح فقط. لا يوجد اتصال LLM أو إرسال مستندات أو بيانات قضية في Phase 1A.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/45">
            Future contract: authorization → matter context → verified legal source → retrieval → citation validation → structured answer.
          </div>
        </aside>
      </section>
    </div>
  );
}
