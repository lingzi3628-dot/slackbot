/**
 * History tab — list all conversations, create new, rename, delete.
 */
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useChatStore } from "@/store/chat-store";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import { ModelBadge } from "@/components/ModelBadge";
import { exportConversationAsMarkdown } from "@/lib/export";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function HistoryScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const router = useRouter();
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const setActive = useChatStore((s) => s.setActive);
  const createConversation = useChatStore((s) => s.createConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const renameConversation = useChatStore((s) => s.renameConversation);

  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);

  const openConversation = (id: string) => {
    haptics.selection();
    setActive(id);
    router.push("/");
  };

  const onNew = () => {
    haptics.impact();
    createConversation();
    router.push("/");
  };

  const onDelete = (id: string, title: string) => {
    haptics.impact();
    Alert.alert(
      "Delete conversation",
      `"${title}" will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteConversation(id) },
      ]
    );
  };

  const onRename = (id: string, current: string) => {
    setEditing({ id, title: current });
  };

  const commitRename = () => {
    if (editing) {
      renameConversation(editing.id, editing.title);
      setEditing(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <ModelBadge size="sm" showTagline />
        <Pressable
          onPress={onNew}
          style={({ pressed }) => [
            styles.newBtn,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="New chat"
        >
          <Ionicons name="add" size={20} color={theme.primaryForeground} />
          <Text style={[styles.newBtnText, { color: theme.primaryForeground }]}>New</Text>
        </Pressable>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 12, gap: 6 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="flame-outline" size={40} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, marginTop: 12, textAlign: "center" }}>
              No conversations yet.{"\n"}Start a new chat to wake the dragon.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = item.id === activeId;
          return (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: isActive ? theme.primaryMuted : theme.surface,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}
            >
              <Pressable
                onPress={() => openConversation(item.id)}
                onLongPress={() => {
                  haptics.impact();
                  Alert.alert(item.title, undefined, [
                    { text: "Rename", onPress: () => onRename(item.id, item.title) },
                    {
                      text: "Export as Markdown",
                      onPress: () => exportConversationAsMarkdown(item),
                    },
                    { text: "Delete", style: "destructive", onPress: () => onDelete(item.id, item.title) },
                    { text: "Cancel", style: "cancel" },
                  ]);
                }}
                style={{ flex: 1 }}
              >
                <Text
                  style={[styles.title, { color: isActive ? theme.primary : theme.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={[styles.meta, { color: theme.textMuted }]}>
                  {item.messages.length} msg · {timeAgo(item.updatedAt)}
                </Text>
              </Pressable>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => onRename(item.id, item.title)}
                  hitSlop={8}
                  accessibilityLabel="Rename"
                >
                  <Ionicons name="create-outline" size={18} color={theme.textMuted} />
                </Pressable>
                <Pressable
                  onPress={() => onDelete(item.id, item.title)}
                  hitSlop={8}
                  accessibilityLabel="Delete"
                >
                  <Ionicons name="trash-outline" size={18} color={theme.destructive} />
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* Rename modal */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Rename conversation</Text>
            <TextInput
              autoFocus
              value={editing?.title ?? ""}
              onChangeText={(t) => setEditing((e) => (e ? { ...e, title: t } : e))}
              onSubmitEditing={commitRename}
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="Conversation name"
              placeholderTextColor={theme.textMuted}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setEditing(null)} style={styles.modalBtn}>
                <Text style={{ color: theme.textMuted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={commitRename} style={styles.modalBtn}>
                <Text style={{ color: theme.primary, fontWeight: "600" }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newBtnText: { fontSize: 14, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", gap: 12 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 32 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modal: { width: "100%", borderRadius: 16, padding: 20, gap: 12 },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 20 },
  modalBtn: { paddingVertical: 6, paddingHorizontal: 8 },
});
