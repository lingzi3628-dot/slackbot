/**
 * Client-side CSRF token helper.
 *
 * Fetches a CSRF token from /api/auth/csrf (which sets it as an HttpOnly
 * cookie + returns it in the JSON body). The caller must include the token
 * in the x-csrf-token header on all state-changing requests to /api/auth/*.
 *
 * Usage:
 *   import { getCsrfToken, withCsrfHeaders } from "@/lib/csrf-client";
 *
 *   const token = await getCsrfToken();
 *   await fetch("/api/auth/login", {
 *     method: "POST",
 *     headers: withCsrfHeaders({ "content-type": "application/json" }, token),
 *     body: JSON.stringify({ email, password }),
 *   });
 *
 * The token is cached in-memory for 50 minutes (1-hour server expiry with
 * a 10-min safety margin). Subsequent calls reuse the cached token.
 */

let cachedToken: string | null = null;
let cachedAt = 0;
const CACHE_TTL = 50 * 60 * 1000; // 50 minutes (server expires at 60 min)

/** Fetch a fresh CSRF token from the server. */
async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  if (!res.ok) {
    throw new Error("Failed to fetch CSRF token");
  }
  const data = await res.json();
  if (!data.csrfToken) {
    throw new Error("No csrfToken in response");
  }
  return data.csrfToken as string;
}

/** Get a CSRF token, using the cached one if still valid. */
export async function getCsrfToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now - cachedAt < CACHE_TTL) {
    return cachedToken;
  }
  cachedToken = await fetchCsrfToken();
  cachedAt = now;
  return cachedToken;
}

/** Merge CSRF header into a headers object. */
export function withCsrfHeaders(
  headers: Record<string, string>,
  token: string
): Record<string, string> {
  return {
    ...headers,
    "x-csrf-token": token,
  };
}

/** Convenience: fetch wrapper that auto-injects the CSRF token. */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getCsrfToken();
  const headers = new Headers(options.headers);
  headers.set("x-csrf-token", token);
  return fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
  });
}
