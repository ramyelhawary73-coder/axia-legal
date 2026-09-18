"use client";

import { FolderDown, X, ExternalLink } from "lucide-react";

interface DailySnapshotToastProps {
  notification: {
    visible: boolean;
    title: string;
    message: string;
    filename: string;
    destination: string;
  } | null;
  onDismiss: () => void;
  onOpenManager: () => void;
}

export function DailySnapshotToast({
  notification,
  onDismiss,
  onOpenManager,
}: DailySnapshotToastProps) {
  if (!notification || !notification.visible) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 max-w-md w-[calc(100vw-2.5rem)] rounded-2xl border border-emerald-500/30 bg-[var(--panel)] p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <FolderDown className="size-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-[var(--text)] truncate">
              {notification.title}
            </h4>
            <button
              onClick={onDismiss}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
            {notification.message}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px]">
            <span className="font-mono bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--axia-gold-light)] font-medium">
              {notification.filename}
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-semibold border border-emerald-500/20">
              {notification.destination}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[var(--border)]/60">
            <button
              onClick={() => {
                onOpenManager();
                onDismiss();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--axia-gold-light)] hover:underline"
            >
              <ExternalLink className="size-3" />
              <span>إدارة الأرشيف وضبط المزامنة السحابية</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
