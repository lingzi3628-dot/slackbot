/**
 * Minimal Telegram Bot API client — direct fetch, no SDK dependency.
 * Supports the handful of methods SPYRO V1 needs.
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

function token(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return t;
}

function apiUrl(method: string): string {
  return `${TELEGRAM_API}/bot${token()}/${method}`;
}

export async function sendMessage(
  chatId: number | string,
  text: string,
  options: {
    parseMode?: "Markdown" | "MarkdownV2" | "HTML";
    replyToMessageId?: number;
    disablePreview?: boolean;
  } = {}
): Promise<{ message_id: number }> {
  const res = await fetch(apiUrl("sendMessage"), {
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
  chatId: number | string,
  messageId: number,
  text: string,
  options: { parseMode?: "Markdown" | "MarkdownV2" | "HTML" } = {}
): Promise<void> {
  const res = await fetch(apiUrl("editMessageText"), {
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
  // Edit can fail if text is identical — ignore that case.
  if (!data.ok && !data.description?.includes("not modified")) {
    throw new Error(`Telegram editMessageText failed: ${data.description}`);
  }
}

export async function sendChatAction(
  chatId: number | string,
  action: "typing" | "upload_photo" | "record_video" | "upload_video" | "record_audio" | "upload_audio" = "typing"
): Promise<void> {
  await fetch(apiUrl("sendChatAction"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action }),
  });
}

export async function setWebhook(url: string): Promise<void> {
  const res = await fetch(apiUrl("setWebhook"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, allowed_updates: ["message"] }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`setWebhook failed: ${data.description}`);
  }
}

export async function deleteWebhook(): Promise<void> {
  const res = await fetch(apiUrl("deleteWebhook"), {
    method: "POST",
    headers: { "content-type": "application/json" },
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`deleteWebhook failed: ${data.description}`);
  }
}

export async function getWebhookInfo(): Promise<{
  url: string;
  pending_update_count: number;
  last_error_message?: string;
}> {
  const res = await fetch(apiUrl("getWebhookInfo"));
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`getWebhookInfo failed: ${data.description}`);
  }
  return data.result;
}

export async function getMe(): Promise<{
  id: number;
  username: string;
  first_name: string;
}> {
  const res = await fetch(apiUrl("getMe"));
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`getMe failed: ${data.description}`);
  }
  return data.result;
}
