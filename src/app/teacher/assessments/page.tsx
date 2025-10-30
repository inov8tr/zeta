import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import ActiveAssignmentList from "@/components/teacher/dashboard/ActiveAssignmentList";
import TeacherEmptyState from "@/components/teacher/TeacherEmptyState";
import PerformanceTrendChart from "@/components/admin/performance/PerformanceTrendChart";
import StatusBreakdownChart from "@/components/admin/performance/StatusBreakdownChart";
import type { Database } from "@/lib/database.types";

import { loadTeacherDashboardData } from "../dashboardData";

const TeacherAssessmentsPage = async () => {
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

  const data = await loadTeacherDashboardData(supabase, user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-teacher-primary-text">Assessment overview</h1>
        <p className="text-sm text-neutral-muted">
          Stay on top of momentum and see where assignments might need a nudge.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
          <header className="border-b border-teacher-primary/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-teacher-primary-text">Assessment momentum</h2>
            <p className="text-xs text-neutral-muted">
              Assignments and completions over the past six months.
            </p>
          </header>
          <div className="px-6 pb-6 pt-2">
            {data.hasTrendData ? (
              <PerformanceTrendChart data={data.trendData} />
            ) : (
              <TeacherEmptyState message="Assign a test to start tracking momentum." />
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
          <header className="border-b border-teacher-primary/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-teacher-primary-text">Status breakdown</h2>
            <p className="text-xs text-neutral-muted">
              Where each assigned test currently sits.
            </p>
          </header>
          <div className="px-6 pb-6 pt-2">
            {data.hasStatusData ? (
              <StatusBreakdownChart data={data.statusChartData} />
            ) : (
              <TeacherEmptyState message="Once students start their tests, you will see a breakdown here." />
            )}
          </div>
        </article>
      </section>

      <ActiveAssignmentList
        items={data.assignmentList}
        totalCount={data.activeAssignmentsCount}
      />
    </main>
  );
};

export default TeacherAssessmentsPage;
