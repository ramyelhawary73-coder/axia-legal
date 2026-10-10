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
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="size-12 shrink-0"
        aria-hidden="true"
      >
        <path
          d="M10 52 29 12a3.3 3.3 0 0 1 6 0l19 40"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 35h24M32 24v22M24 49h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="m20 35-5 9h10l-5-9Zm24 0-5 9h10l-5-9Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <span className="flex flex-col">
          <span className="text-2xl font-semibold tracking-[0.2em] leading-none">
            AXIA
          </span>
          <span className="mt-1.5 text-[10px] tracking-[0.45em] leading-none opacity-70">
            LEGAL
          </span>
        </span>
      )}
    </span>
  );
}
