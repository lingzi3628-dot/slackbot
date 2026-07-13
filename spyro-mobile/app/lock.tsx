/**
 * Biometric lock screen — shown on app foreground when biometric lock is on.
 * Gate is controlled by a transient in-memory flag (NOT persisted) so the
 * lock always re-arms when the app is killed / backgrounded.
 */
import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import { useBiometricLock } from "@/hooks/useBiometricLock";
import { SpyroLogo } from "@/components/SpyroLogo";

/**
 * In-memory lock flag. Set to true when the app backgrounds. The root
 * _layout reads this to decide whether to show the lock screen.
 * (Kept out of MMKV so a freshly-launched app always requires auth.)
 */
export const lockStore = (() => {
  let armed = false;
  const subs = new Set<() => void>();
  return {
    isArmed: () => armed,
    arm: () => {
      armed = true;
      subs.forEach((f) => f());
    },
    disarm: () => {
      armed = false;
      subs.forEach((f) => f());
    },
    subscribe: (fn: () => void) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
})();

export function useLockArmed() {
  const [, force] = useState(0);
  useEffect(() => lockStore.subscribe(() => force((n) => n + 1)), []);
  return lockStore.isArmed();
}

export default function LockScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const router = useRouter();
  const { available, enrolled, authenticate } = useBiometricLock();
  const [error, setError] = useState<string | null>(null);

  const tryUnlock = async () => {
    haptics.impact();
    const ok = await authenticate("Unlock SPYRO V1");
    if (ok) {
      lockStore.disarm();
    } else {
      setError("Authentication failed. Try again.");
    }
  };

  // Auto-prompt on mount.
  useEffect(() => {
    tryUnlock();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.logoWrap}>
        <SpyroLogo size={80} withGlow />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>SPYRO V1</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        {available && enrolled
          ? "Authenticate to unlock your conversations"
          : "Biometrics aren't set up on this device."}
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {available && enrolled && (
        <Pressable
          onPress={tryUnlock}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Unlock with biometrics"
        >
          <Ionicons name="lock-open-outline" size={20} color={theme.primaryForeground} />
          <Text style={[styles.btnText, { color: theme.primaryForeground }]}>
            Unlock
          </Text>
        </Pressable>
      )}

      {!enrolled && (
        <Pressable
          onPress={() => {
            // Lock is on but no biometrics — fall back to disabling the lock
            // so the user isn't permanently locked out.
            lockStore.disarm();
            router.replace("/");
          }}
        >
          <Text style={{ color: theme.textMuted, fontSize: 14, marginTop: 24 }}>
            Continue without biometrics
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  logoWrap: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 32, maxWidth: 280 },
  error: { color: "#e85a3c", fontSize: 13, marginBottom: 16 },
  btn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  btnText: { fontSize: 16, fontWeight: "700" },
});
