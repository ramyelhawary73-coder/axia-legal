export function AxiaMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M26 4 46 44H34L23 21Z" />
      <path d="M23 21 4 44h13l13-15Z" />
      <path d="M26 4 15 27l8-6 8-7Z" opacity="0.7" />
    </svg>
  );
}

export function AxiaLogo({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-3 ${className}`}
      dir="ltr"
      aria-label="AXIA Legal"
    >
      <AxiaMark className="size-11 shrink-0" />
      {!compact && (
        <span className="flex flex-col">
          <svg
            viewBox="0 0 150 38"
            fill="currentColor"
            className="h-7 w-[112px]"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M1 33 14 5h8l13 28h-8l-2.8-6.2H11.8L9 33H1Zm14.1-12.5h6.8L18.5 13Z"
            />
            <path d="M43 5h8l8 10L67 5h8L63 19l12 14h-8L59 23l-8 10h-8l12-14Z" />
            <path d="M88 5h7v28h-7Z" />
            <path
              fillRule="evenodd"
              d="m113 33 13-28h8l13 28h-8l-2.8-6.2h-12.4L122 33h-9Zm14.1-12.5h6.8l-3.4-7.5Z"
            />
          </svg>
          <span className="mt-0.5 text-[9px] font-medium tracking-[0.36em] leading-none opacity-70">
            LEGAL
          </span>
        </span>
      )}
    </span>
  );
}
