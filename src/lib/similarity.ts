import { query } from "@/lib/db";

// Players with fewer minutes than this are excluded from vector generation —
// per-90 stats are unreliable/noisy over very small sample sizes.
export const MIN_MINUTES_FOR_VECTOR = 450;

export interface PlayerStatsForVector {
  player_id: number;
  primary_position: string;
  club_id: number;
  season: string;
  minutes_played: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  shots: number;
  key_passes: number;
  progressive_passes: number;
  pass_accuracy: number;
  tackles: number;
  interceptions: number;
}

export interface RawFeatureVector {
  player_id: number;
  goals_per_90: number;
  assists_per_90: number;
  xg_per_90: number;
  xa_per_90: number;
  shots_per_90: number;
  key_passes_per_90: number;
  progressive_passes_per_90: number;
  pass_accuracy: number;
  tackles_per_90: number;
  interceptions_per_90: number;
}

function per90(total: number, minutes: number): number {
  return (total / minutes) * 90;
}

/**
 * Fetches every player's current-season stats and converts each to raw
 * (un-normalized) per-90 features. Players below MIN_MINUTES_FOR_VECTOR
 * are skipped — their playing sample is too small for per-90 to be
 * meaningful (see spec section 37).
 */
export async function buildRawFeatureVectors(
  season: string
): Promise<RawFeatureVector[]> {
    const rows = await query<PlayerStatsForVector[]>(
    `SELECT ps.player_id, p.primary_position, ps.club_id, ps.season, ps.minutes_played,
            ps.goals, ps.assists, ps.xg, ps.xa, ps.shots, ps.key_passes,
            ps.progressive_passes, ps.pass_accuracy, ps.tackles, ps.interceptions
     FROM player_statistics ps
     INNER JOIN player p ON p.player_id = ps.player_id
     WHERE ps.season = ? AND ps.minutes_played >= ?`,
    [season, MIN_MINUTES_FOR_VECTOR]
  );

    return rows.map((r) => {
    const minutes = Number(r.minutes_played);
    return {
      player_id: r.player_id,
      goals_per_90: per90(Number(r.goals), minutes),
      assists_per_90: per90(Number(r.assists), minutes),
      xg_per_90: per90(Number(r.xg), minutes),
      xa_per_90: per90(Number(r.xa), minutes),
      shots_per_90: per90(Number(r.shots), minutes),
      key_passes_per_90: per90(Number(r.key_passes), minutes),
      progressive_passes_per_90: per90(Number(r.progressive_passes), minutes),
      pass_accuracy: Number(r.pass_accuracy),
      tackles_per_90: per90(Number(r.tackles), minutes),
      interceptions_per_90: per90(Number(r.interceptions), minutes),
    };
  });
}

const FEATURE_KEYS: (keyof Omit<RawFeatureVector, "player_id">)[] = [
  "goals_per_90",
  "assists_per_90",
  "xg_per_90",
  "xa_per_90",
  "shots_per_90",
  "key_passes_per_90",
  "progressive_passes_per_90",
  "pass_accuracy",
  "tackles_per_90",
  "interceptions_per_90",
];

/**
 * Z-score normalization across the whole player pool, feature by feature.
 * Documented choice (spec section 15): z-score rather than min-max, because
 * per-90 stats can have long tails (a handful of prolific scorers), and
 * z-score is less distorted by outliers than min-max rescaling.
 */
export function normalizeFeatureVectors(
  raw: RawFeatureVector[]
): Map<number, number[]> {
  const means: Record<string, number> = {};
  const stdDevs: Record<string, number> = {};

  for (const key of FEATURE_KEYS) {
    const values = raw.map((r) => r[key]);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    means[key] = mean;
    stdDevs[key] = stdDev;
  }

  const result = new Map<number, number[]>();
  for (const r of raw) {
    const vector = FEATURE_KEYS.map((key) => {
      const stdDev = stdDevs[key];
      // Guard against a zero-variance feature (every player identical on
      // that stat) which would otherwise divide by zero.
      if (stdDev === 0) return 0;
      return (r[key] - means[key]) / stdDev;
    });
    result.set(r.player_id, vector);
  }

  return result;
}
