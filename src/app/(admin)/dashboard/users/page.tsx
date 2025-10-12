import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type UserWithClass = ProfileRow & {
  classes: { name: string } | { name: string }[] | null;
};

const UsersPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, username, role, phone, class_id, test_status, classes(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold text-red-600">Unable to load users</h1>
        <p className="text-sm text-neutral-600">{error.message}</p>
      </main>
    );
  }

  const users = (data as UserWithClass[] | null) ?? [];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-neutral-900">Users</h1>
        <p className="text-sm text-neutral-600">Assign roles, link classes, and monitor test readiness.</p>
      </header>

      <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Role</th>
                <th className="px-6 py-3 text-left font-semibold">Class</th>
                <th className="px-6 py-3 text-left font-semibold">Test status</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-neutral-500">
                    No profiles yet. Invited users will appear here once they sign in.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const classData = Array.isArray(user.classes) ? user.classes[0] : user.classes;
                  return (
                    <tr key={user.user_id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900">{user.full_name ?? "Unnamed user"}</div>
                        <div className="text-xs text-neutral-500">
                          {user.username ?? user.phone ?? "No contact details"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role ?? "student"} />
                      </td>
                      <td className="px-6 py-4">
                        {classData ? (
                          <span className="text-sm text-neutral-700">{classData.name}</span>
                        ) : (
                          <span className="text-xs text-neutral-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700">{user.test_status ?? "none"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Link
                            href={`/dashboard/users/${user.user_id}`}
                            className="rounded-full border border-neutral-300 px-3 py-1 font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                          >
                            View
                          </Link>
                          <Link
                            href={`/dashboard/users/${user.user_id}/edit`}
                            className="rounded-full border border-neutral-300 px-3 py-1 font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

const RoleBadge = ({ role }: { role: string }) => {
  const palette: Record<string, string> = {
    admin: "bg-neutral-900 text-white",
    teacher: "bg-emerald-100 text-emerald-800",
    student: "bg-sky-100 text-sky-800",
  };
  const style = palette[role] ?? "bg-neutral-200 text-neutral-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{role}</span>;
};

export default UsersPage;
