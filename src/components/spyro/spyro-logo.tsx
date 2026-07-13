import * as React from "react";
import { cn } from "@/lib/utils";

interface SpyroLogoProps extends React.SVGProps<SVGSVGElement> {
  withAura?: boolean;
}

/**
 * SPYRO V1 mark — a stylised dragon head formed from a single flame,
 * drawn as crisp SVG so it scales cleanly at any size.
 */
export function SpyroLogo({ withAura = false, className, ...props }: SpyroLogoProps) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center",
        withAura && "ember-aura",
        className
      )}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        {...props}
      >
        <defs>
          <linearGradient id="spyro-flame" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="oklch(0.88 0.16 85)" />
            <stop offset="0.45" stopColor="oklch(0.74 0.21 48)" />
            <stop offset="1" stopColor="oklch(0.58 0.24 27)" />
          </linearGradient>
          <linearGradient id="spyro-core" x1="32" y1="30" x2="32" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="oklch(0.96 0.08 80)" />
            <stop offset="1" stopColor="oklch(0.82 0.16 60)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer flame / dragon silhouette */}
        <path
          d="M32 4c2.4 6.2.8 9.8-1.8 12.6-2.6 2.8-6 4.8-7.6 9.2-1.2 3.4-.4 6.8 1.2 9.4-2.2-1.2-4.4-3.4-5.2-6.6-1.2-4.8 1-9.2 1-9.2s-6.2 4-8.6 11.6C8.4 38.2 12 48 18.6 53.4 23.4 57 28 58.6 32 58.6s8.6-1.6 13.4-5.2C52 48 55.6 38.2 53 31.6c-2.4-7.6-8.6-11.6-8.6-11.6s2.2 4.4 1 9.2c-.8 3.2-3 5.4-5.2 6.6 1.6-2.6 2.4-6 1.2-9.4-1.6-4.4-5-6.4-7.6-9.2C31.2 13.8 29.6 10.2 32 4Z"
          fill="url(#spyro-flame)"
        />
        {/* Inner core glow */}
        <path
          d="M32 30c1.4 3.2.6 5.6-1 7.6-1.6 2-2.8 3.4-2.8 6 0 3.4 2.6 6.4 3.8 7.6 1.2-1.2 3.8-4.2 3.8-7.6 0-2.6-1.2-4-2.8-6-1.6-2-2.4-4.4-1-7.6Z"
          fill="url(#spyro-core)"
        />
        {/* Eyes — two sharp embers */}
        <circle cx="26.5" cy="40" r="1.6" fill="oklch(0.98 0.02 80)" />
        <circle cx="37.5" cy="40" r="1.6" fill="oklch(0.98 0.02 80)" />
      </svg>
    </span>
  );
}
