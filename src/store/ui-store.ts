/**
 * UI state — which "page" is active.
 * Aligned with SPYRO OS spec: Home, Projects, Chats, Knowledge, Agents,
 * Files, Apps, Automation, Analytics, Settings.
 */
import { create } from "zustand";

export type View =
  | "chat" | "dashboard" | "integrations" | "integration-control"
  | "settings" | "about" | "login" | "register" | "profile"
  | "api-playground" | "agent-builder" | "god-mode-live";

interface UIState {
  activeView: View;
  setView: (v: View) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: "register",
  setView: (v) => set({ activeView: v }),
}));
