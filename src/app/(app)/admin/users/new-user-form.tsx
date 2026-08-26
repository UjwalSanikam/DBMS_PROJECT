"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewUserForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SCOUT" | "ADMIN">("SCOUT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not create the user.");
        return;
      }

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("SCOUT");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="h-fit rounded-lg border border-border-soft bg-surface p-5"
    >
      <h2 className="font-display text-sm font-semibold">Add a user</h2>

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
            Full name
          </label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
            Email
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
            Temporary password
          </label>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "SCOUT" | "ADMIN")}
            className="mt-1.5 w-full rounded-md border border-border bg-pitch-900 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="SCOUT">Scout</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-xs text-danger"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-pitch-950 transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}
