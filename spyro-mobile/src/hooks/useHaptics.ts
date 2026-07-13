/**
 * Thin wrapper around expo-haptics that respects the user's haptics setting.
 */
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { useSettingsStore } from "@/store/settings-store";

export function useHaptics() {
  const enabled = useSettingsStore((s) => s.hapticsEnabled);

  const impact = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
      if (!enabled) return;
      Haptics.impactAsync(style).catch(() => {});
    },
    [enabled]
  );

  const notify = useCallback(
    (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
      if (!enabled) return;
      Haptics.notificationAsync(type).catch(() => {});
    },
    [enabled]
  );

  const selection = useCallback(() => {
    if (!enabled) return;
    Haptics.selectionAsync().catch(() => {});
  }, [enabled]);

  return { impact, notify, selection };
}
