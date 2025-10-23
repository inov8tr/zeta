import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";

type TestRow = Database["public"]["Tables"]["tests"]["Row"];
type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "full_name">;
type SectionRow = Database["public"]["Tables"]["test_sections"]["Row"];
type ResponseRow = Database["public"]["Tables"]["responses"]["Row"];

interface ScorePageProps {
  params: Promise<{ id: string }>;
}

const formatDuration = (ms: number | null | undefined) => {
  if (!ms || ms <= 0) {
    return "—";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 1) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
};

const formatSectionName = (section: string) =>
  section.charAt(0).toUpperCase() + section.slice(1).replace(/_/g, " ");

const formatLevel = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  const str = value.toFixed(1);
  return str.endsWith(".0") ? str.replace(".0", ".0") : str;
};

const ScorePage = async ({ params }: ScorePageProps) => {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const testPromise = supabase
    .from("tests")
    .select("id, student_id, type, status, total_score, assigned_at, completed_at, elapsed_ms")
    .eq("id", id)
    .maybeSingle<TestRow>();

  const sectionsPromise = supabase
    .from("test_sections")
    .select("section, questions_served, correct_count, incorrect_count, score, final_level, current_level, current_sublevel")
    .eq("test_id", id)
    .returns<SectionRow[]>();

  const responsesPromise = supabase
    .from("responses")
    .select("id, section, correct, time_spent_ms, created_at")
    .eq("test_id", id)
    .order("created_at", { ascending: false })
    .returns<ResponseRow[]>();

  const [testResult, sectionsResult, responsesResult] = await Promise.all([
    testPromise,
    sectionsPromise,
    responsesPromise,
  ]);

  const { data: test, error: testError } = testResult;

  if (testError || !test) {
    notFound();
  }

  const { student_id: studentId } = test;

  const { data: profile } = studentId
    ? await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", studentId)
        .maybeSingle<ProfileRow>()
    : { data: null };

  const sections = (sectionsResult.data as SectionRow[] | null) ?? [];
  const responses = (responsesResult.data as ResponseRow[] | null) ?? [];

  const totalQuestions = responses.length;
  const correctResponses = responses.filter((response) => response.correct).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctResponses / totalQuestions) * 100) : null;
  const totalTimeMs =
    test.elapsed_ms && test.elapsed_ms > 0
      ? test.elapsed_ms
      : responses.reduce((sum, response) => sum + (response.time_spent_ms ?? 0), 0);

  const sectionsByName = sections.sort((a, b) => a.section.localeCompare(b.section));

  const recentResponses = responses.slice(0, 10);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link href={`/dashboard/tests/${test.id}`} className="text-xs font-semibold uppercase text-brand-primary/60">
            ← Back to test overview
          </Link>
          <h1 className="text-3xl font-semibold text-brand-primary-dark">{test.type} score dashboard</h1>
          <p className="text-sm text-neutral-muted">
            Student: <span className="font-medium text-brand-primary-dark">{profile?.full_name ?? "Unknown"}</span>
          </p>
        </div>
        <Link
          href="/dashboard/tests"
          className="inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark"
        >
          All tests
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total score" value={typeof test.total_score === "number" ? test.total_score : "Pending"} />
        <StatCard label="Accuracy" value={accuracy !== null ? `${accuracy}%` : "—"} />
        <StatCard label="Questions answered" value={totalQuestions} />
        <StatCard label="Time spent" value={formatDuration(totalTimeMs)} />
      </section>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <header className="border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Section breakdown</h2>
        </header>
        <div className="divide-y divide-brand-primary/10">
          {sectionsByName.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-neutral-muted">No section data recorded.</div>
          ) : (
            sectionsByName.map((section) => {
              const totalServed = section.questions_served;
              const correct = section.correct_count;
              const incorrect = section.incorrect_count;
              const sectionAccuracy =
                totalServed > 0 ? Math.round((correct / totalServed) * 100) : null;

              return (
                <article key={section.section} className="grid gap-4 px-6 py-4 text-sm text-neutral-800 sm:grid-cols-6">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-brand-primary/70">Section</div>
                    <div className="font-medium text-brand-primary-dark">{formatSectionName(section.section)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-brand-primary/70">Questions</div>
                    <div>{totalServed}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-brand-primary/70">Correct</div>
                    <div>{correct}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-brand-primary/70">Incorrect</div>
                    <div>{incorrect}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-brand-primary/70">Accuracy</div>
                    <div>{sectionAccuracy !== null ? `${sectionAccuracy}%` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-brand-primary/70">Level</div>
                    <div>{formatLevel(section.final_level)}</div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <header className="border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Recent responses</h2>
        </header>
        <div className="divide-y divide-brand-primary/10">
          {recentResponses.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-neutral-muted">No responses recorded.</div>
          ) : (
            recentResponses.map((response) => (
              <article key={response.id} className="grid gap-4 px-6 py-4 text-sm text-neutral-800 sm:grid-cols-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Section</div>
                  <div className="font-medium text-brand-primary-dark">{formatSectionName(response.section)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Result</div>
                  <div className={response.correct ? "text-emerald-600" : "text-red-600"}>
                    {response.correct ? "Correct" : "Incorrect"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Time</div>
                  <div>{formatDuration(response.time_spent_ms)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Submitted</div>
                  <div className="text-neutral-muted">
                    {response.created_at ? format(new Date(response.created_at), "MMM d, yyyy p") : "—"}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
    <div className="text-xs uppercase tracking-wide text-brand-primary/70">{label}</div>
    <div className="mt-2 text-2xl font-semibold text-brand-primary-dark">{value}</div>
  </section>
);

export default ScorePage;
