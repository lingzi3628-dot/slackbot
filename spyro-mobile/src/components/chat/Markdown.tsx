/**
 * Markdown renderer using react-native-markdown-display with the SPYRO
 * ember theme. Code blocks get a monospace style + copy-on-long-press.
 */
import { useMemo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as ExpoClipboard from "expo-clipboard";
import MarkdownDisplay from "react-native-markdown-display";
import { useTheme } from "@/hooks/useTheme";
import { buildMarkdownRules } from "@/lib/markdown-theme";
import { useHaptics } from "@/hooks/useHaptics";

export function Markdown({ children }: { children: string }) {
  const theme = useTheme();
  const haptics = useHaptics();
  const rules = useMemo(() => buildMarkdownRules(theme), [theme]);

  const copy = useCallback(
    async (text: string) => {
      await ExpoClipboard.setStringAsync(text);
      haptics.notify();
    },
    [haptics]
  );

  const displayRules = useMemo(
    () => ({
      code_block: (node: { content?: string }) => {
        const content = node?.content ?? "";
        return (
          <Pressable onLongPress={() => copy(content)} delayLongPress={300}>
            <View style={[styles.codeBlock, { backgroundColor: theme.codeBackground, borderColor: theme.border }]}>
              <Text style={styles.codeText} selectable>
                {content}
              </Text>
            </View>
          </Pressable>
        );
      },
      fence: (node: { content?: string }) => {
        const content = node?.content ?? "";
        return (
          <Pressable onLongPress={() => copy(content)} delayLongPress={300}>
            <View style={[styles.codeBlock, { backgroundColor: theme.codeBackground, borderColor: theme.border }]}>
              <Text style={styles.codeText} selectable>
                {content}
              </Text>
            </View>
          </Pressable>
        );
      },
    }),
    [theme, copy]
  );

  return (
    <MarkdownDisplay rules={displayRules} style={rules as any}>
      {children}
    </MarkdownDisplay>
  );
}

const styles = StyleSheet.create({
  codeBlock: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginVertical: 8,
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 18,
  },
});
