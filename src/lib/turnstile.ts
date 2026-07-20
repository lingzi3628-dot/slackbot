/**
 * Cloudflare Turnstile server-side verification.
 *
 * V8 (round 2): Bot protection for the registration endpoint.
 * Uses Cloudflare Turnstile (free, privacy-friendly, no CAPTCHA solving needed).
 *
 * Set TURNSTILE_SECRET_KEY in env to enable. If not set, verification is
 * skipped (for dev) — in production, fail closed (reject registrations).
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  success: boolean;
  /** Error codes from Turnstile if verification failed. */
  "error-codes"?: string[];
  /** The hostname of the site where the challenge was solved. */
  hostname?: string;
  /** The action from the widget. */
  action?: string;
  /** Challenge solve time in milliseconds. */
  challenge_ts?: string;
}

/**
 * Verify a Turnstile token server-side.
 *
 * @param token    The token from the client-side Turnstile widget.
 * @param remoteip The user's IP (optional, helps Cloudflare detect fraud).
 * @returns True if the token is valid.
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // No secret configured.
    // In production: fail closed (reject).
    // In development: allow (so devs can test without Turnstile).
    if (process.env.NODE_ENV === "production") {
      console.error("[turnstile] TURNSTILE_SECRET_KEY not set — rejecting registration in production.");
      return false;
    }
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — allowing in dev mode.");
    return true;
  }

  try {
    const body = new URLSearchParams();
    body.append("secret", secret);
    body.append("response", token);
    if (remoteip) body.append("remoteip", remoteip);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    if (!res.ok) {
      console.error("[turnstile] Verify API returned", res.status);
      return false;
    }

    const data: TurnstileResult = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] Verification failed:", err);
    return false;
  }
}
