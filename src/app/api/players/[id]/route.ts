import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/session";

interface PlayerDetailRow {
  player_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  primary_position: string;
  secondary_position: string | null;
  preferred_foot: string;
  height_cm: number | null;
  club_id: number | null;
  club_name: string | null;
  league_name: string | null;
  market_value: string | null;
  contract_end: string | null;
  availability: "AVAILABLE" | "INJURED";
  injury_type: string | null;
  expected_return_date: string | null;
}

interface LatestStatsRow {
  season: string;
  appearances: number;
  starts: number;
  minutes_played: number;
  goals: number;
  assists: number;
  xg: string;
  xa: string;
  shots: number;
  shots_on_target: number;
  key_passes: number;
  progressive_passes: number;
  pass_accuracy: string;
  tackles: number;
  interceptions: number;
}

function authErrorResponse(): NextResponse {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
  } catch {
    return authErrorResponse();
  }

  const { id } = await params;
  const playerId = Number(id);
  if (!Number.isInteger(playerId)) {
    return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
  }

  const snapshotRows = await query<PlayerDetailRow[]>(
    `SELECT
       p.player_id, p.first_name, p.last_name, p.date_of_birth, p.nationality,
       p.primary_position, p.secondary_position, p.preferred_foot, p.height_cm,
       pc.club_id, cl.club_name, lg.league_name,
       lmv.market_value, ce.end_date AS contract_end,
       CASE WHEN av.player_id IS NULL THEN 'INJURED' ELSE 'AVAILABLE' END AS availability,
       active_inj.injury_type, active_inj.expected_return_date
     FROM player p
     LEFT JOIN player_club pc ON pc.player_id = p.player_id AND pc.is_current = TRUE
     LEFT JOIN club cl ON cl.club_id = pc.club_id
     LEFT JOIN league lg ON lg.league_id = cl.league_id
     LEFT JOIN vw_latest_market_values lmv ON lmv.player_id = p.player_id
     LEFT JOIN vw_contract_expiry ce ON ce.player_id = p.player_id
     LEFT JOIN vw_available_players av ON av.player_id = p.player_id
     LEFT JOIN (
       SELECT i1.player_id, i1.injury_type, i1.expected_return_date
       FROM injury i1
       WHERE i1.status IN ('ACTIVE', 'RECOVERING')
         AND i1.injury_date = (
           SELECT MAX(i2.injury_date) FROM injury i2
           WHERE i2.player_id = i1.player_id AND i2.status IN ('ACTIVE', 'RECOVERING')
         )
     ) active_inj ON active_inj.player_id = p.player_id
     WHERE p.player_id = ?`,
    [playerId]
  );

  const player = snapshotRows[0];
  if (!player) {
    return NextResponse.json({ error: "Player not found." }, { status: 404 });
  }

  const statsRows = await query<LatestStatsRow[]>(
    `SELECT season, appearances, starts, minutes_played, goals, assists, xg, xa,
            shots, shots_on_target, key_passes, progressive_passes,
            pass_accuracy, tackles, interceptions
     FROM player_statistics
     WHERE player_id = ?
     ORDER BY season DESC
     LIMIT 1`,
    [playerId]
  );

  return NextResponse.json({
    player,
    latestSeasonStats: statsRows[0] ?? null,
  });
}
