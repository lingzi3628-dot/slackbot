/**
 * Root layout — installs streaming polyfills, providers, splash control,
 * and the Expo Router stack.
 *
 * IMPORTANT: react-native-polyfill-globals + react-native-fetch-api must be
 * imported here (at app entry) BEFORE any fetch call so that `res.body`
 * becomes a ReadableStream on React Native. Without this, the streaming
 * chat client in src/lib/api.ts will not work.
 */
import "../src/lib/polyfills";

import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useThemeMode } from "@/hooks/useTheme";
import { useSettingsStore } from "@/store/settings-store";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const mode = useThemeMode();
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);

  useEffect(() => {
    // Hide splash once the first paint is ready.
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Protect condition={!hasOnboarded}>
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          </Stack.Protect>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
