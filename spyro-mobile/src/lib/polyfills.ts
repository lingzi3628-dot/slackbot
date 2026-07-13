/**
 * Streaming polyfills for React Native.
 *
 * React Native's bundled `fetch` does not expose a ReadableStream body.
 * These polyfills (installed at app entry in _layout.tsx) restore:
 *   - ReadableStream / WritableStream / TransformStream globals
 *   - fetch with streaming support (textStreaming)
 *
 * Without this file being imported first, src/lib/api.ts will throw on the
 * first streamed chunk.
 */
import "react-native-polyfill-globals/auto";

// Enable text streaming on fetch. Try the official expo-fetch-api first
// (bundled with SDK 53), then fall back to the community package.
let polyfilled = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("expo-fetch-api");
  if (typeof mod?.polyfill === "function") {
    mod.polyfill({ enableTextStreaming: true });
    polyfilled = true;
  }
} catch {
  /* expo-fetch-api not installed — try fallback below */
}

if (!polyfilled) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-fetch-api");
    if (typeof mod?.polyfill === "function") {
      mod.polyfill({ enableTextStreaming: true });
    }
  } catch {
    // Neither package available — streaming will not work, but the app
    // won't crash. The API client will surface a clear error.
  }
}
