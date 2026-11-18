import { query } from "@/lib/db";
import { buildRawFeatureVectors, normalizeFeatureVectors } from "@/lib/similarity";
import { ensurePlayerProfilesCollection, getQdrantClient, PLAYER_PROFILES_COLLECTION } from "@/lib/qdrant";

export const VECTOR_SEASON = "2025-2026";
let mutationQueue: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(fn, fn);
  mutationQueue = result.catch(() => undefined);
  return result;
}

export function rebuildPlayerVectors() {
  return serialize(async () => {
    await ensurePlayerProfilesCollection();
    const client = getQdrantClient();
    const raw = await buildRawFeatureVectors(VECTOR_SEASON);
    const normalized = normalizeFeatureVectors(raw);
    const meta = await query<Array<{player_id: number; player_name: string; primary_position: string; club_id: number | null}>>(
      `SELECT p.player_id, CONCAT(p.first_name, ' ', p.last_name) AS player_name,
              p.primary_position,
              (SELECT pc.club_id FROM player_club pc
               WHERE pc.player_id=p.player_id AND pc.is_current=TRUE
               ORDER BY pc.start_date DESC, pc.player_club_id DESC LIMIT 1) AS club_id
       FROM player p`
    );
    const metadata = new Map(meta.map((row) => [row.player_id, row]));
    const points = raw.map((row) => ({
      id: row.player_id, vector: normalized.get(row.player_id)!,
      payload: { ...metadata.get(row.player_id)!, season: VECTOR_SEASON },
    }));
    for (let offset=0; offset<points.length; offset+=200) {
      await client.upsert(PLAYER_PROFILES_COLLECTION, {wait: true, points: points.slice(offset,offset+200)});
    }
    const eligible = new Set(points.map((point) => point.id));
    const obsolete: Array<number | string> = [];
    let offset: number | string | undefined;
    do {
      const page = await client.scroll(PLAYER_PROFILES_COLLECTION, {limit: 200, offset, with_payload: false, with_vector: false});
      for (const point of page.points) if (!eligible.has(Number(point.id))) obsolete.push(point.id);
      const next = page.next_page_offset;
      if (next !== null && next !== undefined && typeof next !== "number" && typeof next !== "string") {
        throw new Error("Unexpected Qdrant scroll cursor.");
      }
      offset = next ?? undefined;
    } while (offset !== undefined);
    for (let i=0; i<obsolete.length; i+=200) {
      await client.delete(PLAYER_PROFILES_COLLECTION, {wait: true, points: obsolete.slice(i,i+200)});
    }
    return {indexed: points.length, removed: obsolete.length, season: VECTOR_SEASON};
  });
}

export function deletePlayerVector(playerId: number) {
  return serialize(async () => {
    await getQdrantClient().delete(PLAYER_PROFILES_COLLECTION, {wait: true, points: [playerId]});
  });
}
