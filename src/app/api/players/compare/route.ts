import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/session";

interface ComparisonRow {
  player_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  primary_position: string;
  market_value: string | null;
  contract_end: string | null;
  availability: "AVAILABLE" | "INJURED";
  injury_count: number;
  days_missed: number;
  goals: number | null;
  assists: number | null;
  xg: string | null;
  xa: string | null;
  pass_accuracy: string | null;
  key_passes: number | null;
  tackles: number | null;
  interceptions: number | null;
  avg_scout_rating: string | null;
}

const CURRENT_SEASON = "2025-2026";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json(
      { error: "ids query param is required, e.g. ?ids=12,45,78" },
      { status: 400 }
    );
  }

  const playerIds = idsParam
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v));

  if (playerIds.length < 2 || playerIds.length > 3) {
    return NextResponse.json(
      { error: "Provide 2 or 3 player ids to compare." },
      { status: 400 }
    );
  }

  const placeholders = playerIds.map(() => "?").join(", ");

  const rows = await query<ComparisonRow[]>(
    `SELECT
       p.player_id, p.first_name, p.last_name, p.date_of_birth, p.primary_position,
       lmv.market_value, ce.end_date AS contract_end,
       CASE WHEN av.player_id IS NULL THEN 'INJURED' ELSE 'AVAILABLE' END AS availability,
       COALESCE(ic.injury_count, 0) AS injury_count,
       COALESCE(dm.days_missed, 0) AS days_missed,
       ps.goals, ps.assists, ps.xg, ps.xa, ps.pass_accuracy,
       ps.key_passes, ps.tackles, ps.interceptions,
       sr.avg_scout_rating
     FROM player p
     LEFT JOIN vw_latest_market_values lmv ON lmv.player_id = p.player_id
     LEFT JOIN vw_contract_expiry ce ON ce.player_id = p.player_id
     LEFT JOIN vw_available_players av ON av.player_id = p.player_id
     LEFT JOIN player_statistics ps ON ps.player_id = p.player_id AND ps.season = ?
     LEFT JOIN (
       SELECT player_id, COUNT(*) AS injury_count FROM injury GROUP BY player_id
     ) ic ON ic.player_id = p.player_id
     LEFT JOIN (
       SELECT player_id,
              SUM(DATEDIFF(COALESCE(actual_return_date, CURDATE()), injury_date)) AS days_missed
       FROM injury
       GROUP BY player_id
     ) dm ON dm.player_id = p.player_id
     LEFT JOIN (
       SELECT player_id, AVG(overall_rating) AS avg_scout_rating
       FROM scout_report
       GROUP BY player_id
     ) sr ON sr.player_id = p.player_id
     WHERE p.player_id IN (${placeholders})`,
    [CURRENT_SEASON, ...playerIds]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "No matching players found." }, { status: 404 });
  }

  return NextResponse.json({ players: rows });
}
