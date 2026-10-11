// The wordmark uses outlined DejaVu Serif glyphs; attribution in docs/P0A_LOGIN_UNIFIED_V3.md.
export function AxiaMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 58 54" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4 46 21 8h9L14 46Z" />
      <path d="M25 8h10l20 38H45Z" />
      <path d="M45 8h10L35 46H25Z" />
      <path d="M13 31h27l-5 9H9Z" />
    </svg>
  );
}

export function AxiaLogo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} dir="ltr" aria-label="AXIA Legal">
      <AxiaMark className="h-10 w-12 shrink-0" />
      {!compact && (
        <span className="inline-flex items-center gap-3">
          <svg viewBox="0 0 5405 1600" fill="currentColor" className="h-7 w-[108px]" aria-hidden="true">
            <path d="M410 1009H958L684 299ZM-12 1550V1444H119L651 57H819L1352 1444H1499V1550H956V1444H1122L997 1116H369L244 1444H408V1550ZM2202 911 1837 1444H2030V1550H1536V1444H1708L2138 817L1702 164H1542V57H2134V164H1958L2278 645L2607 164H2415V57H2904V164H2736L2341 739L2812 1444H2972V1550H2380V1444H2558ZM3533 1444H3723V1550H3140V1444H3330V164H3140V57H3723V164H3533ZM4291 1009H4839L4565 299ZM3869 1550V1444H4000L4532 57H4700L5233 1444H5380V1550H4837V1444H5003L4878 1116H4250L4125 1444H4289V1550Z" />
          </svg>
          <span className="border-l border-current/25 pl-3 text-[10px] font-medium tracking-[0.18em]">LEGAL</span>
        </span>
      )}
    </span>
  );
}
