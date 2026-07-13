import { NextRequest, NextResponse } from "next/server";
import { getSpyroReply } from "@/lib/spyro-engine";
import {
  sendMessage,
  editMessageText,
  sendChatAction,
  type TelegramUpdate,
} from "@/lib/integrations/telegram-client";
import { getHistory, pushMessage, clearHistory } from "@/lib/integrations/telegram-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel: allow up to 60s for the reply

/**
 * Telegram webhook — receives updates (messages) from Telegram and replies
 * with a SPYRO V1 response. Simulates streaming by editing the message
 * every ~1.5s as tokens arrive.
 *
 * Setup: call /api/telegram/set-webhook once after deploying.
 */
export async function POST(req: NextRequest) {
  // Optional: validate the secret path segment to prevent abuse.
  // const url = new URL(req.url);
  // if (url.searchParams.get("token") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
  //   return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN not configured" },
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
    // Not a text message — acknowledge and ignore.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const firstName = msg.from?.first_name ?? "there";

  // Handle slash commands.
  if (text.startsWith("/")) {
    return handleCommand(chatId, text, firstName);
  }

  // Regular message — get a SPYRO V1 reply.
  // Acknowledge immediately so Telegram doesn't retry.
  // (We process the reply in the background.)
  void processMessage(chatId, text, msg.message_id);
  return NextResponse.json({ ok: true });
}

async function handleCommand(
  chatId: number,
  text: string,
  firstName: string
): Promise<NextResponse> {
  const [cmd] = text.toLowerCase().split(/\s+/);
  switch (cmd) {
    case "/start":
      await sendMessage(
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
        chatId,
        "🧹 *Conversation cleared.* The dragon's memory is wiped — ask me anything fresh. 🔥",
        { parseMode: "Markdown" }
      );
      break;
    case "/help":
      await sendMessage(
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
      // Unknown command — treat as a normal message.
      return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: true });
}

async function processMessage(
  chatId: number,
  text: string,
  replyToMessageId: number
): Promise<void> {
  try {
    // Show "typing..." indicator while we work.
    await sendChatAction(chatId, "typing");

    // Save the user's message to history.
    pushMessage(chatId, { role: "user", content: text });

    // Send an initial placeholder we'll edit as tokens stream in.
    const placeholder = await sendMessage(chatId, "🐉 _SPYRO V1 is breathing fire…_", {
      parseMode: "Markdown",
      replyToMessageId,
    });

    let lastEdit = 0;
    let lastText = "";
    let fullText = "";

    const EDIT_INTERVAL_MS = 1500; // throttle edits to avoid Telegram rate limits
    const MAX_MESSAGE_LENGTH = 4096;

    await getSpyroReply(getHistory(chatId), {
      onToken: (_token, acc) => {
        fullText = acc;
        const now = Date.now();
        // Throttle edits + only edit if there's meaningful new content.
        if (now - lastEdit > EDIT_INTERVAL_MS && acc.length > lastText.length + 20) {
          lastEdit = now;
          lastText = acc;
          // Best-effort edit — send as plain text to avoid Markdown escaping issues mid-stream.
          void editMessageText(
            chatId,
            placeholder.message_id,
            truncateForTelegram(acc)
          ).catch(() => {});
        }
      },
    });

    // Final edit with the complete response (or an error if empty).
    const finalText =
      fullText.trim().length > 0
        ? fullText
        : "SPYRO V1 returned an empty response. Try rephrasing your prompt. 🐉";

    await editMessageText(
      chatId,
      placeholder.message_id,
      truncateForTelegram(finalText).slice(0, MAX_MESSAGE_LENGTH)
    );

    // Save the assistant's reply to history.
    pushMessage(chatId, { role: "assistant", content: finalText });
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Unknown error";
    await sendMessage(
      chatId,
      `🐉 SPYRO V1 lost its fire: ${errorMsg}\n\nTry again in a moment. 🔥`,
      { replyToMessageId }
    ).catch(() => {});
  }
}

/**
 * Telegram's MarkdownV2 requires escaping many chars, and HTML is more
 * forgiving. We send plain text (no parse mode) for the live-edited message
 * to avoid format errors mid-stream, then the final message can be plain too.
 */
function truncateForTelegram(text: string): string {
  // Telegram messages max out at 4096 chars. Leave room for a truncation note.
  const MAX = 4000;
  if (text.length <= MAX) return text;
  return text.slice(0, MAX) + "\n\n…(truncated)";
}
