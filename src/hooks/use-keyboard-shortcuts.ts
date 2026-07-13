"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  onNewChat?: () => void;
  onFocusInput?: () => void;
  onToggleSidebar?: () => void;
  onCloseSidebar?: () => void;
}

/**
 * Global keyboard shortcuts for the SPYRO V1 web app.
 *   Cmd/Ctrl+K  → new chat
 *   /           → focus the message input
 *   Cmd/Ctrl+B  → toggle sidebar (desktop)
 *   Escape      → close mobile sidebar / blur input
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+K → new chat (works even while typing)
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handlers.onNewChat?.();
        return;
      }

      // Cmd/Ctrl+B → toggle sidebar
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handlers.onToggleSidebar?.();
        return;
      }

      // Escape → close sidebar / blur
      if (e.key === "Escape") {
        handlers.onCloseSidebar?.();
        if (isTyping) target?.blur();
        return;
      }

      // / → focus input (only when not already typing)
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        handlers.onFocusInput?.();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
