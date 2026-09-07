"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
      <div>
        <label
          htmlFor="email"
          className="block text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted"
        >
          Email
        </label>
        <div className="relative mt-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint">
            <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
          </svg>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/[0.09] bg-pitch-950/70 py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-faint hover:border-white/[0.14] focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            placeholder="name@club.com"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted"
        >
          Password
        </label>
        <div className="relative mt-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint">
            <rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/[0.09] bg-pitch-950/70 py-3 pl-10 pr-14 text-sm text-text-primary outline-none transition placeholder:text-text-faint hover:border-white/[0.14] focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-faint transition hover:text-accent"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger/35 bg-danger-soft px-3.5 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-pitch-950 shadow-[0_12px_30px_rgba(61,220,132,0.18)] transition hover:-translate-y-0.5 hover:bg-[#55e596] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Enter workspace"}
        {!loading && <span className="transition-transform group-hover:translate-x-1">→</span>}
      </button>
    </form>
  );
}
