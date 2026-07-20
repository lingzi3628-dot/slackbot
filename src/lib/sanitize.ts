/**
 * Centralized sanitization utilities — the SINGLE source of truth for
 * cleaning user input before it touches any database operation.
 *
 * #4 (hardening): Every user-supplied string MUST pass through one of
 * these functions before being used in a Prisma query, AI prompt, or
 * response. This is the SQL-injection prevention layer at the code level.
 *
 * Prisma's parameterized queries protect against SQL injection at the
 * database driver level. This module protects at the APPLICATION level:
 *  - Strips null bytes (prompt-injection vector)
 *  - Strips control characters (0x00-0x1F except \n \r \t)
 *  - Strips HTML tags (prevents stored XSS)
 *  - Enforces max lengths (prevents DoS / storage abuse)
 *
 * For validation (format checking), see lib/validation.ts.
 */

import {
  sanitizeString as _sanitizeString,
  sanitizeName,
  sanitizePrompt,
  validateEmail,
  validateUsername,
  validateHexColor,
  validateUrl,
  LIMITS,
} from "@/lib/input-validation";

/** Re-exports for the names requested in the spec. */
export const sanitizeString = _sanitizeString;
export { sanitizeName, sanitizePrompt, LIMITS };

/**
 * Sanitize an email: validate format, lowercase, trim.
 * Returns the cleaned email or null if invalid.
 * Max 254 chars (RFC 5321).
 */
export function sanitizeEmail(input: unknown): string | null {
  return validateEmail(input); // validates + lowercases + trims
}

/**
 * Sanitize a username: alphanumeric + underscore/hyphen, 3-30 chars,
 * no consecutive special chars, no leading/trailing special chars.
 * Returns the cleaned username or null if invalid.
 */
export function sanitizeUsername(input: unknown): string | null {
  return validateUsername(input);
}

/**
 * Sanitize a hex color: must match #RRGGBB (or #RGB shorthand).
 * Returns the normalized lowercase hex or null if invalid.
 */
export function sanitizeHexColor(input: unknown): string | null {
  return validateHexColor(input);
}

/**
 * Sanitize a URL for safe fetching (SSRF prevention).
 * Rejects: non-http(s) protocols, private IP ranges, localhost, link-local.
 * Returns the validated URL or null.
 */
export function sanitizeUrl(input: unknown): string | null {
  return validateUrl(input);
}
