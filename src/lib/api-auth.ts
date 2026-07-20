/**
 * API key authentication + management.
 *
 * #7 (hardening):
 *  - Keys generated as crypto.randomBytes(32).toString('hex') (64 hex chars).
 *  - Keys hashed with SHA-256 before storing in the DB (never store raw keys).
 *  - Returned to the user exactly ONCE on creation.
 *  - Revocable by the user (DELETE /api/auth/api-keys/[id]).
 *  - Rate limited separately (100 req/min per key).
 *  - Lookup: hash the incoming key → find by hash (indexed).
 */

import { db } from "@/lib/db";
import { randomBytes, createHash } from "crypto";

/** Generate a new API key (raw, returned to user once). Format: spyro-<64hex>. */
export function generateApiKey(): string {
  return "spyro-" + randomBytes(32).toString("hex");
}

/** Hash an API key with SHA-256 for DB storage. */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey, "utf8").digest("hex");
}

export interface ApiKeyUser {
  id: string;
  email: string;
  name: string;
  plan: string;
}

/**
 * Validate an API key from the x-api-key header.
 * Hashes the key and looks it up in the DB.
 * Returns the user if valid + active, null otherwise.
 */
export async function getUserByApiKey(apiKey: string | null | undefined): Promise<ApiKeyUser | null> {
  if (!apiKey) return null;
  // Basic format check before hitting the DB
  if (!apiKey.startsWith("spyro-") || apiKey.length < 20) return null;

  try {
    const hashed = hashApiKey(apiKey);
    // Look up by hash — the `key` column stores the SHA-256 hash
    const apiKeyRecord = await db.apiKey.findUnique({
      where: { key: hashed },
      include: {
        user: {
          select: { id: true, email: true, name: true, plan: true },
        },
      },
    });

    if (!apiKeyRecord || !apiKeyRecord.active) return null;
    if (apiKeyRecord.callLimit > 0 && apiKeyRecord.callsUsed >= apiKeyRecord.callLimit) {
      // Quota exceeded
      return null;
    }

    // Update lastUsedAt + increment callsUsed (best-effort, non-blocking)
    db.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: {
        lastUsedAt: new Date(),
        callsUsed: { increment: 1 },
      },
    }).catch(() => { /* don't block the request */ });

    return {
      id: apiKeyRecord.user.id,
      email: apiKeyRecord.user.email,
      name: apiKeyRecord.user.name,
      plan: apiKeyRecord.user.plan,
    };
  } catch {
    return null;
  }
}

/**
 * Create a new API key for a user.
 * Returns the RAW key (shown once) + the DB record (without the key).
 */
export async function createApiKeyForUser(userId: string, name: string): Promise<{
  rawKey: string;
  record: { id: string; name: string; createdAt: Date };
}> {
  const rawKey = generateApiKey();
  const hashed = hashApiKey(rawKey);

  const record = await db.apiKey.create({
    data: {
      userId,
      name: name.slice(0, 80), // limit name length
      key: hashed, // store the HASH, not the raw key
      callLimit: 1000, // default monthly limit
    },
    select: { id: true, name: true, createdAt: true },
  });

  return { rawKey, record };
}

/** Revoke (deactivate) an API key by ID. Only the owner can revoke. */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const result = await db.apiKey.updateMany({
    where: { id: keyId, userId }, // ensure ownership
    data: { active: false },
  });
  return result.count > 0;
}

/** List all API keys for a user (without revealing the hashed key). */
export async function listApiKeysForUser(userId: string): Promise<Array<{
  id: string;
  name: string;
  active: boolean;
  callsUsed: number;
  callLimit: number;
  createdAt: Date;
  lastUsedAt: Date | null;
}>> {
  const keys = await db.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      active: true,
      callsUsed: true,
      callLimit: true,
      createdAt: true,
      lastUsedAt: true,
      // NOTE: `key` (the hash) is NOT selected — never expose it
    },
    orderBy: { createdAt: "desc" },
  });
  return keys;
}
