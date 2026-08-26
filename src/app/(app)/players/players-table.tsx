"use client";

import { useEffect, useState, useCallback } from "react";

interface Player {
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
}

const POSITIONS = [
  "GK", "CB", "LB", "RB", "LWB", "RWB", "DM", "CM", "AM", "LW", "RW", "ST",
];

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export default function PlayersTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [nationality, setNationality] = useState("");

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (name) params.set("name", name);
      if (position) params.set("position", position);
      if (nationality) params.set("nationality", nationality);

      const res = await fetch(`/api/players?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not load players.");
        return;
      }
      setPlayers(data.players);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }, [name, position, nationality]);

  useEffect(() => {
    // Fetching initial data on mount is the intended use of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchPlayers();
  }

  return (
    <div>
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-wrap gap-3 rounded-lg border border-border-soft bg-surface p-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Search by name…"
          className="flex-1 min-w-[180px] rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        >
          <option value="">Any position</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder="Nationality…"
          className="w-40 rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-pitch-950 transition hover:opacity-90"
        >
          Search
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="mt-4 rounded-lg border border-border-soft bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3 font-medium">Player</th>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium">Nationality</th>
              <th className="px-4 py-3 font-medium">Club</th>
              <th className="px-4 py-3 font-medium">League</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  Loading players…
                </td>
              </tr>
            )}
            {!loading && players.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  No players match that search.
                </td>
              </tr>
            )}
            {!loading &&
              players.map((p) => (
                <tr
                  key={p.player_id}
                  className="border-b border-border-soft last:border-0 hover:bg-surface-raised transition"
                >
                  <td className="px-4 py-3 text-text-primary font-medium">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="px-4 py-3 stat-figure text-text-muted">
                    {calculateAge(p.date_of_birth)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                      {p.primary_position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{p.nationality}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {p.club_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {p.league_name ?? "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
