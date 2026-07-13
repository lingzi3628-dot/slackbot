/**
 * Upstash Redis client — uses the REST API directly (no package needed).
 *
 * If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, Telegram
 * conversation history persists across cold starts. Otherwise, falls back
 * to in-memory storage.
 *
 * Setup (free tier): https://console.upstash.com → create database →
 * copy REST URL + REST token → add as Vercel env vars.
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasRedis = !!(UPSTASH_URL && UPSTASH_TOKEN);

/** Execute a Redis command via the Upstash REST API. */
async function redis(command: string[], ...args: (string | number)[]): Promise<unknown> {
  if (!hasRedis) throw new Error("Redis not configured");
  const res = await fetch(`${UPSTASH_URL}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${UPSTASH_TOKEN}`,
      "content-type": "application/json",
    },
 body: JSON.stringify([command, ...args]),
    keepalive: false,
  });
  if (!res.ok) {
    throw new Error(`Redis error: ${res.status}`);
  }
  const data = await res.json();
  return data.result;
}

const PREFIX = "spyro:tg:";

export const redisStore = {
  async get(chatId: number): Promise<string | null> {
    if (!hasRedis) return null;
    try {
      return (await redis(["GET", `${PREFIX}${chatId}`])) as string | null;
    } catch {
      return null;
    }
  },

  async set(chatId: number, value: string): Promise<void> {
    if (!hasRedis) return;
    try {
      // Expire after 7 days of inactivity to keep Redis clean.
      await redis(["SET", `${PREFIX}${chatId}`, value, "EX", "604800"]);
    } catch {
      /* ignore */
    }
  },

  async del(chatId: number): Promise<void> {
    if (!hasRedis) return;
    try {
      await redis(["DEL", `${PREFIX}${chatId}`]);
    } catch {
      /* ignore */
    }
  },
};
