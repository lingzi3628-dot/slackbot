/**
 * Chat tab — the primary screen. Shows the active conversation (or the
 * welcome empty-state) plus the message input.
 */
import { useEffect, useRef } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  Text,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChatStore } from "@/store/chat-store";
import { useSpyroChat } from "@/hooks/useSpyroChat";
import { useTheme } from "@/hooks/useTheme";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeEmpty } from "@/components/chat/WelcomeEmpty";
import type { Message } from "@/store/chat-store";

export default function ChatScreen() {
  const theme = useTheme();
  const { send, stop, regenerate } = useSpyroChat();
  const activeId = useChatStore((s) => s.activeId);
  const messages = useChatStore((s) =>
    s.conversations.find((c) => c.id === s.activeId)?.messages ?? []
  );
  const isGenerating = useChatStore((s) => s.isGenerating);
  const createConversation = useChatStore((s) => s.createConversation);
  const listRef = useRef<FlashList<Message>>(null);

  // Scroll to bottom when new messages arrive.
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length, messages[messages.length - 1]?.content]);

  const handleNewChat = () => {
    createConversation();
    router.push("/history");
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        {messages.length === 0 ? (
          <WelcomeEmpty onPick={send} />
        ) : (
          <FlashList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            estimatedItemSize={140}
            contentContainerStyle={{ paddingVertical: 16, gap: 14 }}
            renderItem={({ item, index }) => (
              <MessageBubble
                message={item}
                isLast={index === messages.length - 1}
                isGenerating={isGenerating}
                onRegenerate={regenerate}
              />
            )}
          />
        )}
        <ChatInput onSend={send} onStop={stop} />
      </KeyboardAvoidingView>

      {/* FAB: new chat — only when there's an active conversation */}
      {messages.length > 0 && (
        <Pressable
          onPress={handleNewChat}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityLabel="New chat"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color={theme.primaryForeground} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 64,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
