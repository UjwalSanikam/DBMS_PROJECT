"use client";

import { useState } from "react";
import Link from "next/link";
import PlayerAvatar from "@/components/player-avatar";

interface SimilarPlayer {
  player_id: number;
  player_name: string;
  primary_position: string;
  similarity_percent: number;
}

export default function SimilarPlayers({ playerId }: { playerId: number }) {
  const [results, setResults] = useState<SimilarPlayer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samePosition, setSamePosition] = useState(false);

  async function handleFindSimilar() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
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

      <div className="mt-3 flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-text-muted">
          <input
            type="checkbox"
            checked={samePosition}
            onChange={(e) => setSamePosition(e.target.checked)}
          />
          Same position only
        </label>
        <button
          onClick={handleFindSimilar}
          disabled={loading}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-pitch-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Find Similar Players"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

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
              <Link
                href={`/players/${p.player_id}`}
                className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary hover:text-accent"
              >
                {p.player_name}
              </Link>
              <span className="text-xs text-text-muted">
                {p.primary_position} · {p.similarity_percent}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
