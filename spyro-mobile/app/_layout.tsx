/**
 * Root layout — installs streaming polyfills, providers, splash control,
 * the biometric lock gate, and the Expo Router stack.
 *
 * IMPORTANT: react-native-polyfill-globals + react-native-fetch-api must be
 * imported here (at app entry) BEFORE any fetch call so that `res.body`
 * becomes a ReadableStream on React Native. Without this, the streaming
 * chat client in src/lib/api.ts will not work.
 */
import "../src/lib/polyfills";

import { useEffect } from "react";
import { AppState, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useThemeMode } from "@/hooks/useTheme";
import { useSettingsStore } from "@/store/settings-store";
import { lockStore, useLockArmed } from "./lock";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const mode = useThemeMode();
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);
  const biometricLock = useSettingsStore((s) => s.biometricLock);
  const armed = useLockArmed();

  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 400);
    return () => clearTimeout(t);
  }, []);

  // Re-arm the lock whenever the app goes to background (only if the user
  // has biometric lock enabled). This ensures the lock screen always shows
  // when returning to the app.
  useEffect(() => {
    if (!biometricLock) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        lockStore.arm();
      }
    });
    // Arm on first launch if biometric lock is on.
    lockStore.arm();
    return () => sub.remove();
  }, [biometricLock]);

  const showLock = biometricLock && armed;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Protect condition={!hasOnboarded}>
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          </Stack.Protect>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lock" options={{ gestureEnabled: false, animation: "fade" }} />
        </Stack>
        {/*
          The lock overlay. Rendered above the stack so it covers everything
          when armed. Uses absolute fill so it doesn't unmount the chat
          (preserving the streaming state under the lock).
        */}
        {showLock && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 999,
              elevation: 999,
            }}
          >
            <LockGate />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Lazy-render the lock screen so its biometric check only runs when armed.
 */
function LockGate() {
  // Re-imported lazily to keep the module graph small when lock is off.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const LockScreen = require("./lock").default as React.ComponentType;
  return <LockScreen />;
}
