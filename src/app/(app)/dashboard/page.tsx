import { getSession } from "@/lib/session";

const STAT_CARDS = [
  { label: "Players tracked", value: "—" },
  { label: "Available players", value: "—" },
  { label: "Currently injured", value: "—" },
  { label: "Shortlisted", value: "—" },
  { label: "Scout reports", value: "—" },
];

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        Overview
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold">
        Welcome back{session ? `, ${session.fullName.split(" ")[0]}` : ""}
      </h1>
      <p className="mt-1.5 text-sm text-text-muted max-w-xl">
        Recruitment snapshot cards below will populate once player,
        statistics, injury and shortlist tables are seeded in the next
        build phase.
      </p>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border-soft bg-surface p-4"
          >
            <p className="stat-figure text-2xl font-semibold text-text-primary">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-text-muted">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-border-soft bg-surface p-6">
        <h2 className="font-display text-base font-semibold">
          You&apos;re signed in
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm max-w-md">
          <dt className="text-text-muted">Name</dt>
          <dd className="text-text-primary">{session?.fullName}</dd>
          <dt className="text-text-muted">Email</dt>
          <dd className="text-text-primary">{session?.email}</dd>
          <dt className="text-text-muted">Role</dt>
          <dd className="text-text-primary">{session?.role}</dd>
        </dl>
      </div>
    </div>
  );
}
