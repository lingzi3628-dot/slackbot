/**
 * Security headers + CORS configuration.
 * Applied to all API routes via NextResponse headers.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
  "Access-Control-Max-Age": "86400",
};

/** Apply security + CORS headers to a Response. */
export function withSecurityHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    ...CORS_HEADERS,
    ...headers,
  };
}
