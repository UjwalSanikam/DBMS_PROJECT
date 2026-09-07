import PlayersTable from "./players-table";

export default function PlayersPage() {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_rgba(61,220,132,0.8)]" />
            Recruitment intelligence
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Player database</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Discover targets using performance, availability, contract, and market-value signals.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-faint">
          <span className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5">40 profiles</span>
          <span className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5">10 clubs</span>
          <span className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5">5 leagues</span>
        </div>
      </div>

      <div className="mt-7">
        <PlayersTable />
      </div>
    </div>
  );
}
