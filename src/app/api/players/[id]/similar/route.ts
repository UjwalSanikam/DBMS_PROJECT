import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { findSqlSimilar } from "@/lib/sql-similarity";
import { findStylePair } from "@/lib/qdrant-style-pair";
import { getQdrantClient, PLAYER_PROFILES_COLLECTION } from "@/lib/qdrant";

interface SimilarPlayerResult {
  player_id: number;
  player_name: string;
  primary_position: string;
  season: string;
  club_id: number | null;
  similarity_percent: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const playerId = Number(id);
  if (!Number.isSafeInteger(playerId) || playerId <= 0) {
    return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const samePositionOnly = searchParams.get("samePosition") === "true";
  const limit = Number(searchParams.get("limit") ?? 5);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    return NextResponse.json({error: "limit must be an integer between 1 and 20."}, {status: 400});
  }

  try {
  const engine = searchParams.get("engine") ?? "qdrant";
  if (engine !== "sql" && engine !== "qdrant") return NextResponse.json({error: "Choose sql or qdrant."}, {status: 400});
  if (engine === "sql") {
    const similar = await findSqlSimilar(playerId, samePositionOnly, limit);
    if (similar === null) return NextResponse.json({error: "Player needs at least 450 minutes of current-season statistics."}, {status: 404});
    return NextResponse.json({similar, engine});
  }
  const client = getQdrantClient();

  // Step 1: fetch the target player's stored vector + payload.
  const points = await client.retrieve(PLAYER_PROFILES_COLLECTION, {
    ids: [playerId],
    with_vector: true,
    with_payload: true,
  });

  const target = points[0];
  if (!target) {
    return NextResponse.json(
      {
        error:
          "No playing-style vector on file for this player (insufficient minutes played, or vectors have not been rebuilt yet).",
      },
      { status: 404 }
    );
  }

  const vector = target.vector;
  if (!Array.isArray(vector) || !vector.length || vector.some(v => typeof v !== "number" || !Number.isFinite(v)) || !vector.some(v => v !== 0)) {
    return NextResponse.json({error: "Player has no usable playing-style vector. Refresh the index."}, {status: 422});
  }
  const pair = await findStylePair(client, playerId, vector as number[], samePositionOnly
    ? (target.payload as {primary_position: string}).primary_position : undefined);
  if (!pair) return NextResponse.json({error: "At least two other indexed players are needed. Turn off Same position only or add more player vectors."}, {status: 422});
  const similar: SimilarPlayerResult[] = pair
    .map((p) => {
      const payload = p.payload as {
        player_id: number;
        player_name: string;
        primary_position: string;
        season: string;
        club_id: number | null;
      };
      // Cosine similarity score from Qdrant ranges roughly -1..1;
      // clamp and rescale to a 0-100% "similarity" for display.
      const clamped = Math.max(-1, Math.min(1, p.score));
      const similarityPercent = Math.round(((clamped + 1) / 2) * 100);
      return {
        player_id: payload.player_id,
        player_name: payload.player_name,
        primary_position: payload.primary_position,
        season: payload.season,
        club_id: payload.club_id,
        similarity_percent: similarityPercent,
        match_type: p.match_type,
      };
    });

  return NextResponse.json({ similar, engine: "qdrant" });
  } catch {
    return NextResponse.json({error: "Selected search service is unavailable. Check MySQL, or start Qdrant and refresh its index."}, {status: 503});
  }
}
