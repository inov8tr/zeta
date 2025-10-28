import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabaseAdmin";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type UserWithClass = ProfileRow & {
  classes: { name: string } | { name: string }[] | null;
};

interface UsersPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const UsersPage = async ({ searchParams }: UsersPageProps) => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const viewParam = resolvedSearchParams?.view;
  const view = Array.isArray(viewParam) ? viewParam[0] : viewParam;
  let showArchived = view === "archived";
  let archivingEnabled = true;

  let query = supabase
    .from("profiles")
    .select(
      "user_id, full_name, username, role, phone, class_id, test_status, archived, archived_at, classes(name)"
    )
    .order("created_at", { ascending: false });
  if (showArchived) {
    query = query.eq("archived", true);
  } else {
    query = query.or("archived.is.null,archived.eq.false");
  }

  let { data, error } = await query;

  if (error && error.message?.toLowerCase().includes("archived")) {
    archivingEnabled = false;
    showArchived = false;
    const fallback = await supabase
      .from("profiles")
      .select("user_id, full_name, username, role, phone, class_id, test_status, classes(name)")
      .order("created_at", { ascending: false });
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold text-red-600">Unable to load users</h1>
        <p className="text-sm text-neutral-600">{error.message}</p>
      </main>
    );
  }

  const users = (data as UserWithClass[] | null) ?? [];
  const admin = createAdminClient();
  let surveyStatuses = new Map<string, boolean>();

  if (users.length > 0) {
    const { data: studentRows, error: studentError } = await admin
      .from("students")
      .select("id, survey_completed")
      .in(
        "id",
        users.map((user) => user.user_id),
      );
    if (studentError) {
      console.error("Failed to load survey statuses", studentError);
    } else if (studentRows) {
      surveyStatuses = new Map(studentRows.map((row) => [row.id, row.survey_completed]));
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-brand-primary-dark">Users</h1>
          <p className="text-sm text-neutral-muted">Assign roles, link classes, and monitor test readiness.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {archivingEnabled ? (
            <div className="flex items-center gap-2 rounded-full bg-brand-primary/10 p-1 text-xs font-semibold uppercase text-brand-primary">
              <Link
                href="/dashboard/users"
                className={`rounded-full px-3 py-1 transition ${
                  showArchived ? "text-brand-primary" : "bg-white text-brand-primary-dark shadow"
                }`}
              >
                Active
              </Link>
              <Link
                href="/dashboard/users?view=archived"
                className={`rounded-full px-3 py-1 transition ${
                  showArchived ? "bg-white text-brand-primary-dark shadow" : "text-brand-primary"
                }`}
              >
                Archived
              </Link>
            </div>
          ) : null}
          <Link
            href="/dashboard/users/new"
            className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-dark"
          >
            Create new user
          </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-brand-primary/5 text-xs uppercase tracking-wide text-brand-primary">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Role</th>
                <th className="px-6 py-3 text-left font-semibold">Class</th>
                <th className="px-6 py-3 text-left font-semibold">Test status</th>
                <th className="px-6 py-3 text-left font-semibold">Survey</th>
                {archivingEnabled && showArchived ? (
                  <th className="px-6 py-3 text-left font-semibold">Archived</th>
                ) : null}
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={archivingEnabled && showArchived ? 7 : 6} className="px-6 py-10 text-center text-neutral-muted">
                    {archivingEnabled && showArchived
                      ? "No archived profiles."
                      : archivingEnabled
                      ? "No profiles yet. Invited users will appear here once they sign in."
                      : "No profiles yet."}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const classData = Array.isArray(user.classes) ? user.classes[0] : user.classes;
                  return (
                    <tr key={user.user_id} className="hover:bg-brand-primary/5">
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-primary-dark">{user.full_name ?? "Unnamed user"}</div>
                        <div className="text-xs text-neutral-muted">
                          {user.username ?? user.phone ?? "No contact details"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role ?? "student"} />
                      </td>
                      <td className="px-6 py-4">
                        {classData ? (
                          <span className="text-sm text-neutral-800">{classData.name}</span>
                        ) : (
                          <span className="text-xs text-neutral-muted">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-800">{user.test_status ?? "none"}</td>
                      <td className="px-6 py-4">
                        <SurveyStatusBadge completed={surveyStatuses.get(user.user_id) ?? false} />
                      </td>
                      {archivingEnabled && showArchived ? (
                        <td className="px-6 py-4 text-xs text-neutral-muted">
                          {user.archived_at ? format(new Date(user.archived_at), "MMM d, yyyy") : "—"}
                        </td>
                      ) : null}
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/users/${user.user_id}`}
                          className="inline-flex rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-primary-dark"
                        >
                          View
                        </Link>
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
    admin: "bg-brand-primary text-white",
    teacher: "bg-brand-primary/15 text-brand-primary-dark",
    student: "bg-brand-accent/20 text-brand-accent-dark",
    parent: "bg-slate-200 text-slate-700",
  };
  const style = palette[role] ?? "bg-neutral-200 text-neutral-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{role}</span>;
};

const SurveyStatusBadge = ({ completed }: { completed: boolean }) => {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        completed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {completed ? "Completed" : "Pending"}
    </span>
  );
};

export default UsersPage;
