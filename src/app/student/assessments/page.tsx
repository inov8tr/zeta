import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import ActiveAssessmentCard from "@/components/student/ActiveAssessmentCard";
import ProgressTimeline from "@/components/student/ProgressTimeline";
import { formatDateTime } from "@/lib/formatDateTime";

type TestRow = Pick<
  Database["public"]["Tables"]["tests"]["Row"],
  | "id"
  | "type"
  | "status"
  | "assigned_at"
  | "completed_at"
  | "started_at"
  | "last_seen_at"
  | "time_limit_seconds"
  | "elapsed_ms"
  | "total_score"
  | "weighted_level"
>;

const STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  reviewed: "Reviewed",
  cancelled: "Cancelled",
};

const STATUS_BADGES: Record<string, string> = {
  assigned: "bg-amber-100 text-amber-800",
  in_progress: "bg-brand-primary/10 text-brand-primary-dark",
  completed: "bg-emerald-100 text-emerald-700",
  reviewed: "bg-indigo-100 text-indigo-700",
  cancelled: "bg-neutral-200 text-neutral-600",
};

const StudentAssessmentsPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("tests")
    .select(
      "id, type, status, assigned_at, completed_at, started_at, last_seen_at, total_score, weighted_level, time_limit_seconds, elapsed_ms",
    )
    .eq("student_id", user.id)
    .order("assigned_at", { ascending: false })
    .returns<TestRow[]>();

  const tests = (data ?? []) as TestRow[];

  const activeTest =
    tests.find((test) => test.status === "in_progress") ?? tests.find((test) => test.status === "assigned");
  const queuedTests = tests.filter(
    (test) => test.id !== activeTest?.id && (test.status === "assigned" || test.status === "in_progress"),
  );
  const completedTests = tests.filter((test) => test.status === "completed" || test.status === "reviewed");

  const nextQueued = queuedTests[0] ?? null;
  const stats = [
    {
      label: "Total assessments",
      value: tests.length.toString(),
      helper: tests.length === 0 ? "None assigned yet" : "Assigned across all sections",
    },
    {
      label: activeTest ? "Active status" : "Active status",
      value: activeTest ? STATUS_LABELS[activeTest.status] ?? "In progress" : "Nothing active",
      helper: activeTest?.assigned_at ? `Assigned ${formatDateTime(activeTest.assigned_at) ?? "recently"}` : undefined,
    },
    {
      label: "Next in queue",
      value: nextQueued ? nextQueued.type.replace(/_/g, " ") : "Up to date",
      helper: nextQueued?.assigned_at ? formatDateTime(nextQueued.assigned_at) ?? undefined : undefined,
    },
    {
      label: "Completed",
      value: completedTests.length.toString(),
      helper: completedTests.length ? "Check your timeline below" : "Waiting for your first results",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Assessments</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-muted">
          Stay on top of what&apos;s assigned, what&apos;s queued next, and how your results are trending over time.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">{stat.value}</p>
            {stat.helper ? <p className="mt-1 text-xs text-neutral-500">{stat.helper}</p> : null}
          </article>
        ))}
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          We couldn&apos;t load your assessments right now. Please refresh or contact support if this continues.
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-brand-primary-dark">Current assessment</h2>
                <p className="text-sm text-neutral-muted">
                  Jump back into your latest assessment or get started as soon as you&lsquo;re ready.
                </p>
              </div>
            </header>
            <div className="mt-4">
              {activeTest ? (
                <ActiveAssessmentCard
                  test={{
                    id: activeTest.id,
                    type: activeTest.type,
                    status: activeTest.status as "assigned" | "in_progress",
                    assigned_at: activeTest.assigned_at,
                    time_limit_seconds: activeTest.time_limit_seconds,
                    elapsed_ms: activeTest.elapsed_ms,
                  }}
                />
              ) : (
                <div className="rounded-3xl border border-dashed border-brand-primary/20 bg-brand-primary/5 p-6 text-sm text-neutral-muted">
                  No active assessments right now. We&apos;ll let you know as soon as your teacher assigns one.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Upcoming queue</h2>
                <p className="text-sm text-neutral-muted">Track what&apos;s coming up next so you can plan your study time.</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                {queuedTests.length} pending
              </span>
            </header>
            <div className="mt-4 space-y-3">
              {queuedTests.length > 0 ? (
                queuedTests.map((test) => {
                  const badgeClasses = STATUS_BADGES[test.status] ?? "bg-neutral-200 text-neutral-700";
                  const friendlyType = test.type.replace(/_/g, " ");
                  const assigned = formatDateTime(test.assigned_at) ?? "recently";
                  const started = test.started_at ? formatDateTime(test.started_at) : null;
                  const lastSeen = test.last_seen_at ? formatDateTime(test.last_seen_at) : null;

                  return (
                    <article
                      key={test.id}
                      className="rounded-2xl border border-neutral-200 bg-neutral-lightest/70 px-4 py-4 shadow-sm transition hover:border-brand-primary/30 hover:bg-white"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 capitalize">{friendlyType}</p>
                          <p className="text-xs text-neutral-500">
                            Assigned {assigned}
                            {started ? ` · Started ${started}` : lastSeen ? ` · Last opened ${lastSeen}` : ""}
                          </p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
                          {STATUS_LABELS[test.status] ?? test.status}
                        </span>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-lightest/70 px-4 py-8 text-center text-sm text-neutral-muted">
                  You&apos;re caught up. New assessments will appear here automatically when they&apos;re assigned.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <header className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Assessment history</h2>
                <p className="text-sm text-neutral-muted">
                  Compare results and keep tabs on how your level improves over time.
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                {completedTests.length} completed
              </p>
            </header>
            <div className="mt-4">
              {completedTests.length > 0 ? (
                <ProgressTimeline tests={completedTests} />
              ) : (
                <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-lightest/70 px-4 py-8 text-sm text-neutral-muted">
                  Once you finish your first assessment, the timeline will show your progress and scores here.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4 rounded-3xl border border-brand-primary/15 bg-brand-primary/5 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Make each test count</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-700">
            <li>Review prep resources before you begin, especially for new sections.</li>
            <li>Use the queue to schedule short study sessions leading up to each assessment.</li>
            <li>Finished early? Revisit the timeline to see what worked and where to focus next.</li>
          </ul>
          <Link
            href="/student/resources"
            className="inline-flex items-center rounded-full bg-brand-primary px-5 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark"
          >
            Explore resources
          </Link>
        </aside>
      </section>
    </main>
  );
};

export default StudentAssessmentsPage;
