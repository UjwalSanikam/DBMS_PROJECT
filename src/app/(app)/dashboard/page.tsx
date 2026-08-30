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

export default async function DashboardPage() {
  const [session, summary] = await Promise.all([
    getSession(),
    getDashboardSummary(),
  ]);

  const STAT_CARDS = [
    { label: "Players tracked", value: summary.cards.playersTracked },
    { label: "Available players", value: summary.cards.availablePlayers },
    { label: "Currently injured", value: summary.cards.currentlyInjured },
    { label: "Shortlisted", value: summary.cards.shortlisted },
    { label: "Scout reports", value: summary.cards.scoutReports },
  ];

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        Overview
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold">
        Welcome back{session ? `, ${session.fullName.split(" ")[0]}` : ""}
      </h1>
      <p className="mt-1.5 text-sm text-text-muted max-w-xl">
        A snapshot of your club&apos;s recruitment activity.
      </p>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border-soft bg-surface p-4"
          >
            <p className="stat-figure text-2xl font-semibold text-text-primary">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-text-muted">{card.label}</p>
          </div>
        ))}
      </div>

      {summary.injuredShortlisted.length > 0 && (
        <div className="mt-8 rounded-lg border border-danger/40 bg-danger-soft p-4">
          <h2 className="font-display text-sm font-semibold text-danger">
            ⚠ Shortlisted players currently injured
          </h2>
          <ul className="mt-3 space-y-2">
            {summary.injuredShortlisted.map((row) => (
              <li key={row.player_id} className="text-sm text-text-primary">
                <span className="font-medium">{row.player_name}</span>
                <span className="text-text-muted">
                  {" "}
                  — {row.injury_type}, expected return{" "}
                  {formatDate(row.expected_return_date)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border-soft bg-surface p-5">
          <h2 className="font-display text-base font-semibold">
            Recent scout reports
          </h2>
          <ul className="mt-4 space-y-3">
            {summary.recentReports.length === 0 && (
              <li className="text-sm text-text-muted">No reports yet.</li>
            )}
            {summary.recentReports.map((r) => (
              <li
                key={r.report_id}
                className="flex items-center justify-between border-b border-border-soft pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {r.player_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    by {r.scout_name} · {r.recommendation}
                  </p>
                </div>
                <span className="stat-figure rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                  {r.overall_rating}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border-soft bg-surface p-5">
          <h2 className="font-display text-base font-semibold">
            Recently shortlisted
          </h2>
          <ul className="mt-4 space-y-3">
            {summary.recentShortlisted.length === 0 && (
              <li className="text-sm text-text-muted">
                No shortlist entries yet.
              </li>
            )}
            {summary.recentShortlisted.map((s) => (
              <li
                key={s.shortlist_id}
                className="flex items-center justify-between border-b border-border-soft pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {s.player_name}
                  </p>
                  <p className="text-xs text-text-muted">{s.status}</p>
                </div>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                  {s.priority}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border-soft bg-surface p-5">
          <h2 className="font-display text-base font-semibold">
            Contract expiries
          </h2>
          <ul className="mt-4 space-y-3">
            {summary.contractExpiries.length === 0 && (
              <li className="text-sm text-text-muted">
                No contracts expiring soon.
              </li>
            )}
            {summary.contractExpiries.map((c) => (
              <li
                key={c.player_id}
                className="flex items-center justify-between border-b border-border-soft pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {c.player_name}
                  </p>
                  <p className="text-xs text-text-muted">{c.club_name}</p>
                </div>
                <span className="stat-figure text-xs text-text-muted">
                  {c.months_remaining} mo · {formatDate(c.end_date)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border-soft bg-surface p-5">
          <h2 className="font-display text-base font-semibold">
            Highest-rated targets
          </h2>
          <ul className="mt-4 space-y-3">
            {summary.topTargets.length === 0 && (
              <li className="text-sm text-text-muted">No ratings yet.</li>
            )}
            {summary.topTargets.map((t) => (
              <li
                key={t.player_id}
                className="flex items-center justify-between border-b border-border-soft pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {t.player_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {t.report_count} report{t.report_count === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="stat-figure rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                  {Number(t.avg_rating).toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}