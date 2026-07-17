/**
 * Token tracking — counts AI tokens used per month.
 * Free plan: 1,000 tokens. Pro: 50,000. etc.
 * Persists in localStorage with monthly reset.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UsageState {
  tokensUsed: number;
  imagesUsed: number;
  emailsUsed: number;
  monthKey: string; // e.g. "2026-07" — resets when month changes
  incrementTokens: (n: number) => void;
  incrementImages: () => void;
  incrementEmails: () => void;
  resetIfNewMonth: () => void;
  reset: () => void;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      tokensUsed: 0,
      imagesUsed: 0,
      emailsUsed: 0,
      monthKey: currentMonthKey(),

      incrementTokens: (n) => {
        get().resetIfNewMonth();
        set((s) => ({ tokensUsed: s.tokensUsed + n }));
      },

      incrementImages: () => {
        get().resetIfNewMonth();
        set((s) => ({ imagesUsed: s.imagesUsed + 1 }));
      },

      incrementEmails: () => {
        get().resetIfNewMonth();
        set((s) => ({ emailsUsed: s.emailsUsed + 1 }));
      },

      resetIfNewMonth: () => {
        const mk = currentMonthKey();
        if (get().monthKey !== mk) {
          set({ tokensUsed: 0, imagesUsed: 0, emailsUsed: 0, monthKey: mk });
        }
      },

      reset: () => set({ tokensUsed: 0, imagesUsed: 0, emailsUsed: 0, monthKey: currentMonthKey() }),
    }),
    { name: "spyro-usage" }
  )
);
