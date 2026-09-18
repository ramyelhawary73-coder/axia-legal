"use client";

import { useEffect, useCallback } from "react";
import { NavigationTab } from "@/types/legal";

export interface KeyboardShortcutHandlers {
  onNewTask?: () => void;
  onSearchFocus?: () => void;
  onToggleHelp?: () => void;
  onCloseModals?: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export interface ShortcutDefinition {
  keys: string[];
  labelAr: string;
  descriptionAr: string;
  category: "مهام وإجراءات" | "تنقل وبحث" | "نظام ونوافذ";
}

export const APP_KEYBOARD_SHORTCUTS: ShortcutDefinition[] = [
  {
    keys: ["Ctrl", "N"],
    labelAr: "إضافة مهمة إجرائية جديدة",
    descriptionAr: "فتح نافذة إسناد وتكليف مهمة إجرائية أو ميعاد سقوط فوراً من أي شاشة",
    category: "مهام وإجراءات",
  },
  {
    keys: ["Alt", "N"],
    labelAr: "إضافة مهمة بديل (بدون تعارض)",
    descriptionAr: "مفتاح اختصار بديل مخصص لمتصفحات الويب بدون تداخل مع المتصفح",
    category: "مهام وإجراءات",
  },
  {
    keys: ["Ctrl", "Enter"],
    labelAr: "حفظ وتكليف المهمة",
    descriptionAr: "اعتماد وحفظ نموذج المهمة مباشرة أثناء الكتابة",
    category: "مهام وإجراءات",
  },
  {
    keys: ["Ctrl", "K"],
    labelAr: "البحث السريع الشامل",
    descriptionAr: "الانتقال المباشر لشريط البحث في القضايا والموكلين",
    category: "تنقل وبحث",
  },
  {
    keys: ["Ctrl", "1..6"],
    labelAr: "التنقل السريع بين الأقسام",
    descriptionAr: "التبديل بين النظرة العامة، القضايا، الجلسات، الموكلين، والمهام",
    category: "تنقل وبحث",
  },
  {
    keys: ["Esc"],
    labelAr: "إغلاق النوافذ النشطة",
    descriptionAr: "إغلاق أي نافذة منبثقة أو إلغاء التحديد الجاري",
    category: "نظام ونوافذ",
  },
  {
    keys: ["Ctrl", "/"],
    labelAr: "دليل اختصارات لوحة المفاتيح",
    descriptionAr: "عرض جدول كافة الاختصارات المدعومة في نظام AXIA Legal",
    category: "نظام ونوافذ",
  },
];

export function useGlobalKeyboardShortcuts({
  onNewTask,
  onSearchFocus,
  onToggleHelp,
  onCloseModals,
  onNavigateTab,
}: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.tagName === "SELECT");

      const isModifierCtrlOrMeta = event.ctrlKey || event.metaKey;
      const isAlt = event.altKey;
      const key = event.key ? event.key.toLowerCase() : "";
      const code = event.code;

      // 1. Task Creation: Ctrl+N, Cmd+N, Alt+N, or Ctrl+Shift+N
      // Even if typing in an input, if Ctrl+N or Alt+N is pressed, the user intentionally wants to spawn a new task.
      const isTaskShortcut =
        ((isModifierCtrlOrMeta || isAlt) && (key === "n" || code === "KeyN")) ||
        (isModifierCtrlOrMeta && event.shiftKey && (key === "n" || code === "KeyN"));

      if (isTaskShortcut && onNewTask) {
        event.preventDefault();
        event.stopPropagation();
        onNewTask();
        return;
      }

      // 2. Global Search: Ctrl+K or Cmd+K
      if (isModifierCtrlOrMeta && (key === "k" || code === "KeyK") && onSearchFocus) {
        event.preventDefault();
        event.stopPropagation();
        onSearchFocus();
        return;
      }

      // 3. Keyboard Shortcuts Help: Ctrl+/ or F1, or '?' when NOT typing in an input
      if (
        (isModifierCtrlOrMeta && (key === "/" || code === "Slash")) ||
        event.key === "F1" ||
        (!isTyping && event.key === "?")
      ) {
        if (onToggleHelp) {
          event.preventDefault();
          onToggleHelp();
          return;
        }
      }

      // 4. Close Modal / Cancel on Escape
      if (event.key === "Escape" && onCloseModals) {
        onCloseModals();
        return;
      }

      // 5. Quick Tab Navigation (Ctrl+1 to Ctrl+5 or Alt+1 to Alt+5)
      if ((isModifierCtrlOrMeta || isAlt) && onNavigateTab && !event.shiftKey) {
        switch (event.key) {
          case "1":
            event.preventDefault();
            onNavigateTab("overview");
            break;
          case "2":
            event.preventDefault();
            onNavigateTab("matters");
            break;
          case "3":
            event.preventDefault();
            onNavigateTab("hearings");
            break;
          case "4":
            event.preventDefault();
            onNavigateTab("clients");
            break;
          case "5":
            event.preventDefault();
            onNavigateTab("tasks");
            break;
          case "6":
            event.preventDefault();
            onNavigateTab("documents");
            break;
        }
      }
    },
    [onNewTask, onSearchFocus, onToggleHelp, onCloseModals, onNavigateTab]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [handleKeyDown]);
}
