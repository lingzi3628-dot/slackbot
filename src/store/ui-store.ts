/**
 * UI state — which "page" is active.
 *
 * Aligned with the SPYRO AI OS master specification global navigation:
 *   Home, Projects, Chats, Knowledge, Agents, Files, Apps,
 *   Automation, Analytics, Settings.
 *
 * Auth-only views (login/register) and tool sub-views live alongside.
 */
import { create } from "zustand";

export type View =
  // Primary nav (spec)
  | "home" | "projects" | "chat" | "knowledge" | "agents"
  | "files" | "apps" | "automation" | "analytics" | "settings"
  // Secondary views
  | "integrations" | "integration-control" | "about" | "profile"
  | "login" | "register"
  | "api-playground" | "agent-builder" | "god-mode-live";

interface UIState {
  activeView: View;
  setView: (v: View) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Default to register so first-time visitors see the landing/auth screen.
  // The init() effect in page.tsx will redirect to "home" if a session exists.
  activeView: "register",
  setView: (v) => set({ activeView: v }),
}));
