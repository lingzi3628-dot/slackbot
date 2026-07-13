/**
 * Web-side conversation export — mirrors the mobile app's export.ts.
 * Downloads a single conversation as Markdown, or all as JSON.
 */

export interface WebMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface WebConversation {
  id: string;
  title: string;
  messages: WebMessage[];
  createdAt: number;
  updatedAt: number;
}

export function conversationToMarkdown(c: WebConversation): string {
  const lines: string[] = [`# ${c.title}`, ""];
  for (const m of c.messages) {
    const who = m.role === "user" ? "🧑 You" : "🐉 SPYRO V1";
    lines.push(`### ${who}`, "", m.content, "", "---", "");
  }
  return lines.join("\n");
}

export function conversationsToJson(conversations: WebConversation[]): string {
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

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportConversationAsMarkdown(conversation: WebConversation) {
  const safeTitle = conversation.title
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()
    .slice(0, 40);
  const filename = `spyro-v1-${safeTitle || "chat"}.md`;
  download(filename, conversationToMarkdown(conversation), "text/markdown");
}

export function exportAllConversationsAsJson(conversations: WebConversation[]) {
  if (conversations.length === 0) return;
  const filename = `spyro-v1-export-${Date.now()}.json`;
  download(
    filename,
    conversationsToJson(conversations),
    "application/json"
  );
}
