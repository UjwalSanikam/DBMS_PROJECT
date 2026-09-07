import Link from "next/link";
import PlayerAvatar from "@/components/player-avatar";
import { getSession } from "@/lib/session";
import { getDashboardSummary } from "@/lib/dashboard";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STAT_META = [
  { key: "playersTracked", label: "Players tracked", detail: "Global database", tone: "text-sky-300", dot: "bg-sky-300" },
  { key: "availablePlayers", label: "Match ready", detail: "Available now", tone: "text-accent", dot: "bg-accent" },
  { key: "currentlyInjured", label: "In recovery", detail: "Active injuries", tone: "text-danger", dot: "bg-danger" },
  { key: "shortlisted", label: "On shortlist", detail: "Priority targets", tone: "text-warning", dot: "bg-warning" },
  { key: "scoutReports", label: "Scout reports", detail: "Knowledge base", tone: "text-violet-300", dot: "bg-violet-300" },
] as const;

const recommendationTone: Record<string, string> = {
  PRIORITY: "border-accent/20 bg-accent/10 text-accent",
  SHORTLIST: "border-sky-300/20 bg-sky-300/10 text-sky-300",
  MONITOR: "border-warning/20 bg-warning/10 text-warning",
  AVOID: "border-danger/20 bg-danger/10 text-danger",
};

export default async function DashboardPage() {
  const [session, summary] = await Promise.all([getSession(), getDashboardSummary()]);
  const firstName = session?.fullName.split(" ")[0] ?? "Scout";
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_rgba(61,220,132,0.8)]" />
            Live recruitment overview
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Good evening, {firstName}.
          </h1>
          <p className="mt-2 text-sm text-text-muted">{today} · Your scouting operation at a glance</p>
        </div>
        <div className="flex gap-2">
          <Link href="/compare" className="rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-white/[0.07]">
            Compare players
          </Link>
          <Link href="/players" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-pitch-950 shadow-[0_10px_30px_rgba(61,220,132,0.18)] transition hover:-translate-y-0.5 hover:bg-[#55e596]">
            Find a player
          </Link>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="Recruitment metrics">
        {STAT_META.map((meta) => (
          <div key={meta.key} className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-surface/80 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.12)] backdrop-blur transition hover:-translate-y-0.5 hover:border-white/[0.13] hover:bg-surface-raised/80 sm:p-5">
            <div className="flex items-start justify-between">
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-faint">2025/26</span>
            </div>
            <p className={`stat-figure mt-5 text-3xl font-semibold tracking-tight ${meta.tone}`}>
              {summary.cards[meta.key]}
            </p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{meta.label}</p>
            <p className="mt-0.5 text-[11px] text-text-muted">{meta.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.75fr)]">
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-surface/80 shadow-[0_20px_70px_rgba(0,0,0,0.16)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Latest scout intelligence</h2>
              <p className="mt-0.5 text-xs text-text-muted">Recent reports from across the network</p>
            </div>
            <Link href="/reports" className="text-xs font-semibold text-accent hover:text-white">View all →</Link>
          </div>
          <div className="divide-y divide-white/[0.055]">
            {summary.recentReports.length === 0 && <p className="px-6 py-8 text-sm text-text-muted">No reports yet.</p>}
            {summary.recentReports.map((report) => (
              <Link key={report.report_id} href={`/players/${report.player_id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.035] sm:px-6">
                <PlayerAvatar playerId={report.player_id} className="w-11" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{report.player_name}</p>
                  <p className="mt-0.5 truncate text-xs text-text-muted">Scouted by {report.scout_name}</p>
                </div>
                <span className={`hidden rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide sm:inline-flex ${recommendationTone[report.recommendation] ?? "border-white/10 text-text-muted"}`}>
                  {report.recommendation}
                </span>
                <div className="w-12 text-right">
                  <p className="stat-figure text-lg font-semibold text-white">{Number(report.overall_rating).toFixed(1)}</p>
                  <p className="text-[9px] uppercase tracking-wider text-text-faint">rating</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-surface/80 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.16)] backdrop-blur sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Top targets</h2>
              <p className="mt-0.5 text-xs text-text-muted">Ranked by scout rating</p>
            </div>
            <span className="rounded-lg bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">Live</span>
          </div>
          <ol className="mt-5 space-y-4">
            {summary.topTargets.map((target, index) => (
              <li key={target.player_id}>
                <Link href={`/players/${target.player_id}`} className="group flex items-center gap-3">
                  <span className="stat-figure w-4 text-xs text-text-faint">{String(index + 1).padStart(2, "0")}</span>
                  <PlayerAvatar playerId={target.player_id} className="w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary transition group-hover:text-accent">{target.player_name}</p>
                    <p className="text-[11px] text-text-muted">{target.report_count} verified report{target.report_count === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/[0.07]">
                    <span className="stat-figure text-xs font-bold text-accent">{Number(target.avg_rating).toFixed(1)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-danger/20 bg-[linear-gradient(135deg,rgba(226,76,76,0.10),rgba(18,27,46,0.85)_55%)] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.12)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-danger">Medical flag</p>
              <h2 className="mt-1 font-display text-lg font-semibold text-white">Injured shortlist players</h2>
            </div>
            <span className="stat-figure rounded-xl border border-danger/20 bg-danger/10 px-3 py-1.5 text-sm font-bold text-danger">{summary.injuredShortlisted.length}</span>
          </div>
          <div className="mt-4 space-y-2">
            {summary.injuredShortlisted.length === 0 && <p className="text-sm text-text-muted">No medical conflicts on the shortlist.</p>}
            {summary.injuredShortlisted.map((row) => (
              <Link key={row.player_id} href={`/players/${row.player_id}`} className="flex items-center gap-3 rounded-xl border border-white/[0.055] bg-pitch-950/35 p-3 transition hover:border-danger/25 hover:bg-pitch-950/60">
                <PlayerAvatar playerId={row.player_id} className="w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{row.player_name}</p>
                  <p className="truncate text-xs text-text-muted">{row.injury_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-text-faint">Expected</p>
                  <p className="mt-0.5 text-xs font-medium text-danger">{formatDate(row.expected_return_date)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-surface/80 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.12)] backdrop-blur sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warning">Opportunity window</p>
              <h2 className="mt-1 font-display text-lg font-semibold text-white">Contracts approaching expiry</h2>
            </div>
            <Link href="/players" className="text-xs font-semibold text-accent hover:text-white">Explore →</Link>
          </div>
          <div className="mt-4 divide-y divide-white/[0.055]">
            {summary.contractExpiries.length === 0 && <p className="py-4 text-sm text-text-muted">No contracts expiring soon.</p>}
            {summary.contractExpiries.map((contract) => (
              <Link key={contract.player_id} href={`/players/${contract.player_id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <PlayerAvatar playerId={contract.player_id} className="w-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{contract.player_name}</p>
                  <p className="truncate text-[11px] text-text-muted">{contract.club_name}</p>
                </div>
                <div className="text-right">
                  <p className="stat-figure text-sm font-semibold text-warning">{contract.months_remaining} mo</p>
                  <p className="text-[10px] text-text-faint">{formatDate(contract.end_date)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
