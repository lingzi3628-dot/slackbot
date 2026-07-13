/**
 * Streaming polyfills for React Native.
 *
 * React Native's bundled `fetch` does not expose a ReadableStream body.
 * These polyfills (installed at app entry in _layout.tsx) restore:
 *   - ReadableStream / WritableStream / TransformStream globals
 *   - fetch with streaming support (react-native-fetch-api, textStreaming)
 *
 * Without this file being imported first, src/lib/api.ts will throw on the
 * first streamed chunk.
 */
import "react-native-polyfill-globals/auto";
import { polyfill as fetchPolyfill } from "react-native-fetch-api";

fetchPolyfill({ enableTextStreaming: true });
