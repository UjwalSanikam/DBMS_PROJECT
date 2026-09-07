import { notFound } from "next/navigation";
import { getFullPlayerDetail } from "@/lib/player-detail";
import PlayerAvatar from "@/components/player-avatar";
import SimilarPlayers from "./similar-players";

function calculateAge(dob: string): number {
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function formatCurrency(value: string | null): string {
  if (!value) return "—";
  const num = Number(value);
  if (num >= 1_000_000) return `€${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `€${(num / 1_000).toFixed(0)}K`;
  return `€${num.toFixed(0)}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const playerId = Number(id);
  if (!Number.isInteger(playerId)) notFound();

  const detail = await getFullPlayerDetail(playerId);
  if (!detail) notFound();

  const { player, latestSeasonStats, injuries, transfers, valuations, reports } =
    detail;

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[radial-gradient(circle_at_85%_20%,rgba(61,220,132,0.13),transparent_35%),linear-gradient(135deg,rgba(23,35,59,0.96),rgba(7,12,22,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-7">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <PlayerAvatar
          playerId={player.player_id}
          photoUrl={player.photo_url}
          firstName={player.first_name}
          lastName={player.last_name}
          className="w-28 rounded-2xl border border-white/10 shadow-2xl sm:w-32"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Player intelligence profile</p>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${player.availability === "AVAILABLE" ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"}`}>
              {player.availability}
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {player.first_name} {player.last_name}
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            <span className="font-semibold text-text-primary">{player.primary_position}
            {player.secondary_position ? ` / ${player.secondary_position}` : ""} ·{" "}
            </span>{player.club_name ?? "Free agent"} · {player.league_name ?? "—"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5">{player.nationality}</span>
            <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5">{calculateAge(player.date_of_birth)} years</span>
            <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5">{player.preferred_foot} foot</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-52">
          <div className="rounded-xl border border-white/[0.08] bg-pitch-950/40 p-3 text-center"><p className="stat-figure text-lg font-semibold text-white">{formatCurrency(player.market_value)}</p><p className="text-[9px] uppercase tracking-wider text-text-faint">Market value</p></div>
          <div className="rounded-xl border border-white/[0.08] bg-pitch-950/40 p-3 text-center"><p className="stat-figure text-lg font-semibold text-white">{latestSeasonStats?.appearances ?? "—"}</p><p className="text-[9px] uppercase tracking-wider text-text-faint">Apps</p></div>
        </div>
        </div>
      </div>


      {/* Overview + Fitness */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border-soft bg-surface p-5">
          <h2 className="font-display text-sm font-semibold">Overview</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Age</dt>
              <dd>{calculateAge(player.date_of_birth)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Nationality</dt>
              <dd>{player.nationality}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Preferred foot</dt>
              <dd>{player.preferred_foot}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Height</dt>
              <dd>{player.height_cm ? `${player.height_cm} cm` : "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-border-soft bg-surface p-5">
          <h2 className="font-display text-sm font-semibold">Fitness</h2>
          <div className="mt-3">
            {player.availability === "AVAILABLE" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                🟢 AVAILABLE
              </span>
            ) : (
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">
                  🔴 INJURED
                </span>
                <p className="mt-2 text-sm text-text-primary">
                  {player.injury_type}
                </p>
                <p className="text-xs text-text-muted">
                  Expected return: {formatDate(player.expected_return_date)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border-soft bg-surface p-5">
          <h2 className="font-display text-sm font-semibold">Contract</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Market value</dt>
              <dd>{formatCurrency(player.market_value)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Contract expiry</dt>
              <dd>{formatDate(player.contract_end)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Performance */}
      {latestSeasonStats && (
        <div className="mt-6 rounded-lg border border-border-soft bg-surface p-5">
          <h2 className="font-display text-sm font-semibold">
            Performance — {latestSeasonStats.season}
          </h2>
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4 text-center">
            {[
              ["Apps", latestSeasonStats.appearances],
              ["Goals", latestSeasonStats.goals],
              ["Assists", latestSeasonStats.assists],
              ["xG", latestSeasonStats.xg],
              ["xA", latestSeasonStats.xa],
              ["Shots", latestSeasonStats.shots],
              ["Key passes", latestSeasonStats.key_passes],
              ["Pass acc.", `${latestSeasonStats.pass_accuracy}%`],
              ["Tackles", latestSeasonStats.tackles],
              ["Interceptions", latestSeasonStats.interceptions],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="stat-figure text-lg font-semibold text-text-primary">
                  {value}
                </p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Injury history */}
      <div className="mt-6 rounded-lg border border-border-soft bg-surface p-5">
        <h2 className="font-display text-sm font-semibold">Injury history</h2>
        {injuries.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No injuries on record.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="py-2 font-medium">Injury</th>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Return</th>
                <th className="py-2 font-medium">Severity</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {injuries.map((inj) => (
                <tr key={inj.injury_id} className="border-b border-border-soft last:border-0">
                  <td className="py-2">
                    {inj.injury_type} ({inj.body_area})
                  </td>
                  <td className="py-2 text-text-muted">{formatDate(inj.injury_date)}</td>
                  <td className="py-2 text-text-muted">
                    {formatDate(inj.actual_return_date ?? inj.expected_return_date)}
                  </td>
                  <td className="py-2 text-text-muted">{inj.severity}</td>
                  <td className="py-2 text-text-muted">{inj.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Market value history */}
      <div className="mt-6 rounded-lg border border-border-soft bg-surface p-5">
        <h2 className="font-display text-sm font-semibold">Market value history</h2>
        {valuations.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No valuations on record.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-3">
            {valuations.map((v) => (
              <li
                key={v.valuation_id}
                className="rounded-md border border-border-soft px-3 py-2 text-sm"
              >
                <span className="text-text-muted">{formatDate(v.valuation_date)}</span>{" "}
                <span className="font-medium text-text-primary">
                  {formatCurrency(v.market_value)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Transfers */}
      <div className="mt-6 rounded-lg border border-border-soft bg-surface p-5">
        <h2 className="font-display text-sm font-semibold">Transfer history</h2>
        {transfers.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No transfers on record.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {transfers.map((t) => (
              <li key={t.transfer_id} className="flex items-center justify-between border-b border-border-soft pb-2 last:border-0">
                <span>
                  {t.from_club_name ?? "Free agent"} → {t.to_club_name ?? "Free agent"}
                </span>
                <span className="text-text-muted">
                  {formatDate(t.transfer_date)} · {formatCurrency(t.transfer_fee)} ·{" "}
                  {t.transfer_type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Scout reports */}
      <div className="mt-6 rounded-lg border border-border-soft bg-surface p-5">
        <h2 className="font-display text-sm font-semibold">Scout reports</h2>
        {reports.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No scout reports yet.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {reports.map((r) => (
              <li key={r.report_id} className="border-b border-border-soft pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">{r.scout_name}</p>
                  <span className="stat-figure rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                    {r.overall_rating} · {r.recommendation}
                  </span>
                </div>
                {r.strengths && (
                  <p className="mt-1 text-xs text-text-muted">Strengths: {r.strengths}</p>
                )}
                {r.weaknesses && (
                  <p className="text-xs text-text-muted">Weaknesses: {r.weaknesses}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Similar players (client component, on-demand) */}
      <div className="mt-6 rounded-lg border border-border-soft bg-surface p-5">
        <h2 className="font-display text-sm font-semibold">Similar players</h2>
        <SimilarPlayers playerId={player.player_id} />
      </div>
    </div>
  );
}
