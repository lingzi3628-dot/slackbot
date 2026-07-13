/**
 * Settings tab — appearance, haptics, privacy, about.
 */
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useThemeMode } from "@/hooks/useTheme";
import { useSettingsStore, type ThemeMode } from "@/store/settings-store";
import { useChatStore } from "@/store/chat-store";
import { useHaptics } from "@/hooks/useHaptics";
import { ModelBadge } from "@/components/ModelBadge";
import { API_BASE_URL } from "@/lib/constants";

function Row({
  icon,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: theme.primaryMuted }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }}>{title}</Text>
        {subtitle && <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {right}
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{children}</Text>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const mode = useThemeMode();
  const haptics = useHaptics();
  const themePref = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const biometricLock = useSettingsStore((s) => s.biometricLock);
  const setBiometricLock = useSettingsStore((s) => s.setBiometricLock);
  const conversations = useChatStore((s) => s.conversations);

  const themeOptions: { key: ThemeMode; label: string }[] = [
    { key: "system", label: "System" },
    { key: "dark", label: "Dark" },
    { key: "light", label: "Light" },
  ];

  const clearAll = () => {
    Alert.alert(
      "Clear all conversations",
      "This permanently deletes every conversation on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: () => {
            haptics.notify();
            conversations.forEach((c) => useChatStore.getState().deleteConversation(c.id));
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, gap: 6 }}
    >
      <View style={{ alignItems: "center", paddingVertical: 20 }}>
        <ModelBadge size="lg" showTagline />
      </View>

      <SectionTitle>Appearance</SectionTitle>
      <View style={styles.group}>
        {themeOptions.map((opt, i) => (
          <Pressable
            key={opt.key}
            onPress={() => { haptics.selection(); setTheme(opt.key); }}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderTopWidth: i === 0 ? 1 : 0,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.rowIcon, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons
                name={opt.key === "dark" ? "moon" : opt.key === "light" ? "sunny" : "contrast"}
                size={18}
                color={theme.primary}
              />
            </View>
            <Text style={{ flex: 1, color: theme.text, fontSize: 15 }}>{opt.label}</Text>
            {themePref === opt.key && <Ionicons name="checkmark" size={20} color={theme.primary} />}
          </Pressable>
        ))}
      </View>

      <SectionTitle>Feedback</SectionTitle>
      <Row
        icon="phone-portrait-outline"
        title="Haptics"
        subtitle={hapticsEnabled ? "On" : "Off"}
        onPress={() => { haptics.impact(); setHapticsEnabled(!hapticsEnabled); }}
        right={
          <Ionicons
            name={hapticsEnabled ? "toggle" : "toggle-outline"}
            size={28}
            color={hapticsEnabled ? theme.primary : theme.textMuted}
          />
        }
      />

      <SectionTitle>Privacy</SectionTitle>
      <Row
        icon="lock-closed-outline"
        title="Biometric lock"
        subtitle={biometricLock ? "On — Face ID / fingerprint" : "Off"}
        onPress={() => { haptics.impact(); setBiometricLock(!biometricLock); }}
        right={
          <Ionicons
            name={biometricLock ? "toggle" : "toggle-outline"}
            size={28}
            color={biometricLock ? theme.primary : theme.textMuted}
          />
        }
      />
      <Row
        icon="trash-outline"
        title="Clear all conversations"
        subtitle={`${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`}
        onPress={clearAll}
      />

      <SectionTitle>About</SectionTitle>
      <Row icon="flame" title="Model" subtitle="SPYRO V1 — Dragon-powered AI" />
      <Row icon="server-outline" title="Backend" subtitle={API_BASE_URL} />
      <Row
        icon="logo-github"
        title="GitHub repository"
        subtitle="meshmusic2836-lab/slackbot"
        onPress={() => Linking.openURL("https://github.com/meshmusic2836-lab/slackbot")}
        right={<Ionicons name="open-outline" size={18} color={theme.textMuted} />}
      />
      <Row icon="document-text-outline" title="Version" subtitle="1.0.0 (Phase 0+1)" />

      <Text style={[styles.footer, { color: theme.textMuted }]}>
        Built with fire by SPYRO Labs. 🐉🔥
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: 14, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  footer: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 8,
  },
});
