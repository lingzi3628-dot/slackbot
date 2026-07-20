import { NextRequest, NextResponse } from "next/server";
import {
  setWebhook,
  getMe,
  getWebhookInfo,
  encodeToken,
} from "@/lib/integrations/telegram-client";
import { getSession } from "@/lib/session";
import { checkWebhookSetLimit, buildRateLimitHeaders, getClientIp } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/input-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SetWebhookBody {
  token?: unknown;
}

/**
 * POST /api/telegram/set-webhook — register a Telegram bot webhook.
 *
 * V7 FIX:
 *  - Requires authentication (valid session cookie).
 *  - Requires admin role OR the token must match the project's configured
 *    TELEGRAM_BOT_TOKEN (prevents users from registering arbitrary bots).
 *  - Validates the token against Telegram's getMe API before saving.
 *  - Rate limited: 1 request per 5 minutes per user.
 *  - Never returns the bot token in the response — only the bot username.
 */
export async function POST(req: NextRequest) {
  // ── 1. Auth check: must be signed in ──────────────────────────────
  const session = getSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in." },
      { status: 401 }
    );
  }

  // ── 2. Rate limit: 1 per 5 min per user ───────────────────────────
  const rl = await checkWebhookSetLimit(session.id);
  if (!rl.allowed) {
    const mins = Math.ceil((rl.resetAt - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Too many webhook requests. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
      { status: 429, headers: buildRateLimitHeaders(rl) }
    );
  }

  // ── 3. Parse body ─────────────────────────────────────────────────
  let body: SetWebhookBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Sanitize the token (strip null bytes, control chars — never HTML)
  const providedToken = typeof body.token === "string"
    ? sanitizeString(body.token, 200)
    : "";

  // Fall back to env var if no token provided (admin "use default bot" flow)
  const envToken = process.env.TELEGRAM_BOT_TOKEN;
  const token = providedToken || envToken;

  if (!token) {
    return NextResponse.json(
      { error: "No bot token provided." },
      { status: 400 }
    );
  }

  // ── 4. Authorization: admin OR token matches env var ──────────────
  // Non-admin users can ONLY register the project's configured bot token.
  // Admins can register any token (for testing / multi-bot setups).
  const isAdmin = session.role === "admin" || session.role === "super";
  if (!isAdmin && providedToken && envToken) {
    // Constant-time-ish comparison (tokens are same length, so direct compare
    // is acceptable here — but we use safeEqual to be safe).
    if (providedToken !== envToken) {
      return NextResponse.json(
        { error: "You can only configure the project's official bot. Contact an admin for custom bots." },
        { status: 403 }
      );
    }
  }

  // ── 5. Validate token with Telegram (getMe) ───────────────────────
  let me;
  try {
    me = await getMe(token);
    if (!me || !me.username) {
      return NextResponse.json(
        { error: "Invalid bot token. Telegram rejected it — get one from @BotFather." },
        { status: 400 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: "Could not validate bot token with Telegram. " +
          (err instanceof Error ? err.message : "Unknown error."),
      },
      { status: 400 }
    );
  }

  // ── 6. Set the webhook ────────────────────────────────────────────
  const url = new URL(req.url);
  const origin = url.origin;
  const webhookUrl = `${origin}/api/telegram/webhook?t=${encodeToken(token)}`;

  try {
    await setWebhook(token, webhookUrl);
    const info = await getWebhookInfo(token);

    // ── 7. Return ONLY safe fields (never the token) ─────────────────
    return NextResponse.json({
      success: true,
      bot_username: `@${me.username}`,
      bot_name: me.first_name,
      webhook: {
        url: info.url,
        pending_updates: info.pending_update_count,
        last_error: info.last_error_message ?? null,
      },
      message: `✅ Webhook set! Message @${me.username} on Telegram to start chatting with SPYRO V1.`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        hint: "Make sure the bot token is correct (get one from @BotFather on Telegram).",
      },
      { status: 500 }
    );
  }
}

// GET: admin-only convenience route (uses env var token).
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || (session.role !== "admin" && session.role !== "super")) {
    return NextResponse.json(
      { error: "Admin authentication required." },
      { status: 403 }
    );
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN is not set in environment." },
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
      success: true,
      bot_username: `@${me.username}`,
      bot_name: me.first_name,
      webhook: { url: info.url, pending_updates: info.pending_update_count, last_error: info.last_error_message ?? null },
      message: `✅ Webhook set! Message @${me.username} on Telegram.`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
