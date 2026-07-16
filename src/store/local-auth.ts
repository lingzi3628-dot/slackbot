/**
 * Local auth store — thin client wrapper around the cookie-based session
 * endpoints in /api/auth/*. Keeps a synced local copy of the current user
 * so UI components can read it synchronously.
 *
 * - `init()` is called once on mount to restore the session from the cookie.
 * - `signIn(email, name)` is used for guest/local sign-in (no DB write).
 *   Real login/register pages call the API themselves, then call signIn()
 *   to update local state immediately.
 * - `signOut()` clears local state. The cookie is cleared by the page that
 *   triggers sign-out via POST /api/auth/logout.
 */
import { create } from "zustand";

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  role: string;
  plan: string;
  isGuest: boolean;
  createdAt: number;
}

interface LocalAuthState {
  user: LocalUser | null;
  isAuthed: boolean;
  loading: boolean;
  init: () => Promise<void>;
  signIn: (email: string, name?: string, opts?: { guest?: boolean }) => void;
  signOut: () => void;
  updateProfile: (patch: Partial<LocalUser>) => void;
}

const AVATAR_COLORS = [
  "#7C3AED", "#06B6D4", "#F59E0B", "#EC4899",
  "#10B981", "#ff7a1a", "#e8421b", "#8B5CF6",
];

function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const useLocalAuth = create<LocalAuthState>((set, get) => ({
  user: null,
  isAuthed: false,
  loading: true,

  init: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (data?.user) {
        const u = data.user;
        set({
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
            avatarColor: u.avatarColor || pickColor(u.email || u.id),
            role: u.role || "user",
            plan: u.plan || "free",
            isGuest: u.email === "guest@spyro.ai",
            createdAt: u.createdAt ? new Date(u.createdAt).getTime() : Date.now(),
          },
          isAuthed: true,
          loading: false,
        });
      } else {
        set({ user: null, isAuthed: false, loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  signIn: (email, name, opts) => {
    const isGuest = opts?.guest || email === "guest@spyro.ai";
    const displayName =
      name?.trim() ||
      (isGuest ? "Guest Dragon" : email.split("@")[0] || "User");
    const user: LocalUser = {
      id: isGuest ? `guest-${Date.now()}` : `local-${Date.now()}`,
      name: displayName,
      email,
      avatarColor: isGuest ? "#7C3AED" : pickColor(email),
      role: "user",
      plan: isGuest ? "guest" : "free",
      isGuest,
      createdAt: Date.now(),
    };
    set({ user, isAuthed: true, loading: false });
  },

  signOut: () => set({ user: null, isAuthed: false }),

  updateProfile: (patch) => {
    const u = get().user;
    if (u) set({ user: { ...u, ...patch } });
  },
}));

/** Guests have access to a limited set of tools. */
const GUEST_ALLOWED_TOOLS = new Set([
  "chat",
  "web-scout",
  "voice-studio",
  "image-gen",
]);

export function isGuest(user: LocalUser | null): boolean {
  return !!user?.isGuest;
}

export function canAccessTool(toolId: string, user: LocalUser | null): boolean {
  if (!user) return false;
  if (user.isGuest) return GUEST_ALLOWED_TOOLS.has(toolId);
  return true;
}
