/**
 * Workspace store — tracks the user's selected workspace template.
 *
 * On first login, users pick a workspace template (Developer, Startup,
 * Research, etc.). The template provisions agents, apps, dashboard
 * widgets, quick actions, and knowledge collections.
 *
 * The selection persists in localStorage so it survives reloads.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkspaceTemplate } from "@/lib/workspace-templates";
import { getTemplate, WORKSPACE_TEMPLATES } from "@/lib/workspace-templates";

interface WorkspaceState {
  templateId: string | null;
  template: WorkspaceTemplate | null;
  hasSelectedWorkspace: boolean;
  customApps: string[];        // app IDs the user added beyond the template
  hiddenWidgets: string[];     // widget IDs the user hid
  pinnedTools: string[];       // tool IDs the user pinned

  selectWorkspace: (templateId: string) => void;
  resetWorkspace: () => void;
  addApp: (appId: string) => void;
  removeApp: (appId: string) => void;
  hideWidget: (widgetId: string) => void;
  showWidget: (widgetId: string) => void;
  pinTool: (toolId: string) => void;
  unpinTool: (toolId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      templateId: null,
      template: null,
      hasSelectedWorkspace: false,
      customApps: [],
      hiddenWidgets: [],
      pinnedTools: [],

      selectWorkspace: (templateId: string) => {
        const template = getTemplate(templateId) || null;
        set({ templateId, template, hasSelectedWorkspace: true });
      },

      resetWorkspace: () => set({
        templateId: null,
        template: null,
        hasSelectedWorkspace: false,
        customApps: [],
        hiddenWidgets: [],
        pinnedTools: [],
      }),

      addApp: (appId) => set((s) => ({
        customApps: s.customApps.includes(appId) ? s.customApps : [...s.customApps, appId],
      })),

      removeApp: (appId) => set((s) => ({
        customApps: s.customApps.filter((id) => id !== appId),
      })),

      hideWidget: (widgetId) => set((s) => ({
        hiddenWidgets: s.hiddenWidgets.includes(widgetId) ? s.hiddenWidgets : [...s.hiddenWidgets, widgetId],
      })),

      showWidget: (widgetId) => set((s) => ({
        hiddenWidgets: s.hiddenWidgets.filter((id) => id !== widgetId),
      })),

      pinTool: (toolId) => set((s) => ({
        pinnedTools: s.pinnedTools.includes(toolId) ? s.pinnedTools : [...s.pinnedTools, toolId],
      })),

      unpinTool: (toolId) => set((s) => ({
        pinnedTools: s.pinnedTools.filter((id) => id !== toolId),
      })),
    }),
    {
      name: "spyro-workspace",
      partialize: (s) => ({
        templateId: s.templateId,
        hasSelectedWorkspace: s.hasSelectedWorkspace,
        customApps: s.customApps,
        hiddenWidgets: s.hiddenWidgets,
        pinnedTools: s.pinnedTools,
      }),
      // Rehydrate the template object from the stored ID
      onRehydrateStorage: () => (state) => {
        if (state?.templateId) {
          state.template = getTemplate(state.templateId) || null;
        }
      },
    }
  )
);

export { WORKSPACE_TEMPLATES };
