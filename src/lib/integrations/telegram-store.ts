/**
 * In-memory conversation store for Telegram chats.
 *
 * Keyed by Telegram chat id. Keeps the last N turns for context. This is
 * ephemeral (resets when the Vercel function cold-starts) — good enough for
 * a single-user bot. For multi-user production, swap this for a real DB
 * (Upstash Redis, Supabase, etc.).
 */
import type { SpyroMessage } from "@/lib/spyro-engine";

const MAX_TURNS = 20; // per chat
const MAX_CHATS = 200; // total, to bound memory

const store = new Map<number, SpyroMessage[]>();

export function getHistory(chatId: number): SpyroMessage[] {
  return store.get(chatId) ?? [];
}

export function pushMessage(chatId: number, msg: SpyroMessage): void {
  const history = store.get(chatId) ?? [];
  history.push(msg);
  // Keep only the last MAX_TURNS messages.
  if (history.length > MAX_TURNS) {
    history.splice(0, history.length - MAX_TURNS);
  }
  store.set(chatId, history);

  // Bound total memory: drop oldest chats if we exceed MAX_CHATS.
  if (store.size > MAX_CHATS) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
}

export function clearHistory(chatId: number): void {
  store.delete(chatId);
}
