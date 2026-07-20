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

// ── Username validation (V11 round 2) ─────────────────────────────────
/**
 * Validate a username: alphanumeric + underscore/hyphen, 3-30 chars,
 * no consecutive special chars, no leading/trailing special chars.
 */
export function validateUsername(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.trim();
  if (name.length < 3 || name.length > 30) return null;
  // Alphanumeric + underscore + hyphen only
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) return null;
  // No consecutive special chars
  if (/[_-]{2,}/.test(name)) return null;
  // No leading/trailing special chars
  if (/^[_-]|[_-]$/.test(name)) return null;
  return name;
}

// ── URL validation with SSRF prevention (V11 round 2) ────────────────
/**
 * Validate a URL. Rejects non-http(s) protocols, private IP ranges,
 * localhost, and link-local addresses to prevent SSRF.
 *
 * Returns the validated URL string, or null if invalid/unsafe.
 */
export function validateUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    return null;
  }
  // Only allow http and https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  const hostname = parsed.hostname.toLowerCase();
  // Reject localhost and loopback
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return null;
  // Reject private IP ranges (IPv4)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    const parts = hostname.split(".").map(Number);
    // 10.0.0.0/8
    if (parts[0] === 10) return null;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return null;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return null;
    // 169.254.0.0/16 (link-local)
    if (parts[0] === 169 && parts[1] === 254) return null;
    // 0.0.0.0/8
    if (parts[0] === 0) return null;
    // 127.0.0.0/8 (loopback — already caught above but be thorough)
    if (parts[0] === 127) return null;
  }
  // Reject .local, .internal, .localhost TLDs
  if (/\.(local|internal|localhost)$/i.test(hostname)) return null;
  // Reject IPv6 link-local (fe80::/10) and Unique Local (fc00::/7) — basic check
  if (/^(fe80|fc|fd)/i.test(hostname)) return null;
  return parsed.toString();
}

// ── Hex color validation (V11 round 2) ───────────────────────────────
/** Validate a hex color string (#RRGGBB). Returns normalized or null. */
export function validateHexColor(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  // Allow 3-digit shorthand #RGB → expand to #RRGGBB
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const hex = trimmed.slice(1);
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
  }
  return null;
}

// ── API key validation (V11 round 2) ─────────────────────────────────
/**
 * Validate an API key format: UUID v4 or a Spyro-prefixed key
 * (spyro-<32hexchars>). Returns normalized or null.
 */
export function validateApiKey(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  // UUID v4
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  // Spyro-prefixed key: spyro-<32 hex chars>
  if (/^spyro-[0-9a-f]{32}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return null;
}

// ── Numeric parameter validation (V11 round 2) ───────────────────────
/**
 * Parse and validate a numeric parameter. Returns null if invalid.
 * @param input   The input value (string, number, etc.)
 * @param min     Minimum value (inclusive)
 * @param max     Maximum value (inclusive)
 * @param integer If true, require an integer (no decimals)
 */
export function validateNumber(
  input: unknown,
  min: number,
  max: number,
  integer: boolean = true
): number | null {
  if (typeof input === "number") {
    if (integer && !Number.isInteger(input)) return null;
    if (input < min || input > max) return null;
    return input;
  }
  if (typeof input === "string") {
    const n = parseInt(input, 10);
    if (isNaN(n)) return null;
    if (integer && !Number.isInteger(n)) return null;
    if (n < min || n > max) return null;
    return n;
  }
  return null;
}

/** Validate a boolean parameter (accepts true/false, "true"/"false", 0/1). */
export function validateBoolean(input: unknown): boolean | null {
  if (typeof input === "boolean") return input;
  if (typeof input === "string") {
    const lower = input.toLowerCase().trim();
    if (lower === "true" || lower === "1") return true;
    if (lower === "false" || lower === "0") return false;
  }
  if (typeof input === "number") {
    if (input === 1) return true;
    if (input === 0) return false;
  }
  return null;
}

// ── File type validation (for uploads — V6, V10) ─────────────────────
/** Allowed image MIME types + their magic bytes (first 4-8 bytes). */
export const ALLOWED_IMAGE_TYPES: Record<string, { mime: string; magic: number[] }> = {
  png: { mime: "image/png", magic: [0x89, 0x50, 0x4e, 0x47] },
  jpg: { mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  jpeg: { mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  webp: { mime: "image/webp", magic: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  gif: { mime: "image/gif", magic: [0x47, 0x49, 0x46, 0x38] }, // GIF8
};

/** Allowed audio MIME types + magic bytes (for transcription — V10). */
export const ALLOWED_AUDIO_TYPES: Record<string, { mime: string; magic: number[] }> = {
  mp3: { mime: "audio/mpeg", magic: [0xff, 0xfb] }, // MP3 (also 0x49 0x44 0x33 for ID3)
  mp4: { mime: "audio/mp4", magic: [0x66, 0x74, 0x79, 0x70] }, // ftyp
  mpeg: { mime: "audio/mpeg", magic: [0xff, 0xfb] },
  mpga: { mime: "audio/mpeg", magic: [0xff, 0xfb] },
  m4a: { mime: "audio/mp4", magic: [0x66, 0x74, 0x79, 0x70] },
  wav: { mime: "audio/wav", magic: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  webm: { mime: "audio/webm", magic: [0x1a, 0x45, 0xdf, 0xa3] }, // EBML
};

/**
 * Validate a file buffer by checking its magic bytes (not just the extension).
 * Returns the detected type key, or null if not allowed.
 */
export function validateFileType(
  buffer: Buffer,
  allowed: Record<string, { mime: string; magic: number[] }>
): string | null {
  for (const [type, def] of Object.entries(allowed)) {
    if (buffer.length < def.magic.length) continue;
    const matches = def.magic.every((byte, i) => buffer[i] === byte);
    if (matches) return type;
  }
  return null;
}

// ── Disposable email domain blocklist (V8 round 2) ───────────────────
// Top ~40 disposable email providers. For full list see
// https://github.com/disposable-email-domains/disposable-email-domains
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "throwaway.email", "getnada.com", "mailnesia.com", "sharklasers.com",
  "guerrillamailblock.com", "spam4.me", "disposableinbox.com", "maildrop.cc",
  "discard.email", "fakeinbox.com", "mailcatch.com", "tempinbox.com",
  "spam.la", "trbvm.com", "tempr.email", "moakt.com", "tmpmail.org",
  "burnermail.io", "inboxbear.com", "mohmal.com", "yopmail.com",
  "yopmail.fr", "cool.fr", "jetable.fr", "nospam.ze.tc", "nomail.xl.cx",
  "mega.zik.dj", "speed.1s.fr", "courriel.temporaire.ligne", "mail-temporaire",
  "30secondmail.com", "15minuteemail.com", "temp-mail.org", "tempmailo.com",
  "emailondeck.com", "mimicmail.com", "makemetheking.com", "anonbox.net",
  "trashmail.com", "trashmail.net", "trashmail.me", "mytemp.email",
  "tempmailaddress.com", "tempmailo.com", "dispostable.com", "mailify.com",
]);

/** Check if an email uses a disposable/temporary domain. */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

// ── Honeypot field check (V8 round 2) ────────────────────────────────
/**
 * Check if a honeypot field was filled (indicating a bot).
 * Honeypot fields are hidden in the UI — humans never fill them.
 * Returns true if the field has any content (bot detected).
 */
export function isHoneypotTriggered(field: unknown): boolean {
  if (typeof field !== "string") return false;
  return field.trim().length > 0;
}
