/**
 * SPYRO V1 settings store (Zustand + AsyncStorage).
 * Persists theme preference, haptics, biometric lock, onboarding flag.
 *
 * Uses AsyncStorage so the app runs in Expo Go (no native module build
 * required). For production, you can swap to react-native-mmkv for sync
 * + encrypted storage — see the README "Production storage" note.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
