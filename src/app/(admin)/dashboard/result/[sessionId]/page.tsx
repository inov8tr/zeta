import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Trophy, Compass, Sparkles, Route } from "lucide-react";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";
import { SectionPerformanceComparison } from "@/components/dashboard/SectionPerformanceComparison";
import { OverallLevelGauge } from "@/components/dashboard/OverallLevelGauge";
import SectionDetailsAccordion, { SectionDetail, SectionDetailItem } from "@/components/dashboard/SectionDetailsAccordion";
import { SectionTrendList } from "@/components/dashboard/SectionTrendList";
import PrintButton from "@/components/dashboard/PrintButton";

type SectionPerformanceDatum = {
  section: string;
  score: number;
};

type TestRow = Database["public"]["Tables"]["tests"]["Row"];
type SectionRow = Pick<
  Database["public"]["Tables"]["test_sections"]["Row"],
  "test_id" | "section" | "questions_served" | "correct_count" | "incorrect_count" | "final_level" | "current_level" | "current_sublevel"
>;
type ResponseRow = Pick<
  Database["public"]["Tables"]["responses"]["Row"],
  "section" | "question_id" | "correct" | "time_spent_ms" | "created_at"
>;
type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "full_name" | "class_id">;

interface ResultPageProps {
  params: Promise<{ sessionId: string }>;
}

const toPercentage = (correct: number, total: number): number =>
  total > 0 ? Math.round((correct / total) * 100) : 0;

const formatLevel = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return "—";
  }
  const level = Number(value);
  if (Number.isNaN(level)) {
    return "—";
  }
  const formatted = level.toFixed(1);
  return formatted.endsWith(".0") ? formatted.slice(0, -1) : formatted;
};

const formatDuration = (milliseconds: number | null | undefined) => {
  if (!milliseconds) {
    return "—";
  }
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
  }
  return `${remainingSeconds}s`;
};

const titleCase = (value: string) =>
  value
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const summarizeStrengths = (data: SectionPerformanceDatum[]) => {
  const strengths = data.filter((item) => item.score >= 80).map((item) => titleCase(item.section));
  if (!strengths.length) {
    return "Keep building experience across all sections.";
  }
  if (strengths.length === 1) {
    return `Strength: ${strengths[0]}.`;
  }
  return `Strengths: ${strengths.slice(0, -1).join(", ")} and ${strengths.at(-1)}.`;
};

const summarizeOpportunities = (data: SectionPerformanceDatum[]) => {
  const opportunities = data
    .filter((item) => item.score < 70)
    .map((item) => titleCase(item.section));
  if (!opportunities.length) {
    return "Solid performance across the board—nice work!";
  }
  if (opportunities.length === 1) {
    return `Focus area: ${opportunities[0]}.`;
  }
  return `Focus areas: ${opportunities.slice(0, -1).join(", ")} and ${opportunities.at(-1)}.`;
};

const recommendNextSteps = (data: SectionPerformanceDatum[]) => {
  const steps: string[] = [];
  const opportunities = data.filter((item) => item.score < 70);
  opportunities.forEach((item) => {
    if (item.score < 50) {
      steps.push(`Schedule a one-on-one review for ${titleCase(item.section)} fundamentals.`);
    } else {
      steps.push(`Assign a targeted practice set for ${titleCase(item.section)}.`);
    }
  });

  if (!steps.length) {
    steps.push("Move ahead with the next module to keep your momentum going.");
    steps.push("Share these results with your teacher to celebrate your progress.");
  }

  return steps;
};

