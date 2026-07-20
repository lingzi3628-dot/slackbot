"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SpyroLogo } from "@/components/spyro/spyro-logo";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

/**
 * Email verification page — accessed via the link in the verification email.
 * The URL contains ?token=<signed-token> which is sent to /api/auth/verify-email.
 *
 * Must be wrapped in <Suspense> because useSearchParams() requires it
 * for static prerendering (Next.js build requirement).
 */
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided. Check your email for the correct link.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.verified) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Please try again.");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#08080A] px-4 text-white">
      <div className="w-full max-w-md text-center">
        <div className="ember-aura relative mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl spyro-bg-gradient spyro-glow-strong">
          <SpyroLogo className="h-10 w-10 [&_svg]:h-full [&_svg]:w-full" />
        </div>

        <h1 className="mb-2 text-2xl font-bold">Email Verification</h1>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <p className="text-sm text-foreground">{message}</p>
            <a
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-lg spyro-bg-gradient px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:scale-105"
            >
              Continue to SPYRO V1
            </a>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <AlertCircle className="h-12 w-12 text-rose-400" />
            <p className="text-sm text-foreground">{message}</p>
            <a
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Back to Home
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#08080A]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
