import { query } from "@/lib/db";
import { buildRawFeatureVectors, normalizeFeatureVectors } from "@/lib/similarity";

// Exact comparison from live MySQL statistics; no Qdrant service or index needed.
export async function findSqlSimilar(playerId: number, samePosition: boolean, limit: number) {
  const raw = await buildRawFeatureVectors("2025-2026");
  const vectors = normalizeFeatureVectors(raw);
  const target = vectors.get(playerId);
  if (!target) return null;
  const players = await query<Array<{player_id: number; player_name: string; primary_position: string}>>(
    "SELECT player_id, CONCAT(first_name, ' ', last_name) AS player_name, primary_position FROM player"
  );
  const position = players.find(p => p.player_id === playerId)?.primary_position;
  return players.filter(p => p.player_id !== playerId && vectors.has(p.player_id) && (!samePosition || p.primary_position === position))
    .map(p => {
      const vector = vectors.get(p.player_id)!;
      const denominator = Math.hypot(...target) * Math.hypot(...vector);
      const score = denominator === 0 ? 0 : target.reduce((sum, v, i) => sum + v * vector[i], 0) / denominator;
      return {...p, score, similarity_percent: Math.round((Math.max(-1, Math.min(1, score)) + 1) * 50)};
    })
    .sort((a,b) => b.score - a.score || a.player_id - b.player_id).slice(0, limit);
}
