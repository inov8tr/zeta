import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format, startOfMonth, subMonths } from "date-fns";

import PerformanceTrendChart from "@/components/admin/performance/PerformanceTrendChart";
import StatusBreakdownChart from "@/components/admin/performance/StatusBreakdownChart";
import type { Database } from "@/lib/database.types";

type CompletedStatus = "completed" | "reviewed";
const COMPLETED_STATUSES: CompletedStatus[] = ["completed", "reviewed"];

type ClassRow = Pick<Database["public"]["Tables"]["classes"]["Row"], "id" | "name" | "level">;
type StudentProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "user_id" | "full_name" | "class_id">;
type TestRow = Pick<
  Database["public"]["Tables"]["tests"]["Row"],
  "id" | "student_id" | "status" | "total_score" | "assigned_at" | "completed_at" | "elapsed_ms"
>;

type TrendPoint = { month: string; assigned: number; completed: number };
type StatusPoint = { status: string; value: number };

interface StudentLeaderboardRow {
  studentId: string;
  name: string;
  latestScore: number | null;
  improvement: number | null;
  attempts: number;
  lastCompletedAt: string | null;
}

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

const TeacherDashboardPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const now = new Date();
  const windowStart = startOfMonth(subMonths(now, 5));
  const windowIso = windowStart.toISOString();

  const { data: classesDataRaw } = await supabase
    .from("classes")
    .select("id, name, level")
    .eq("teacher_id", user.id);

  const classes: ClassRow[] = (classesDataRaw as ClassRow[] | null) ?? [];
  const classIds = classes.map((cls) => cls.id);

  let students: StudentProfileRow[] = [];
  if (classIds.length > 0) {
    const { data: studentRows } = await supabase
      .from("profiles")
      .select("user_id, full_name, class_id")
      .in("class_id", classIds);
    students = (studentRows as StudentProfileRow[] | null) ?? [];
  }

  const studentIds = students.map((student) => student.user_id);

  let tests: TestRow[] = [];
  if (studentIds.length > 0) {
    const { data: testRows } = await supabase
      .from("tests")
      .select("id, student_id, status, total_score, assigned_at, completed_at, elapsed_ms")
      .in("student_id", studentIds)
      .or(`assigned_at.gte.${windowIso},completed_at.gte.${windowIso}`);
    tests = (testRows as TestRow[] | null) ?? [];
  }

  const totalStudents = students.length;
  const totalTests = tests.length;
  const completedTests = tests.filter((test) => COMPLETED_STATUSES.includes((test.status ?? "") as CompletedStatus));
  const avgScore =
    completedTests.length > 0
      ? completedTests.reduce((sum, test) => sum + Number(test.total_score ?? 0), 0) / completedTests.length
      : null;
  const completionRate = totalTests > 0 ? (completedTests.length / totalTests) * 100 : 0;
  const avgElapsedMs =
    completedTests.length > 0
      ? completedTests.reduce((sum, test) => sum + Number(test.elapsed_ms ?? 0), 0) / completedTests.length
      : null;

  const studentsById = new Map(students.map((student) => [student.user_id, student] as const));

  const assignedCounts = new Map<string, number>();
  const completedCounts = new Map<string, number>();
  const statusTotals: Record<string, number> = {
    assigned: 0,
    in_progress: 0,
    completed: 0,
    reviewed: 0,
    other: 0,
  };

  const classAggregates = new Map<string, { totalScore: number; testCount: number }>();
  const completedTestsByStudent = new Map<string, TestRow[]>();

  tests.forEach((test) => {
    const status = (test.status ?? "").toLowerCase();
    if (status === "assigned" || status === "in_progress" || status === "completed" || status === "reviewed") {
      statusTotals[status] += 1;
    } else {
      statusTotals.other += 1;
    }

    if (test.assigned_at) {
      const assignedDate = new Date(test.assigned_at);
      if (!Number.isNaN(assignedDate.getTime()) && assignedDate >= windowStart) {
        const bucket = format(startOfMonth(assignedDate), "yyyy-MM");
        assignedCounts.set(bucket, (assignedCounts.get(bucket) ?? 0) + 1);
      }
    }

    if (test.completed_at && COMPLETED_STATUSES.includes(status as CompletedStatus)) {
      const completedDate = new Date(test.completed_at);
      if (!Number.isNaN(completedDate.getTime()) && completedDate >= windowStart) {
        const bucket = format(startOfMonth(completedDate), "yyyy-MM");
        completedCounts.set(bucket, (completedCounts.get(bucket) ?? 0) + 1);
      }

      if (typeof test.total_score === "number") {
        const student = studentsById.get(test.student_id ?? "");
        if (student?.class_id) {
          const aggregate = classAggregates.get(student.class_id) ?? { totalScore: 0, testCount: 0 };
          aggregate.totalScore += Number(test.total_score ?? 0);
          aggregate.testCount += 1;
          classAggregates.set(student.class_id, aggregate);
        }
      }

      if (test.student_id) {
        const list = completedTestsByStudent.get(test.student_id) ?? [];
        list.push(test);
        completedTestsByStudent.set(test.student_id, list);
      }
    }
  });

  const monthBuckets: Array<{ key: string; label: string }> = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = subMonths(startOfMonth(now), offset);
    monthBuckets.push({ key: format(monthDate, "yyyy-MM"), label: format(monthDate, "MMM") });
  }

  const trendData: TrendPoint[] = monthBuckets.map(({ key, label }) => ({
    month: label,
    assigned: assignedCounts.get(key) ?? 0,
    completed: completedCounts.get(key) ?? 0,
  }));

  const statusChartData: StatusPoint[] = [
    { status: "Assigned", value: statusTotals.assigned },
    { status: "In progress", value: statusTotals.in_progress },
    { status: "Completed", value: statusTotals.completed },
    { status: "Reviewed", value: statusTotals.reviewed },
  ].filter((item) => item.value > 0);

  if (statusTotals.other > 0) {
    statusChartData.push({ status: "Other", value: statusTotals.other });
  }

  const classRows = classes
    .map((cls) => {
      const aggregate = classAggregates.get(cls.id);
      return {
        classId: cls.id,
        className: cls.name,
        level: cls.level,
        avgScore: aggregate && aggregate.testCount > 0 ? aggregate.totalScore / aggregate.testCount : null,
        testCount: aggregate?.testCount ?? 0,
      };
    })
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));

  const leaderboard: StudentLeaderboardRow[] = Array.from(completedTestsByStudent.entries())
    .map(([studentId, studentTests]) => {
      const sorted = studentTests
        .filter((test) => typeof test.total_score === "number")
        .sort((a, b) => new Date(a.completed_at ?? a.assigned_at ?? 0).getTime() - new Date(b.completed_at ?? b.assigned_at ?? 0).getTime());

      if (sorted.length === 0) {
        return null;
      }

      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const firstScore = typeof first.total_score === "number" ? first.total_score : null;
      const lastScore = typeof last.total_score === "number" ? last.total_score : null;
      const improvement = firstScore != null && lastScore != null ? lastScore - firstScore : null;
      const profile = studentsById.get(studentId);

      return {
        studentId,
        name: profile?.full_name ?? "Unnamed student",
        latestScore: lastScore,
        improvement,
        attempts: sorted.length,
        lastCompletedAt: last.completed_at ?? last.assigned_at ?? null,
      } satisfies StudentLeaderboardRow;
    })
    .filter((row): row is StudentLeaderboardRow => Boolean(row))
    .sort((a, b) => {
      const improvementDiff = (b.improvement ?? -Infinity) - (a.improvement ?? -Infinity);
      if (Number.isFinite(improvementDiff) && improvementDiff !== 0) {
        return improvementDiff;
      }
      return (b.latestScore ?? 0) - (a.latestScore ?? 0);
    })
    .slice(0, 5);

  const hasTrendData = trendData.some((point) => point.assigned > 0 || point.completed > 0);
  const hasStatusData = statusChartData.some((item) => item.value > 0);
  const hasClassData = classRows.some((row) => (row.avgScore ?? 0) > 0);

  const summaryCards = [
    {
      title: "My students",
      value: numberFormatter.format(totalStudents),
      description: `${classes.length === 1 ? "1 class" : `${classes.length} classes`} assigned to you`,
    },
    {
      title: "Tests assigned",
      value: numberFormatter.format(totalTests),
      description: `${numberFormatter.format(completedTests.length)} completed so far`,
    },
    {
      title: "Average score",
      value: typeof avgScore === "number" ? `${decimalFormatter.format(avgScore)}%` : "—",
      description: completedTests.length > 0 ? "Calculated from completed tests" : "Waiting for completions",
    },
    {
      title: "Completion rate",
      value: totalTests > 0 ? `${decimalFormatter.format(completionRate)}%` : "—",
      description:
        typeof avgElapsedMs === "number"
          ? `Average finish time ${decimalFormatter.format(avgElapsedMs / 60000)} min`
          : "Track momentum as students finish",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Classroom insights</h1>
        <p className="text-sm text-neutral-muted">Monitor how your classes are progressing through Zeta assessments.</p>
      </header>

      {classes.length === 0 ? (
        <TeacherEmptyState message="No classes are assigned to you yet. Please contact an admin to link your classes." />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.title}
            className="flex flex-col justify-between rounded-3xl border border-brand-primary/10 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="text-xs uppercase tracking-[0.4em] text-brand-primary/60">{card.title}</div>
            <div className="py-4 text-4xl font-semibold text-brand-primary-dark">{card.value}</div>
            <p className="text-sm font-medium text-brand-primary-dark/80">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
          <header className="border-b border-brand-primary/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-brand-primary-dark">Assessment momentum</h2>
            <p className="text-xs text-neutral-muted">Assignments and completions over the past six months.</p>
          </header>
          <div className="px-6 pb-6 pt-2">
            {hasTrendData ? <PerformanceTrendChart data={trendData} /> : <TeacherEmptyState message="Assign a test to start tracking momentum." />}
          </div>
        </article>
        <article className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
          <header className="border-b border-brand-primary/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-brand-primary-dark">Status breakdown</h2>
            <p className="text-xs text-neutral-muted">Where each assigned test currently sits.</p>
          </header>
          <div className="px-6 pb-6 pt-2">
            {hasStatusData ? <StatusBreakdownChart data={statusChartData} /> : <TeacherEmptyState message="Once students start their tests, you will see a breakdown here." />}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ClassSummaryTable rows={classRows} hasData={hasClassData} />
        <StudentLeaderboard rows={leaderboard} />
      </section>
    </main>
  );
};

export default TeacherDashboardPage;

const TeacherEmptyState = ({ message }: { message: string }) => (
  <div className="flex h-56 items-center justify-center rounded-3xl border border-dashed border-brand-primary/20 bg-brand-primary/5 text-center text-sm text-neutral-muted">
    <p className="max-w-sm px-6">{message}</p>
  </div>
);

interface ClassSummaryTableProps {
  rows: Array<{
    classId: string;
    className: string;
    level: string | null;
    avgScore: number | null;
    testCount: number;
  }>;
  hasData: boolean;
}

const ClassSummaryTable = ({ rows, hasData }: ClassSummaryTableProps) => (
  <article className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
    <header className="border-b border-brand-primary/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-brand-primary-dark">Class performance</h2>
      <p className="text-xs text-neutral-muted">Average scores for your assigned classes.</p>
    </header>
    {hasData ? (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-primary/10 text-sm">
          <thead className="bg-brand-primary/5 text-xs uppercase tracking-wide text-brand-primary">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Class</th>
              <th className="px-6 py-3 text-left font-semibold">Average score</th>
              <th className="px-6 py-3 text-left font-semibold">Completed tests</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/10">
            {rows.map((row) => (
              <tr key={row.classId} className="hover:bg-brand-primary/10">
                <td className="px-6 py-3 font-medium text-brand-primary-dark">
                  {row.className}
                  {row.level ? <span className="ml-2 text-xs text-neutral-muted">Level {row.level}</span> : null}
                </td>
                <td className="px-6 py-3 text-neutral-800">{row.avgScore != null ? `${decimalFormatter.format(row.avgScore)}%` : "—"}</td>
                <td className="px-6 py-3 text-neutral-800">{numberFormatter.format(row.testCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="px-6 py-10 text-sm text-neutral-muted">Once students complete tests, class averages will appear here.</div>
    )}
  </article>
);

const StudentLeaderboard = ({ rows }: { rows: StudentLeaderboardRow[] }) => (
  <article className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
    <header className="border-b border-brand-primary/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-brand-primary-dark">Student highlights</h2>
      <p className="text-xs text-neutral-muted">Recent improvement based on completed assessments.</p>
    </header>
    {rows.length === 0 ? (
      <div className="px-6 py-10 text-sm text-neutral-muted">Keep an eye here for improvement once students submit tests.</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-primary/10 text-sm">
          <thead className="bg-brand-primary/5 text-xs uppercase tracking-wide text-brand-primary">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Student</th>
              <th className="px-6 py-3 text-left font-semibold">Latest score</th>
              <th className="px-6 py-3 text-left font-semibold">Improvement</th>
              <th className="px-6 py-3 text-left font-semibold">Attempts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/10">
            {rows.map((row) => (
              <tr key={row.studentId} className="hover:bg-brand-primary/10">
                <td className="px-6 py-3 font-medium text-brand-primary-dark">{row.name}</td>
                <td className="px-6 py-3 text-neutral-800">{row.latestScore != null ? `${decimalFormatter.format(row.latestScore)}%` : "—"}</td>
                <td className="px-6 py-3 text-neutral-800">
                  {row.improvement != null
                    ? `${row.improvement >= 0 ? "+" : ""}${decimalFormatter.format(row.improvement)}%`
                    : "—"}
                </td>
                <td className="px-6 py-3 text-neutral-800">{numberFormatter.format(row.attempts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </article>
);
