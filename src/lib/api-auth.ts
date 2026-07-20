/**
 * API key authentication helper.
 *
 * V4 (round 2): /api/image-gen and other endpoints accept an x-api-key
 * header as an alternative to session cookies. This module validates
 * the key against the database (Neon) where API keys are stored.
 *
 * API keys are stored in the User.resetToken field (prefixed with 'spyro-').
 * In future, migrate to a dedicated ApiKey table with scoped permissions.
 */
import { db } from "@/lib/db";
import { validateApiKey, hashToken } from "@/lib/input-validation";

export interface ApiKeyUser {
  id: string;
  email: string;
  name: string;
  plan: string;
}

/**
 * Validate an API key from the x-api-key header.
 * Returns the user if valid, null if invalid or no key provided.
 */
export async function getUserByApiKey(apiKey: string | null | undefined): Promise<ApiKeyUser | null> {
  if (!apiKey) return null;
  // Validate format first (cheap regex before hitting the DB)
  const validated = validateApiKey(apiKey);
  if (!validated) return null;
  try {
    // API keys are stored in User.resetToken (prefixed with 'spyro-').
    // The stored value is the hash of the key (not the raw key).
    // For backward compat, we also check if the raw key matches.
    const hashed = hashToken(validated);
    const user = await db.user.findFirst({
      where: {
        OR: [
          { resetToken: validated }, // raw key (legacy)
          { resetToken: hashed },     // hashed key (future)
        ],
      },
      select: { id: true, email: true, name: true, plan: true, resetToken: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    };
  } catch {
    return null;
  }
}
