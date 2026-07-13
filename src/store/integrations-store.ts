/**
 * User-configured integrations — stored in localStorage.
 * Each integration is a bot the user created from the Integrations page.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";

export interface UserIntegration {
  id: string;
  platform: "telegram";
  label: string;
  token: string;
  botUsername?: string;
  botName?: string;
  connected: boolean;
  createdAt: number;
}

interface IntegrationsState {
  integrations: UserIntegration[];
  addIntegration: (int: Omit<UserIntegration, "id" | "createdAt">) => string;
  updateIntegration: (id: string, patch: Partial<UserIntegration>) => void;
  removeIntegration: (id: string) => void;
}

export const useIntegrationsStore = create<IntegrationsState>()(
  persist(
    (set) => ({
      integrations: [],
      addIntegration: (int) => {
        const id = uuid();
        const full: UserIntegration = { id, createdAt: Date.now(), ...int };
        set((s) => ({ integrations: [...s.integrations, full] }));
        return id;
      },
      updateIntegration: (id, patch) =>
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id ? { ...i, ...patch } : i
          ),
        })),
      removeIntegration: (id) =>
        set((s) => ({
          integrations: s.integrations.filter((i) => i.id !== id),
        })),
    }),
    { name: "spyro-v1-integrations" }
  )
);
