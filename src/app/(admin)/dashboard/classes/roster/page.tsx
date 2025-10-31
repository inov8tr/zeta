import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import PrintButton from "@/components/dashboard/PrintButton";
import ClassRosterGrid from "@/components/admin/ClassRosterGrid";
import type { Database } from "@/lib/database.types";
import { prepareClassSummaries, type StudentSummary } from "@/utils/rosterSchedule";

const RosterOverviewPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const [{ data: classesData }, { data: studentsData }, { data: teachersData }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, level, schedule, teacher_id, created_at")
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select("user_id, full_name, username, role, class_id, test_status")
      .eq("role", "student")
      .order("full_name", { ascending: true }),
    supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("role", "teacher")
      .order("full_name", { ascending: true }),
  ]);

  const classes = (classesData ?? []) as Database["public"]["Tables"]["classes"]["Row"][];
  const students = (studentsData ?? []) as Database["public"]["Tables"]["profiles"]["Row"][];
  const teachers = (teachersData ?? []) as Database["public"]["Tables"]["profiles"]["Row"][];

  const teacherNames = new Map<string, string>();
  teachers.forEach((teacher) => {
    teacherNames.set(teacher.user_id, teacher.full_name ?? "Unnamed teacher");
  });

  const rosterByClass = new Map<string, StudentSummary[]>();
  students.forEach((student) => {
    if (!student.class_id) {
      return;
    }
    const list = rosterByClass.get(student.class_id) ?? [];
    list.push({
      user_id: student.user_id,
      full_name: student.full_name,
      username: student.username,
      test_status: student.test_status,
    });
    rosterByClass.set(student.class_id, list);
  });

  const classSummaries = prepareClassSummaries(
    classes.map((classItem) => ({
      id: classItem.id,
      name: classItem.name,
      level: classItem.level,
      schedule: classItem.schedule,
      teacher_id: classItem.teacher_id,
    })),
    rosterByClass,
    teacherNames
  );

  const unassignedStudents = students.filter((student) => !student.class_id);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <PrintButton label="Print roster" ariaLabel="Print all class rosters" />
            <Link href="/dashboard/classes" className="text-xs font-semibold uppercase text-brand-primary/60">
              ← Back to classes
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-brand-primary-dark">Roster overview</h1>
            <p className="text-sm text-neutral-muted">
              Weekly view of all classes. Use your browser print dialog to save as PDF.
            </p>
          </div>
        </div>
      </header>

      <ClassRosterGrid classes={classSummaries} />

      {unassignedStudents.length > 0 ? (
        <section className="rounded-3xl border border-dashed border-brand-primary/20 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Unassigned students</h2>
          <p className="text-sm text-neutral-muted">Students without a class appear here so you can place them quickly.</p>
          <ul className="mt-4 divide-y divide-brand-primary/10 rounded-2xl border border-brand-primary/10">
            {unassignedStudents.map((student) => (
              <li key={student.user_id} className="flex flex-col gap-1 px-4 py-3 text-sm text-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium text-brand-primary-dark">{student.full_name ?? "Unnamed student"}</div>
                  <div className="text-xs text-neutral-muted">{student.username ?? "No username"}</div>
                </div>
                <div className="text-xs text-neutral-muted sm:text-right">
                  <span className="font-semibold uppercase text-brand-primary/70">{student.role ?? "student"}</span>
                  {student.test_status ? <span className="ml-2">Test: {student.test_status}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
};

export default RosterOverviewPage;
