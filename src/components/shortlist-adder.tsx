"use client";

import {useEffect,useState} from "react";
import {AddToShortlist} from "./player-management";

type Player = {player_id:number;first_name:string;last_name:string;club_name:string|null};
export default function ShortlistAdder({onSaved}:{onSaved:()=>void}) {
  const [term,setTerm] = useState("");
  const [players,setPlayers] = useState<Player[]>([]);
  const [selected,setSelected] = useState<Player|null>(null);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);
  useEffect(()=>{
    if (!term.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(async ()=>{
      setLoading(true);setError("");
      try {
        const response = await fetch(`/api/players?name=${encodeURIComponent(term)}`,{signal:controller.signal});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Search failed.");
        setPlayers(data.players);
      } catch(error) {if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Search failed.");}
      finally {if (!controller.signal.aborted) setLoading(false);}
    },250);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[term]);
  return <details className="mt-5 rounded-xl border border-border-soft p-4"><summary className="cursor-pointer font-semibold text-accent">Add player to shortlist</summary>
    <label className="mt-3 block text-sm">Search player
      <input className="mt-1 w-full rounded-lg border border-border bg-pitch-900 p-2" value={term} onChange={event=>{setTerm(event.target.value);setSelected(null);setPlayers([]);setLoading(false);}}/>
    </label>
    {loading && <p role="status" className="text-sm">Searching…</p>}
    {error && <p role="alert" className="text-danger">{error}</p>}
    {!selected && term.trim() && <ul className="mt-2 space-y-1">{players.map(player=><li key={player.player_id}><button className="w-full rounded p-2 text-left text-sm hover:bg-surface" onClick={()=>setSelected(player)}>{player.first_name} {player.last_name} · {player.club_name ?? "Free agent"}</button></li>)}</ul>}
    {selected && <><p className="mt-3 text-sm">Selected: {selected.first_name} {selected.last_name}</p><AddToShortlist key={selected.player_id} playerId={selected.player_id} onSaved={onSaved}/></>}
  </details>;
}
