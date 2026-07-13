/**
 * Resolves the active theme: system color scheme + user preference override.
 * Re-renders consumers when either changes.
 */
import { useColorScheme } from "react-native";
import { useSettingsStore } from "@/store/settings-store";
import { getTheme, type Theme } from "@/lib/theme";

export function useTheme(): Theme {
  const system = useColorScheme();
  const mode = useSettingsStore((s) => s.theme);
  const resolved =
    mode === "system" ? (system ?? "dark") : mode;
  return getTheme(resolved === "dark" ? "dark" : "light");
}

export function useThemeMode(): "dark" | "light" {
  const system = useColorScheme();
  const mode = useSettingsStore((s) => s.theme);
  const resolved = mode === "system" ? (system ?? "dark") : mode;
  return resolved === "dark" ? "dark" : "light";
}
