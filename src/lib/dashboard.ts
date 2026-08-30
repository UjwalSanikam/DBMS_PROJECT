import { query } from "@/lib/db";

interface CountRow {
  count: number;
}

export interface RecentReportRow {
  report_id: number;
  player_id: number;
  player_name: string;
  scout_name: string;
  overall_rating: string;
  recommendation: string;
  created_at: string;
}

export interface RecentShortlistRow {
  shortlist_id: number;
  player_id: number;
  player_name: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface ContractExpiryRow {
  player_id: number;
  player_name: string;
  club_name: string;
  end_date: string;
  months_remaining: number;
}

export interface InjuredShortlistRow {
  player_id: number;
  player_name: string;
  shortlist_status: string;
  injury_type: string;
  expected_return_date: string | null;
}

export interface TopTargetRow {
  player_id: number;
  player_name: string;
  avg_rating: string;
  report_count: number;
}

export interface DashboardSummary {
  cards: {
    playersTracked: number;
    availablePlayers: number;
    currentlyInjured: number;
    shortlisted: number;
    scoutReports: number;
  };
  recentReports: RecentReportRow[];
  recentShortlisted: RecentShortlistRow[];
  contractExpiries: ContractExpiryRow[];
  injuredShortlisted: InjuredShortlistRow[];
  topTargets: TopTargetRow[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    playersTracked,
    availablePlayers,
    currentlyInjured,
    shortlistedCount,
    scoutReportCount,
    recentReports,
    recentShortlisted,
    contractExpiries,
    injuredShortlisted,
    topTargets,
  ] = await Promise.all([
    query<CountRow[]>(`SELECT COUNT(*) AS count FROM player`),
    query<CountRow[]>(`SELECT COUNT(*) AS count FROM vw_available_players`),
    query<CountRow[]>(
      `SELECT COUNT(DISTINCT player_id) AS count FROM injury WHERE status IN ('ACTIVE','RECOVERING')`
    ),
    query<CountRow[]>(`SELECT COUNT(*) AS count FROM shortlist`),
    query<CountRow[]>(`SELECT COUNT(*) AS count FROM scout_report`),

    query<RecentReportRow[]>(
      `SELECT r.report_id, r.player_id,
              CONCAT(p.first_name, ' ', p.last_name) AS player_name,
              u.full_name AS scout_name, r.overall_rating, r.recommendation, r.created_at
       FROM scout_report r
       INNER JOIN player p ON p.player_id = r.player_id
       INNER JOIN \`user\` u ON u.user_id = r.scout_user_id
       ORDER BY r.created_at DESC
       LIMIT 5`
    ),

    query<RecentShortlistRow[]>(
      `SELECT s.shortlist_id, s.player_id,
              CONCAT(p.first_name, ' ', p.last_name) AS player_name,
              s.priority, s.status, s.created_at
       FROM shortlist s
       INNER JOIN player p ON p.player_id = s.player_id
       ORDER BY s.created_at DESC
       LIMIT 5`
    ),

    query<ContractExpiryRow[]>(
      `SELECT player_id, CONCAT(first_name, ' ', last_name) AS player_name,
              club_name, end_date, months_remaining
       FROM vw_contract_expiry
       WHERE months_remaining <= 18
       ORDER BY end_date ASC
       LIMIT 5`
    ),

    query<InjuredShortlistRow[]>(
      `SELECT s.player_id, CONCAT(p.first_name, ' ', p.last_name) AS player_name,
              s.status AS shortlist_status, i.injury_type, i.expected_return_date
       FROM shortlist s
       INNER JOIN player p ON p.player_id = s.player_id
       INNER JOIN injury i ON i.player_id = s.player_id AND i.status IN ('ACTIVE','RECOVERING')
       GROUP BY s.player_id, p.first_name, p.last_name, s.status, i.injury_type, i.expected_return_date
       ORDER BY i.expected_return_date ASC
       LIMIT 5`
    ),

    query<TopTargetRow[]>(
      `SELECT r.player_id, CONCAT(p.first_name, ' ', p.last_name) AS player_name,
              AVG(r.overall_rating) AS avg_rating, COUNT(*) AS report_count
       FROM scout_report r
       INNER JOIN player p ON p.player_id = r.player_id
       GROUP BY r.player_id, p.first_name, p.last_name
       HAVING COUNT(*) >= 1
       ORDER BY avg_rating DESC
       LIMIT 5`
    ),
  ]);

  return {
    cards: {
      playersTracked: playersTracked[0].count,
      availablePlayers: availablePlayers[0].count,
      currentlyInjured: currentlyInjured[0].count,
      shortlisted: shortlistedCount[0].count,
      scoutReports: scoutReportCount[0].count,
    },
    recentReports,
    recentShortlisted,
    contractExpiries,
    injuredShortlisted,
    topTargets,
  };
}
