import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";

const StudentPortal = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: tests, error } = await supabase
    .from("tests")
    .select("id, type, status, assigned_at, completed_at")
    .eq("student_id", session.user.id)
    .order("assigned_at", { ascending: false });

  const assigned = (tests ?? []).filter((test) => test.status === "assigned" || test.status === "in_progress");
  const completed = (tests ?? []).filter((test) => test.status === "completed");

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2 text-brand-primary-dark">
        <h1 className="text-3xl font-semibold">Student Portal</h1>
        <p className="text-sm text-neutral-muted">
          Welcome back! Start your entrance test or review previous assessments below.
        </p>
      </header>

      {error ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          We couldn&rsquo;t load your assessments right now. Please refresh or contact support if this continues.
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand-primary-dark">Upcoming assessments</h2>
        {assigned.length === 0 ? (
          <div className="rounded-3xl border border-brand-primary/10 bg-white p-6 text-sm text-neutral-muted">
            No entrance tests waiting for you right now. Your teacher will let you know when the next assessment is
            ready.
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {assigned.map((test) => (
              <li
                key={test.id}
                className="flex flex-col justify-between rounded-3xl border border-brand-primary/15 bg-white p-6 shadow-sm"
              >
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-brand-primary/70">
                    {test.type === "entrance" ? "Entrance Test" : test.type}
                  </p>
                  <h3 className="text-xl font-semibold text-brand-primary-dark">
                    {test.status === "in_progress" ? "Continue your assessment" : "Your entrance assessment"}
                  </h3>
                  <p className="text-sm text-neutral-muted">
                    Assigned {test.assigned_at ? formatDistanceToNow(new Date(test.assigned_at), { addSuffix: true }) : "recently"}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    href={`/assessment?test=${test.id}`}
                    className="inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark"
                  >
                    {test.status === "in_progress" ? "Resume test" : "Start test"}
                  </Link>
                  <Link
                    href="/resources/prep"
                    className="inline-flex items-center rounded-full border border-brand-primary/30 px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:border-brand-primary hover:text-brand-primary-dark"
                  >
                    Review tips
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand-primary-dark">Completed assessments</h2>
        {completed.length === 0 ? (
          <div className="rounded-3xl border border-brand-primary/10 bg-white p-6 text-sm text-neutral-muted">
            You haven&rsquo;t completed any assessments yet. Finished tests will appear here for easy review.
          </div>
        ) : (
          <ul className="space-y-3 text-sm text-neutral-700">
            {completed.map((test) => (
              <li
                key={test.id}
                className="flex flex-col gap-1 rounded-3xl border border-brand-primary/15 bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-brand-primary/70">
                    {test.type === "entrance" ? "Entrance Test" : test.type}
                  </p>
                  <p className="font-medium text-brand-primary-dark">
                    Completed {test.completed_at ? formatDistanceToNow(new Date(test.completed_at), { addSuffix: true }) : "recently"}
                  </p>
                </div>
                <Link
                  href={`/dashboard/tests/${test.id}`}
                  className="inline-flex items-center rounded-full border border-brand-primary/30 px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:border-brand-primary hover:text-brand-primary-dark"
                >
                  View summary
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default StudentPortal;
