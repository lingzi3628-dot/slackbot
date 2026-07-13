import { NextRequest, NextResponse } from "next/server";
import { getSpyroReply } from "@/lib/spyro-engine";
import {
  sendMessage,
  editMessageText,
  sendChatAction,
  decodeToken,
  type TelegramUpdate,
} from "@/lib/integrations/telegram-client";
import { getHistory, pushMessage, clearHistory } from "@/lib/integrations/telegram-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Telegram webhook — receives updates from Telegram and replies with a
 * SPYRO V1 response.
 *
 * The bot token is passed in the `?t=` query parameter (base64url-encoded).
 * This lets multiple users each connect their own bot — each bot gets its
 * own webhook URL with its own encoded token.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const encodedToken = url.searchParams.get("t");

  // Fall back to env var for backward compatibility.
  let token: string | undefined = encodedToken
    ? decodeToken(encodedToken)
    : process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "No bot token. Connect a bot via the Integrations page." },
      { status: 503 }
    );
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const msg = update.message ?? update.edited_message;
  if (!msg?.text || !msg.chat) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const firstName = msg.from?.first_name ?? "there";

  if (text.startsWith("/")) {
    return handleCommand(token, chatId, text, firstName);
  }

  // Regular message — process in background, acknowledge immediately.
  void processMessage(token, chatId, text, msg.message_id);
  return NextResponse.json({ ok: true });
}

async function handleCommand(
  token: string,
  chatId: number,
  text: string,
  firstName: string
): Promise<NextResponse> {
  const [cmd] = text.toLowerCase().split(/\s+/);
  switch (cmd) {
    case "/start":
      await sendMessage(
        token,
        chatId,
        `🐉 *Hi ${firstName}, I'm SPYRO V1!*\n\n` +
          `I'm a dragon-powered AI assistant. Ask me anything — I breathe fire on hard problems.\n\n` +
          `*Commands:*\n` +
          `/new — start a fresh conversation\n` +
          `/help — show this help\n\n` +
          `Just send me a message to begin. 🔥`,
        { parseMode: "Markdown" }
      );
      break;
    case "/new":
      clearHistory(chatId);
      await sendMessage(
        token,
        chatId,
        "🧹 *Conversation cleared.* The dragon's memory is wiped — ask me anything fresh. 🔥",
        { parseMode: "Markdown" }
      );
      break;
    case "/help":
      await sendMessage(
        token,
        chatId,
        `*SPYRO V1 — Dragon-Powered AI*\n\n` +
          `I'm an AI chat assistant. Send me any message and I'll reply.\n\n` +
          `*Commands:*\n` +
          `/new — clear conversation history\n` +
          `/help — show this help\n\n` +
          `Powered by the SPYRO dragon engine. 🐉🔥`,
        { parseMode: "Markdown" }
      );
      break;
    default:
      return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: true });
}

async function processMessage(
  token: string,
  chatId: number,
  text: string,
  replyToMessageId: number
): Promise<void> {
  try {
    await sendChatAction(token, chatId, "typing");
    pushMessage(chatId, { role: "user", content: text });

    const placeholder = await sendMessage(
      token,
      chatId,
      "🐉 _SPYRO V1 is breathing fire…_",
      { parseMode: "Markdown", replyToMessageId }
    );

    let lastEdit = 0;
    let lastText = "";
    let fullText = "";
    const EDIT_INTERVAL_MS = 1500;
    const MAX_MESSAGE_LENGTH = 4096;

    await getSpyroReply(getHistory(chatId), {
      onToken: (_token, acc) => {
        fullText = acc;
        const now = Date.now();
        if (now - lastEdit > EDIT_INTERVAL_MS && acc.length > lastText.length + 20) {
          lastEdit = now;
          lastText = acc;
          void editMessageText(token, chatId, placeholder.message_id, truncateForTelegram(acc)).catch(() => {});
        }
      },
    });

    const finalText =
      fullText.trim().length > 0
        ? fullText
        : "SPYRO V1 returned an empty response. Try rephrasing your prompt. 🐉";

    await editMessageText(
      token,
      chatId,
      placeholder.message_id,
      truncateForTelegram(finalText).slice(0, MAX_MESSAGE_LENGTH)
    );

    pushMessage(chatId, { role: "assistant", content: finalText });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    await sendMessage(
      token,
      chatId,
      `🐉 SPYRO V1 lost its fire: ${errorMsg}\n\nTry again in a moment. 🔥`,
      { replyToMessageId }
    ).catch(() => {});
  }
}

function truncateForTelegram(text: string): string {
  const MAX = 4000;
  if (text.length <= MAX) return text;
  return text.slice(0, MAX) + "\n\n…(truncated)";
}
