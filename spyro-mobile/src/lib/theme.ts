/**
 * SPYRO V1 ember/fire theme tokens — ported 1:1 from the web app's CSS.
 * Dark is the default; light is a warm parchment variant.
 */

export interface Theme {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryForeground: string;
  primaryMuted: string;
  text: string;
  textMuted: string;
  border: string;
  destructive: string;
  userBubble: string;
  userBubbleText: string;
  assistantBubble: string;
  codeBackground: string;
  /** Linear gradient stops for the fire emblem / logo badge. */
  gradient: [string, string, string];
}

export const darkTheme: Theme = {
  background: "#16110d", // warm charcoal (oklch 0.16 0.012 35)
  surface: "#211410", // card (oklch 0.21 0.016 38)
  surfaceElevated: "#2b1c15",
  primary: "#ff7a1a", // ember orange (oklch 0.7 0.2 42)
  primaryForeground: "#16110d",
  primaryMuted: "rgba(255,122,26,0.15)",
  text: "#f5ecd9", // foreground (oklch 0.97 0.012 70)
  textMuted: "#a99c87", // muted-foreground (oklch 0.7 0.02 60)
  border: "rgba(255,255,255,0.09)",
  destructive: "#e85a3c",
  userBubble: "#ff7a1a",
  userBubbleText: "#16110d",
  assistantBubble: "#211410",
  codeBackground: "rgba(0,0,0,0.4)",
  gradient: ["#ffe9a8", "#ff9a3c", "#e8421b"],
};

export const lightTheme: Theme = {
  background: "#fcf7ee", // warm parchment
  surface: "#ffffff",
  surfaceElevated: "#fff8ec",
  primary: "#e8651a",
  primaryForeground: "#fff8ec",
  primaryMuted: "rgba(232,101,26,0.12)",
  text: "#3a2a1a",
  textMuted: "#8a7a68",
  border: "rgba(60,40,20,0.12)",
  destructive: "#c93822",
  userBubble: "#e8651a",
  userBubbleText: "#fff8ec",
  assistantBubble: "#ffffff",
  codeBackground: "rgba(60,40,20,0.06)",
  gradient: ["#ffd27a", "#ee8a2e", "#d8421b"],
};

export function getTheme(mode: "dark" | "light"): Theme {
  return mode === "dark" ? darkTheme : lightTheme;
}
