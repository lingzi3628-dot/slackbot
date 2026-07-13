import { NextResponse } from "next/server";
import { deleteWebhook } from "@/lib/integrations/telegram-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Teardown: removes the Telegram webhook. Useful when switching to a new
 * deployment URL or stopping the bot.
 */
export async function GET() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN is not set" },
      { status: 503 }
    );
  }
  try {
    await deleteWebhook();
    return NextResponse.json({
      ok: true,
      message: "Webhook removed. The bot will no longer receive messages.",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
