"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export type ActionContextMenuItem = {
  id: string;
  label: string;
  onSelect: () => void | Promise<void>;
  disabled?: boolean;
  tone?: "default" | "danger";
};

type MenuState = {
  x: number;
  y: number;
  label: string;
  items: ActionContextMenuItem[];
};

const LONG_PRESS_MS = 550;
const LONG_PRESS_MOVE_TOLERANCE = 10;
const MENU_WIDTH = 224;
const MENU_ESTIMATED_HEIGHT = 280;

export function useActionContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStart = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClick = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressStart.current = null;
  }, []);

  const close = useCallback(() => {
    clearLongPress();
    setMenu(null);
  }, [clearLongPress]);

  const openAt = (
    x: number,
    y: number,
    items: ActionContextMenuItem[],
    label: string,
  ) => {
    if (typeof window === "undefined") return;

    const enabledItems = items.filter((item) => !item.disabled);
    if (enabledItems.length === 0) return;

    const safeX = Math.max(
      8,
      Math.min(x, Math.max(8, window.innerWidth - MENU_WIDTH - 8)),
    );
    const safeY = Math.max(
      8,
      Math.min(y, Math.max(8, window.innerHeight - MENU_ESTIMATED_HEIGHT)),
    );

    setMenu({ x: safeX, y: safeY, label, items });
  };

  useEffect(() => {
    if (!menu) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const handleViewportChange = () => close();

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [menu, close]);

  const bind = (items: ActionContextMenuItem[], label: string) => ({
    onContextMenu: (event: ReactMouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      clearLongPress();
      openAt(event.clientX, event.clientY, items, label);
    },
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") return;

      clearLongPress();
      longPressStart.current = { x: event.clientX, y: event.clientY };
      longPressTimer.current = setTimeout(() => {
        suppressNextClick.current = true;
        openAt(event.clientX, event.clientY, items, label);
        longPressTimer.current = null;
      }, LONG_PRESS_MS);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      if (!longPressStart.current || !longPressTimer.current) return;
      const dx = Math.abs(event.clientX - longPressStart.current.x);
      const dy = Math.abs(event.clientY - longPressStart.current.y);
      if (dx > LONG_PRESS_MOVE_TOLERANCE || dy > LONG_PRESS_MOVE_TOLERANCE) {
        clearLongPress();
      }
    },
    onPointerUp: clearLongPress,
    onPointerCancel: clearLongPress,
    onClickCapture: (event: ReactMouseEvent<HTMLElement>) => {
      if (!suppressNextClick.current) return;
      suppressNextClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  });

  const triggerButton = (
    items: ActionContextMenuItem[],
    label: string,
    className = "",
  ) => (
    <button
      type="button"
      aria-label={`إجراءات ${label}`}
      aria-haspopup="menu"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        openAt(rect.left, rect.bottom + 6, items, label);
      }}
      className={`inline-grid size-7 place-items-center rounded-lg border border-transparent text-[var(--text-muted)] transition hover:border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)] ${className}`}
    >
      <MoreVertical className="size-4" />
    </button>
  );

  const menuNode =
    menu && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="إغلاق قائمة الإجراءات"
              className="fixed inset-0 z-[9998] cursor-default bg-transparent"
              onClick={close}
            />
            <div
              role="menu"
              aria-label={`إجراءات ${menu.label}`}
              dir="rtl"
              className="fixed z-[9999] w-56 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-1.5 text-right shadow-2xl"
              style={{ left: menu.x, top: menu.y }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-[var(--border)] px-2.5 py-2 text-[10px] font-bold text-[var(--text-muted)]">
                {menu.label}
              </div>
              <div className="mt-1 space-y-0.5">
                {menu.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      if (item.disabled) return;
                      close();
                      void Promise.resolve(item.onSelect()).catch((error) => {
                        console.error("AXIA action failed", error);
                      });
                    }}
                    className={`flex w-full items-center rounded-xl px-3 py-2 text-right text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      item.tone === "danger"
                        ? "text-red-400 hover:bg-red-500/10"
                        : "text-[var(--text)] hover:bg-[var(--accent)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return {
    bind,
    close,
    menuNode,
    openAt,
    triggerButton,
  };
}
