/**
 * Branded SPYRO V1 badge — logo + name.
 */
import { View, Text, StyleSheet } from "react-native";
import { SpyroLogo } from "./SpyroLogo";
import { useTheme } from "@/hooks/useTheme";
import { LinearGradient } from "./LinearGradient";

interface ModelBadgeProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function ModelBadge({ size = "md", showTagline = false }: ModelBadgeProps) {
  const theme = useTheme();
  const dims =
    size === "sm"
      ? { box: 28, text: 14, sub: 10 }
      : size === "lg"
        ? { box: 56, text: 20, sub: 12 }
        : { box: 40, text: 16, sub: 11 };

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={theme.gradient}
        style={[styles.box, { width: dims.box, height: dims.box, borderRadius: dims.box * 0.28 }]}
      >
        <SpyroLogo size={dims.box * 0.7} />
      </LinearGradient>
      <View>
        <Text style={{ fontSize: dims.text, fontWeight: "700", color: theme.text }}>
          <Text style={{ color: theme.primary }}>SPYRO</Text> V1
        </Text>
        {showTagline && (
          <Text style={{ fontSize: dims.sub, color: theme.textMuted }}>
            Dragon-powered AI
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  box: { alignItems: "center", justifyContent: "center" },
});
