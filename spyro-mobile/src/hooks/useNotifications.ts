/**
 * Push notifications setup.
 *
 * SPYRO V1 uses notifications for ONE thing: alerting the user when a
 * backgrounded chat response finishes streaming. (The actual scheduling is
 * done from useSpyroChat when the app background-detects.)
 *
 * This hook exposes permission status + a toggle. It also registers the
 * device token with your backend (POST /api/push/register) — see the
 * `registerForPush` export if you wire up a push server later.
 */
import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { API_BASE_URL } from "@/lib/constants";

// Configure how notifications appear while the app is foregrounded.
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export type PermissionStatus =
  | "undetermined"
  | "granted"
  | "denied";

export function useNotifications() {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("undetermined");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status, canAskAgain } =
          await Notifications.getPermissionsAsync();
        setPermissionStatus(
          status === "granted"
            ? "granted"
            : canAskAgain
              ? "undetermined"
              : "denied"
        );
      } catch {
        /* ignore */
      }
    })();
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      // Tap on a "response ready" notification → no-op (app already open).
    });
    return () => sub.remove();
  }, []);

  const request = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === "granted";
    setPermissionStatus(granted ? "granted" : "denied");
    if (granted) {
      const t = await registerForPush();
      setToken(t);
    }
    return granted;
  };

  const toggle = async () => {
    if (permissionStatus === "granted") {
      // We can't revoke permission from code — open device settings.
      setPermissionStatus("denied");
      return;
    }
    await request();
  };

  return { permissionStatus, token, request, toggle };
}

/**
 * Requests the Expo push token and (optionally) registers it with the SPYRO
 * V1 backend so the server can send "response ready" pushes. Safe to call
 * from app launch after permission is granted.
 */
export async function registerForPush(): Promise<string | null> {
  try {
    const projectId = "REPLACE_WITH_EAS_PROJECT_ID"; // from app.config.ts extra.eas.projectId
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    // Best-effort register with backend. Ignore failures — push is a
    // nice-to-have, not a critical path.
    try {
      await fetch(`${API_BASE_URL}/api/push/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, platform: Platform.OS }),
      });
    } catch {
      /* backend may not implement /api/push/register yet — that's fine */
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * Schedules a local notification. Used by useSpyroChat to alert the user
 * that a response finished while the app was backgrounded.
 */
export async function notifyResponseReady(title: string, preview: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `SPYRO V1 · ${title}`,
      body: preview.slice(0, 140),
      data: { type: "response_ready" },
    },
    trigger: null, // immediate
  });
}
