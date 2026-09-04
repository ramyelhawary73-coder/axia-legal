const navigation = [
  ["نظرة عامة", "Overview"],
  ["العملاء", "Clients"],
  ["القضايا والملفات", "Matters"],
  ["الجلسات والتقويم", "Hearings & Calendar"],
  ["المهام", "Tasks"],
  ["المستندات", "Documents"],
  ["المالية", "Finance"],
  ["الفريق", "Team"],
  ["المحامون المتدربون", "Junior & Trainees"],
  ["المكتبة القانونية", "Legal Library"],
  ["راجح", "RAJIH AI"],
  ["التقارير", "Reports"],
  ["الإدارة", "Administration"],
] as const;

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[var(--axia-bg)] text-[var(--axia-text)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-[var(--axia-panel)] px-5 py-6 lg:border-b-0 lg:border-l">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] text-cyan-300">AXIA</p>
              <h1 className="mt-1 text-xl font-semibold">Legal</h1>
              <p className="mt-1 text-xs text-white/45">Powered by ASIA AURA</p>
            </div>
            <div className="grid size-11 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 font-semibold text-cyan-200">
              A
            </div>
          </div>

          <nav aria-label="التنقل الرئيسي" className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
            {navigation.map(([ar, en], index) => (
              <button
                className={`rounded-xl px-3 py-2.5 text-right transition ${
                  index === 0
                    ? "bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-300/20"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
                key={en}
                type="button"
              >
                <span className="block text-sm font-medium">{ar}</span>
                <span className="mt-0.5 block text-[11px] text-white/35">{en}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
