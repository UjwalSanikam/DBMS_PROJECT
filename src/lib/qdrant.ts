import { QdrantClient } from "@qdrant/js-client-rest";

// Single client instance, reused across hot-reloads in dev via a global —
// same pattern as the MySQL pool in lib/db.ts.
const globalForQdrant = globalThis as unknown as { scoutiqQdrant?: QdrantClient };

export const PLAYER_PROFILES_COLLECTION = "player_profiles";
export const VECTOR_SIZE = 10; // must match the number of features in similarity.ts

export function getQdrantClient(): QdrantClient {
  if (!globalForQdrant.scoutiqQdrant) {
    globalForQdrant.scoutiqQdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY || undefined,
    });
  }
  return globalForQdrant.scoutiqQdrant;
}

/**
 * Ensures the player_profiles collection exists with the correct vector
 * config. Safe to call repeatedly — no-ops if the collection already exists.
 */
export async function ensurePlayerProfilesCollection(): Promise<void> {
  const client = getQdrantClient();
  const collections = await client.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === PLAYER_PROFILES_COLLECTION
  );
  if (!exists) {
    await client.createCollection(PLAYER_PROFILES_COLLECTION, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    });
  }
}
