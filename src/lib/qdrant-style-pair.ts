import type { QdrantClient } from "@qdrant/js-client-rest";
import { PLAYER_PROFILES_COLLECTION } from "@/lib/qdrant";

export async function findStylePair(client: Pick<QdrantClient, "query">, playerId: number, vector: number[], position?: string) {
  if (!vector.length || vector.some(v => !Number.isFinite(v)) || !vector.some(v => v !== 0)) {
    throw new Error("Player has no usable playing-style vector.");
  }
  const must = position ? [{key: "primary_position", match: {value: position}}] : undefined;
  const closest = await client.query(PLAYER_PROFILES_COLLECTION, {
    query: vector, limit: 1, params: {exact: true}, with_payload: true,
    filter: {must, must_not: [{has_id: [playerId]}]},
  });
  const near = closest.points[0];
  if (!near) return null;
  // cos(-target, candidate) = -cos(target, candidate): the nearest to
  // the negated vector is the least similar to the original vector.
  const opposite = await client.query(PLAYER_PROFILES_COLLECTION, {
    query: vector.map(v => -v), limit: 1, params: {exact: true}, with_payload: true,
    filter: {must, must_not: [{has_id: [playerId, near.id]}]},
  });
  const far = opposite.points[0];
  if (!far) return null;
  return [
    {...near, score: near.score, match_type: "closest" as const},
    {...far, score: -far.score, match_type: "most_different" as const},
  ];
}
