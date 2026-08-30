"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ShortlistEntry {
  shortlist_id: number;
  scout_user_id: number;
  player_id: number;
  player_name: string;
  primary_position: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
  availability: "AVAILABLE" | "INJURED";
  contract_end: string | null;
}

const STATUSES = [
  "WATCHING",
  "RECOMMENDED",
  "CONTACT_CLUB",
  "NEGOTIATING",
  "REJECTED",
  "SIGNED",
];

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-surface-raised text-text-muted",
  MEDIUM: "bg-accent-soft text-accent",
  HIGH: "bg-danger-soft text-danger",
};

function monthsUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const end = new Date(dateStr);
  const now = new Date();
  return (
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth())
  );
}

export default function ShortlistPage() {
  const [entries, setEntries] = useState<ShortlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchShortlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/shortlist?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load shortlist.");
        return;
      }
      setEntries(data.shortlist);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchShortlist();
  }, [fetchShortlist]);

  async function updateStatus(shortlistId: number, status: string) {
    const res = await fetch(`/api/shortlist/${shortlistId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchShortlist();
  }

  async function removeEntry(shortlistId: number) {
    const res = await fetch(`/api/shortlist/${shortlistId}`, { method: "DELETE" });
    if (res.ok) fetchShortlist();
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        Recruitment intelligence
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold">Shortlist</h1>
      <p className="mt-1.5 text-sm text-text-muted max-w-xl">
        Players you&apos;re tracking for recruitment.
      </p>

      <div className="mt-6 flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-text-muted">Loading shortlist…</p>}
        {!loading && entries.length === 0 && !error && (
          <p className="text-sm text-text-muted">No players on your shortlist yet.</p>
        )}
        {!loading &&
          entries.map((entry) => {
            const months = monthsUntil(entry.contract_end);
            const contractSoon = months !== null && months <= 18;
            return (
              <div
                key={entry.shortlist_id}
                className="rounded-lg border border-border-soft bg-surface p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/players/${entry.player_id}`}
                      className="text-sm font-medium text-text-primary hover:text-accent"
                    >
                      {entry.player_name}
                    </Link>
                    <p className="text-xs text-text-muted">{entry.primary_position}</p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[entry.priority]}`}
                      >
                        {entry.priority} PRIORITY
                      </span>
                      {entry.availability === "INJURED" && (
                        <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
                          ⚠ CURRENTLY INJURED
                        </span>
                      )}
                      {contractSoon && (
                        <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
                          ⚠ CONTRACT EXPIRING SOON
                        </span>
                      )}
                    </div>

                    {entry.reason && (
                      <p className="mt-2 text-xs text-text-muted max-w-md">{entry.reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={entry.status}
                      onChange={(e) => updateStatus(entry.shortlist_id, e.target.value)}
                      className="rounded-md border border-border bg-pitch-900 px-2 py-1.5 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeEntry(entry.shortlist_id)}
                      className="rounded-md border border-danger/40 px-2 py-1.5 text-xs text-danger transition hover:bg-danger-soft"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}