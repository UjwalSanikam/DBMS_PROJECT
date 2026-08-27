import "dotenv/config";
import { query, getPool } from "@/lib/db";
import {
  buildRawFeatureVectors,
  normalizeFeatureVectors,
} from "@/lib/similarity";
import {
  ensurePlayerProfilesCollection,
  getQdrantClient,
  PLAYER_PROFILES_COLLECTION,
} from "@/lib/qdrant";

const CURRENT_SEASON = "2025-2026";

interface PlayerMeta {
  player_id: number;
  player_name: string;
  primary_position: string;
  club_id: number | null;
}

async function main() {
  await ensurePlayerProfilesCollection();

  const raw = await buildRawFeatureVectors(CURRENT_SEASON);
  if (raw.length === 0) {
    console.log("No players met the minimum-minutes threshold. Nothing to upsert.");
    process.exit(0);
  }

  const normalized = normalizeFeatureVectors(raw);
  const playerIds = raw.map((r) => r.player_id);

  const metaRows = await query<PlayerMeta[]>(
    `SELECT p.player_id,
            CONCAT(p.first_name, ' ', p.last_name) AS player_name,
            p.primary_position, pc.club_id
     FROM player p
     LEFT JOIN player_club pc ON pc.player_id = p.player_id AND pc.is_current = TRUE
     WHERE p.player_id IN (${playerIds.map(() => "?").join(", ")})`,
    playerIds
  );
  const metaById = new Map(metaRows.map((m) => [m.player_id, m]));

  const client = getQdrantClient();
  const points = raw.map((r) => {
    const meta = metaById.get(r.player_id);
    return {
      id: r.player_id,
      vector: normalized.get(r.player_id)!,
      payload: {
        player_id: r.player_id,
        player_name: meta?.player_name ?? "Unknown",
        primary_position: meta?.primary_position ?? "Unknown",
        season: CURRENT_SEASON,
        club_id: meta?.club_id ?? null,
      },
    };
  });

  await client.upsert(PLAYER_PROFILES_COLLECTION, { points });

  console.log(`Rebuilt and upserted ${points.length} player vector(s) into Qdrant.`);
  await getPool().end();
}

main().catch((err) => {
  console.error("Rebuilding vectors failed:", err);
  process.exit(1);
});
