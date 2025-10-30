import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import ClassSummaryTable from "@/components/teacher/dashboard/ClassSummaryTable";
import TeacherEmptyState from "@/components/teacher/TeacherEmptyState";
import type { Database } from "@/lib/database.types";

import { loadTeacherDashboardData, numberFormatter } from "../dashboardData";

const TeacherClassesPage = async () => {
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

  const data = await loadTeacherDashboardData(
    supabase as unknown as Parameters<typeof loadTeacherDashboardData>[0],
    user.id,
  );
  const hasClasses = data.totals.classesCount > 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-teacher-primary-text">Class roster</h1>
        <p className="text-sm text-neutral-muted">
          Track class-level readiness and confirm everyone has what they need.
        </p>
      </header>

      {!hasClasses ? (
        <TeacherEmptyState message="No classes are assigned to you yet. Please contact an admin to link your classes." />
      ) : null}

      {hasClasses ? (
        <section className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
          <header className="border-b border-teacher-primary/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-teacher-primary-text">Class coverage</h2>
            <p className="text-xs text-neutral-muted">
              You currently have {data.totals.classesCount === 1 ? "1 class" : `${data.totals.classesCount} classes`}
              {" "}with {numberFormatter.format(data.totals.totalStudents)} students assigned.
            </p>
          </header>
          <ul className="divide-y divide-teacher-primary/10 px-6 py-4 text-sm text-neutral-800">
            {data.classRosterSummary.map((item) => (
              <li key={item.classId} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-teacher-primary-text">{item.className}</p>
                  <p className="text-xs uppercase tracking-widest text-neutral-muted">
                    {item.level ? `Level ${item.level}` : "Mixed level"}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-teacher-primary-text">
                  {numberFormatter.format(item.studentCount)} students
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ClassSummaryTable rows={data.classRows} hasData={data.hasClassData} />
    </main>
  );
};

export default TeacherClassesPage;
