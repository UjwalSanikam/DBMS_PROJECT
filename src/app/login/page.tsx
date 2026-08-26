import { Suspense } from "react";
import LoginForm from "./login-form";

const TICKER_ITEMS = [
  "xG 0.34 →",
  "PASS ACC 87% →",
  "PROG PASSES 6.2/90 →",
  "ASSISTS 0.41/90 →",
  "TACKLES 2.8/90 →",
  "SHOTS 3.1/90 →",
  "KEY PASSES 1.9/90 →",
  "INTERCEPTIONS 1.4/90 →",
];

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr]">
      {/* Left: ambient identity panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-pitch-950 radar-field p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-display font-semibold tracking-wide text-sm text-text-muted uppercase">
              ScoutIQ
            </span>
          </div>
          <h1 className="mt-10 font-display text-4xl xl:text-5xl font-semibold leading-[1.1] max-w-lg">
            Every signal on a player,
            <span className="text-accent"> in one profile.</span>
          </h1>
          <p className="mt-5 text-text-muted max-w-md leading-relaxed">
            Performance, fitness, contract, transfer and market-value data —
            unified so your recruitment department can answer one question:
            is this player a suitable target.
          </p>
        </div>

        {/* Signature: concentric radar rings anchored bottom-left, evoking
            a scouting/search sweep rather than a literal football. */}
        <div className="relative z-10">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-text-faint stat-figure">
            {TICKER_ITEMS.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <svg
          className="pointer-events-none absolute -bottom-32 -left-32 opacity-40"
          width="520"
          height="520"
          viewBox="0 0 520 520"
          fill="none"
          aria-hidden="true"
        >
          {[80, 140, 200, 260].map((r) => (
            <circle
              key={r}
              cx="260"
              cy="260"
              r={r}
              stroke="var(--color-accent)"
              strokeOpacity="0.18"
              strokeWidth="1"
            />
          ))}
          <line
            x1="260"
            y1="260"
            x2="260"
            y2="0"
            stroke="var(--color-accent)"
            strokeOpacity="0.25"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-8 bg-pitch-900">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-display font-semibold tracking-wide text-sm text-text-muted uppercase">
              ScoutIQ
            </span>
          </div>

          <h2 className="font-display text-2xl font-semibold">Sign in</h2>
          <p className="mt-1.5 text-sm text-text-muted">
            Access your scouting dashboard.
          </p>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
