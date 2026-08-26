import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LogoutButton from "./logout-button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/players", label: "Players" },
  { href: "/compare", label: "Compare" },
  { href: "/shortlist", label: "Shortlist" },
  { href: "/reports", label: "Reports" },
];

const ADMIN_NAV_ITEMS = [{ href: "/admin/users", label: "Admin · Users" }];

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
    <div className="min-h-screen grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:flex flex-col border-r border-border-soft bg-pitch-950 p-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-display font-semibold tracking-wide text-sm text-text-muted uppercase">
            ScoutIQ
          </span>
        </div>

        <nav className="mt-10 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-text-muted hover:bg-surface hover:text-text-primary transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border-soft">
          <p className="text-sm font-medium text-text-primary truncate">
            {session.fullName}
          </p>
          <p className="text-xs text-text-muted">
            {session.role === "ADMIN" ? "Administrator" : "Scout"}
          </p>
          <LogoutButton />
        </div>
      </aside>

      <main className="p-6 lg:p-10">{children}</main>
    </div>
  );
}
