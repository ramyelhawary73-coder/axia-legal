"use client";

import React from "react";
import { motion } from "motion/react";

export interface AxiaBrandLogoProps {
  /**
   * - "mark": symbol icon only
   * - "lockup": symbol + AXIA LEGAL wordmark + optional subtitle
   * - "hero": large animated constellation emblem for the login portal
   */
  mode?: "mark" | "lockup" | "hero";
  /**
   * Visual color treatment
   */
  variant?: "default" | "gold" | "monochrome";
  /**
   * Size preset for mark/lockup modes
   */
  size?: "sm" | "md" | "lg";
  /**
   * Show Arabic/English legal OS subtitle in lockup mode
   */
  showSubtitle?: boolean;
  /**
   * Enable subtle SVG path/node entrance animation
   */
  animated?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: {
    box: "size-8 rounded-lg",
    svg: "size-5",
    title: "text-sm",
    badge: "text-[9px] px-1.5 py-0.5",
    subtitle: "text-[9px]",
  },
  md: {
    box: "size-10 rounded-xl",
    svg: "size-6",
    title: "text-base",
    badge: "text-[10px] px-1.5 py-0.5",
    subtitle: "text-[10px]",
  },
  lg: {
    box: "size-12 rounded-2xl",
    svg: "size-7",
    title: "text-lg",
    badge: "text-[10px] px-2 py-0.5",
    subtitle: "text-[11px]",
  },
};

/**
 * Original AXIA Legal vector symbol:
 * Combines the architectural "A" apex (Axis of Justice) with a balanced sovereign
 * scale beam, suspended equilibrium pans, and an octagonal tenant-isolation shield.
 */
export function AxiaSymbolSvg({
  className = "size-6",
  animated = false,
  monochrome = false,
  idPrefix = "axia-symbol",
}: {
  className?: string;
  animated?: boolean;
  monochrome?: boolean;
  idPrefix?: string;
}) {
  const goldGradId = `${idPrefix}-gold-grad`;
  const beamGradId = `${idPrefix}-beam-grad`;
  const glowId = `${idPrefix}-glow`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={goldGradId} x1="12" y1="6" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={monochrome ? "currentColor" : "#F5D061"} />
          <stop offset="48%" stopColor={monochrome ? "currentColor" : "#C59B27"} />
          <stop offset="100%" stopColor={monochrome ? "currentColor" : "#8F6B10"} />
        </linearGradient>
        <linearGradient id={beamGradId} x1="8" y1="26" x2="56" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={monochrome ? "currentColor" : "#E5B842"} stopOpacity="0.3" />
          <stop offset="50%" stopColor={monochrome ? "currentColor" : "#F7D97E"} stopOpacity="1" />
          <stop offset="100%" stopColor={monochrome ? "currentColor" : "#E5B842"} stopOpacity="0.3" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Sovereign Octagonal Shield (Tenant Isolation Frame) */}
      <motion.path
        d="M32 4 L52 12 L59 32 L52 52 L32 60 L12 52 L5 32 L12 12 Z"
        stroke={`url(#${goldGradId})`}
        strokeWidth="1.5"
        strokeOpacity="0.32"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : false}
        animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      {/* Central Sovereign Pillar of Justice */}
      <motion.path
        d="M32 10 V52 M23 52 H41"
        stroke={`url(#${goldGradId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        initial={animated ? { pathLength: 0 } : false}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {/* Architectural "A" Apex Wings */}
      <motion.path
        d="M32 10 L17 48 M32 10 L47 48 M22 36 H42"
        stroke={`url(#${goldGradId})`}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={!monochrome ? `url(#${glowId})` : undefined}
        initial={animated ? { pathLength: 0, opacity: 0.3 } : false}
        animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" }}
      />

      {/* Horizontal Precision Equilibrium Beam */}
      <motion.path
        d="M11 24 H53"
        stroke={`url(#${beamGradId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        initial={animated ? { scaleX: 0.2, opacity: 0 } : false}
        animate={animated ? { scaleX: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.55, delay: 0.14, ease: "easeOut" }}
      />

      {/* Left & Right Scale Suspension Lines + Geometric Pans */}
      <motion.path
        d="M14 24 L10 34 H18 L14 24 Z M50 24 L46 34 H54 L50 24 Z"
        stroke={`url(#${goldGradId})`}
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={monochrome ? "currentColor" : "#C59B27"}
        fillOpacity="0.18"
        initial={animated ? { opacity: 0, y: -3 } : false}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.45, delay: 0.22 }}
      />

      {/* Constellation Precision Nodes (Apex, Fulcrum, Wing Anchors) */}
      <circle cx="32" cy="10" r="2.6" fill={monochrome ? "currentColor" : "#F7D97E"} />
      <circle cx="32" cy="24" r="2.2" fill={monochrome ? "currentColor" : "#C59B27"} />
      <circle cx="14" cy="24" r="1.7" fill={monochrome ? "currentColor" : "#F5D061"} />
      <circle cx="50" cy="24" r="1.7" fill={monochrome ? "currentColor" : "#F5D061"} />
    </svg>
  );
}

