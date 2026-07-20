/**
 * Single source of truth for ALL input validation rules.
 *
 * #10 (hardening): Validate at the EDGE (middleware or early in each route
 * handler), not inside business logic. This module provides:
 *
 *  - Email: RFC 5322 pragmatic regex, max 254 chars
 *  - Username: /^[a-zA-Z0-9_-]{3,30}$/
 *  - Password: min 12 chars, complexity (upper + lower + digit + special)
 *  - Prompt text: max 4000 chars, strip control chars
 *  - Hex colors: /^#[0-9a-fA-F]{6}$/
 *  - Numbers: parseInt with radix 10, range validation
 *  - File uploads: MIME type + magic bytes, max 10MB images / 25MB audio
 *  - URLs: SSRF-safe (reject private IPs, non-http, localhost)
 *  - API keys: UUID v4 or spyro-<32hex> format
 *  - Booleans: true/false, "true"/"false", 0/1
 *
 * This module RE-EXPORTS from lib/input-validation.ts (the implementation).
 * Import from HERE in route handlers — it's the public API.
 */

export {
  // ── String sanitization ────────────────────────────────────────────
  sanitizeString,
  sanitizeName,
  sanitizePrompt,

  // ── Email ──────────────────────────────────────────────────────────
  validateEmail,

  // ── Username ───────────────────────────────────────────────────────
  validateUsername,

  // ── Password ───────────────────────────────────────────────────────
  validatePassword,
  type PasswordValidationResult,

  // ── Hex color ──────────────────────────────────────────────────────
  validateHexColor,

  // ── URL (SSRF-safe) ────────────────────────────────────────────────
  validateUrl,

  // ── API key ────────────────────────────────────────────────────────
  validateApiKey,

  // ── Numeric ────────────────────────────────────────────────────────
  validateNumber,
  validateBoolean,

  // ── File type (magic bytes) ────────────────────────────────────────
  validateFileType,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_AUDIO_TYPES,

  // ── Disposable email / honeypot ─────────────────────────────────────
  isDisposableEmail,
  isHoneypotTriggered,

  // ── SQL injection detection ────────────────────────────────────────
  detectSqlInjection,

  // ── Constant-time comparison ────────────────────────────────────────
  safeEqual,
  hashToken,

  // ── ID validation ──────────────────────────────────────────────────
  isValidId,
  validatePhone,

  // ── Length limits ──────────────────────────────────────────────────
  LIMITS,
} from "@/lib/input-validation";

// ── Convenience aliases (the names the spec requested) ────────────────
export { sanitizeEmail, sanitizeUsername, sanitizeHexColor, sanitizeUrl } from "@/lib/sanitize";

// ── File upload limits ────────────────────────────────────────────────
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB (Whisper limit)

// ── Rate limit constants ──────────────────────────────────────────────
export const RATE_LIMITS = {
  ANON_PER_MIN: 20,
  AUTH_PER_MIN: 100,
  IMAGE_PER_HOUR: 10,
  LOGIN_FAIL_PER_EMAIL: 5, // per 15 min
  LOGIN_FAIL_PER_IP: 10, // per 1 hour (IP ban)
  REGISTER_PER_HOUR: 3,
  TRANSCRIBE_PER_DAY: 60,
  REMOVE_BG_PER_HOUR: 10,
  GOD_MODE_DAILY_PRO: 10,
} as const;

// ── Lockout durations ─────────────────────────────────────────────────
export const LOCKOUTS = {
  EMAIL_LOCKOUT_MS: 15 * 60 * 1000, // 15 minutes (account lockout)
  IP_BAN_MS: 60 * 60 * 1000, // 1 HOUR (IP ban — was 15 min, now 1h per spec)
  REGISTER_WINDOW_MS: 60 * 60 * 1000, // 1 hour
} as const;
