"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  market_value: string | null;
  contract_end: string | null;
  availability: "AVAILABLE" | "INJURED";
  goals: number | null;
  assists: number | null;
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

function formatCurrency(value: string | null): string {
  if (!value) return "—";
  const num = Number(value);
  if (num >= 1_000_000) return `€${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `€${(num / 1_000).toFixed(0)}K`;
  return `€${num.toFixed(0)}`;
}

export default function PlayersTable() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Basic
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [nationality, setNationality] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");

  // Performance
  const [minGoals, setMinGoals] = useState("");
  const [minAssists, setMinAssists] = useState("");
  const [minAppearances, setMinAppearances] = useState("");
  const [minPassAccuracy, setMinPassAccuracy] = useState("");

  // Recruitment
  const [maxMarketValue, setMaxMarketValue] = useState("");
  const [maxContractMonths, setMaxContractMonths] = useState("");

  // Fitness
  const [availableOnly, setAvailableOnly] = useState(false);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (name) params.set("name", name);
      if (position) params.set("position", position);
      if (nationality) params.set("nationality", nationality);
      if (ageMin) params.set("ageMin", ageMin);
      if (ageMax) params.set("ageMax", ageMax);
      if (minGoals) params.set("minGoals", minGoals);
      if (minAssists) params.set("minAssists", minAssists);
      if (minAppearances) params.set("minAppearances", minAppearances);
      if (minPassAccuracy) params.set("minPassAccuracy", minPassAccuracy);
      if (maxMarketValue) params.set("maxMarketValue", maxMarketValue);
      if (maxContractMonths) params.set("maxContractMonths", maxContractMonths);
      if (availableOnly) params.set("availableOnly", "true");

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
  }, [
    name, position, nationality, ageMin, ageMax,
    minGoals, minAssists, minAppearances, minPassAccuracy,
    maxMarketValue, maxContractMonths, availableOnly,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchPlayers();
  }

  function handleClearAdvanced() {
    setAgeMin("");
    setAgeMax("");
    setMinGoals("");
    setMinAssists("");
    setMinAppearances("");
    setMinPassAccuracy("");
    setMaxMarketValue("");
    setMaxContractMonths("");
    setAvailableOnly(false);
  }

  const inputClass =
    "rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";

  return (
    <div>
      <form
        onSubmit={handleSearchSubmit}
        className="rounded-lg border border-border-soft bg-surface p-4"
      >
        <div className="flex flex-wrap gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search by name…"
            className={`flex-1 min-w-[180px] ${inputClass}`}
          />
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className={inputClass}
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
            className={`w-40 ${inputClass}`}
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-pitch-950 transition hover:opacity-90"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="rounded-md border border-border-soft px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-surface-raised"
          >
            {showAdvanced ? "Hide advanced filters" : "Advanced filters"}
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-4 border-t border-border-soft pt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                Basic
              </p>
              <div className="flex flex-wrap gap-3">
                <input
                  type="number"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  placeholder="Age min"
                  className={`w-28 ${inputClass}`}
                />
                <input
                  type="number"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  placeholder="Age max"
                  className={`w-28 ${inputClass}`}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                Performance
              </p>
              <div className="flex flex-wrap gap-3">
                <input
                  type="number"
                  value={minGoals}
                  onChange={(e) => setMinGoals(e.target.value)}
                  placeholder="Min goals"
                  className={`w-32 ${inputClass}`}
                />
                <input
                  type="number"
                  value={minAssists}
                  onChange={(e) => setMinAssists(e.target.value)}
                  placeholder="Min assists"
                  className={`w-32 ${inputClass}`}
                />
                <input
                  type="number"
                  value={minAppearances}
                  onChange={(e) => setMinAppearances(e.target.value)}
                  placeholder="Min appearances"
                  className={`w-36 ${inputClass}`}
                />
                <input
                  type="number"
                  value={minPassAccuracy}
                  onChange={(e) => setMinPassAccuracy(e.target.value)}
                  placeholder="Min pass accuracy %"
                  className={`w-40 ${inputClass}`}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                Recruitment
              </p>
              <div className="flex flex-wrap gap-3">
                <input
                  type="number"
                  value={maxMarketValue}
                  onChange={(e) => setMaxMarketValue(e.target.value)}
                  placeholder="Max market value (€)"
                  className={`w-48 ${inputClass}`}
                />
                <input
                  type="number"
                  value={maxContractMonths}
                  onChange={(e) => setMaxContractMonths(e.target.value)}
                  placeholder="Contract expires within (months)"
                  className={`w-56 ${inputClass}`}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                Fitness
              </p>
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                />
                Available only
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-pitch-950 transition hover:opacity-90"
              >
                Apply filters
              </button>
              <button
                type="button"
                onClick={handleClearAdvanced}
                className="rounded-md border border-border-soft px-4 py-2 text-sm text-text-muted transition hover:bg-surface-raised"
              >
                Clear advanced filters
              </button>
            </div>
          </div>
        )}
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="mt-4 rounded-lg border border-border-soft bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3 font-medium">Player</th>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium">Nationality</th>
              <th className="px-4 py-3 font-medium">Club</th>
              <th className="px-4 py-3 font-medium">Goals</th>
              <th className="px-4 py-3 font-medium">Assists</th>
              <th className="px-4 py-3 font-medium">Market value</th>
              <th className="px-4 py-3 font-medium">Fitness</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-text-muted">
                  Loading players…
                </td>
              </tr>
            )}
            {!loading && players.length === 0 && !error && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-text-muted">
                  No players match that search.
                </td>
              </tr>
            )}
            {!loading &&
              players.map((p) => (
                <tr
                  key={p.player_id}
                  className="border-b border-border-soft last:border-0 hover:bg-surface-raised transition cursor-pointer"
                  onClick={() => router.push(`/players/${p.player_id}`)}
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
                  <td className="px-4 py-3 text-text-muted">{p.club_name ?? "—"}</td>
                  <td className="px-4 py-3 stat-figure text-text-muted">{p.goals ?? "—"}</td>
                  <td className="px-4 py-3 stat-figure text-text-muted">{p.assists ?? "—"}</td>
                  <td className="px-4 py-3 stat-figure text-text-muted">
                    {formatCurrency(p.market_value)}
                  </td>
                  <td className="px-4 py-3">
                    {p.availability === "AVAILABLE" ? (
                      <span className="text-success text-xs">🟢 Available</span>
                    ) : (
                      <span className="text-danger text-xs">🔴 Injured</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}