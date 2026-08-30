import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
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
  if (!Number.isInteger(playerId)) {
    return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const samePositionOnly = searchParams.get("samePosition") === "true";
  const limit = Number(searchParams.get("limit") ?? 5);

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

  // Step 2: query for nearest neighbors, excluding the player themself.
  const filter = samePositionOnly
    ? {
        must: [
          {
            key: "primary_position",
            match: { value: (target.payload as { primary_position: string }).primary_position },
          },
        ],
      }
    : undefined;

  const searchResult = await client.query(PLAYER_PROFILES_COLLECTION, {
    query: target.vector as number[],
    limit: limit + 1, // +1 since the target itself may come back as the top match
    filter,
    with_payload: true,
  });

  const similar: SimilarPlayerResult[] = searchResult.points
    .filter((p) => p.id !== playerId)
    .slice(0, limit)
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
      };
    });

  return NextResponse.json({ similar });
}
