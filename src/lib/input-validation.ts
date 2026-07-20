/**
 * Input validation + sanitization utilities.
 *
 * Used by all auth endpoints (register, login, send-code, verify-code,
 * reset-password) and any route that accepts user-supplied strings bound
 * for the database.
 *
 * Principles:
 *  - Never trust client-side validation. Server is the source of truth.
 *  - Strip null bytes, control characters, HTML tags, excess whitespace.
 *  - Enforce max lengths to prevent DoS / storage abuse.
 *  - Use parameterized Prisma queries everywhere (never string interpolation).
 *  - Constant-time comparison for all secret/token checks.
 */

import { createHash, timingSafeEqual } from "crypto";

// ── Regexes ───────────────────────────────────────────────────────────
// Pragmatic email regex (RFC 5322 is too permissive to be useful).
// Rejects: whitespace, control chars, quotes, commas, angle brackets.
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Password complexity: ≥12 chars, ≥1 upper, ≥1 lower, ≥1 digit, ≥1 special.
const PASSWORD_UPPER = /[A-Z]/;
const PASSWORD_LOWER = /[a-z]/;
const PASSWORD_DIGIT = /[0-9]/;
const PASSWORD_SPECIAL = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?~`\\]/;

// SQL keywords that indicate prompt-injection attempts in chat. Case-insensitive.
// We strip messages containing these from the chat history before sending to the LLM.
const SQL_INJECTION_PATTERNS = [
  /\b(DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+.*\s+SET|TRUNCATE\s+TABLE|ALTER\s+TABLE|CREATE\s+TABLE|GRANT\s+ALL|REVOKE)\b/i,
  /\b(EXEC(UTE)?|EXECUTE\s+IMMEDIATE|sp_executesql|pg_exec|mysqli?_query)\b/i,
  /\b(UNION\s+SELECT|OR\s+1\s*=\s*1|AND\s+1\s*=\s*1|';\s*--|\/\*.*\*\/)\b/i,
  /\b(pg_sleep|SLEEP\(|BENCHMARK\(|WAITFOR\s+DELAY)\b/i,
];

// ── Length limits ─────────────────────────────────────────────────────
export const LIMITS = {
  NAME_MAX: 80,
  EMAIL_MAX: 254, // RFC 5321
  PASSWORD_MIN: 12,
  PASSWORD_MAX: 128,
  SUBJECT_MAX: 200,
  MESSAGE_MAX: 10000,
  PROMPT_MAX: 4096,
} as const;

// ── Sanitization ──────────────────────────────────────────────────────

/** Strip null bytes, control chars (except newline/tab), and HTML tags. */
export function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== "string") return "";
  let s = input;
  // Remove null bytes and control characters (except \n \r \t)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Strip HTML tags (basic — prevents stored XSS if rendered without escaping)
  s = s.replace(/<[^>]*>/g, "");
  // Collapse excessive whitespace
  s = s.replace(/[ \t]{3,}/g, "  ").replace(/\n{4,}/g, "\n\n\n");
  // Truncate to max length (UTF-8 safe via Array.from)
  if (s.length > maxLength) {
    s = Array.from(s).slice(0, maxLength).join("");
  }
  return s.trim();
}

/** Sanitize a name (no HTML, no control chars, max 80 chars). */
export function sanitizeName(input: unknown): string {
  return sanitizeString(input, LIMITS.NAME_MAX);
}

/** Validate + sanitize an email. Returns null if invalid. */
export function validateEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email.length === 0 || email.length > LIMITS.EMAIL_MAX) return null;
  if (!EMAIL_REGEX.test(email)) return null;
  // Reject consecutive dots, leading/trailing dots in local part
  const local = email.split("@")[0];
  if (local.includes("..") || local.startsWith(".") || local.endsWith(".")) return null;
  return email;
}

// ── Password validation ───────────────────────────────────────────────
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a password against the strong policy:
 *  - ≥12 characters
 *  - ≥1 uppercase, 1 lowercase, 1 digit, 1 special character
 *  - Not in the common-password list
 *  - Not the same as the email (checked by caller if email is available)
 */
export function validatePassword(
  password: unknown,
  email?: string
): PasswordValidationResult {
  const errors: string[] = [];
  if (typeof password !== "string") {
    return { valid: false, errors: ["Password is required"] };
  }
  if (password.length < LIMITS.PASSWORD_MIN) {
    errors.push(`Password must be at least ${LIMITS.PASSWORD_MIN} characters`);
  }
  if (password.length > LIMITS.PASSWORD_MAX) {
    errors.push(`Password must be at most ${LIMITS.PASSWORD_MAX} characters`);
  }
  if (!PASSWORD_UPPER.test(password)) {
    errors.push("Password must contain an uppercase letter");
  }
  if (!PASSWORD_LOWER.test(password)) {
    errors.push("Password must contain a lowercase letter");
  }
  if (!PASSWORD_DIGIT.test(password)) {
    errors.push("Password must contain a digit");
  }
  if (!PASSWORD_SPECIAL.test(password)) {
    errors.push("Password must contain a special character (!@#$%^&*...)");
  }
  // Common password check (top ~50 most breached; full 10k list is too large to inline)
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push("This password is too common. Please choose a more unique password.");
  }
  // Reject if password contains the email local-part
  if (email) {
    const localPart = email.split("@")[0].toLowerCase();
    if (localPart.length >= 4 && password.toLowerCase().includes(localPart)) {
      errors.push("Password must not contain your email address");
    }
  }
  return { valid: errors.length === 0, errors };
}

// ── Common passwords (top 50 — high signal, low storage) ──────────────
// For full 10k list, see https://github.com/danielmiessler/SecLists —
// rotate into a DB table or KV namespace for production scale.
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "123456", "12345678", "123456789",
  "1234567890", "qwerty", "qwertyuiop", "abc123", "monkey", "letmein",
  "dragon", "master", "shadow", "sunshine", "princess", "football",
  "baseball", "superman", "iloveyou", "trustno1", "welcome", "welcome1",
  "admin", "admin123", "administrator", "root", "toor", "login",
  "passw0rd", "p@ssword", "p@ssw0rd", "password!", "changeme", "secret",
  "secret123", "test", "test123", "guest", "guest123", "user",
  "user123", "default", "ninja", "mustang", "access", "flower",
  "hello", "hello123", "freedom", "whatever", "michael", "jordan23",
]);

// ── Prompt sanitization (for AI chat) ─────────────────────────────────

/** Sanitize a user prompt for the AI: strip nulls, control chars, enforce max length. */
export function sanitizePrompt(input: unknown): string {
  if (typeof input !== "string") return "";
  let s = input;
  // Remove null bytes (prompt-injection vector)
  s = s.replace(/\x00/g, "");
  // Remove other control chars except newline/tab
  s = s.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Truncate to PROMPT_MAX
  if (s.length > LIMITS.PROMPT_MAX) {
    s = s.slice(0, LIMITS.PROMPT_MAX);
  }
  return s;
}

/** Detect SQL-injection / prompt-injection patterns in a user message. */
export function detectSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some((p) => p.test(input));
}

// ── Constant-time comparison (for tokens, session IDs) ────────────────

/**
 * Compare two strings in constant time to prevent timing attacks.
 * Returns true if they are equal.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  try {
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

/** Hash a token for storage (one-way SHA-256). Use for API keys, CSRF tokens. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

// ── Generic field validators ──────────────────────────────────────────

/** Validate a UUID (cuid format: 24-char alphanumeric, or UUID v4). */
export function isValidId(id: unknown): boolean {
  if (typeof id !== "string") return false;
  // CUID (Prisma default): 24 chars, lowercase alphanumeric, starts with c/m/u/p
  if (/^[a-z0-9]{24}$/.test(id)) return true;
  // UUID v4
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return true;
  return false;
}

/** Validate a phone number (E.164-ish). */
export function validatePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const phone = input.replace(/[\s\-().]/g, "");
  if (/^\+\d{8,15}$/.test(phone)) return phone;
  return null;
}
