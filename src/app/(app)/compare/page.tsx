"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface PlayerOption {
  player_id: number;
  first_name: string;
  last_name: string;
  club_name: string | null;
}

interface ComparisonPlayer {
  player_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  primary_position: string;
  market_value: string | null;
  contract_end: string | null;
  availability: "AVAILABLE" | "INJURED";
  injury_count: number;
  days_missed: string;
  goals: number | null;
  assists: number | null;
  xg: string | null;
  xa: string | null;
  pass_accuracy: string | null;
  key_passes: number | null;
  tackles: number | null;
  interceptions: number | null;
  avg_scout_rating: string | null;
}

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

const ROWS: Array<{ label: string; render: (p: ComparisonPlayer) => string }> = [
  { label: "Age", render: (p) => String(calculateAge(p.date_of_birth)) },
  { label: "Position", render: (p) => p.primary_position },
  { label: "Market value", render: (p) => formatCurrency(p.market_value) },
  { label: "Contract expiry", render: (p) => formatDate(p.contract_end) },
  { label: "Availability", render: (p) => p.availability },
  { label: "Injuries", render: (p) => String(p.injury_count) },
  { label: "Days missed", render: (p) => String(p.days_missed) },
  { label: "Goals", render: (p) => String(p.goals ?? "—") },
  { label: "Assists", render: (p) => String(p.assists ?? "—") },
  { label: "xG", render: (p) => String(p.xg ?? "—") },
  { label: "xA", render: (p) => String(p.xa ?? "—") },
  { label: "Pass accuracy", render: (p) => (p.pass_accuracy ? `${p.pass_accuracy}%` : "—") },
  { label: "Key passes", render: (p) => String(p.key_passes ?? "—") },
  { label: "Tackles", render: (p) => String(p.tackles ?? "—") },
  { label: "Interceptions", render: (p) => String(p.interceptions ?? "—") },
  {
    label: "Scout rating",
    render: (p) => (p.avg_scout_rating ? Number(p.avg_scout_rating).toFixed(1) : "—"),
  },
];

export default function ComparePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<PlayerOption[]>([]);
  const [selected, setSelected] = useState<PlayerOption[]>([]);
  const [comparison, setComparison] = useState<ComparisonPlayer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setOptions([]);
      return;
    }
    const res = await fetch(`/api/players?name=${encodeURIComponent(term)}`);
    const data = await res.json();
    if (res.ok) setOptions(data.players);
  }, []);

  function addPlayer(p: PlayerOption) {
    if (selected.some((s) => s.player_id === p.player_id)) return;
    if (selected.length >= 3) return;
    setSelected([...selected, p]);
    setSearchTerm("");
    setOptions([]);
  }

  function removePlayer(playerId: number) {
    setSelected(selected.filter((s) => s.player_id !== playerId));
    setComparison(null);
  }

  async function handleCompare() {
    if (selected.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const ids = selected.map((s) => s.player_id).join(",");
      const res = await fetch(`/api/players/compare?ids=${ids}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not compare players.");
        return;
      }
      // Preserve the order the user selected them in.
      const ordered = selected
        .map((s) => data.players.find((p: ComparisonPlayer) => p.player_id === s.player_id))
        .filter(Boolean);
      setComparison(ordered);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        Recruitment intelligence
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold">Compare</h1>
      <p className="mt-1.5 text-sm text-text-muted max-w-xl">
        Pick 2–3 players to compare side by side.
      </p>

      <div className="mt-6 rounded-lg border border-border-soft bg-surface p-4">
        <div className="flex flex-wrap gap-2">
          {selected.map((p) => (
            <span
              key={p.player_id}
              className="flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent"
            >
              {p.first_name} {p.last_name}
              <button
                onClick={() => removePlayer(p.player_id)}
                className="text-accent hover:opacity-70"
                aria-label={`Remove ${p.first_name} ${p.last_name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {selected.length < 3 && (
          <div className="relative mt-3">
            <input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search players to add…"
              className="w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            {options.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-md border border-border-soft bg-surface shadow-lg max-h-56 overflow-y-auto">
                {options.map((p) => (
                  <li key={p.player_id}>
                    <button
                      onClick={() => addPlayer(p)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-surface-raised"
                    >
                      {p.first_name} {p.last_name}
                      <span className="ml-2 text-xs text-text-muted">
                        {p.club_name ?? "—"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={handleCompare}
          disabled={selected.length < 2 || loading}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-pitch-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Comparing…" : "Compare"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      {comparison && comparison.length > 0 && (
        <div className="mt-6 rounded-lg border border-border-soft bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-medium">Metric</th>
                {comparison.map((p) => (
                  <th key={p.player_id} className="px-4 py-3 font-medium">
                    <Link href={`/players/${p.player_id}`} className="hover:text-accent">
                      {p.first_name} {p.last_name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border-soft last:border-0">
                  <td className="px-4 py-2.5 text-text-muted">{row.label}</td>
                  {comparison.map((p) => (
                    <td key={p.player_id} className="px-4 py-2.5 stat-figure text-text-primary">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}