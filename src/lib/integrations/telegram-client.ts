/**
 * Minimal Telegram Bot API client — direct fetch, no SDK dependency.
 * All functions accept the bot token as the first parameter so the same
 * client works for the server-side env-var bot AND user-created bots.
 */

const TELEGRAM_API = "https://api.telegram.org";

export interface TelegramMessage {
  message_id: number;
  chat: { id: number; type: string; first_name?: string; title?: string };
  from?: { id: number; first_name?: string; username?: string };
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

function apiUrl(token: string, method: string): string {
  return `${TELEGRAM_API}/bot${token}/${method}`;
}

export async function sendMessage(
  token: string,
  chatId: number | string,
  text: string,
  options: {
    parseMode?: "Markdown" | "MarkdownV2" | "HTML";
    replyToMessageId?: number;
    disablePreview?: boolean;
  } = {}
): Promise<{ message_id: number }> {
  const res = await fetch(apiUrl(token, "sendMessage"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options.parseMode,
      reply_to_message_id: options.replyToMessageId,
      disable_web_page_preview: options.disablePreview ?? true,
    }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram sendMessage failed: ${data.description}`);
  }
  return { message_id: data.result.message_id };
}

export async function editMessageText(
  token: string,
  chatId: number | string,
  messageId: number,
  text: string,
  options: { parseMode?: "Markdown" | "MarkdownV2" | "HTML" } = {}
): Promise<void> {
  const res = await fetch(apiUrl(token, "editMessageText"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: options.parseMode,
      disable_web_page_preview: true,
    }),
  });
  const data = await res.json();
  if (!data.ok && !data.description?.includes("not modified")) {
    throw new Error(`Telegram editMessageText failed: ${data.description}`);
  }
}

export async function sendChatAction(
  token: string,
  chatId: number | string,
  action: "typing" | "upload_photo" | "record_video" | "upload_video" | "record_audio" | "upload_audio" = "typing"
): Promise<void> {
  await fetch(apiUrl(token, "sendChatAction"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action }),
  });
}

export async function setWebhook(
  token: string,
  url: string
): Promise<void> {
  const res = await fetch(apiUrl(token, "setWebhook"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, allowed_updates: ["message"] }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`setWebhook failed: ${data.description}`);
  }
}

export async function deleteWebhook(token: string): Promise<void> {
  const res = await fetch(apiUrl(token, "deleteWebhook"), {
    method: "POST",
    headers: { "content-type": "application/json" },
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`deleteWebhook failed: ${data.description}`);
  }
}

export async function getWebhookInfo(
  token: string
): Promise<{
  url: string;
  pending_update_count: number;
  last_error_message?: string;
}> {
  const res = await fetch(apiUrl(token, "getWebhookInfo"));
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`getWebhookInfo failed: ${data.description}`);
  }
  return data.result;
}

export async function getMe(token: string): Promise<{
  id: number;
  username: string;
  first_name: string;
}> {
  const res = await fetch(apiUrl(token, "getMe"));
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`getMe failed: ${data.description}`);
  }
  return data.result;
}

// ── Token encoding for webhook URLs ──────────────────────────────────
// The webhook URL encodes the bot token so the server can identify which
// bot Telegram is messaging. base64url keeps it URL-safe. This is
// obfuscation, not encryption — see docs/INTEGRATIONS.md for security notes.

export function encodeToken(token: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(token, "utf8").toString("base64url");
  }
  // Browser fallback (used by the integrations page when building URLs)
  return btoa(token).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeToken(encoded: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(encoded, "base64url").toString("utf8");
  }
  const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
  return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}