export function AxiaBrandLogo({
  mode = "lockup",
  variant = "default",
  size = "md",
  showSubtitle = true,
  animated = false,
  className = "",
}: AxiaBrandLogoProps) {
  const s = SIZE_MAP[size];
  const isMono = variant === "monochrome";

  if (mode === "mark") {
    return (
      <div
        className={`relative inline-grid place-items-center border border-[var(--axia-gold)]/30 bg-gradient-to-br from-[var(--axia-gold)]/20 via-[var(--axia-gold)]/5 to-transparent shadow-sm ${s.box} ${className}`}
      >
        <AxiaSymbolSvg
          className={s.svg}
          animated={animated}
          monochrome={isMono}
          idPrefix="axia-mark"
        />
      </div>
    );
  }

  if (mode === "hero") {
    return (
      <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
        {/* Ambient sovereign radial aura */}
        <div className="pointer-events-none absolute -inset-6 rounded-full bg-gradient-to-tr from-[var(--axia-gold)]/25 via-amber-500/10 to-transparent blur-2xl" />

        <div className="relative flex items-center gap-4">
          <motion.div
            initial={animated ? { scale: 0.92, opacity: 0 } : false}
            animate={animated ? { scale: 1, opacity: 1 } : undefined}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative grid size-16 place-items-center rounded-2xl border border-[var(--axia-gold)]/40 bg-gradient-to-br from-[var(--axia-gold)]/25 via-[var(--panel)] to-[var(--panel)] shadow-xl ring-1 ring-white/10"
          >
            {/* Corner constellation micro-dots */}
            <span className="absolute top-1.5 right-1.5 size-1 rounded-full bg-[var(--axia-gold-light)]/70" />
            <span className="absolute bottom-1.5 left-1.5 size-1 rounded-full bg-[var(--axia-gold-light)]/70" />
            <AxiaSymbolSvg
              className="size-10"
              animated={animated}
              monochrome={isMono}
              idPrefix="axia-hero"
            />
          </motion.div>

          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-[var(--text)]">
                AXIA <span className="text-[var(--axia-gold-light)]">LEGAL</span>
              </span>
              <span className="rounded-full border border-[var(--axia-gold)]/35 bg-[var(--axia-gold)]/15 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[var(--axia-gold-light)]">
                OS v2.5
              </span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-[var(--text-muted)]">
              نظام التشغيل القضائي والذكاء الاصطناعي السيادي
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className={`relative grid shrink-0 place-items-center border border-[var(--axia-gold)]/35 bg-gradient-to-br from-[var(--axia-gold)]/20 via-[var(--axia-gold)]/5 to-transparent shadow-sm transition-transform duration-300 group-hover:scale-[1.03] ${s.box}`}
      >
        <AxiaSymbolSvg
          className={s.svg}
          animated={animated}
          monochrome={isMono}
          idPrefix="axia-lockup"
        />
      </div>

      <div className="text-right leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold tracking-tight text-[var(--text)] ${s.title}`}>
            AXIA <span className="text-[var(--axia-gold-light)]">Legal</span>
          </span>
          <span
            className={`rounded-md border border-[var(--axia-gold)]/30 bg-[var(--axia-gold)]/12 font-mono font-bold text-[var(--axia-gold-light)] ${s.badge}`}
          >
            OS
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`mt-0.5 block font-mono tracking-wide text-[var(--text-muted)] ${s.subtitle}`}
          >
            Egyptian Legal Practice &amp; Intelligence OS
          </span>
        )}
      </div>
    </div>
  );
}
