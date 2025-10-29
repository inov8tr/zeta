import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format, startOfMonth, subDays, subMonths } from "date-fns";

import GradeLevelChart, { type GradeLevelSeries } from "@/components/admin/performance/GradeLevelChart";
import PerformanceTrendChart from "@/components/admin/performance/PerformanceTrendChart";
import StatusBreakdownChart from "@/components/admin/performance/StatusBreakdownChart";
import { Database } from "@/lib/database.types";
import type { ParentSurveyForm } from "@/app/(public)/survey/shared";

type CompletedStatus = "completed" | "reviewed";
const COMPLETED_STATUSES: CompletedStatus[] = ["completed", "reviewed"];

interface StatItem {
  title: string;
  description: string;
  href: string;
  value: number;
  accent: string;
}

interface PendingConsultation {
  id: string;
  full_name: string | null;
  email: string;
  preferred_start: string;
}

interface RecentTestRow {
  id: string;
  status: string;
  total_score: number | null;
  assigned_at: string | null;
  completed_at: string | null;
  profiles: { full_name: string | null } | null;
}

type TestAnalyticsRow = Pick<
  Database["public"]["Tables"]["tests"]["Row"],
  | "id"
  | "student_id"
  | "status"
  | "total_score"
  | "assigned_at"
  | "completed_at"
  | "elapsed_ms"
  | "weighted_level"
>;

type StudentProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "user_id" | "class_id" | "full_name"
>;

type ClassRow = Pick<Database["public"]["Tables"]["classes"]["Row"], "id" | "name" | "level">;

type TestSectionRow = Pick<
  Database["public"]["Tables"]["test_sections"]["Row"],
  "test_id" | "section" | "final_level"
>;

type ParentSurveyRow = {
  student_id: string;
  data: ParentSurveyForm | null;
  created_at: string;
};

type StatusKey = "assigned" | "in_progress" | "completed" | "reviewed" | "other";

interface ClassPerformanceRow {
  classId: string;
  className: string;
  avgScore: number;
  testCount: number;
}

interface SectionWeaknessRow {
  section: string;
  averageLevel: number;
}

interface GradeWeaknessRow {
  grade: string;
  weakestSections: SectionWeaknessRow[];
}

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

