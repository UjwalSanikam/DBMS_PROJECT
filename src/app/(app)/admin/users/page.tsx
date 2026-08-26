import { query } from "@/lib/db";
import NewUserForm from "./new-user-form";

interface UserRow {
  user_id: number;
  full_name: string;
  email: string;
  role: "ADMIN" | "SCOUT";
  created_at: string;
}

export default async function AdminUsersPage() {
  const users = await query<UserRow[]>(
    `SELECT user_id, full_name, email, role, created_at
     FROM \`user\` ORDER BY created_at DESC`
  );

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        Admin
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold">Users</h1>
      <p className="mt-1.5 text-sm text-text-muted max-w-xl">
        Manage who can access ScoutIQ and which role they hold.
      </p>

      <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="rounded-lg border border-border-soft bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-b border-border-soft last:border-0">
                  <td className="px-4 py-3 text-text-primary">{u.full_name}</td>
                  <td className="px-4 py-3 text-text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "ADMIN"
                          ? "bg-warning-soft text-warning"
                          : "bg-accent-soft text-accent"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted stat-figure">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-text-muted"
                  >
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <NewUserForm />
      </div>
    </div>
  );
}
