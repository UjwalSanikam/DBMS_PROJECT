"use client";

import { useState } from "react";
import Link from "next/link";
import PlayerAvatar from "@/components/player-avatar";

interface SimilarPlayer {
  player_id: number;
  player_name: string;
  primary_position: string;
  similarity_percent: number;
  match_type?: "closest" | "most_different";
}

export default function SimilarPlayers({ playerId, isAdmin = false }: { playerId: number; isAdmin?: boolean }) {
  const [results, setResults] = useState<SimilarPlayer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samePosition, setSamePosition] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [engine, setEngine] = useState("qdrant");
  const [point, setPoint] = useState<unknown>(null);

  async function vectorAction(method: "GET" | "POST" | "PUT" | "DELETE") {
    if (method === "DELETE" && !window.confirm("Delete this player's Qdrant vector? The MySQL player record will remain. You can recreate the vector.")) return;
    setLoading(true); setError(null); setNotice(null); setPoint(null); setResults(null);
    try {
      const response = await fetch(`/api/players/${playerId}/vector`, {method});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Qdrant operation failed.");
      if (method === "GET") setPoint(data.point);
      setNotice(method === "GET" ? "Stored Qdrant vector loaded." : method === "DELETE" ? "Qdrant vector deleted. MySQL record is unchanged." : "Qdrant vector saved from current MySQL statistics.");
    } catch (err) { setError(err instanceof Error ? err.message : "Qdrant operation failed."); }
    finally { setLoading(false); }
  }

  async function manageIndex(remove: boolean) {
    setLoading(true); setError(null); setNotice(null); setResults(null);
    try {
      const response = await fetch(remove ? `/api/players/${playerId}/vector` : "/api/admin/vectors", {method: remove ? "DELETE" : "POST"});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update similarity search.");
      setNotice(remove ? "Player removed from similarity search. Refresh the index to restore eligible players." : `Similarity search refreshed for ${data.indexed} players.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update similarity search."); }
    finally { setLoading(false); }
  }

  async function handleFindSimilar() {
    setLoading(true);
    setError(null);
    setResults(null); setNotice(null);
    try {
      const params = new URLSearchParams();
      params.set("engine", engine);
      if (samePosition) params.set("samePosition", "true");
      const res = await fetch(`/api/players/${playerId}/similar?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not find similar players.");
        return;
      }
      setResults(data.similar);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <p className="text-xs text-text-muted max-w-lg">
        Similarity is calculated using normalized performance indicators such
        as goals, assists, xG, xA, passing, progression, tackling and
        interceptions. It does not predict player quality — only
        statistical playing-profile similarity.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-xs text-text-muted">Search using
          <select aria-label="Similarity search engine" disabled={loading} value={engine} onChange={e => {setEngine(e.target.value); setResults(null); setError(null); setNotice(null);}} className="ml-2 rounded-md border border-border-soft bg-surface px-3 py-2 text-text-primary">
            <option value="qdrant">Qdrant vectors</option>
            <option value="sql">MySQL live statistics</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-text-muted">
          <input
            type="checkbox"
            checked={samePosition}
            disabled={loading}
            onChange={(e) => {setSamePosition(e.target.checked); setResults(null);}}
          />
          Same position only
        </label>
        <button
          onClick={handleFindSimilar}
          disabled={loading}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-pitch-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Searching…" : engine === "qdrant" ? "Find closest & most different" : "Find Similar Players"}
        </button>
      </div>
      <p className="mt-2 text-xs text-text-muted">{engine === "sql" ? "Reads live MySQL statistics and compares normalized profiles on the server. Works without Qdrant." : "Returns two players: the closest match and the most different available playing style, based on cosine similarity. Same position only restricts both choices. These are relative to the indexed players; a complete opposite may not exist."}</p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      {notice && <p role="status" className="mt-3 text-sm text-accent">{notice}</p>}
      {engine === "qdrant" && <div className="mt-4 rounded-xl border border-border-soft p-4">
        <h3 className="text-sm font-semibold">Qdrant player vector</h3>
        <p className="mt-1 text-xs text-text-muted">Create and update derive the vector and metadata from MySQL. Delete removes only the Qdrant point. A full refresh recreates eligible vectors.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button disabled={loading} onClick={() => vectorAction("GET")} className="text-xs text-accent disabled:opacity-50">View vector (Read)</button>
          {isAdmin && <>
            <button disabled={loading} onClick={() => vectorAction("POST")} className="text-xs text-accent disabled:opacity-50">Create vector</button>
            <button disabled={loading} onClick={() => vectorAction("PUT")} className="text-xs text-accent disabled:opacity-50">Update from statistics</button>
            <button disabled={loading} onClick={() => vectorAction("DELETE")} className="text-xs text-danger disabled:opacity-50">Delete vector</button>
          </>}
        </div>
        {point !== null && <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(point, null, 2)}</pre>}
      </div>}
      {isAdmin && engine === "qdrant" && <div className="mt-3 flex flex-wrap gap-3">
        <button onClick={() => manageIndex(false)} disabled={loading} className="text-xs text-accent disabled:opacity-50">Refresh similarity index</button>
      </div>}

      {results && (
        <ul className="mt-4 space-y-2">
          {results.length === 0 && (
            <li className="text-sm text-text-muted">
              No comparable players found.
            </li>
          )}
          {results.map((p) => (
            <li
              key={p.player_id}
              className="flex items-center gap-3 border-b border-border-soft pb-2 last:border-0"
            >
              <PlayerAvatar playerId={p.player_id} className="w-9" />
              {p.match_type && <span className={`rounded-md px-2 py-1 text-xs font-semibold ${p.match_type === "closest" ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"}`}>{p.match_type === "closest" ? "Closest match" : "Most different"}</span>}
              <Link
                href={`/players/${p.player_id}`}
                className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary hover:text-accent"
              >
                {p.player_name}
              </Link>
              <span className="text-xs text-text-muted">
                {p.primary_position} · {p.similarity_percent}% similar
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
