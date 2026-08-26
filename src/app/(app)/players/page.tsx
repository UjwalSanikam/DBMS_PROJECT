import PlayersTable from "./players-table";

export default function PlayersPage() {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        Recruitment intelligence
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold">Players</h1>
      <p className="mt-1.5 text-sm text-text-muted max-w-xl">
        Search the player database by name, position, or nationality.
      </p>

      <div className="mt-8">
        <PlayersTable />
      </div>
    </div>
  );
}
