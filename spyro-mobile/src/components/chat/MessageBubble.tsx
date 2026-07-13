/**
 * Message bubble — user (right, ember) or assistant (left, surface card).
 * Shows avatar, role label, streaming cursor, copy on long-press.
 */
import { memo } from "react";
import { Pressable, StyleSheet, Text, View, Alert, Platform } from "react-native";
import * as ExpoClipboard from "expo-clipboard";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { SpyroLogo } from "../SpyroLogo";
import { Markdown } from "./Markdown";
import { TypingIndicator } from "./TypingIndicator";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import type { Message } from "@/store/chat-store";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  isGenerating: boolean;
  onRegenerate: () => void;
}

function MessageBubbleImpl({
  message,
  isLast,
  isGenerating,
  onRegenerate,
}: MessageBubbleProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const isUser = message.role === "user";

  const showTyping = !isUser && message.streaming && message.content.length === 0;

  const onLongPress = () => {
    haptics.impact();
    if (Platform.OS === "ios") {
      Alert.alert(
        "Message actions",
        undefined,
        [
          { text: "Copy", onPress: () => ExpoClipboard.setStringAsync(message.content) },
          ...(isUser || isGenerating ? [] : [{ text: "Regenerate", onPress: onRegenerate }]),
          { text: "Cancel", style: "cancel" as const },
        ]
      );
    } else {
      ExpoClipboard.setStringAsync(message.content);
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          isUser
            ? { backgroundColor: theme.surfaceElevated }
            : { backgroundColor: theme.primary },
        ]}
      >
        {isUser ? (
          <Ionicons name="person" size={16} color={theme.textMuted} />
        ) : (
          <SpyroLogo size={20} />
        )}
      </View>

      {/* Bubble */}
      <View style={[styles.bubbleCol, isUser ? styles.bubbleColUser : styles.bubbleColAssistant]}>
        <Text style={[styles.role, { color: theme.textMuted }]}>
          {isUser ? "You" : "SPYRO V1"}
        </Text>
        <Pressable onLongPress={onLongPress} delayLongPress={350}>
          <View
            style={[
              styles.bubble,
              isUser
                ? [styles.bubbleUser, { backgroundColor: theme.userBubble }]
                : message.error
                  ? [styles.bubbleAssistant, { backgroundColor: theme.surface, borderColor: theme.destructive }]
                  : [styles.bubbleAssistant, { backgroundColor: theme.assistantBubble, borderColor: theme.border }],
            ]}
          >
            {showTyping ? (
              <TypingIndicator />
            ) : isUser ? (
              <Text style={[styles.userText, { color: theme.userBubbleText }]}>
                {message.content}
              </Text>
            ) : (
              <View>
                <Markdown>{message.content}</Markdown>
                {message.streaming && (
                  <View style={[styles.cursor, { backgroundColor: theme.primary }]} />
                )}
              </View>
            )}
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export const MessageBubble = memo(MessageBubbleImpl);

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, paddingHorizontal: 12 },
  rowUser: { flexDirection: "row-reverse" },
  rowAssistant: { flexDirection: "row" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  bubbleCol: { maxWidth: "82%", gap: 3 },
  bubbleColUser: { alignItems: "flex-end" },
  bubbleColAssistant: { alignItems: "flex-start" },
  role: { fontSize: 11, fontWeight: "500", paddingHorizontal: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleUser: { borderTopRightRadius: 6 },
  bubbleAssistant: { borderTopLeftRadius: 6, borderWidth: 1 },
  userText: { fontSize: 15, lineHeight: 21 },
  cursor: { width: 2, height: 14, marginTop: 4, borderRadius: 1 },
});