const capitalizeSectionLabel = (value: string) => {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const normalizeGradeLabel = (value: string | null | undefined) => {
  if (!value) {
    return "Unassigned";
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Unassigned";
};

const AdminDashboardPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const now = new Date();
  const windowStart = startOfMonth(subMonths(now, 5));
  const windowIso = windowStart.toISOString();
  const thirtyDaysAgoIso = subDays(now, 30).toISOString();

  const [
    consultationsCountResult,
    pendingConsultationsResult,
    userCountResult,
    studentCountResult,
    teacherCountResult,
    classesResult,
    totalTestsResult,
    completedTestsResult,
    avgScoreResult,
    avgElapsedResult,
    testsCompletedThirtyResult,
    testsAnalyticsResult,
    pendingConsultationsList,
    recentTests,
  ] = await Promise.all([
    supabase.from("consultations").select("id", { count: "exact", head: true }),
    supabase
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "student"),
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "teacher"),
    supabase.from("classes").select("id, name, level"),
    supabase.from("tests").select("id", { count: "exact", head: true }),
    supabase
      .from("tests")
      .select("id", { count: "exact", head: true })
      .in("status", COMPLETED_STATUSES),
    supabase
      .from("tests")
      .select("avg_score:avg(total_score)")
      .in("status", COMPLETED_STATUSES)
      .not("total_score", "is", null)
      .maybeSingle<{ avg_score: number | null }>(),
    supabase
      .from("tests")
      .select("avg_elapsed:avg(elapsed_ms)")
      .in("status", COMPLETED_STATUSES)
      .not("elapsed_ms", "is", null)
      .maybeSingle<{ avg_elapsed: number | null }>(),
    supabase
      .from("tests")
      .select("id", { count: "exact", head: true })
      .in("status", COMPLETED_STATUSES)
      .gte("completed_at", thirtyDaysAgoIso),
    supabase
      .from("tests")
      .select("id, student_id, status, total_score, assigned_at, completed_at, elapsed_ms, weighted_level")
      .or(`assigned_at.gte.${windowIso},completed_at.gte.${windowIso}`),
    supabase
      .from("consultations")
      .select("id, full_name, email, preferred_start")
      .eq("status", "pending")
      .order("preferred_start", { ascending: true })
      .limit(5),
    supabase
      .from("tests")
      .select(
        "id, status, total_score, assigned_at, completed_at, profiles:student_id(full_name)"
      )
      .order("assigned_at", { ascending: false })
      .limit(5),
  ]);

  const totalConsultations = consultationsCountResult.count ?? 0;
  const pendingConsultationsCount = pendingConsultationsResult.count ?? 0;
  const totalUsers = userCountResult.count ?? 0;
  const totalStudents = studentCountResult.count ?? 0;
  const totalTeachers = teacherCountResult.count ?? 0;
  const classesData = (classesResult.data as ClassRow[] | null) ?? [];
  const totalClasses = classesData.length;
  const totalTests = totalTestsResult.count ?? 0;
  const completedTests = completedTestsResult.count ?? 0;
  const avgScore =
    typeof avgScoreResult.data?.avg_score === "number"
      ? Number(avgScoreResult.data.avg_score)
      : avgScoreResult.data?.avg_score != null
      ? Number(avgScoreResult.data.avg_score)
      : null;
  const avgElapsedMs =
    typeof avgElapsedResult.data?.avg_elapsed === "number"
      ? Number(avgElapsedResult.data.avg_elapsed)
      : avgElapsedResult.data?.avg_elapsed != null
      ? Number(avgElapsedResult.data.avg_elapsed)
      : null;
  const testsCompletedLast30 = testsCompletedThirtyResult.count ?? 0;
  const testsAnalytics = (testsAnalyticsResult.data as TestAnalyticsRow[] | null) ?? [];

  const completedTestsAll = testsAnalytics.filter((test) =>
    COMPLETED_STATUSES.includes((test.status ?? "") as CompletedStatus)
  );

  const completedTestsWithScores = completedTestsAll.filter(
    (test) => test.student_id && typeof test.total_score === "number"
  );

  const completedTestsWithLevel = completedTestsAll.filter(
    (test) => typeof test.weighted_level === "number" && test.student_id
  );

  const studentIds = Array.from(
    new Set(
      completedTestsAll
        .map((test) => test.student_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );

  let studentProfiles: StudentProfileRow[] = [];
  if (studentIds.length > 0) {
    const { data: studentProfileRows } = await supabase
      .from("profiles")
      .select("user_id, class_id, full_name")
      .in("user_id", studentIds);
    studentProfiles = (studentProfileRows as StudentProfileRow[] | null) ?? [];
  }

  const surveyGradeMap = new Map<string, string>();
  if (studentIds.length > 0) {
    const { data: surveyRows } = await supabase
      .from("parent_surveys")
      .select("student_id, data, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false });
    const typedSurveyRows = (surveyRows as ParentSurveyRow[] | null) ?? [];
    typedSurveyRows.forEach((row) => {
      if (!row.student_id || surveyGradeMap.has(row.student_id)) {
        return;
      }
      const payload = (row.data ?? null) as ParentSurveyForm | null;
      const gradeRaw = typeof payload?.grade === "string" ? payload.grade.trim() : null;
      surveyGradeMap.set(row.student_id, normalizeGradeLabel(gradeRaw));
    });
  }

  const classNameMap = new Map<string, string>();
  const classLevelMap = new Map<string, string | null>();
  classesData.forEach((cls) => {
    classNameMap.set(cls.id, cls.name);
    classLevelMap.set(cls.id, cls.level);
  });

  const studentClassMap = new Map<string, string | null>();
  studentProfiles.forEach((profile) => {
    studentClassMap.set(profile.user_id, profile.class_id);
  });

  const classAggregates = new Map<string, { classId: string; className: string; totalScore: number; testCount: number }>();

  completedTestsWithScores.forEach((test) => {
    const studentId = test.student_id as string;
    const classId = studentClassMap.get(studentId);
    if (!classId) {
      return;
    }
    const className = classNameMap.get(classId) ?? "Unassigned";
    const aggregate = classAggregates.get(classId) ?? {
      classId,
      className,
      totalScore: 0,
      testCount: 0,
    };
    aggregate.totalScore += Number(test.total_score ?? 0);
    aggregate.testCount += 1;
    classAggregates.set(classId, aggregate);
  });

  const testGradeMap = new Map<string, string>();
  const gradeStatsMap = new Map<string, { totalLevel: number; highLevel: number; lowLevel: number; count: number }>();
  const gradeMonthlyStats = new Map<string, Map<string, { totalLevel: number; highLevel: number; lowLevel: number; count: number }>>();
  const monthLabels = new Set<string>();
  const levelSamples: number[] = [];

  completedTestsWithLevel.forEach((test) => {
    const studentId = test.student_id as string;
    const classId = studentClassMap.get(studentId ?? "");
    const surveyGrade = surveyGradeMap.get(studentId ?? "");
    const classLevel = classId ? classLevelMap.get(classId) : null;
    const gradeLabel = normalizeGradeLabel(surveyGrade ?? classLevel ?? null);
    const levelValue = Number(test.weighted_level);
    if (Number.isNaN(levelValue)) {
      return;
    }
    const stats = gradeStatsMap.get(gradeLabel) ?? {
      totalLevel: 0,
      highLevel: Number.NEGATIVE_INFINITY,
      lowLevel: Number.POSITIVE_INFINITY,
      count: 0,
    };
    stats.totalLevel += levelValue;
    stats.count += 1;
    stats.highLevel = Math.max(stats.highLevel, levelValue);
    stats.lowLevel = Math.min(stats.lowLevel, levelValue);
    gradeStatsMap.set(gradeLabel, stats);
    levelSamples.push(levelValue);
    testGradeMap.set(test.id, gradeLabel);

    const completedAtRaw = test.completed_at ?? test.assigned_at;
    if (completedAtRaw) {
      const completedDate = new Date(completedAtRaw);
      if (!Number.isNaN(completedDate.getTime())) {
        const monthKey = format(startOfMonth(completedDate), "yyyy-MM");
        monthLabels.add(monthKey);
        const gradeMonthMap = gradeMonthlyStats.get(gradeLabel) ?? new Map<string, { totalLevel: number; highLevel: number; lowLevel: number; count: number }>();
        const monthStats = gradeMonthMap.get(monthKey) ?? {
          totalLevel: 0,
          highLevel: Number.NEGATIVE_INFINITY,
          lowLevel: Number.POSITIVE_INFINITY,
          count: 0,
        };
        monthStats.totalLevel += levelValue;
        monthStats.count += 1;
        monthStats.highLevel = Math.max(monthStats.highLevel, levelValue);
        monthStats.lowLevel = Math.min(monthStats.lowLevel, levelValue);
        gradeMonthMap.set(monthKey, monthStats);
        gradeMonthlyStats.set(gradeLabel, gradeMonthMap);
      }
    }
  });

  const sortedMonths = Array.from(monthLabels.values()).sort();

  const gradeSeries: GradeLevelSeries[] = Array.from(gradeMonthlyStats.entries())
    .map(([grade, monthMap]) => {
      const points = sortedMonths.map((monthKey) => {
        const stats = monthMap.get(monthKey);
        const monthDate = new Date(`${monthKey}-01T00:00:00`);
        const label = Number.isNaN(monthDate.getTime()) ? monthKey : format(monthDate, "MMM yyyy");
        if (!stats || stats.count === 0) {
          return { monthLabel: label, avgLevel: null, highLevel: null, lowLevel: null };
        }
        return {
          monthLabel: label,
          avgLevel: stats.totalLevel / stats.count,
          highLevel: stats.highLevel,
          lowLevel: stats.lowLevel,
        };
      });
      return { grade, points } satisfies GradeLevelSeries;
    })
    .sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true, sensitivity: "base" }));

  const programAverageLevel = levelSamples.length > 0 ? levelSamples.reduce((sum, value) => sum + value, 0) / levelSamples.length : null;
  const programHighLevel = levelSamples.length > 0 ? Math.max(...levelSamples) : null;
  const programLowLevel = levelSamples.length > 0 ? Math.min(...levelSamples) : null;

  let testSections: TestSectionRow[] = [];
  const completedTestIds = completedTestsAll.map((test) => test.id).filter((id): id is string => typeof id === "string" && id.length > 0);
  if (completedTestIds.length > 0) {
    const { data: sectionRows } = await supabase
      .from("test_sections")
      .select("test_id, section, final_level")
      .in("test_id", completedTestIds);
    testSections = (sectionRows as TestSectionRow[] | null) ?? [];
  }

  const sectionTotals = new Map<string, { total: number; count: number }>();
  const gradeSectionTotals = new Map<string, Map<string, { total: number; count: number }>>();

  testSections.forEach((sectionRow) => {
    if (sectionRow.final_level == null) {
      return;
    }
    const levelValue = Number(sectionRow.final_level);
    if (Number.isNaN(levelValue)) {
      return;
    }

    const overall = sectionTotals.get(sectionRow.section) ?? { total: 0, count: 0 };
    overall.total += levelValue;
    overall.count += 1;
    sectionTotals.set(sectionRow.section, overall);

    const gradeLabel = testGradeMap.get(sectionRow.test_id) ?? "Unassigned";
    const gradeSections = gradeSectionTotals.get(gradeLabel) ?? new Map<string, { total: number; count: number }>();
    const gradeSection = gradeSections.get(sectionRow.section) ?? { total: 0, count: 0 };
    gradeSection.total += levelValue;
    gradeSection.count += 1;
    gradeSections.set(sectionRow.section, gradeSection);
    gradeSectionTotals.set(gradeLabel, gradeSections);
  });

  const overallWeaknesses: SectionWeaknessRow[] = Array.from(sectionTotals.entries())
    .map(([section, stats]) => ({
      section,
      averageLevel: stats.count > 0 ? stats.total / stats.count : Number.POSITIVE_INFINITY,
    }))
    .filter((item) => Number.isFinite(item.averageLevel))
    .sort((a, b) => a.averageLevel - b.averageLevel)
    .slice(0, 3);

  const gradeWeaknessRows: GradeWeaknessRow[] = Array.from(gradeSectionTotals.entries())
    .map(([grade, sectionMap]) => {
      const weakestSections = Array.from(sectionMap.entries())
        .map(([section, stats]) => ({
          section,
          averageLevel: stats.count > 0 ? stats.total / stats.count : Number.POSITIVE_INFINITY,
        }))
        .filter((item) => Number.isFinite(item.averageLevel))
        .sort((a, b) => a.averageLevel - b.averageLevel)
        .slice(0, 3);
      return { grade, weakestSections } satisfies GradeWeaknessRow;
    })
    .filter((row) => row.weakestSections.length > 0)
    .sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true, sensitivity: "base" }));

  const classPerformanceRows: ClassPerformanceRow[] = Array.from(classAggregates.values())
    .map((item) => ({
      classId: item.classId,
      className: item.className,
      avgScore: item.testCount > 0 ? item.totalScore / item.testCount : 0,
      testCount: item.testCount,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  const monthBuckets: Array<{ key: string; label: string }> = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = subMonths(startOfMonth(now), offset);
    monthBuckets.push({ key: format(monthDate, "yyyy-MM"), label: format(monthDate, "MMM") });
  }

  const assignedCounts = new Map<string, number>();
  const completedCounts = new Map<string, number>();
  const statusTotals: Record<StatusKey, number> = {
    assigned: 0,
    in_progress: 0,
    completed: 0,
    reviewed: 0,
    other: 0,
  };

  testsAnalytics.forEach((test) => {
    const normalizedStatus = (test.status ?? "").toLowerCase();
    if (normalizedStatus === "assigned" || normalizedStatus === "in_progress" || normalizedStatus === "completed" || normalizedStatus === "reviewed") {
      statusTotals[normalizedStatus as StatusKey] += 1;
    } else {
      statusTotals.other += 1;
    }

    if (test.assigned_at) {
      const assignedDate = new Date(test.assigned_at);
      if (!Number.isNaN(assignedDate.getTime()) && assignedDate >= windowStart) {
        const key = format(startOfMonth(assignedDate), "yyyy-MM");
        assignedCounts.set(key, (assignedCounts.get(key) ?? 0) + 1);
      }
    }

    if (test.completed_at && COMPLETED_STATUSES.includes(normalizedStatus as CompletedStatus)) {
      const completedDate = new Date(test.completed_at);
      if (!Number.isNaN(completedDate.getTime()) && completedDate >= windowStart) {
        const key = format(startOfMonth(completedDate), "yyyy-MM");
        completedCounts.set(key, (completedCounts.get(key) ?? 0) + 1);
      }
    }
  });

  const trendData = monthBuckets.map(({ key, label }) => ({
    month: label,
    assigned: assignedCounts.get(key) ?? 0,
    completed: completedCounts.get(key) ?? 0,
  }));

  const statusChartData = [
    { status: "Assigned", value: statusTotals.assigned },
    { status: "In progress", value: statusTotals.in_progress },
    { status: "Completed", value: statusTotals.completed },
    { status: "Reviewed", value: statusTotals.reviewed },
  ].filter((item) => item.value > 0);

  if (statusTotals.other > 0) {
    statusChartData.push({ status: "Other", value: statusTotals.other });
  }

  const completionRate = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;
  const avgCompletionMinutes = typeof avgElapsedMs === "number" ? avgElapsedMs / 60000 : null;

  const summaryCards = [
    {
      title: "Students enrolled",
      value: numberFormatter.format(totalStudents),
      description: `${numberFormatter.format(totalTeachers)} teachers across ${numberFormatter.format(totalClasses)} classes`,
      accent: "from-white via-brand-primary/10 to-brand-primary/5",
    },
    {
      title: "Tests completed (30d)",
      value: numberFormatter.format(testsCompletedLast30),
      description: `${numberFormatter.format(completedTests)} completed overall`,
      accent: "from-white via-brand-accent/10 to-brand-accent/5",
    },
    {
      title: "Average score",
      value: typeof avgScore === "number" ? `${decimalFormatter.format(avgScore)}%` : "—",
      description:
        completedTests > 0
          ? `Based on ${numberFormatter.format(completedTests)} completed tests`
          : "No completed tests yet",
      accent: "from-white via-brand-primary/10 to-brand-primary/5",
    },
    {
      title: "Completion rate",
      value: totalTests > 0 ? `${decimalFormatter.format(completionRate)}%` : "—",
      description:
        typeof avgCompletionMinutes === "number"
          ? `Avg time to finish ${decimalFormatter.format(avgCompletionMinutes)} min`
          : "Waiting for additional completions",
      accent: "from-white via-brand-primary-dark/10 to-brand-primary-dark/5",
    },
  ];

  const pendingConsultationItems: PendingConsultation[] = (
    (pendingConsultationsList.data as Array<{
      id: string;
      full_name: string | null;
      email: string;
      preferred_start: string;
    }> | null) ?? []
  ).map((item) => ({
    id: item.id,
    full_name: item.full_name,
    email: item.email,
    preferred_start: item.preferred_start,
  }));

  const recentTestItems: RecentTestRow[] =
    (recentTests.data as Array<RecentTestRow> | null) ?? [];

  const stats: StatItem[] = [
    {
      title: "Consultations",
      description: `${pendingConsultationsCount} pending responses`,
      href: "/dashboard/consultations",
      value: totalConsultations,
      accent: "text-brand-primary bg-brand-primary/10",
    },
    {
      title: "Users",
      description: `${numberFormatter.format(totalStudents)} students · ${numberFormatter.format(totalTeachers)} teachers`,
      href: "/dashboard/users",
      value: totalUsers,
      accent: "text-brand-primary-dark bg-brand-primary/10",
    },
    {
      title: "Classes",
      description: "Assign students to cohorts",
      href: "/dashboard/classes",
      value: totalClasses,
      accent: "text-brand-accent-dark bg-brand-accent/10",
    },
    {
      title: "Tests",
      description: `Completion rate ${totalTests > 0 ? `${decimalFormatter.format(completionRate)}%` : "—"}`,
      href: "/dashboard/tests",
      value: totalTests,
      accent: "text-brand-primary bg-brand-primary/10",
    },
  ];

  const highlights: string[] = [];
  highlights.push(`${numberFormatter.format(completedTests)} tests completed overall`);
  if (typeof avgScore === "number") {
    highlights.push(`Average score ${decimalFormatter.format(avgScore)}%`);
  }
  if (programAverageLevel != null) {
    highlights.push(`Program average level ${decimalFormatter.format(programAverageLevel)}`);
  }
  if (typeof avgCompletionMinutes === "number") {
    highlights.push(`Average completion time ${decimalFormatter.format(avgCompletionMinutes)} minutes`);
  }
  if (classPerformanceRows.length > 0) {
    const topClass = classPerformanceRows[0];
    highlights.push(
      `Top class ${topClass.className} at ${decimalFormatter.format(topClass.avgScore)}% across ${numberFormatter.format(
        topClass.testCount
      )} tests`
    );
  }
  if (overallWeaknesses.length > 0) {
    const weakest = overallWeaknesses[0];
    highlights.push(`Greatest opportunity: ${capitalizeSectionLabel(weakest.section)} (avg level ${decimalFormatter.format(weakest.averageLevel)})`);
  }

  const hasTrendData = trendData.some((point) => point.assigned > 0 || point.completed > 0);
  const hasStatusData = statusChartData.some((item) => item.value > 0);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Program overview</h1>
        <p className="text-sm text-neutral-muted">
          Track enrollment, assessment progress, and class performance across the academy.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.title}
            className={`flex flex-col justify-between rounded-3xl border border-white/40 bg-gradient-to-br ${card.accent} p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg`}
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
            {hasTrendData ? (
              <PerformanceTrendChart data={trendData} />
            ) : (
              <EmptyState message="No test assignments in the selected window." />
            )}
          </div>
        </article>
        <article className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
          <header className="border-b border-brand-primary/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-brand-primary-dark">Test status breakdown</h2>
            <p className="text-xs text-neutral-muted">Distribution of tests by current progress stage.</p>
          </header>
          <div className="px-6 pb-6 pt-2">
            {hasStatusData ? (
              <StatusBreakdownChart data={statusChartData} />
            ) : (
              <EmptyState message="No recent tests to analyse." />
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <GradeLevelChart gradeSeries={gradeSeries} />
        <ProgramLevelCard
          programAverageLevel={programAverageLevel}
          programHighLevel={programHighLevel}
          programLowLevel={programLowLevel}
          overallWeaknesses={overallWeaknesses}
        />
      </section>

      {gradeWeaknessRows.length > 0 ? <GradeWeaknessesCard rows={gradeWeaknessRows} /> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ClassPerformanceTable rows={classPerformanceRows} />
        <ProgramHighlightsCard highlights={highlights} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="group flex flex-col justify-between rounded-3xl border border-brand-primary/10 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="text-xs uppercase tracking-[0.4em] text-brand-primary/60">{stat.title}</div>
            <div className="py-4 text-4xl font-semibold text-brand-primary-dark">{stat.value}</div>
            <p className={`text-sm font-medium rounded-full px-3 py-1 ${stat.accent}`}>{stat.description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
        <PendingConsultationsCard consultations={pendingConsultationItems} />
        <RecentTestsCard tests={recentTestItems} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardQuickLink
          title="Control availability"
          description="Add or remove consultation slots, close bookings on busy days, and prevent double bookings."
          href="/dashboard/consultations/slots"
        />
        <DashboardQuickLink
          title="Assign classes and tests"
          description="Match students with the right class groups and entrance assessments."
          href="/dashboard/users"
        />
      </section>
    </main>
  );
};

const DashboardQuickLink = ({ title, description, href }: { title: string; description: string; href: string }) => (
  <Link
    href={href}
    className="flex flex-col justify-between rounded-3xl border border-brand-primary/15 bg-gradient-to-br from-white to-brand-primary/5 p-6 transition hover:border-brand-primary/40 hover:shadow-lg"
  >
    <div>
      <h2 className="text-xl font-semibold text-brand-primary-dark">{title}</h2>
      <p className="mt-2 text-sm text-neutral-muted">{description}</p>
    </div>
    <span className="mt-6 inline-flex items-center text-sm font-semibold text-brand-primary">
      Open <span className="ml-1 text-brand-accent">→</span>
    </span>
  </Link>
);

const PendingConsultationsCard = ({ consultations }: { consultations: PendingConsultation[] }) => (
  <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
    <header className="border-b border-brand-primary/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-brand-primary-dark">Pending consultations</h2>
      <p className="text-xs text-neutral-muted">Follow up with families waiting to hear back.</p>
    </header>
    <div className="divide-y divide-brand-primary/10">
      {consultations.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-neutral-muted">
          No pending consultations. Great job staying caught up!
        </div>
      ) : (
        consultations.map((consultation) => (
          <article key={consultation.id} className="flex items-center justify-between gap-3 px-6 py-4 text-sm text-neutral-800">
            <div>
              <div className="font-medium text-brand-primary-dark">{consultation.full_name ?? "Unnamed"}</div>
              <div className="text-xs text-neutral-muted">{consultation.email}</div>
            </div>
            <div className="flex flex-col items-end text-xs text-neutral-muted">
              <span>Preferred start</span>
              <span className="font-semibold text-brand-primary-dark">
                {format(new Date(consultation.preferred_start), "MMM d, yyyy p")}
              </span>
            </div>
          </article>
        ))
      )}
    </div>
    <div className="border-t border-brand-primary/10 px-6 py-4 text-right text-xs">
      <Link href="/dashboard/consultations" className="font-semibold text-brand-primary">
        Review all consultations →
      </Link>
    </div>
  </section>
);

const RecentTestsCard = ({ tests }: { tests: RecentTestRow[] }) => (
  <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
    <header className="border-b border-brand-primary/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-brand-primary-dark">Recent test activity</h2>
      <p className="text-xs text-neutral-muted">Latest assignments and completions across students.</p>
    </header>
    <div className="divide-y divide-brand-primary/10">
      {tests.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-neutral-muted">
          No tests assigned yet. Create a new entrance test to begin collecting data.
        </div>
      ) : (
        tests.map((test) => (
          <article key={test.id} className="grid gap-3 px-6 py-4 text-xs text-neutral-muted">
            <div className="flex items-center justify-between">
              <div className="font-medium text-brand-primary-dark">
                {test.profiles?.full_name ?? "Unknown student"}
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                test.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
              }`}>
                {test.status}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-neutral-800">
              <span>
                Assigned {test.assigned_at ? format(new Date(test.assigned_at), "MMM d") : "—"}
              </span>
              <span>
                Score {typeof test.total_score === "number" ? `${test.total_score}%` : "Pending"}
              </span>
              <span>
                {test.completed_at ? `Completed ${format(new Date(test.completed_at), "MMM d")}` : "In progress"}
              </span>
            </div>
          </article>
        ))
      )}
    </div>
    <div className="border-t border-brand-primary/10 px-6 py-4 text-right text-xs">
      <Link href="/dashboard/tests" className="font-semibold text-brand-primary">
        View all tests →
      </Link>
    </div>
  </section>
);

export default AdminDashboardPage;

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-brand-primary/20 bg-brand-primary/5 text-sm text-neutral-muted">
    {message}
  </div>
);

interface ProgramLevelCardProps {
  programAverageLevel: number | null;
  programHighLevel: number | null;
  programLowLevel: number | null;
  overallWeaknesses: SectionWeaknessRow[];
}

const ProgramLevelCard = ({ programAverageLevel, programHighLevel, programLowLevel, overallWeaknesses }: ProgramLevelCardProps) => (
  <section className="flex flex-col gap-4 rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
    <div>
      <h2 className="text-lg font-semibold text-brand-primary-dark">Program level summary</h2>
      <p className="text-xs text-neutral-muted">Average placement levels based on completed assessments.</p>
    </div>
    <dl className="grid grid-cols-2 gap-4 text-sm text-neutral-800">
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Average level</dt>
        <dd className="mt-1 text-2xl font-semibold text-brand-primary-dark">
          {programAverageLevel != null ? decimalFormatter.format(programAverageLevel) : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Range</dt>
        <dd className="mt-1 text-brand-primary-dark">
          {programLowLevel != null && programHighLevel != null
            ? `${decimalFormatter.format(programLowLevel)} – ${decimalFormatter.format(programHighLevel)}`
            : "—"}
        </dd>
      </div>
    </dl>
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-primary/70">Greatest opportunities</h3>
      {overallWeaknesses.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-muted">Section-level trends will appear once more tests are completed.</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm text-neutral-800">
          {overallWeaknesses.map((weakness) => (
            <li key={weakness.section} className="flex items-center justify-between rounded-2xl bg-brand-primary/5 px-3 py-2">
              <span className="font-medium text-brand-primary-dark">{capitalizeSectionLabel(weakness.section)}</span>
              <span className="text-xs text-neutral-muted">Avg level {decimalFormatter.format(weakness.averageLevel)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  </section>
);

const GradeWeaknessesCard = ({ rows }: { rows: GradeWeaknessRow[] }) => (
  <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
    <header className="mb-4 border-b border-brand-primary/10 pb-4">
      <h2 className="text-lg font-semibold text-brand-primary-dark">Grade-specific challenges</h2>
      <p className="text-xs text-neutral-muted">Lowest average levels by grade to focus your interventions.</p>
    </header>
    <div className="space-y-4 text-sm text-neutral-800">
      {rows.map((row) => (
        <div key={row.grade} className="rounded-2xl border border-brand-primary/10 bg-brand-primary/5 p-4">
          <h3 className="text-sm font-semibold text-brand-primary-dark">{row.grade}</h3>
          <ul className="mt-2 space-y-1 text-xs text-neutral-muted">
            {row.weakestSections.map((section) => (
              <li key={section.section} className="flex items-center justify-between">
                <span>{capitalizeSectionLabel(section.section)}</span>
                <span>Avg level {decimalFormatter.format(section.averageLevel)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

interface ClassPerformanceTableProps {
  rows: ClassPerformanceRow[];
}

const ClassPerformanceTable = ({ rows }: ClassPerformanceTableProps) => (
  <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
    <header className="border-b border-brand-primary/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-brand-primary-dark">Top class performance</h2>
      <p className="text-xs text-neutral-muted">Average scores for classes with completed assessments.</p>
    </header>
    {rows.length === 0 ? (
      <div className="px-6 py-10 text-sm text-neutral-muted">We need completed tests to calculate class performance.</div>
    ) : (
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
                <td className="px-6 py-3 font-medium text-brand-primary-dark">{row.className}</td>
                <td className="px-6 py-3 text-neutral-800">{decimalFormatter.format(row.avgScore)}%</td>
                <td className="px-6 py-3 text-neutral-800">{numberFormatter.format(row.testCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

const ProgramHighlightsCard = ({ highlights }: { highlights: string[] }) => (
  <section className="flex flex-col gap-4 rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
    <div>
      <h2 className="text-lg font-semibold text-brand-primary-dark">Program highlights</h2>
      <p className="text-xs text-neutral-muted">Key takeaways from recent assessment activity.</p>
    </div>
    {highlights.length === 0 ? (
      <p className="text-sm text-neutral-muted">Once students start completing tests, insights will appear here.</p>
    ) : (
      <ul className="space-y-2 text-sm text-neutral-800">
        {highlights.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-brand-primary" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    )}
  </section>
);
