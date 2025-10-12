import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";

type TestRow = Database["public"]["Tables"]["tests"]["Row"];
type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "user_id" | "full_name">;

const TestsPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const { data, error } = await supabase
    .from("tests")
    .select("id, student_id, type, status, score, assigned_at, completed_at")
    .order("assigned_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold text-red-600">Unable to load tests</h1>
        <p className="text-sm text-neutral-600">{error.message}</p>
      </main>
    );
  }

  const tests = (data as TestRow[] | null) ?? [];

  const studentIds = Array.from(new Set(tests.map((test) => test.student_id).filter((id): id is string => !!id)));
  const profileMap = new Map<string, string>();

  if (studentIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", studentIds);

    const profiles = (profilesData as ProfileRow[] | null) ?? [];
    profiles.forEach((profile) => {
      profileMap.set(profile.user_id, profile.full_name ?? "");
    });
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-neutral-900">Tests</h1>
        <p className="text-sm text-neutral-600">Assign entrance or periodic tests and monitor completion.</p>
      </header>

      <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Student</th>
                <th className="px-6 py-3 text-left font-semibold">Type</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Score</th>
                <th className="px-6 py-3 text-left font-semibold">Assigned</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                    No tests assigned yet. Use the user edit screen to create one.
                  </td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {profileMap.get(test.student_id ?? "") || "Unknown student"}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">{test.type}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={test.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {test.score !== null ? test.score : "Pending"}
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-500">
                      {test.assigned_at ? format(new Date(test.assigned_at), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/tests/${test.id}`}
                        className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold uppercase text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const palette: Record<string, string> = {
    assigned: "bg-neutral-200 text-neutral-700",
    completed: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
  };
  const style = palette[status] ?? "bg-neutral-200 text-neutral-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{status}</span>;
};

export default TestsPage;
