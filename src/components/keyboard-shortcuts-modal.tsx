"use client";

import { X, Keyboard, Plus } from "lucide-react";
import { APP_KEYBOARD_SHORTCUTS } from "@/hooks/use-global-keyboard-shortcuts";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerNewTask?: () => void;
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  onTriggerNewTask,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const categories = ["مهام وإجراءات", "تنقل وبحث", "نظام ونوافذ"] as const;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-[var(--axia-gold)]/15 border border-[var(--axia-gold)]/30 text-[var(--axia-gold)]">
              <Keyboard className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">
                اختصارات لوحة المفاتيح السريعة (Keyboard Shortcuts)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                أوامر واختصارات فورية لتسريع وتيرة العمل والمهام القضائية اليومية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Shortcuts Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
          {/* Highlighted Banner for Task Shortcut */}
          <div className="rounded-2xl border border-[var(--axia-gold)]/30 bg-gradient-to-r from-[var(--axia-gold)]/10 via-[var(--panel)] to-[var(--axia-gold)]/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-[var(--axia-gold)] animate-ping" />
                <span className="text-xs font-extrabold text-[var(--axia-gold-light)]">
                  المفتاح العالمي للمهام الإجرائية:
                </span>
              </div>
              <p className="text-xs text-[var(--text)] font-semibold">
                اضغط <kbd className="rounded bg-[var(--bg)] px-2 py-0.5 border border-[var(--axia-gold)]/40 font-mono text-[var(--axia-gold-light)]">Ctrl+N</kbd> أو <kbd className="rounded bg-[var(--bg)] px-2 py-0.5 border border-[var(--axia-gold)]/40 font-mono text-[var(--axia-gold-light)]">Alt+N</kbd> في أي وقت لإسناد مهمة إجرائية جديدة فوراً.
              </p>
            </div>

            {onTriggerNewTask && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerNewTask();
                }}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[var(--axia-gold)] px-3.5 py-1.5 text-xs font-extrabold text-black shadow hover:brightness-110 transition"
              >
                <Plus className="size-3.5" />
                <span>تجربة الاختصار الآن</span>
              </button>
            )}
          </div>

          {/* Grouped Shortcuts */}
          {categories.map((cat) => {
            const list = APP_KEYBOARD_SHORTCUTS.filter((s) => s.category === cat);
            if (list.length === 0) return null;

            return (
              <div key={cat} className="space-y-2.5">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {cat}
                </h3>

                <div className="grid gap-2 sm:grid-cols-1">
                  {list.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg)]/40 p-3 hover:bg-[var(--accent)]/50 transition"
                    >
                      <div className="space-y-0.5 pr-2">
                        <p className="text-xs font-bold text-[var(--text)]">
                          {item.labelAr}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {item.descriptionAr}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ltr:flex-row rtl:flex-row-reverse">
                        {item.keys.map((k, kIdx) => (
                          <span key={kIdx} className="flex items-center gap-1">
                            <kbd className="min-w-6 text-center rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-xs font-mono font-bold text-[var(--text)] shadow-sm">
                              {k}
                            </kbd>
                            {kIdx < item.keys.length - 1 && (
                              <span className="text-[10px] text-[var(--text-muted)]">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] bg-[var(--bg)] px-6 py-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>يمكنك إغلاق هذه النافذة بالضغط على <kbd className="rounded bg-[var(--panel)] border px-1.5 py-0.5 font-mono">Esc</kbd></span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--accent)] px-4 py-1.5 font-semibold text-[var(--text)] hover:bg-[var(--accent-hover)] transition"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
}