const ResultPage = async ({ params }: ResultPageProps) => {
  const { sessionId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const testPromise = supabase
    .from("tests")
    .select("id, student_id, type, status, total_score, weighted_level, elapsed_ms, completed_at")
    .eq("id", sessionId)
    .maybeSingle<TestRow>();

  const sectionsPromise = supabase
    .from("test_sections")
    .select("section, questions_served, correct_count, incorrect_count, final_level, current_level, current_sublevel")
    .eq("test_id", sessionId)
    .returns<SectionRow[]>();

  const responsesPromise = supabase
    .from("responses")
    .select("section, correct, time_spent_ms, question_id")
    .eq("test_id", sessionId)
    .returns<ResponseRow[]>();

  const [testResult, sectionsResult, responsesResult] = await Promise.all([
    testPromise,
    sectionsPromise,
    responsesPromise,
  ]);

  const { data: test, error: testError } = testResult;

  if (!test || testError) {
    notFound();
  }

  const { student_id: studentId } = test;

  const { data: profile } = studentId
    ? await supabase
        .from("profiles")
        .select("full_name, class_id")
        .eq("user_id", studentId)
        .maybeSingle<ProfileRow & { class_id: string | null }>()
    : { data: null };

  const sections = (sectionsResult.data as SectionRow[] | null) ?? [];
  const responses = (responsesResult.data as ResponseRow[] | null) ?? [];

  const { data: priorTestsData } = studentId
    ? await supabase
        .from("tests")
        .select("id, completed_at, total_score")
        .eq("student_id", studentId)
        .neq("id", sessionId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(3)
        .returns<Array<{ id: string; completed_at: string | null; total_score: number | null }>>()
    : { data: null };

  const priorTestIds = (priorTestsData ?? []).map((item) => item.id).filter((id): id is string => Boolean(id));

  const { data: priorSectionsData } = priorTestIds.length
    ? await supabase
        .from("test_sections")
        .select("test_id, section, correct_count, questions_served")
        .in("test_id", priorTestIds)
        .returns<
          Array<{
            test_id: string;
            section: string;
            correct_count: number;
            questions_served: number;
          }>
        >()
    : { data: null };

  const priorSections = priorSectionsData ?? [];

  const historyEntries: Array<{
    test_id: string;
    label: string;
    completed_at: string | null;
  }> = [
    {
      test_id: test.id,
      label: "Current",
      completed_at: test.completed_at,
    },
    ...((priorTestsData ?? []).map((item, index) => ({
      test_id: item.id,
      label: `Previous ${index + 1}`,
      completed_at: item.completed_at,
    })) ?? []),
  ];

  const sectionHistory = new Map<string, Array<{ label: string; accuracy: number; completed_at: string | null }>>();

  historyEntries.forEach((entry) => {
    const sourceSections = entry.test_id === test.id ? sections : priorSections.filter((row) => row.test_id === entry.test_id);
    sourceSections.forEach((row) => {
      const sectionName = titleCase(row.section);
      if (!sectionHistory.has(sectionName)) {
        sectionHistory.set(sectionName, []);
      }
      sectionHistory.get(sectionName)!.push({
        label: entry.label,
        accuracy: toPercentage(row.correct_count ?? 0, row.questions_served ?? 0),
        completed_at: entry.completed_at,
      });
    });
  });

  const sectionTrendEntries = Array.from(sectionHistory.entries()).map(([sectionName, history]) => ({
    section: sectionName,
    history: history.sort((a, b) => {
      const dateA = a.completed_at ? new Date(a.completed_at).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.completed_at ? new Date(b.completed_at).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    }),
  }));

  let classSectionAverages: Array<{ section: string; score: number }> | null = null;

  if (profile?.class_id) {
    const { data: classmatesData } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("class_id", profile.class_id)
      .returns<Array<{ user_id: string | null }>>();

    const classmateIds = (classmatesData ?? [])
      .map((row) => row.user_id)
      .filter((id): id is string => Boolean(id) && id !== studentId);

    if (classmateIds.length) {
      const { data: classTestsData } = await supabase
        .from("tests")
        .select("id")
        .in("student_id", classmateIds)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(80)
        .returns<Array<{ id: string }>>();

      const classTestIds = (classTestsData ?? []).map((row) => row.id).filter((id): id is string => Boolean(id));

      if (classTestIds.length) {
        const { data: classSectionsData } = await supabase
          .from("test_sections")
          .select("section, correct_count, questions_served")
          .in("test_id", classTestIds)
          .returns<Array<{ section: string; correct_count: number; questions_served: number }>>();

        const classSectionStats = new Map<string, { correct: number; attempts: number }>();

        (classSectionsData ?? []).forEach((row) => {
            const sectionName = titleCase(row.section);
            if (!classSectionStats.has(sectionName)) {
              classSectionStats.set(sectionName, { correct: 0, attempts: 0 });
            }
            const stat = classSectionStats.get(sectionName)!;
            stat.correct += row.correct_count ?? 0;
            stat.attempts += row.questions_served ?? 0;
          });

        classSectionAverages = Array.from(classSectionStats.entries()).map(([sectionName, stat]) => ({
          section: sectionName,
          score: stat.attempts > 0 ? Math.round((stat.correct / stat.attempts) * 100) : 0,
        }));
      }
    }
  }

  const breakdown: SectionPerformanceDatum[] = sections.map((section) => ({
    section: titleCase(section.section),
    score: toPercentage(section.correct_count, section.questions_served),
  }));

  const totalQuestions = responses.length;
  const correctResponses = responses.filter((response) => response.correct).length;
  const accuracy = totalQuestions ? Math.round((correctResponses / totalQuestions) * 100) : null;
  const totalTimeMs =
    test.elapsed_ms && test.elapsed_ms > 0
      ? test.elapsed_ms
      : responses.reduce((acc, response) => acc + (response.time_spent_ms ?? 0), 0);

  const questionIds = Array.from(
    new Set(responses.map((response) => response.question_id).filter((id): id is string => Boolean(id)))
  );

  const questionMeta = new Map<string, { section: string; skill_tags: string[] | null }>();

  if (questionIds.length > 0) {
    const { data: questionData } = await supabase
      .from("questions")
      .select("id, section, skill_tags")
      .in("id", questionIds);

    (questionData as Array<{ id: string; section: string; skill_tags: string[] | null }> | null)?.forEach(
      (question) => {
        questionMeta.set(question.id, {
          section: question.section,
          skill_tags: question.skill_tags,
        });
      }
    );
  }

  const tagAggregates = new Map<string, SectionDetailItem & { section: string }>();

  responses.forEach((response) => {
    const meta = response.question_id ? questionMeta.get(response.question_id) : null;
    const sectionName = titleCase(meta?.section ?? response.section ?? "General");
    const tags = meta?.skill_tags && meta.skill_tags.length > 0 ? meta.skill_tags : ["General"];

    tags.forEach((tagRaw) => {
      const tagName = titleCase(tagRaw);
      const key = `${sectionName}::${tagName}`;
      if (!tagAggregates.has(key)) {
        tagAggregates.set(key, {
          section: sectionName,
          tag: tagName,
          attempts: 0,
          correct: 0,
          averageTimeMs: 0,
          accuracy: 0,
        });
      }
      const aggregate = tagAggregates.get(key)!;
      aggregate.attempts += 1;
      aggregate.correct += response.correct ? 1 : 0;
      aggregate.averageTimeMs = (aggregate.averageTimeMs ?? 0) + (response.time_spent_ms ?? 0);
    });
  });

  const sectionDetailsMap = Array.from(tagAggregates.values()).reduce<Record<string, SectionDetail>>((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = { section: item.section, items: [] };
    }
    acc[item.section].items.push({
      tag: item.tag,
      attempts: item.attempts,
      correct: item.correct,
      accuracy: item.attempts > 0 ? Math.round((item.correct / item.attempts) * 100) : 0,
      averageTimeMs: item.attempts > 0 ? (item.averageTimeMs ?? 0) / item.attempts : null,
    });
    return acc;
  }, {});

  const sectionDetailsList: SectionDetail[] = Object.values(sectionDetailsMap)
    .map((section) => ({
      section: section.section,
      items: section.items.filter((item) => item.attempts > 0),
    }))
    .filter((section) => section.items.length > 0);

  const estimatedLevel = typeof test.weighted_level === "number" ? Number(test.weighted_level) : null;
  const maxProgramLevel = 7;

  const summaryStrengths = summarizeStrengths(breakdown);
  const summaryOpportunities = summarizeOpportunities(breakdown);
  const recommendedNextSteps = recommendNextSteps(breakdown);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 print:max-w-none print:w-full print:px-10 print:py-12">
      <div className="flex items-center justify-start">
        <PrintButton />
      </div>
      <header className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-4 py-1 text-sm font-semibold text-brand-primary">
          Entrance Test Results
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-brand-primary-dark">
          Great work{profile?.full_name ? `, ${profile.full_name}` : ""}!
        </h1>
        <p className="mt-2 text-sm text-neutral-muted">
          You’ve completed your entrance test{test.completed_at ? ` on ${format(new Date(test.completed_at), "MMM d, yyyy")}` : ""}.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-6">
          <StatCard icon={<Trophy className="text-yellow-500" size={32} />} label="Estimated Level" value={formatLevel(test.weighted_level)} />
          <StatCard
            icon={<Compass className="text-sky-500" size={32} />}
            label="Total Score"
            value={typeof test.total_score === "number" ? `${test.total_score}%` : "Pending"}
          />
          <StatCard
            icon={<Sparkles className="text-emerald-500" size={32} />}
            label="Accuracy"
            value={accuracy !== null ? `${accuracy}%` : "—"}
          />
          <StatCard
            icon={<Route className="text-fuchsia-500" size={32} />}
            label="Time Spent"
            value={formatDuration(totalTimeMs)}
          />
        </div>
      </header>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <div className="border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Overall Level Progress</h2>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center gap-3">
            <OverallLevelGauge level={estimatedLevel ?? 0} maxLevel={maxProgramLevel} />
            <p className="text-sm text-neutral-muted">
              {estimatedLevel
                ? `Tracking at Level ${formatLevel(estimatedLevel)} of ${maxProgramLevel}.`
                : "Level estimate pending additional responses."}
            </p>
          </div>
          <div className="space-y-3 text-sm text-neutral-700">
            <p>
              {estimatedLevel
                ? `You’re ${((Math.min(estimatedLevel, maxProgramLevel) / maxProgramLevel) * 100).toFixed(0)}% of the way through the program levels.`
                : "Once level data is available, your progress toward Level 7 will display here."}
            </p>
            <p>
              Use this view to align the student with the appropriate level in your seven-stage program and plan the next
              round of lessons or practice.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <div className="border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Section Performance Snapshot</h2>
        </div>
        <div className="p-6">
          <SectionPerformanceComparison
            studentData={breakdown}
            classData={classSectionAverages ?? undefined}
          />
        </div>
      </section>

      {sectionTrendEntries.length ? (
        <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
          <div className="border-b border-brand-primary/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-brand-primary-dark">Section Trends</h2>
          </div>
          <div className="p-6">
            <SectionTrendList entries={sectionTrendEntries} />
          </div>
        </section>
      ) : null}

      <SectionDetailsAccordion sections={sectionDetailsList} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
          <div className="border-b border-brand-primary/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-brand-primary-dark">Highlights</h2>
          </div>
          <div className="space-y-3 p-6 text-sm text-neutral-700">
            <p>
              <span className="font-semibold text-brand-primary-dark">Strengths:</span> {summaryStrengths}
            </p>
            <p>
              <span className="font-semibold text-brand-primary-dark">Focus areas:</span> {summaryOpportunities}
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
          <div className="border-b border-brand-primary/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-brand-primary-dark">Recommended Next Steps</h2>
          </div>
          <div className="p-6">
            <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-700">
              {recommendedNextSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="flex justify-center gap-4">
        <Link
          href="/dashboard/tests"
          className="inline-flex items-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          Back to all tests
        </Link>
        {studentId ? (
          <Link
            href={`/dashboard/users/${studentId}`}
            className="inline-flex items-center rounded-full border border-brand-primary px-5 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10"
          >
            View student profile
          </Link>
        ) : null}
      </div>
    </main>
  );
};

const StatCard = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="flex w-full max-w-[190px] flex-col items-center gap-2 rounded-3xl border border-brand-primary/10 bg-white p-6 text-center shadow-sm">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">{icon}</div>
    <div className="text-xs uppercase tracking-wide text-brand-primary/70">{label}</div>
    <div className="text-2xl font-semibold text-brand-primary-dark">{value}</div>
  </div>
);

export default ResultPage;
