/**
 * SPYRO V1 settings store (Zustand + MMKV).
 * Persists theme preference, haptics, biometric lock, onboarding flag.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const mmkv = new MMKV({ id: "spyro-v1-settings" });

export type ThemeMode = "system" | "dark" | "light";

interface SettingsState {
  theme: ThemeMode;
  hapticsEnabled: boolean;
  biometricLock: boolean;
  hasOnboarded: boolean;
  setTheme: (t: ThemeMode) => void;
  setHapticsEnabled: (v: boolean) => void;
  setBiometricLock: (v: boolean) => void;
  setOnboarded: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      hapticsEnabled: true,
      biometricLock: false,
      hasOnboarded: false,
      setTheme: (t) => set({ theme: t }),
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
      setBiometricLock: (v) => set({ biometricLock: v }),
      setOnboarded: (v) => set({ hasOnboarded: v }),
    }),
    {
      name: "spyro-v1-settings",
      storage: createJSONStorage(() => ({
        getItem: (k) => (mmkv.getString(k) as string | null) ?? null,
        setItem: (k, v) => mmkv.set(k, v),
        removeItem: (k) => mmkv.delete(k),
      })),
    }
  )
);
