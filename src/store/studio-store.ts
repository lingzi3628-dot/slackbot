/**
 * SPYRO STUDIO — Store
 *
 * Tracks: selected studio type, installed apps, open windows, layout.
 * Studio is an additive layer — it uses the SAME data as the main app.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StudioType } from "@/lib/studio-types";
import { getStudioType } from "@/lib/studio-types";

interface OpenWindow {
  id: string;
  appId: string;
  appName: string;
  minimized: boolean;
  maximized: boolean;
}

interface StudioState {
  studioTypeId: string | null;
  studioType: StudioType | null;
  hasSelectedStudio: boolean;
  isInStudio: boolean;             // whether the user is currently inside Studio
  installedAppIds: string[];       // apps installed from the App Store
  openWindows: OpenWindow[];
  layout: "split" | "tabs" | "single";

  selectStudio: (typeId: string) => void;
  enterStudio: () => void;
  exitStudio: () => void;
  installApp: (appId: string) => void;
  uninstallApp: (appId: string) => void;
  openApp: (appId: string, appName: string) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  setLayout: (layout: "split" | "tabs" | "single") => void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      studioTypeId: null,
      studioType: null,
      hasSelectedStudio: false,
      isInStudio: false,
      installedAppIds: [],
      openWindows: [],
      layout: "tabs",

      selectStudio: (typeId: string) => {
        const studioType = getStudioType(typeId) || null;
        set({ studioTypeId: typeId, studioType, hasSelectedStudio: true });
      },

      enterStudio: () => set({ isInStudio: true }),
      exitStudio: () => set({ isInStudio: false, openWindows: [] }),

      installApp: (appId) => set((s) => ({
        installedAppIds: s.installedAppIds.includes(appId) ? s.installedAppIds : [...s.installedAppIds, appId],
      })),

      uninstallApp: (appId) => set((s) => ({
        installedAppIds: s.installedAppIds.filter((id) => id !== appId),
      })),

      openApp: (appId, appName) => set((s) => {
        // Don't open duplicate windows
        const existing = s.openWindows.find((w) => w.appId === appId);
        if (existing) return { openWindows: s.openWindows };
        return {
          openWindows: [...s.openWindows, {
            id: `win-${Date.now()}`,
            appId,
            appName,
            minimized: false,
            maximized: false,
          }],
        };
      }),

      closeWindow: (windowId) => set((s) => ({
        openWindows: s.openWindows.filter((w) => w.id !== windowId),
      })),

      minimizeWindow: (windowId) => set((s) => ({
        openWindows: s.openWindows.map((w) => w.id === windowId ? { ...w, minimized: !w.minimized } : w),
      })),

      maximizeWindow: (windowId) => set((s) => ({
        openWindows: s.openWindows.map((w) => w.id === windowId ? { ...w, maximized: !w.maximized } : w),
      })),

      setLayout: (layout) => set({ layout }),
    }),
    {
      name: "spyro-studio",
      partialize: (s) => ({
        studioTypeId: s.studioTypeId,
        hasSelectedStudio: s.hasSelectedStudio,
        installedAppIds: s.installedAppIds,
        layout: s.layout,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.studioTypeId) {
          state.studioType = getStudioType(state.studioTypeId) || null;
        }
      },
    }
  )
);
