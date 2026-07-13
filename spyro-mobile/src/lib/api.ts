/**
 * SPYRO V1 streaming chat client.
 *
 * Calls the deployed SPYRO V1 backend (/api/chat) which proxies the free
 * Pollination AI text endpoint and rebrands responses as SPYRO V1.
 *
 * NOTE on streaming: React Native's bundled `fetch` does NOT expose a
 * ReadableStream body by default. The root `_layout.tsx` installs the
 * `react-native-polyfill-globals` + `react-native-fetch-api` polyfills so
 * `res.body.getReader()` works on-device. Without those polyfills this
 * function will throw on the first chunk.
 */
import { API_BASE_URL } from "./constants";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamHandlers {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function streamChat(
  messages: ChatMessage[],
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const url = `${API_BASE_URL}/api/chat`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/plain; charset=utf-8",
      },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (err) {
    handlers.onError(
      err instanceof Error ? err : new Error("Network request failed")
    );
    return;
  }

  if (!res.ok || !res.body) {
    let detail = `SPYRO V1 error (${res.status})`;
    try {
      const data = await res.json();
      detail = data?.error ?? data?.detail ?? detail;
    } catch {
      /* ignore */
    }
    handlers.onError(new Error(detail));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk.length > 0) handlers.onToken(chunk);
    }
    handlers.onDone();
  } catch (err) {
    if (signal?.aborted) {
      // User-cancelled — not an error.
      handlers.onDone();
      return;
    }
    handlers.onError(
      err instanceof Error ? err : new Error("Stream interrupted")
    );
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* noop */
    }
  }
}
