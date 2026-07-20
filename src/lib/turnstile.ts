/**
 * Cloudflare Turnstile server-side verification.
 *
 * Uses Cloudflare Turnstile (free, privacy-friendly CAPTCHA).
 *
 * Set TURNSTILE_SECRET_KEY in env to enable. If not set, verification is
 * skipped (graceful degradation for dev).
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
  challenge_ts?: string;
}

/**
 * Verify a Turnstile token server-side.
 *
 * @param token    The token from the client-side Turnstile widget.
 * @param remoteip The user's IP (optional).
 * @returns True if the token is valid (or if verification is skipped).
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // No secret configured — skip verification (dev mode).
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — skipping CAPTCHA verification.");
    return true;
  }

  // Empty or placeholder token — reject (user didn't solve the CAPTCHA).
  if (!token || token.length < 10) {
    return false;
  }

  try {
    const body = new URLSearchParams();
    body.append("secret", secret);
    body.append("response", token);
    if (remoteip) body.append("remoteip", remoteip);

    // 5s timeout — Cloudflare is fast.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error("[turnstile] Verify API returned", res.status);
      return false;
    }

    const data: TurnstileResult = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] Verification failed:", err);
    // On network error/timeout, FAIL OPEN — don't block real users.
    return true;
  }
}
