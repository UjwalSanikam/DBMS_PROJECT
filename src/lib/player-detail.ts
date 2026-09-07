import { query } from "@/lib/db";

export interface PlayerDetail {
  player_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  primary_position: string;
  secondary_position: string | null;
  preferred_foot: string;
  height_cm: number | null;
  photo_url: string | null;
  club_id: number | null;
  club_name: string | null;
  league_name: string | null;
  market_value: string | null;
  contract_end: string | null;
  availability: "AVAILABLE" | "INJURED";
  injury_type: string | null;
  expected_return_date: string | null;
}

export interface LatestSeasonStats {
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

export interface InjuryRow {
  injury_id: number;
  injury_type: string;
  body_area: string;
  injury_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  severity: string;
  status: string;
}

export interface ContractRow {
  contract_id: number;
  club_id: number;
  start_date: string;
  end_date: string;
  weekly_salary: string | null;
  release_clause: string | null;
  currency: string;
  contract_status: string;
}

export interface TransferRow {
  transfer_id: number;
  from_club_id: number | null;
  to_club_id: number | null;
  from_club_name: string | null;
  to_club_name: string | null;
  transfer_date: string;
  transfer_fee: string | null;
  currency: string;
  transfer_type: string;
}

export interface ValuationRow {
  valuation_id: number;
  valuation_date: string;
  market_value: string;
  currency: string;
}

export interface ScoutReportRow {
  report_id: number;
  scout_name: string;
  overall_rating: string;
  strengths: string | null;
  weaknesses: string | null;
  tactical_fit: string | null;
  recommendation: string;
  notes: string | null;
  created_at: string;
}

export interface FullPlayerDetail {
  player: PlayerDetail;
  latestSeasonStats: LatestSeasonStats | null;
  injuries: InjuryRow[];
  contracts: ContractRow[];
  transfers: TransferRow[];
  valuations: ValuationRow[];
  reports: ScoutReportRow[];
}

export async function getFullPlayerDetail(
  playerId: number
): Promise<FullPlayerDetail | null> {
  const snapshotRows = await query<PlayerDetail[]>(
    `SELECT
       p.player_id, p.first_name, p.last_name, p.date_of_birth, p.nationality,
       p.primary_position, p.secondary_position, p.preferred_foot, p.height_cm,
       p.photo_url,
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
  if (!player) return null;

  const [
    statsRows,
    injuries,
    contracts,
    transfers,
    valuations,
    reports,
  ] = await Promise.all([
    query<LatestSeasonStats[]>(
      `SELECT season, appearances, starts, minutes_played, goals, assists, xg, xa,
              shots, shots_on_target, key_passes, progressive_passes,
              pass_accuracy, tackles, interceptions
       FROM player_statistics
       WHERE player_id = ?
       ORDER BY season DESC
       LIMIT 1`,
      [playerId]
    ),
    query<InjuryRow[]>(
      `SELECT injury_id, injury_type, body_area, injury_date, expected_return_date,
              actual_return_date, severity, status
       FROM injury
       WHERE player_id = ?
       ORDER BY injury_date DESC`,
      [playerId]
    ),
    query<ContractRow[]>(
      `SELECT contract_id, club_id, start_date, end_date, weekly_salary,
              release_clause, currency, contract_status
       FROM contract
       WHERE player_id = ?
       ORDER BY start_date DESC`,
      [playerId]
    ),
    query<TransferRow[]>(
      `SELECT t.transfer_id, t.from_club_id, t.to_club_id,
              fc.club_name AS from_club_name, tc.club_name AS to_club_name,
              t.transfer_date, t.transfer_fee, t.currency, t.transfer_type
       FROM transfer t
       LEFT JOIN club fc ON fc.club_id = t.from_club_id
       LEFT JOIN club tc ON tc.club_id = t.to_club_id
       WHERE t.player_id = ?
       ORDER BY t.transfer_date DESC`,
      [playerId]
    ),
    query<ValuationRow[]>(
      `SELECT valuation_id, valuation_date, market_value, currency
       FROM market_value_history
       WHERE player_id = ?
       ORDER BY valuation_date ASC`,
      [playerId]
    ),
    query<ScoutReportRow[]>(
      `SELECT r.report_id, u.full_name AS scout_name, r.overall_rating,
              r.strengths, r.weaknesses, r.tactical_fit, r.recommendation,
              r.notes, r.created_at
       FROM scout_report r
       INNER JOIN \`user\` u ON u.user_id = r.scout_user_id
       WHERE r.player_id = ?
       ORDER BY r.created_at DESC`,
      [playerId]
    ),
  ]);

  return {
    player,
    latestSeasonStats: statsRows[0] ?? null,
    injuries,
    contracts,
    transfers,
    valuations,
    reports,
  };
}
