import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import BrandLogo from "@/components/brand-logo";
import LogoutButton from "./logout-button";
import AppNav, { type NavItem } from "./app-nav";

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/players", label: "Player database", icon: "players" },
  { href: "/compare", label: "Compare players", icon: "compare" },
  { href: "/shortlist", label: "Shortlist", icon: "shortlist" },
  { href: "/reports", label: "Scout reports", icon: "reports" },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/users", label: "Manage team", icon: "admin" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const navItems =
    session.role === "ADMIN" ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-pitch-900 lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="border-b border-white/[0.06] bg-pitch-950/95 px-4 py-4 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="flex items-center justify-between lg:block">
          <BrandLogo compact className="px-2" />
          <div className="rounded-full border border-accent/20 bg-accent/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent lg:mt-6 lg:inline-flex">
            2025/26 season
          </div>
        </div>

        <div className="mt-4 lg:mt-8">
          <p className="mb-2 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-faint lg:block">Workspace</p>
          <AppNav items={navItems} />
        </div>

        <div className="mt-auto hidden border-t border-white/[0.06] pt-5 lg:block">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.035] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised font-display text-xs font-bold text-accent">
              {session.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{session.fullName}</p>
              <p className="text-[11px] text-text-muted">{session.role === "ADMIN" ? "Administrator" : "First-team scout"}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="radar-field min-w-0 px-4 py-7 sm:px-7 lg:px-10 lg:py-9 xl:px-12">
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
    </div>
  );
}
