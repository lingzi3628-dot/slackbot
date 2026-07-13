/**
 * First-launch onboarding — 3 slides, then marks onboarded and jumps to chat.
 */
import { useState } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useSettingsStore } from "@/store/settings-store";
import { useHaptics } from "@/hooks/useHaptics";
import { SpyroLogo } from "@/components/SpyroLogo";
import { LinearGradient } from "@/components/LinearGradient";

const SLIDES = [
  {
    icon: "flame" as const,
    title: "Meet SPYRO V1",
    body: "A dragon-powered AI assistant. It breathes fire on hard problems and answers in a flash.",
  },
  {
    icon: "chatbubbles" as const,
    title: "Chat about anything",
    body: "Write code, brainstorm ideas, explain concepts, draft text. Conversations are saved on your device.",
  },
  {
    icon: "shield-checkmark" as const,
    title: "Private by default",
    body: "Your chats live on your phone. Only your prompts are sent to the SPYRO V1 engine to get a reply.",
  },
] as const;

export default function OnboardingScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const router = useRouter();
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const [index, setIndex] = useState(0);
  const { width } = useWindowDimensions();
  const isLast = index === SLIDES.length - 1;

  const next = () => {
    haptics.impact();
    if (isLast) {
      setOnboarded(true);
      router.replace("/");
    } else {
      setIndex((i) => i + 1);
    }
  };

  const slide = SLIDES[index];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.skipRow}>
        {!isLast && (
          <Pressable onPress={() => { haptics.selection(); setOnboarded(true); router.replace("/"); }}>
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>Skip</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.content}>
        <LinearGradient
          colors={theme.gradient}
          style={[styles.badge, { width: 120, height: 120, borderRadius: 32 }]}
        >
          {index === 0 ? (
            <SpyroLogo size={72} />
          ) : (
            <Ionicons name={slide.icon} size={56} color={theme.primaryForeground} />
          )}
        </LinearGradient>

        <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>{slide.body}</Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === index ? theme.primary : theme.border, width: i === index ? 24 : 8 },
            ]}
          />
        ))}
      </View>

      <Pressable
        onPress={next}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={isLast ? "Get started" : "Next"}
      >
        <Text style={[styles.ctaText, { color: theme.primaryForeground }]}>
          {isLast ? "Start chatting" : "Continue"}
        </Text>
        <Ionicons name="arrow-forward" size={20} color={theme.primaryForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingBottom: 40 },
  skipRow: { flexDirection: "row", justifyContent: "flex-end", paddingTop: 16 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  badge: { alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  body: { fontSize: 16, textAlign: "center", lineHeight: 24, maxWidth: 300 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 24 },
  dot: { height: 8, borderRadius: 4 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  ctaText: { fontSize: 16, fontWeight: "700" },
});
