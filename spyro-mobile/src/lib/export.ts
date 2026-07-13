/**
 * Conversation export utilities — writes JSON / Markdown to the device's
 * document directory and opens the native share sheet.
 */
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import type { Conversation } from "@/store/chat-store";

/**
 * Export a single conversation as Markdown.
 */
export function conversationToMarkdown(c: Conversation): string {
  const lines: string[] = [`# ${c.title}`, ""];
  for (const m of c.messages) {
    const who = m.role === "user" ? "🧑 You" : "🐉 SPYRO V1";
    lines.push(`### ${who}`, "", m.content, "", "---", "");
  }
  return lines.join("\n");
}

/**
 * Export all conversations as a single JSON blob.
 */
export function conversationsToJson(conversations: Conversation[]): string {
  return JSON.stringify(
    {
      app: "SPYRO V1",
      version: 1,
      exportedAt: new Date().toISOString(),
      conversations,
    },
    null,
    2
  );
}

async function shareFile(uri: string, filename: string, mime: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device.");
  }
  await Sharing.shareAsync(uri, {
    mimeType: mime,
    dialogTitle: "Export SPYRO V1 conversations",
    UTI: mime === "application/json" ? "public.json" : "net.daringfireball.markdown",
  });
}

/**
 * Export ALL conversations as a single JSON file and open the share sheet.
 */
export async function exportAllConversations(
  conversations: Conversation[]
): Promise<void> {
  if (conversations.length === 0) return;
  const json = conversationsToJson(conversations);
  const filename = `spyro-v1-export-${Date.now()}.json`;
  const uri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await shareFile(uri, filename, "application/json");
}

/**
 * Export a SINGLE conversation as Markdown and open the share sheet.
 */
export async function exportConversationAsMarkdown(
  conversation: Conversation
): Promise<void> {
  const md = conversationToMarkdown(conversation);
  const safeTitle = conversation.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40);
  const filename = `spyro-v1-${safeTitle || "chat"}-${Date.now()}.md`;
  const uri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, md, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await shareFile(uri, filename, "text/markdown");
}
