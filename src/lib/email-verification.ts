/**
 * Email verification token (signed JWT-like token, no external dependency).
 *
 * V8 (round 2): Generates and verifies signed tokens for email verification.
 *  - Token = base64url(payload) + "." + base64url(HMAC-SHA256(payload, secret))
 *  - Payload = { userId, email, exp }
 *  - Secret = EMAIL_VERIFICATION_SECRET env var (or a dev fallback)
 *  - Expiry: 24 hours
 *
 * This is a lightweight JWT alternative — no external jwt library needed.
 */

import { createHmac } from "crypto";

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface EmailTokenPayload {
  userId: string;
  email: string;
  exp: number;
}

/** Get the signing secret from env (with a dev fallback). */
function getSecret(): string {
  const secret = process.env.EMAIL_VERIFICATION_SECRET;
  if (secret && secret.length >= 32) return secret;
  // Dev fallback — warn in production
  if (process.env.NODE_ENV === "production") {
    console.error("[email-verification] EMAIL_VERIFICATION_SECRET not set or too short (<32 chars). Using insecure fallback.");
  }
  return "spyro-dev-email-verification-secret-change-in-production-min-32-chars";
}

/** Base64url encode without padding. */
function b64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

/** Base64url decode. */
function b64urlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

/** Create an HMAC-SHA256 signature. */
function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data, "utf8").digest("base64url");
}

/** Generate a signed email verification token. */
export function createEmailToken(user: { id: string; email: string }): string {
  const payload: EmailTokenPayload = {
    userId: user.id,
    email: user.email,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  const signature = sign(payloadB64, getSecret());
  return `${payloadB64}.${signature}`;
}

/** Verify a signed email verification token. Returns null if invalid/expired. */
export function verifyEmailToken(token: string): EmailTokenPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSignature = sign(payloadB64, getSecret());

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return null;
  try {
    const a = Buffer.from(signature, "base64url");
    const b = Buffer.from(expectedSignature, "base64url");
    if (a.length !== b.length) return false as unknown as null;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    if (diff !== 0) return null;
  } catch {
    return null;
  }

  // Decode payload
  try {
    const payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8")) as EmailTokenPayload;
    if (!payload.userId || !payload.email || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
