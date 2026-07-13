import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaManager } from "@/components/spyro/pwa-manager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SPYRO V1 — Dragon-Powered AI Chat",
  description:
    "SPYRO V1 is a blazing-fast AI chat assistant powered by the Spyro dragon engine. Chat, create, and explore with fire.",
  keywords: ["SPYRO V1", "AI chat", "chatbot", "Spyro", "AI assistant"],
  authors: [{ name: "SPYRO Labs" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SPYRO V1",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "SPYRO V1 — Dragon-Powered AI Chat",
    description: "Chat with SPYRO V1, the dragon-powered AI assistant.",
    siteName: "SPYRO V1",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0907",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <PwaManager />
        </ThemeProvider>
      </body>
    </html>
  );
}
