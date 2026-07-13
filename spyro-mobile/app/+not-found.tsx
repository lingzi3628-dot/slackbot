import { Link, Stack } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export default function NotFoundScreen() {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ fontSize: 64 }}>🐉</Text>
        <Text style={[styles.title, { color: theme.text }]}>Page not found</Text>
        <Link href="/" style={[styles.link, { color: theme.primary }]}>
          Back to SPYRO V1
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  title: { fontSize: 20, fontWeight: "700" },
  link: { fontSize: 16, fontWeight: "600" },
});
