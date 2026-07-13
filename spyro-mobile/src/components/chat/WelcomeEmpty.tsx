/**
 * Empty-state welcome screen — branded hero + 4 suggestion cards.
 */
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SpyroLogo } from "../SpyroLogo";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";

const SUGGESTIONS = [
  { icon: "code-slash-outline" as const, title: "Write some code", prompt: "Write a TypeScript function that debounces an async function, with comments explaining how it works." },
  { icon: "bulb-outline" as const, title: "Brainstorm ideas", prompt: "Give me 5 creative product ideas that combine AI with everyday household objects." },
  { icon: "school-outline" as const, title: "Explain a concept", prompt: "Explain how vector embeddings work, as if I'm a curious beginner." },
  { icon: "create-outline" as const, title: "Draft something", prompt: "Draft a friendly release note for a new dark-mode feature in a mobile app." },
] as const;

export function WelcomeEmpty({ onPick }: { onPick: (prompt: string) => void }) {
  const theme = useTheme();
  const haptics = useHaptics();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={[styles.heroBadge, { backgroundColor: theme.primary }]}>
          <SpyroLogo size={56} withGlow />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          <Text style={{ color: theme.primary }}>SPYRO</Text> V1
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          The dragon-powered AI assistant. Ask anything — SPYRO V1 breathes fire
          on hard problems and answers in a flash.
        </Text>
      </View>

      <View style={styles.grid}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s.title}
            onPress={() => {
              haptics.selection();
              onPick(s.prompt);
            }}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: theme.primaryMuted }]}>
                <Ionicons name={s.icon} size={18} color={theme.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{s.title}</Text>
            </View>
            <Text style={[styles.cardPrompt, { color: theme.textMuted }]} numberOfLines={2}>
              {s.prompt}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", marginBottom: 32 },
  heroBadge: { width: 88, height: 88, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", maxWidth: 320, lineHeight: 22 },
  grid: { width: "100%", maxWidth: 420, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  cardPrompt: { fontSize: 13, lineHeight: 18 },
});
