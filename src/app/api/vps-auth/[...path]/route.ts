import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy: /api/vps-auth/[...path] → VPS auth backend (http://64.181.198.8/api/[...path])
 *
 * This routes auth requests to the VPS backend, which handles bcrypt + DB
 * queries without Vercel's 10s function timeout.
 *
 * Example: /api/vps-auth/auth/login → http://64.181.198.8/api/auth/login
 */

const VPS_BASE = "http://64.181.198.8";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  return proxyToVps(req);
}

export async function GET(req: NextRequest) {
  return proxyToVps(req);
}

async function proxyToVps(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  // /api/vps-auth/auth/login → /api/auth/login
  const path = url.pathname.replace("/api/vps-auth", "/api");

  try {
    const vpsUrl = `${VPS_BASE}${path}${url.search}`;
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };

    // Forward cookies (for session)
    const cookie = req.headers.get("cookie");
    if (cookie) headers["cookie"] = cookie;

    // Forward origin
    const origin = req.headers.get("origin");
    if (origin) headers["origin"] = origin;

    const res = await fetch(vpsUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    });

    const data = await res.text();
    const responseHeaders: Record<string, string> = {
      "content-type": "application/json",
    };

    // Forward Set-Cookie header (for session cookie)
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      responseHeaders["set-cookie"] = setCookie;
    }

    return new Response(data, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[vps-auth-proxy] Error:", err);
    return NextResponse.json(
      { error: "Auth service unavailable. Please try again." },
      { status: 503 }
    );
  }
}
