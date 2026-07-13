"use client";

import { useEffect } from "react";

/**
 * Registers the SPYRO V1 service worker. Rendered once in the root layout.
 * Silent — no UI. The install affordance lives in the sidebar via
 * `usePwaInstall`.
 */
export function PwaManager() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    // Register after load so it never blocks first paint.
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          /* SW registration is best-effort; ignore failures (e.g. dev). */
        });
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
