import { format, startOfMonth, subMonths } from "date-fns";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

type CompletedStatus = "completed" | "reviewed";
const COMPLETED_STATUSES: CompletedStatus[] = ["completed", "reviewed"];

type ClassRow = Pick<Database["public"]["Tables"]["classes"]["Row"], "id" | "name" | "level">;
type StudentProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "user_id" | "full_name" | "class_id"
>;
type TestRow = Pick<
  Database["public"]["Tables"]["tests"]["Row"],
  "id" | "student_id" | "status" | "total_score" | "assigned_at" | "completed_at" | "elapsed_ms"
>;

export interface TrendPoint {
  month: string;
  assigned: number;
  completed: number;
}

export interface StatusPoint {
  status: string;
  value: number;
}

export interface ClassSummaryRow {
  classId: string;
  className: string;
  level: string | null;
  avgScore: number | null;
  testCount: number;
}

export interface StudentLeaderboardRow {
  studentId: string;
  name: string;
  latestScore: number | null;
  improvement: number | null;
  attempts: number;
  lastCompletedAt: string | null;
}

export interface ReviewQueueItem {
  id: string;
  studentName: string;
  completedAt: string | null;
  score: number | null;
}

export interface ActiveAssignmentItem {
  id: string;
  studentName: string;
  assignedAt: string | null;
  status: string;
}

export interface RosterSummaryItem {
  classId: string;
  className: string;
  level: string | null;
  studentCount: number;
}

export interface SummaryCard {
  title: string;
  value: string;
  description: string;
}

export interface TeacherDashboardData {
  summaryCards: SummaryCard[];
  trendData: TrendPoint[];
  hasTrendData: boolean;
  statusChartData: StatusPoint[];
  hasStatusData: boolean;
  classRows: ClassSummaryRow[];
  hasClassData: boolean;
  leaderboard: StudentLeaderboardRow[];
  reviewQueue: ReviewQueueItem[];
  outstandingReviewsCount: number;
  assignmentList: ActiveAssignmentItem[];
  activeAssignmentsCount: number;
  classRosterSummary: RosterSummaryItem[];
  totals: {
    totalStudents: number;
    classesCount: number;
    totalTests: number;
    completedTestsCount: number;
    avgScore: number | null;
    completionRate: number;
    avgElapsedMs: number | null;
  };
}

export const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export const decimalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

interface LoadOptions {
  months?: number;
}

export async function loadTeacherDashboardData(
  supabase: SupabaseClient<Database, "public">,
  userId: string,
  options: LoadOptions = {},
): Promise<TeacherDashboardData> {
  const months = options.months ?? 5;
  const now = new Date();
  const windowStart = startOfMonth(subMonths(now, months));
  const windowIso = windowStart.toISOString();

  const { data: classesDataRaw } = await supabase
    .from("classes")
    .select("id, name, level")
    .eq("teacher_id", userId);

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
  const completedTests = tests.filter((test) =>
    COMPLETED_STATUSES.includes((test.status ?? "") as CompletedStatus),
  );

  const avgScore =
    completedTests.length > 0
      ? completedTests.reduce((sum, test) => sum + Number(test.total_score ?? 0), 0) /
        completedTests.length
      : null;

  const completionRate = totalTests > 0 ? (completedTests.length / totalTests) * 100 : 0;

  const avgElapsedMs =
    completedTests.length > 0
      ? completedTests.reduce((sum, test) => sum + Number(test.elapsed_ms ?? 0), 0) /
        completedTests.length
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
          const aggregate =
            classAggregates.get(student.class_id) ?? { totalScore: 0, testCount: 0 };
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
  for (let offset = months; offset >= 0; offset -= 1) {
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

  const classRows: ClassSummaryRow[] = classes
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
        .sort(
          (a, b) =>
            new Date(a.completed_at ?? a.assigned_at ?? 0).getTime() -
            new Date(b.completed_at ?? b.assigned_at ?? 0).getTime(),
        );

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

  const pendingReviewTests = tests
    .filter((test) => (test.status ?? "").toLowerCase() === "completed")
    .sort(
      (a, b) =>
        new Date(b.completed_at ?? b.assigned_at ?? 0).getTime() -
        new Date(a.completed_at ?? a.assigned_at ?? 0).getTime(),
    );

  const outstandingReviewsCount = pendingReviewTests.length;

  const reviewQueue: ReviewQueueItem[] = pendingReviewTests.slice(0, 5).map((test) => {
    const profile = studentsById.get(test.student_id ?? "");
    return {
      id: test.id,
      studentName: profile?.full_name ?? "Unnamed student",
      completedAt: test.completed_at ?? test.assigned_at ?? null,
      score: typeof test.total_score === "number" ? test.total_score : null,
    };
  });

  const activeAssignments = tests
    .filter((test) => {
      const status = (test.status ?? "").toLowerCase();
      return status === "assigned" || status === "in_progress";
    })
    .sort(
      (a, b) =>
        new Date(a.assigned_at ?? a.completed_at ?? 0).getTime() -
        new Date(b.assigned_at ?? b.completed_at ?? 0).getTime(),
    );

  const activeAssignmentsCount = activeAssignments.length;

  const assignmentList: ActiveAssignmentItem[] = activeAssignments.slice(0, 5).map((test) => {
    const profile = studentsById.get(test.student_id ?? "");
    return {
      id: test.id,
      studentName: profile?.full_name ?? "Unnamed student",
      assignedAt: test.assigned_at ?? test.completed_at ?? null,
      status: (test.status ?? "assigned") as string,
    };
  });

  const classRosterSummary: RosterSummaryItem[] = classes.map((cls) => ({
    classId: cls.id,
    className: cls.name,
    level: cls.level,
    studentCount: students.filter((student) => student.class_id === cls.id).length,
  }));

  const hasTrendData = trendData.some((point) => point.assigned > 0 || point.completed > 0);
  const hasStatusData = statusChartData.some((item) => item.value > 0);
  const hasClassData = classRows.some((row) => (row.avgScore ?? 0) > 0);

  const summaryCards: SummaryCard[] = [
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

  return {
    summaryCards,
    trendData,
    hasTrendData,
    statusChartData,
    hasStatusData,
    classRows,
    hasClassData,
    leaderboard,
    reviewQueue,
    outstandingReviewsCount,
    assignmentList,
    activeAssignmentsCount,
    classRosterSummary,
    totals: {
      totalStudents,
      classesCount: classes.length,
      totalTests,
      completedTestsCount: completedTests.length,
      avgScore,
      completionRate,
      avgElapsedMs,
    },
  };
}
