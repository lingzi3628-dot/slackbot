import { NextRequest, NextResponse } from "next/server";
import { setWebhook, getMe, getWebhookInfo } from "@/lib/integrations/telegram-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-time setup: registers this deployment's webhook URL with Telegram.
 *
 * Usage (after deploying to Vercel + setting TELEGRAM_BOT_TOKEN env var):
 *   curl https://your-app.vercel.app/api/telegram/set-webhook
 *
 * Or open the URL in your browser.
 */
export async function GET(req: NextRequest) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "TELEGRAM_BOT_TOKEN is not set. Add it as an environment variable in Vercel, redeploy, then call this endpoint again.",
      },
      { status: 503 }
    );
  }

  // Determine the public URL of this deployment.
  const url = new URL(req.url);
  const origin = url.origin;
  const webhookUrl = `${origin}/api/telegram/webhook`;

  try {
    const me = await getMe();
    await setWebhook(webhookUrl);
    const info = await getWebhookInfo();

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
      message: `✅ Webhook set! Message @${me.username} on Telegram to start chatting with SPYRO V1. 🔥`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        hint: "Make sure TELEGRAM_BOT_TOKEN is correct (get one from @BotFather on Telegram).",
      },
      { status: 500 }
    );
  }
}
