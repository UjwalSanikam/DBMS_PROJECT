"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PlayerAvatar from "@/components/player-avatar";

interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  primary_position: string;
  preferred_foot: string;
  height_cm: number | null;
  photo_url: string | null;
  club_name: string | null;
  league_name: string | null;
  market_value: string | null;
  contract_end: string | null;
  availability: "AVAILABLE" | "INJURED";
  goals: number | null;
  assists: number | null;
}

const POSITIONS = ["GK", "CB", "LB", "RB", "LWB", "RWB", "DM", "CM", "AM", "LW", "RW", "ST"];

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
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
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [nationality, setNationality] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [minGoals, setMinGoals] = useState("");
  const [minAssists, setMinAssists] = useState("");
  const [minAppearances, setMinAppearances] = useState("");
  const [minPassAccuracy, setMinPassAccuracy] = useState("");
  const [maxMarketValue, setMaxMarketValue] = useState("");
  const [maxContractMonths, setMaxContractMonths] = useState("");
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
  }, [name, position, nationality, ageMin, ageMax, minGoals, minAssists, minAppearances, minPassAccuracy, maxMarketValue, maxContractMonths, availableOnly]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearAll() {
    setName("");
    setPosition("");
    setNationality("");
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

  const inputClass = "rounded-xl border border-white/[0.08] bg-pitch-950/65 px-3.5 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-faint hover:border-white/[0.13] focus:border-accent/60 focus:ring-2 focus:ring-accent/10";

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          fetchPlayers();
        }}
        className="rounded-2xl border border-white/[0.07] bg-surface/80 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.14)] backdrop-blur sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search by player name</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
            </svg>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Search player name…" className={`w-full pl-10 ${inputClass}`} />
          </label>
          <select aria-label="Filter by position" value={position} onChange={(event) => setPosition(event.target.value)} className={`lg:w-44 ${inputClass}`}>
            <option value="">All positions</option>
            {POSITIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input aria-label="Filter by nationality" value={nationality} onChange={(event) => setNationality(event.target.value)} placeholder="Nationality" className={`lg:w-44 ${inputClass}`} />
          <button type="submit" className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-pitch-950 shadow-[0_10px_25px_rgba(61,220,132,0.16)] transition hover:bg-[#55e596]">Search database</button>
          <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="rounded-xl border border-white/[0.09] px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-white/[0.05]">
            {showAdvanced ? "Less filters" : "More filters"}
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-5 grid gap-5 border-t border-white/[0.06] pt-5 md:grid-cols-2 xl:grid-cols-4">
            <FilterGroup label="Profile">
              <input type="number" value={ageMin} onChange={(event) => setAgeMin(event.target.value)} placeholder="Min age" className={`min-w-0 flex-1 ${inputClass}`} />
              <input type="number" value={ageMax} onChange={(event) => setAgeMax(event.target.value)} placeholder="Max age" className={`min-w-0 flex-1 ${inputClass}`} />
            </FilterGroup>
            <FilterGroup label="Performance">
              <input type="number" value={minGoals} onChange={(event) => setMinGoals(event.target.value)} placeholder="Min goals" className={`min-w-0 flex-1 ${inputClass}`} />
              <input type="number" value={minAssists} onChange={(event) => setMinAssists(event.target.value)} placeholder="Min assists" className={`min-w-0 flex-1 ${inputClass}`} />
            </FilterGroup>
            <FilterGroup label="Playing time">
              <input type="number" value={minAppearances} onChange={(event) => setMinAppearances(event.target.value)} placeholder="Min apps" className={`min-w-0 flex-1 ${inputClass}`} />
              <input type="number" value={minPassAccuracy} onChange={(event) => setMinPassAccuracy(event.target.value)} placeholder="Pass %" className={`min-w-0 flex-1 ${inputClass}`} />
            </FilterGroup>
            <FilterGroup label="Recruitment">
              <input type="number" value={maxMarketValue} onChange={(event) => setMaxMarketValue(event.target.value)} placeholder="Max value €" className={`min-w-0 flex-1 ${inputClass}`} />
              <input type="number" value={maxContractMonths} onChange={(event) => setMaxContractMonths(event.target.value)} placeholder="Expiry mo." className={`min-w-0 flex-1 ${inputClass}`} />
            </FilterGroup>
            <div className="flex flex-wrap items-center gap-4 md:col-span-2 xl:col-span-4">
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} className="h-4 w-4 accent-[#3ddc84]" />
                Available players only
              </label>
              <button type="button" onClick={clearAll} className="text-xs font-semibold text-text-muted hover:text-white">Clear all filters</button>
            </div>
          </div>
        )}
      </form>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-text-muted"><span className="stat-figure font-semibold text-text-primary">{loading ? "—" : players.length}</span> players found</p>
        <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-text-faint sm:block">2025/26 performance data</p>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-52 animate-pulse rounded-2xl border border-white/[0.05] bg-surface/60" />)}
        </div>
      ) : players.length === 0 && !error ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/[0.1] bg-surface/40 py-16 text-center">
          <p className="font-display text-lg font-semibold text-text-primary">No matching players</p>
          <p className="mt-1 text-sm text-text-muted">Try widening your filters.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {players.map((player) => (
            <Link key={player.player_id} href={`/players/${player.player_id}`} className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-surface/80 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.12)] transition hover:-translate-y-1 hover:border-accent/25 hover:bg-surface-raised/90 hover:shadow-[0_22px_60px_rgba(0,0,0,0.22)]">
              <div className="flex items-start gap-3.5">
                <PlayerAvatar playerId={player.player_id} firstName={player.first_name} lastName={player.last_name} photoUrl={player.photo_url} className="w-[72px] rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-base font-semibold text-white transition group-hover:text-accent">{player.first_name} {player.last_name}</h2>
                      <p className="mt-1 truncate text-xs text-text-muted">{player.club_name ?? "Free agent"}</p>
                    </div>
                    <span className="rounded-lg border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">{player.primary_position}</span>
                  </div>
                  <p className="mt-3 text-[11px] text-text-faint">{player.nationality} · {calculateAge(player.date_of_birth)} yrs</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 divide-x divide-white/[0.06] rounded-xl bg-pitch-950/45 py-2.5 text-center">
                <div><p className="stat-figure text-sm font-semibold text-white">{player.goals ?? "—"}</p><p className="text-[9px] uppercase tracking-wider text-text-faint">Goals</p></div>
                <div><p className="stat-figure text-sm font-semibold text-white">{player.assists ?? "—"}</p><p className="text-[9px] uppercase tracking-wider text-text-faint">Assists</p></div>
                <div><p className="stat-figure text-sm font-semibold text-white">{formatCurrency(player.market_value)}</p><p className="text-[9px] uppercase tracking-wider text-text-faint">Value</p></div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${player.availability === "AVAILABLE" ? "text-accent" : "text-danger"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${player.availability === "AVAILABLE" ? "bg-accent" : "bg-danger"}`} />
                  {player.availability === "AVAILABLE" ? "Available" : "Injured"}
                </span>
                <span className="text-[11px] font-semibold text-text-muted transition group-hover:text-white">Open profile →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-faint">{label}</p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
