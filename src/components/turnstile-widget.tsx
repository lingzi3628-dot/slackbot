"use client";

import * as React from "react";
import { Turnstile } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
}

/**
 * Cloudflare Turnstile widget — bot protection for auth forms.
 *
 * Behavior:
 * - If NEXT_PUBLIC_TURNSTILE_SITE_KEY is set → render the real Turnstile widget.
 *   The user solves the challenge, a token is sent to the server for verification.
 * - If NEXT_PUBLIC_TURNSTILE_SITE_KEY is NOT set → dev mode, auto-verify.
 *
 * On localhost, Cloudflare Turnstile renders in "test mode" (always passes)
 * when using the test site key 1x00000000000000000000AA.
 */
export function TurnstileWidget({ onVerify, onExpire, onError, className }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isDevMode = !siteKey;

  // Auto-verify in dev mode (no Turnstile configured).
  React.useEffect(() => {
    if (isDevMode) {
      onVerify("dev-mode-no-turnstile");
    }
  }, [isDevMode, onVerify]);

  if (isDevMode) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
        ⚠️ Dev mode: Turnstile CAPTCHA not configured. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY in production.
      </div>
    );
  }

  return (
    <div className={className}>
      <Turnstile
        siteKey={siteKey!}
        onSuccess={(token) => onVerify(token)}
        onExpire={() => onExpire?.()}
        onError={() => onError?.()}
        options={{
          theme: "dark",
          size: "normal",
        }}
      />
    </div>
  );
}
