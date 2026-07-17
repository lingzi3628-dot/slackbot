/**
 * UI state — which "page" is active.
 *
 * Navigation per the SPYRO AI OS redesign spec:
 *   Home · Projects · Chats · Agents · Knowledge · Communication ·
 *   Apps · Analytics · Settings (9 primary items)
 *
 * Tools (Files, Automation, Integrations, API Playground) live inside
 * Apps or contextual workflows — not the primary navigation.
 */
import { create } from "zustand";

export type View =
  // Primary nav (spec — max 9)
  | "home" | "projects" | "chat" | "agents" | "knowledge"
  | "communication" | "studio" | "analytics" | "settings"
  // Legacy Apps view (accessible but not in primary nav)
  | "apps"
  // Secondary views
  | "about" | "profile" | "vps-features"
  | "login" | "register"
  // App sub-views
  | "api-playground" | "agent-builder" | "god-mode-live"
  | "integrations" | "integration-control";

interface UIState {
  activeView: View;
  setView: (v: View) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: "register",
  setView: (v) => set({ activeView: v }),
}));
