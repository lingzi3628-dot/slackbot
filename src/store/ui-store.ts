/**
 * UI state — which "page" is active. We use a view-state rather than
 * separate routes so everything stays on `/` (the preview-visible route)
 * while still feeling like separate pages.
 */
import { create } from "zustand";

export type View = "chat" | "integrations" | "settings" | "about" | "auth";

interface UIState {
  activeView: View;
  setView: (v: View) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: "chat",
  setView: (v) => set({ activeView: v }),
}));
