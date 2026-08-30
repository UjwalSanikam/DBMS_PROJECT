"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface MyReport {
  report_id: number;
  player_id: number;
  player_name: string;
  primary_position: string;
  overall_rating: string;
  strengths: string | null;
  weaknesses: string | null;
  tactical_fit: string | null;
  recommendation: string;
  notes: string | null;
  created_at: string;
}

interface PlayerOption {
  player_id: number;
  first_name: string;
  last_name: string;
  club_name: string | null;
}

const RECOMMENDATIONS = ["AVOID", "MONITOR", "SHORTLIST", "PRIORITY"];

const RECOMMENDATION_STYLES: Record<string, string> = {
  AVOID: "bg-danger-soft text-danger",
  MONITOR: "bg-surface-raised text-text-muted",
  SHORTLIST: "bg-accent-soft text-accent",
  PRIORITY: "bg-danger-soft text-danger",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (res.ok) setReports(data.reports);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports();
  }, [fetchReports]);

  // --- New report form state ---
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<PlayerOption[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerOption | null>(null);
  const [rating, setRating] = useState("7.0");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [tacticalFit, setTacticalFit] = useState("");
  const [recommendation, setRecommendation] = useState("MONITOR");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSearch(term: string) {
    setSearchTerm(term);
    if (!term.trim()) {
      setOptions([]);
      return;
    }
    const res = await fetch(`/api/players?name=${encodeURIComponent(term)}`);
    const data = await res.json();
    if (res.ok) setOptions(data.players);
  }

  function resetForm() {
    setSelectedPlayer(null);
    setSearchTerm("");
    setOptions([]);
    setRating("7.0");
    setStrengths("");
    setWeaknesses("");
    setTacticalFit("");
    setRecommendation("MONITOR");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlayer) {
      setError("Select a player first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/players/${selectedPlayer.player_id}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overall_rating: Number(rating),
          strengths: strengths || null,
          weaknesses: weaknesses || null,
          tactical_fit: tacticalFit || null,
          recommendation,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create report.");
        return;
      }
      resetForm();
      setShowForm(false);
      fetchReports();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Recruitment intelligence
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Scout Reports</h1>
          <p className="mt-1.5 text-sm text-text-muted max-w-xl">
            Reports you&apos;ve written for players.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-pitch-950 transition hover:opacity-90"
        >
          {showForm ? "Cancel" : "New Report"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-lg border border-border-soft bg-surface p-5 space-y-4"
        >
          <div className="relative">
            <label className="block text-xs font-medium text-text-muted mb-1">Player</label>
            {selectedPlayer ? (
              <div className="flex items-center justify-between rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm">
                {selectedPlayer.first_name} {selectedPlayer.last_name}
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className="text-text-muted hover:text-danger"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <input
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search for a player…"
                  className="w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                {options.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full rounded-md border border-border-soft bg-surface shadow-lg max-h-56 overflow-y-auto">
                    {options.map((p) => (
                      <li key={p.player_id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlayer(p);
                            setOptions([]);
                          }}
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
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Overall rating (1–10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Recommendation
              </label>
              <select
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                className="w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {RECOMMENDATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Strengths</label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Weaknesses</label>
            <textarea
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Tactical fit</label>
            <textarea
              value={tacticalFit}
              onChange={(e) => setTacticalFit(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-pitch-950 transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Report"}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-text-muted">Loading reports…</p>}
        {!loading && reports.length === 0 && (
          <p className="text-sm text-text-muted">You haven&apos;t written any reports yet.</p>
        )}
        {!loading &&
          reports.map((r) => (
            <div key={r.report_id} className="rounded-lg border border-border-soft bg-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/players/${r.player_id}`}
                    className="text-sm font-medium text-text-primary hover:text-accent"
                  >
                    {r.player_name}
                  </Link>
                  <p className="text-xs text-text-muted">{r.primary_position}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${RECOMMENDATION_STYLES[r.recommendation]}`}
                  >
                    {r.recommendation}
                  </span>
                  <span className="stat-figure rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                    {r.overall_rating}
                  </span>
                </div>
              </div>
              {r.strengths && (
                <p className="mt-2 text-xs text-text-muted">Strengths: {r.strengths}</p>
              )}
              {r.weaknesses && (
                <p className="text-xs text-text-muted">Weaknesses: {r.weaknesses}</p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}