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

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Assessments</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-muted">
          View your upcoming assessments, resume in-progress tests, and track your progress over time.
        </p>
      </header>

      {error ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          We couldn&rsquo;t load your assessments. Please refresh or contact support if this continues.
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Current assessments</h2>
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
          <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-brand-primary-dark">No active assessments</h3>
            <p className="mt-2 text-sm text-neutral-muted">
              When your teacher assigns a new assessment, it will appear here with a quick start button.
            </p>
          </section>
        )}

        {queuedTests.length > 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-neutral-900">More to complete</h3>
            <ul className="mt-4 space-y-3 text-sm text-neutral-700">
              {queuedTests.map((test) => (
                <li
                  key={test.id}
                  className="flex flex-col gap-1 rounded-2xl border border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium capitalize">{test.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-neutral-500">
                      Assigned {formatDateTime(test.assigned_at) ?? "recently"}
                      {test.started_at
                        ? ` · Started ${formatDateTime(test.started_at) ?? ""}`
                        : test.last_seen_at
                          ? ` · Last opened ${formatDateTime(test.last_seen_at) ?? ""}`
                          : ""}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-student-primary/10 px-3 py-1 text-xs font-semibold text-student-primary">
                    {STATUS_LABELS[test.status] ?? test.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">Assessment history</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{completedTests.length} completed</p>
        </div>
        {completedTests.length > 0 ? (
          <ProgressTimeline tests={completedTests} />
        ) : (
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-600">
              Completed assessments will appear here along with your level and score history once you finish your first
              test.
            </p>
          </section>
        )}
      </section>
    </main>
  );
};

export default StudentAssessmentsPage;
