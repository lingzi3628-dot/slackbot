import { NextRequest, NextResponse } from "next/server";
import { deleteWebhook } from "@/lib/integrations/telegram-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UnsetWebhookBody {
  token?: string;
}

export async function POST(req: NextRequest) {
  let body: UnsetWebhookBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const token = body.token ?? process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "No bot token provided." }, { status: 400 });
  }

  try {
    await deleteWebhook(token);
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

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 503 });
  }
  try {
    await deleteWebhook(token);
    return NextResponse.json({ ok: true, message: "Webhook removed." });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
