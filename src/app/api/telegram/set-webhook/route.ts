import { NextRequest, NextResponse } from "next/server";
import {
  setWebhook,
  getMe,
  getWebhookInfo,
  encodeToken,
} from "@/lib/integrations/telegram-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SetWebhookBody {
  token?: string;
}

/**
 * Registers this deployment's webhook URL with Telegram for a user-provided
 * bot token. Called from the Integrations page.
 *
 * The webhook URL encodes the token (base64url) so the webhook route knows
 * which bot to reply with.
 */
export async function POST(req: NextRequest) {
  let body: SetWebhookBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const token = body.token ?? process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "No bot token provided." },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const webhookUrl = `${origin}/api/telegram/webhook?t=${encodeToken(token)}`;

  try {
    const me = await getMe(token);
    await setWebhook(token, webhookUrl);
    const info = await getWebhookInfo(token);

    return NextResponse.json({
      ok: true,
      bot: {
        id: me.id,
        username: `@${me.username}`,
        name: me.first_name,
      },
      webhook: {
        url: info.url,
        pending_updates: info.pending_update_count,
        last_error: info.last_error_message ?? null,
      },
      webhookUrl,
      message: `✅ Webhook set! Message @${me.username} on Telegram to start chatting with SPYRO V1. 🔥`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        hint: "Make sure the bot token is correct (get one from @BotFather on Telegram).",
      },
      { status: 500 }
    );
  }
}

// Keep GET for backward compatibility (uses env var).
export async function GET(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN is not set. Use POST with a token instead." },
      { status: 503 }
    );
  }
  const url = new URL(req.url);
  const origin = url.origin;
  const webhookUrl = `${origin}/api/telegram/webhook?t=${encodeToken(token)}`;

  try {
    const me = await getMe(token);
    await setWebhook(token, webhookUrl);
    const info = await getWebhookInfo(token);
    return NextResponse.json({
      ok: true,
      bot: { id: me.id, username: `@${me.username}`, name: me.first_name },
      webhook: { url: info.url, pending_updates: info.pending_update_count, last_error: info.last_error_message ?? null },
      message: `✅ Webhook set! Message @${me.username} on Telegram. 🔥`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
