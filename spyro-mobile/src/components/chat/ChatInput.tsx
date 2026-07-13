/**
 * Chat input — auto-growing multiline TextInput with Send/Stop toggle.
 */
import { useRef, useState } from "react";
import { View, TextInput, Pressable, StyleSheet, Platform } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useChatStore } from "@/store/chat-store";
import { useHaptics } from "@/hooks/useHaptics";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
}

export function ChatInput({ onSend, onStop }: ChatInputProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const isGenerating = useChatStore((s) => s.isGenerating);
  const [value, setValue] = useState("");
  const inputRef = useRef<TextInput>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || isGenerating) return;
    onSend(text);
    setValue("");
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={setValue}
        placeholder="Message SPYRO V1…"
        placeholderTextColor={theme.textMuted}
        multiline
        textAlignVertical="center"
        style={[styles.input, { color: theme.text }]}
        onSubmitEditing={submit}
        blurOnSubmit={false}
        returnKeyType="default"
      />
      {isGenerating ? (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
          <Pressable
            onPress={() => { haptics.impact(); onStop(); }}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: theme.surfaceElevated, opacity: pressed ? 0.8 : 1 },
            ]}
            accessibilityLabel="Stop generating"
            accessibilityRole="button"
          >
            <Ionicons name="stop" size={18} color={theme.text} />
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
          <Pressable
            onPress={() => { haptics.impact(); submit(); }}
            disabled={!value.trim()}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: theme.primary, opacity: value.trim() ? (pressed ? 0.85 : 1) : 0.4 },
            ]}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-up" size={20} color={theme.primaryForeground} />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: Platform.OS === "ios" ? 4 : 12,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 140,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
    fontSize: 15,
    lineHeight: 20,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
