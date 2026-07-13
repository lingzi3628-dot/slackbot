/**
 * Auth store — tracks the current Supabase user.
 * When no Supabase is configured, `user` is always null and the app
 * works in offline (localStorage-only) mode.
 */
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase-client";

interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: isSupabaseConfigured,
  configured: isSupabaseConfigured,

  init: async () => {
    const supabase = getSupabase();
    if (!supabase) {
      set({ loading: false });
      return;
    }
    const { data } = await supabase.auth.getSession();
    set({ user: data.session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },

  signIn: async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Auth not configured" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  },

  signUp: async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Auth not configured" };
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return {};
  },

  signOut: async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
