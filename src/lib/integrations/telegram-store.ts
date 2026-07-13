/**
 * Per-chat conversation store for Telegram chats.
 *
 * Uses Upstash Redis when configured (UPSTASH_REDIS_REST_URL +
 * UPSTASH_REDIS_REST_TOKEN env vars) — survives Vercel cold starts.
 * Falls back to in-memory storage otherwise (resets on cold start).
 */
import type { SpyroMessage } from "@/lib/spyro-engine";
import { hasRedis, redisStore } from "@/lib/upstash";

const MAX_TURNS = 20;
const MAX_CHATS = 200;

// In-memory fallback (used when Redis is not configured).
const memStore = new Map<number, SpyroMessage[]>();

export async function getHistory(chatId: number): Promise<SpyroMessage[]> {
  if (hasRedis) {
    const raw = await redisStore.get(chatId);
    if (raw) {
      try {
        return JSON.parse(raw) as SpyroMessage[];
      } catch {
        /* corrupt data — fall through to empty */
      }
    }
    return [];
  }
  return memStore.get(chatId) ?? [];
}

export async function pushMessage(
  chatId: number,
  msg: SpyroMessage
): Promise<void> {
  let history: SpyroMessage[];
  if (hasRedis) {
    const raw = await redisStore.get(chatId);
    history = raw ? (JSON.parse(raw) as SpyroMessage[]) : [];
  } else {
    history = memStore.get(chatId) ?? [];
  }

  history.push(msg);
  if (history.length > MAX_TURNS) {
    history.splice(0, history.length - MAX_TURNS);
  }

  if (hasRedis) {
    await redisStore.set(chatId, JSON.stringify(history));
  } else {
    memStore.set(chatId, history);
    // Bound memory.
    if (memStore.size > MAX_CHATS) {
      const oldest = memStore.keys().next().value;
      if (oldest !== undefined) memStore.delete(oldest);
    }
  }
}

export async function clearHistory(chatId: number): Promise<void> {
  if (hasRedis) {
    await redisStore.del(chatId);
  } else {
    memStore.delete(chatId);
  }
}
