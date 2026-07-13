import type { MetadataRoute } from "next";

/**
 * PWA manifest for SPYRO V1. Served at /manifest.webmanifest by Next.js.
 * Makes the app installable ("Add to Home Screen") on iOS & Android.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SPYRO V1 — Dragon-Powered AI Chat",
    short_name: "SPYRO V1",
    description:
      "SPYRO V1 is a blazing-fast, dragon-powered AI chat assistant.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#0b0907",
    theme_color: "#0b0907",
    categories: ["productivity", "utilities", "lifestyle"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
