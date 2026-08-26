import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/session";

interface PlayerRow {
  player_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  primary_position: string;
  preferred_foot: string;
  height_cm: number | null;
  club_name: string | null;
  league_name: string | null;
  market_value: string | null;
  contract_end: string | null;
  availability: "AVAILABLE" | "INJURED";
  appearances: number | null;
  goals: number | null;
  assists: number | null;
  xg: string | null;
  xa: string | null;
  pass_accuracy: string | null;
  key_passes: number | null;
  tackles: number | null;
  interceptions: number | null;
  injury_count: number;
}

const CURRENT_SEASON = "2025-2026";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  // --- Basic ---
  const name = searchParams.get("name")?.trim();
  const position = searchParams.get("position")?.trim();
  const nationality = searchParams.get("nationality")?.trim();
  const preferredFoot = searchParams.get("preferredFoot")?.trim();
  const club = searchParams.get("club")?.trim();
  const league = searchParams.get("league")?.trim();
  const ageMin = searchParams.get("ageMin");
  const ageMax = searchParams.get("ageMax");

  // --- Performance ---
  const minAppearances = searchParams.get("minAppearances");
  const minMinutes = searchParams.get("minMinutes");
  const minGoals = searchParams.get("minGoals");
  const minAssists = searchParams.get("minAssists");
  const minXg = searchParams.get("minXg");
  const minXa = searchParams.get("minXa");
  const minPassAccuracy = searchParams.get("minPassAccuracy");
  const minKeyPasses = searchParams.get("minKeyPasses");
  const minTackles = searchParams.get("minTackles");
  const minInterceptions = searchParams.get("minInterceptions");

  // --- Recruitment ---
  const maxMarketValue = searchParams.get("maxMarketValue");
  const contractExpiresBefore = searchParams.get("contractExpiresBefore");
  const maxContractMonths = searchParams.get("maxContractMonths");

  // --- Fitness ---
  const availableOnly = searchParams.get("availableOnly") === "true";
  const injurySeverity = searchParams.get("injurySeverity")?.trim();
  const maxInjuryCount = searchParams.get("maxInjuryCount");

  const conditions: string[] = [];
  const havingConditions: string[] = [];
  const params: Array<string | number> = [];

  if (name) {
    conditions.push(`(p.first_name LIKE ? OR p.last_name LIKE ?)`);
    params.push(`%${name}%`, `%${name}%`);
  }
  if (position) {
    conditions.push(`p.primary_position = ?`);
    params.push(position);
  }
  if (nationality) {
    conditions.push(`p.nationality = ?`);
    params.push(nationality);
  }
  if (preferredFoot) {
    conditions.push(`p.preferred_foot = ?`);
    params.push(preferredFoot);
  }
  if (club) {
    conditions.push(`cl.club_name LIKE ?`);
    params.push(`%${club}%`);
  }
  if (league) {
    conditions.push(`lg.league_name LIKE ?`);
    params.push(`%${league}%`);
  }
  if (ageMin) {
    conditions.push(`TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) >= ?`);
    params.push(Number(ageMin));
  }
  if (ageMax) {
    conditions.push(`TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) <= ?`);
    params.push(Number(ageMax));
  }
  if (maxMarketValue) {
    conditions.push(`lmv.market_value <= ?`);
    params.push(Number(maxMarketValue));
  }
  if (contractExpiresBefore) {
    conditions.push(`ce.end_date <= ?`);
    params.push(contractExpiresBefore);
  }
  if (maxContractMonths) {
    conditions.push(
      `ce.end_date IS NOT NULL AND TIMESTAMPDIFF(MONTH, CURDATE(), ce.end_date) <= ?`
    );
    params.push(Number(maxContractMonths));
  }
  if (availableOnly) {
    conditions.push(`av.player_id IS NOT NULL`);
  }
  if (injurySeverity) {
    conditions.push(
      `EXISTS (SELECT 1 FROM injury i WHERE i.player_id = p.player_id AND i.severity = ? AND i.status IN ('ACTIVE','RECOVERING'))`
    );
    params.push(injurySeverity);
  }

  // Performance filters apply to HAVING because they reference the joined
  // player_statistics columns, and NULL-safe comparisons here are simpler
  // expressed post-join with COALESCE than repeated in WHERE.
  if (minAppearances) {
    havingConditions.push(`COALESCE(ps.appearances, 0) >= ?`);
    params.push(Number(minAppearances));
  }
  if (minMinutes) {
    havingConditions.push(`COALESCE(ps.minutes_played, 0) >= ?`);
    params.push(Number(minMinutes));
  }
  if (minGoals) {
    havingConditions.push(`COALESCE(ps.goals, 0) >= ?`);
    params.push(Number(minGoals));
  }
  if (minAssists) {
    havingConditions.push(`COALESCE(ps.assists, 0) >= ?`);
    params.push(Number(minAssists));
  }
  if (minXg) {
    havingConditions.push(`COALESCE(ps.xg, 0) >= ?`);
    params.push(Number(minXg));
  }
  if (minXa) {
    havingConditions.push(`COALESCE(ps.xa, 0) >= ?`);
    params.push(Number(minXa));
  }
  if (minPassAccuracy) {
    havingConditions.push(`COALESCE(ps.pass_accuracy, 0) >= ?`);
    params.push(Number(minPassAccuracy));
  }
  if (minKeyPasses) {
    havingConditions.push(`COALESCE(ps.key_passes, 0) >= ?`);
    params.push(Number(minKeyPasses));
  }
  if (minTackles) {
    havingConditions.push(`COALESCE(ps.tackles, 0) >= ?`);
    params.push(Number(minTackles));
  }
  if (minInterceptions) {
    havingConditions.push(`COALESCE(ps.interceptions, 0) >= ?`);
    params.push(Number(minInterceptions));
  }
  if (maxInjuryCount) {
    havingConditions.push(`injury_count <= ?`);
    params.push(Number(maxInjuryCount));
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const havingClause = havingConditions.length
    ? `HAVING ${havingConditions.join(" AND ")}`
    : "";

  const sql = `
    SELECT
      p.player_id, p.first_name, p.last_name, p.date_of_birth, p.nationality,
      p.primary_position, p.preferred_foot, p.height_cm,
      cl.club_name, lg.league_name,
      lmv.market_value, ce.end_date AS contract_end,
      CASE WHEN av.player_id IS NULL THEN 'INJURED' ELSE 'AVAILABLE' END AS availability,
      ps.appearances, ps.goals, ps.assists, ps.xg, ps.xa,
      ps.pass_accuracy, ps.key_passes, ps.tackles, ps.interceptions,
      COALESCE(ic.injury_count, 0) AS injury_count
    FROM player p
    LEFT JOIN player_club pc ON pc.player_id = p.player_id AND pc.is_current = TRUE
    LEFT JOIN club cl ON cl.club_id = pc.club_id
    LEFT JOIN league lg ON lg.league_id = cl.league_id
    LEFT JOIN vw_latest_market_values lmv ON lmv.player_id = p.player_id
    LEFT JOIN vw_contract_expiry ce ON ce.player_id = p.player_id
    LEFT JOIN vw_available_players av ON av.player_id = p.player_id
    LEFT JOIN player_statistics ps ON ps.player_id = p.player_id AND ps.season = ?
    LEFT JOIN (
      SELECT player_id, COUNT(*) AS injury_count FROM injury GROUP BY player_id
    ) ic ON ic.player_id = p.player_id
    ${whereClause}
    ${havingClause}
    ORDER BY p.last_name, p.first_name
    LIMIT 100
  `;

  const players = await query<PlayerRow[]>(sql, [CURRENT_SEASON, ...params]);

  return NextResponse.json({ players });
}