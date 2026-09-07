import { Suspense } from "react";
import BrandLogo from "@/components/brand-logo";
import PlayerAvatar from "@/components/player-avatar";
import LoginForm from "./login-form";

const SIGNALS = [
  { value: "8.9", label: "Scout rating" },
  { value: "€6.8M", label: "Market value" },
  { value: "83.7%", label: "Pass accuracy" },
];

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-pitch-950 lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(430px,0.88fr)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_15%,rgba(61,220,132,0.12),transparent_28%),radial-gradient(circle_at_90%_90%,rgba(54,139,255,0.08),transparent_28%)]" />

      <section className="radar-field relative hidden min-h-screen overflow-hidden border-r border-white/[0.06] p-10 lg:flex lg:flex-col xl:p-14">
        <BrandLogo />

        <div className="my-auto grid items-center gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Live recruitment workspace
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-white xl:text-6xl">
              Recruit smarter.
              <span className="mt-1 block text-accent">Move earlier.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-text-muted xl:text-lg">
              Turn performance, fitness, contract, and market signals into one confident recruitment decision.
            </p>
            <div className="mt-9 grid grid-cols-3 gap-4">
              {[
                ["40", "Player profiles"],
                ["10", "Clubs tracked"],
                ["5", "Scouting leagues"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="stat-figure text-xl font-semibold text-white">{value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-faint">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden xl:block">
            <div className="absolute -inset-12 rounded-full bg-accent/[0.07] blur-3xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-surface/80 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl">
              <div className="flex items-center justify-between px-1 pb-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-accent">Priority target</p>
                  <p className="mt-1 text-xs text-text-muted">Profile intelligence</p>
                </div>
                <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-accent">Available</span>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-pitch-950">
                <PlayerAvatar playerId={5} firstName="Nikolai" lastName="Vidal" className="w-full rounded-none" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-pitch-950 via-pitch-950/75 to-transparent px-4 pb-4 pt-14">
                  <p className="font-display text-xl font-semibold text-white">Nikolai Vidal</p>
                  <p className="mt-0.5 text-xs text-text-muted">ST · Northgate FC · 26 years</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 divide-x divide-white/[0.07] rounded-xl bg-pitch-950/55 py-3 text-center">
                {SIGNALS.map((signal) => (
                  <div key={signal.label}>
                    <p className="stat-figure text-sm font-semibold text-white">{signal.value}</p>
                    <p className="mt-0.5 text-[8px] uppercase tracking-wider text-text-faint">{signal.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-7 -top-7 rounded-2xl border border-white/[0.08] bg-pitch-950/90 px-3 py-2.5 shadow-2xl backdrop-blur">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-text-faint">Fit score</p>
              <p className="stat-figure mt-1 text-lg font-semibold text-accent">91%</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/[0.06] pt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-faint">
          <span>Performance · Medical · Contract · Market</span>
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />System operational</span>
        </div>

        <svg className="pointer-events-none absolute -bottom-52 -left-48 opacity-40" width="720" height="720" viewBox="0 0 720 720" fill="none" aria-hidden="true">
          {[95, 175, 255, 335].map((radius) => <circle key={radius} cx="360" cy="360" r={radius} stroke="#3ddc84" strokeOpacity="0.13" />)}
          <path d="M360 360 590 115" stroke="#3ddc84" strokeOpacity="0.2" />
          <circle cx="590" cy="115" r="4" fill="#3ddc84" />
        </svg>
      </section>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-20">
        <div className="w-full max-w-[430px]">
          <BrandLogo className="mb-12 lg:hidden" />

          <div className="rounded-[28px] border border-white/[0.075] bg-surface/60 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-8">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Secure access</p>
              <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-text-faint"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Encrypted</span>
            </div>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-white">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">Sign in to continue to your recruitment workspace.</p>

            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>

            <div className="mt-6 flex items-center gap-3 text-[10px] text-text-faint">
              <span className="h-px flex-1 bg-white/[0.06]" />
              Authorized club personnel only
              <span className="h-px flex-1 bg-white/[0.06]" />
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-[0.17em] text-text-faint">
            ScoutIQ · Recruitment intelligence system
          </p>
        </div>
      </section>
    </main>
  );
}
