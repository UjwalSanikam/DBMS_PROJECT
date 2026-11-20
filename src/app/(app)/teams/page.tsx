"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PlayerAvatar from "@/components/player-avatar";
import { changeFormation, FORMATION_DESCRIPTIONS, FORMATION_NAMES, formationSlots, type FormationName, type SavedTeam, type TeamPlayer } from "@/lib/formations";

const field = "w-full rounded-xl border border-border bg-pitch-900 px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";
const secondary = "rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-white/5 disabled:opacity-40";
const positions = ["GK", "CB", "LB", "RB", "LWB", "RWB", "DM", "CM", "AM", "LW", "RW", "ST"];
const emptySquad = (): (TeamPlayer | null)[] => Array(18).fill(null);

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Could not complete the request.");
  return data;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<SavedTeam[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [formation, setFormation] = useState<FormationName>("4-3-3");
  const [squad, setSquad] = useState<(TeamPlayer | null)[]>(emptySquad);
  const [activeSlot, setActiveSlot] = useState(0);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [options, setOptions] = useState<TeamPlayer[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const pickerRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const slots = formationSlots(formation);
  const starters = squad.slice(0, 11).filter(Boolean).length;
  const substitutes = squad.slice(11).filter(Boolean).length;
  const activePlayer = squad[activeSlot];
  const activeRole = activeSlot < 11 ? slots[activeSlot].role : `Sub ${activeSlot - 10}`;

  useEffect(() => {
    let cancelled = false;
    requestJson("/api/teams").then((data) => {
      if (!cancelled) { setTeams(data.teams); setError(""); }
    }).catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoadingTeams(false); });
    return () => { cancelled = true; };
  }, [reload]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingPlayers(true);
      setSearchError("");
      try {
        const params = new URLSearchParams({ name: search, position });
        const data = await requestJson(`/api/teams/players?${params}`, { signal: controller.signal });
        if (!controller.signal.aborted) setOptions(data.players);
      } catch (err) {
        if (!controller.signal.aborted) { setOptions([]); setSearchError(err instanceof Error ? err.message : "Could not load players."); }
      } finally { if (!controller.signal.aborted) setLoadingPlayers(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, position, reload]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function markChanged() { setDirty(true); setNotice(""); }

  function retryLoading() { setLoadingTeams(true); setLoadingPlayers(true); setReload((value) => value + 1); }

  function openTeam(id: string) {
    if (dirty && !window.confirm("Discard the unsaved changes to this lineup?")) return;
    const team = teams.find((entry) => entry.team_id === Number(id));
    setTeamId(team?.team_id ?? null);
    setName(team?.team_name ?? "");
    setFormation(team?.formation ?? "4-3-3");
    const next = emptySquad();
    team?.players.forEach((player) => { next[player.slot_index] = player; });
    setSquad(next);
    setActiveSlot(0);
    setDirty(false);
    setNotice("");
    setError("");
  }

  function selectSlot(index: number) {
    setActiveSlot(index);
    pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    searchRef.current?.focus({ preventScroll: true });
  }

  function assignPlayer(player: TeamPlayer) {
    const previous = squad.findIndex((entry) => entry?.player_id === player.player_id);
    if (previous === activeSlot) return;
    const next = [...squad];
    if (previous !== -1) next[previous] = next[activeSlot];
    next[activeSlot] = player;
    setSquad(next);
    markChanged();
    setNotice(previous !== -1 ? "Players swapped. Save your team to keep the change." : "Player added. Save your team to keep the change.");
  }

  function removePlayer(index: number) {
    setSquad((current) => current.map((player, slot) => slot === index ? null : player));
    markChanged();
  }

  async function save() {
    if (!name.trim()) { setError("Give your team a name before saving."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await requestJson(teamId ? `/api/teams/${teamId}` : "/api/teams", {
        method: teamId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_name: name.trim(), formation, players: squad.flatMap((player, slot_index) => player ? [{ player_id: player.player_id, slot_index }] : []) }),
      });
      setTeamId(data.team_id); setName(name.trim()); setDirty(false);
      setTeams((current) => [{ team_id: data.team_id, team_name: name.trim(), formation, updated_at: new Date().toISOString(), players: squad.flatMap((player, slot_index) => player ? [{ ...player, slot_index }] : []) }, ...current.filter((team) => team.team_id !== data.team_id)]);
      setNotice("Team saved. You can reopen it from Saved teams.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save team."); }
    finally { setBusy(false); }
  }

  async function deleteTeam() {
    if (!teamId || !window.confirm(`Delete “${name}” and its saved lineup?`)) return;
    setBusy(true); setError("");
    try {
      await requestJson(`/api/teams/${teamId}`, { method: "DELETE" });
      setTeams((current) => current.filter((team) => team.team_id !== teamId));
      setTeamId(null); setName(""); setSquad(emptySquad()); setFormation("4-3-3"); setActiveSlot(0); setDirty(false);
      setNotice("Team deleted. Start a new lineup whenever you’re ready.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete team."); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Your club. Your decisions.</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Create your team</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">Build your starting XI, experiment with formations, and find the right players for your system.</p>
        </div>
        <span className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 text-xs text-accent">{starters}/11 starters · {substitutes}/7 substitutes</span>
      </div>

      {error && <div role="alert" className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}<button className="underline" onClick={retryLoading}>Retry loading</button></div>}
      <p role="status" className="mt-3 min-h-5 text-sm text-accent">{notice}</p>

      <fieldset disabled={busy || loadingTeams} className="mt-2 min-w-0 disabled:opacity-60">
        <legend className="sr-only">Team builder</legend>
        <div className="rounded-2xl border border-border-soft bg-surface p-4 sm:p-5">
          <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_auto]">
            <label className="text-xs font-medium text-text-muted">Saved teams
              <select className={`${field} mt-2`} value={teamId ?? ""} onChange={(event) => openTeam(event.target.value)}>
                <option value="">{loadingTeams ? "Loading teams…" : "New team"}</option>
                {teams.map((team) => <option key={team.team_id} value={team.team_id}>{team.team_name} · {team.formation}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-text-muted">Team name
              <input className={`${field} mt-2`} maxLength={80} placeholder="e.g. My Dream XI" value={name} onChange={(event) => { setName(event.target.value); markChanged(); }} />
            </label>
            <label className="text-xs font-medium text-text-muted">Formation
              <select className={`${field} mt-2`} value={formation} onChange={(event) => {
                const next = event.target.value as FormationName;
                setSquad(changeFormation(squad, formation, next)); setFormation(next); markChanged();
                setNotice("Formation changed. All players kept; check their new positions.");
              }}>{FORMATION_NAMES.map((entry) => <option key={entry}>{entry}</option>)}</select>
            </label>
            <button onClick={save} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-pitch-950 transition hover:brightness-110 disabled:opacity-50">{busy ? "Saving…" : "Save team"}</button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
            <p>{FORMATION_DESCRIPTIONS[formation]} {dirty && <span className="text-warning">Unsaved changes</span>}</p>
            <div className="flex gap-4">
              {teamId && <button onClick={() => openTeam("")} className="hover:text-accent">+ New team</button>}
              {teamId && <button onClick={deleteTeam} className="text-danger hover:underline">Delete team</button>}
            </div>
          </div>
        </div>

        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
          <section className="min-w-0 rounded-2xl border border-border-soft bg-surface p-3 sm:p-5" aria-label="Lineup pitch">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Starting XI <span className="ml-2 text-accent">{formation}</span></h2>
              <span className="text-[11px] text-text-muted">Click a position to edit</span>
            </div>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[660px] overflow-hidden rounded-xl border border-emerald-400/20" style={{ background: "repeating-linear-gradient(0deg, #123d30 0%, #123d30 10%, #164535 10%, #164535 20%)" }}>
              <svg className="pointer-events-none absolute inset-0 h-full w-full text-white/20" viewBox="0 0 400 500" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                <path d="M15 15H385V485H15ZM15 250H385M115 15V85H285V15M155 15V43H245V15M115 485V415H285V485M155 485V457H245V485" />
                <circle cx="200" cy="250" r="48" /><circle cx="200" cy="250" r="2" fill="currentColor" />
                <path d="M160 85Q200 120 240 85M160 415Q200 380 240 415" />
              </svg>
              {slots.map((slot, index) => {
                const player = squad[index];
                return <button key={index} onClick={() => selectSlot(index)} aria-pressed={activeSlot === index} aria-label={`${slot.role}: ${player ? `${player.first_name} ${player.last_name}, change player` : "add player"}`} style={{ left: `${slot.x}%`, top: `${slot.y}%` }} className="absolute flex w-[19%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <span className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 shadow-lg sm:h-12 sm:w-12 ${activeSlot === index ? "border-accent bg-accent text-pitch-950 ring-4 ring-accent/20" : "border-white/30 bg-pitch-950/80 text-white"}`}>
                    {player ? <span className="text-sm font-bold">{player.first_name[0]}{player.last_name[0]}</span> : <span className="text-2xl font-light">+</span>}
                  </span>
                  <span className={`max-w-full truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:text-xs ${activeSlot === index ? "bg-accent text-pitch-950" : "bg-pitch-950/85 text-white"}`}>{player ? player.last_name : "Add player"}</span>
                  <span className="text-[9px] font-bold tracking-wide text-emerald-100/80 sm:text-[10px]">{slot.role}</span>
                </button>;
              })}
            </div>
            <div className="mt-5 flex items-center justify-between"><h3 className="text-sm font-semibold">Substitutes</h3><span className="text-xs text-text-muted">Optional · up to 7</span></div>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {squad.slice(11).map((player, offset) => <button key={offset} onClick={() => selectSlot(offset + 11)} aria-pressed={activeSlot === offset + 11} aria-label={`Substitute ${offset + 1}: ${player ? `${player.first_name} ${player.last_name}` : "add player"}`} className={`min-w-0 rounded-xl border px-1 py-3 text-center ${activeSlot === offset + 11 ? "border-accent bg-accent/10 text-accent" : "border-border-soft hover:bg-white/5"}`}>
                <span className="block text-xs font-semibold">{player ? `${player.first_name[0]}${player.last_name[0]}` : "+"}</span>
                <span className="mt-1 block truncate text-[10px] text-text-muted">{player ? player.last_name : `Sub ${offset + 1}`}</span>
              </button>)}
            </div>
          </section>

          <section ref={pickerRef} className="min-w-0 scroll-mt-5 rounded-2xl border border-border-soft bg-surface p-4 sm:p-5" aria-label="Player selection">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{activeSlot < 11 ? "Starting lineup" : "Substitute bench"} / {activeRole}</p>
            <h2 className="mt-2 text-lg font-semibold">{activePlayer ? "Change player" : "Choose a player"}</h2>
            <p className="mt-1 text-xs leading-5 text-text-muted">Select a position on the pitch, then add a player below. Choosing someone already in your squad swaps their position.</p>
            {activePlayer && <div className="mt-4 flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
              <PlayerAvatar key={activePlayer.player_id} playerId={activePlayer.player_id} firstName={activePlayer.first_name} lastName={activePlayer.last_name} photoUrl={activePlayer.photo_url} className="w-10" />
              <div className="min-w-0 flex-1"><Link href={`/players/${activePlayer.player_id}`} className="block truncate text-sm font-semibold hover:text-accent">{activePlayer.first_name} {activePlayer.last_name}</Link><p className="text-xs text-text-muted">{activePlayer.primary_position} · {activePlayer.club_name ?? "Free agent"}</p></div>
              <button onClick={() => removePlayer(activeSlot)} className="text-xs text-danger hover:underline">Remove</button>
            </div>}
            <label className="mt-5 block text-xs text-text-muted" htmlFor="team-player-search">Search player database</label>
            <input ref={searchRef} id="team-player-search" value={search} onChange={(event) => { setSearch(event.target.value); setLoadingPlayers(true); }} className={`${field} mt-2`} placeholder="Search by first or last name…" />
            <label className="mt-3 block text-xs text-text-muted" htmlFor="team-position-filter">Filter by natural position</label>
            <select id="team-position-filter" className={`${field} mt-2`} value={position} onChange={(event) => { setPosition(event.target.value); setLoadingPlayers(true); }}><option value="">All positions</option>{positions.map((entry) => <option key={entry}>{entry}</option>)}</select>
            <p className="mt-3 text-[11px] leading-5 text-text-muted">Players can fill any role. Their natural position is shown to help you decide.</p>
            <div className="mt-3 max-h-[520px] overflow-y-auto" aria-busy={loadingPlayers}>
              {loadingPlayers ? <p role="status" className="py-8 text-center text-sm text-text-muted">Searching players…</p> : searchError ? <p role="alert" className="py-6 text-sm text-danger">{searchError} <button onClick={retryLoading} className="underline">Retry</button></p> : options.length === 0 ? <p className="py-8 text-center text-sm text-text-muted">No players found. Try another name or position.</p> : <ul className="space-y-1">
                {options.map((player) => {
                  const existing = squad.findIndex((entry) => entry?.player_id === player.player_id);
                  const selected = existing === activeSlot;
                  return <li key={player.player_id}><button disabled={selected} onClick={() => assignPlayer(player)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-white/5 disabled:bg-accent/5">
                    <PlayerAvatar playerId={player.player_id} firstName={player.first_name} lastName={player.last_name} photoUrl={player.photo_url} className="w-9" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{player.first_name} {player.last_name}</span><span className="block truncate text-[11px] text-text-muted">{player.primary_position} · {player.club_name ?? "Free agent"}</span></span>
                    <span className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold ${existing !== -1 ? "bg-accent/10 text-accent" : "bg-white/5 text-text-muted"}`}>{selected ? "Selected" : existing !== -1 ? "Swap" : activePlayer ? "Replace" : "Add +"}</span>
                  </button></li>;
                })}
              </ul>}
            </div>
            <p className="mt-3 border-t border-border-soft pt-3 text-[11px] text-text-muted">Showing up to 50 matches. Search to find more players.</p>
          </section>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted"><p>You can save an unfinished lineup and complete it later.</p><button className={secondary} disabled={!squad.some(Boolean)} onClick={() => { if (window.confirm("Remove all players from this lineup?")) { setSquad(emptySquad()); markChanged(); } }}>Clear lineup</button></div>
      </fieldset>
    </div>
  );
}
