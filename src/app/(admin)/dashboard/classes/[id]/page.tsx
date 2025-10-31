import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import ClassAddStudentForm from "@/components/admin/ClassAddStudentForm";
import ClassDetailsForm from "@/components/admin/ClassDetailsForm";
import ClassRemoveStudentButton from "@/components/admin/ClassRemoveStudentButton";
import ClassScheduleEditor from "@/components/admin/ClassScheduleEditor";
import { formatScheduleEntries, parseScheduleEntries } from "@/utils/classSchedule";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type StudentOptionRow = ProfileRow & {
  classes: { name: string | null } | null;
};
type TeacherRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "user_id" | "full_name">;

const describeSchedule = (value: string | null) => {
  if (!value) {
    return "—";
  }
  const entries = parseScheduleEntries(value);
  if (entries.length === 0) {
    return value;
  }
  return formatScheduleEntries(entries);
};

interface ClassDetailPageProps {
  params: Promise<{ id: string }>;
}

const ClassDetailPage = async ({ params }: ClassDetailPageProps) => {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const { data: classInfo, error } = await supabase
    .from("classes")
    .select("id, name, level, schedule, teacher_id, created_at")
    .eq("id", id)
    .maybeSingle<ClassRow>();

  if (error || !classInfo) {
    notFound();
  }

  const { data: roster } = await supabase
    .from("profiles")
    .select("user_id, full_name, role, username, test_status")
    .eq("class_id", id)
    .order("full_name", { ascending: true });

  const { data: studentOptionsData } = await supabase
    .from("profiles")
    .select("user_id, full_name, class_id, classes(name), role")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  const { data: teacherData } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq("role", "teacher")
    .order("full_name", { ascending: true });

  const rosterRows = (roster as ProfileRow[] | null) ?? [];
  const studentOptions = (studentOptionsData as StudentOptionRow[] | null) ?? [];
  const teachers = (teacherData as TeacherRow[] | null) ?? [];

  const teacherNames = new Map<string, string>();
  teachers.forEach((teacher) => {
    teacherNames.set(teacher.user_id, teacher.full_name ?? "Unnamed teacher");
  });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard/classes" className="text-xs font-semibold uppercase text-brand-primary/60">
          ← Back to classes
        </Link>
        <h1 className="text-3xl font-semibold text-brand-primary-dark">{classInfo.name}</h1>
        <p className="text-sm text-neutral-muted">
          Section {classInfo.level ?? "—"} • Teacher{" "}
          {classInfo.teacher_id ? teacherNames.get(classInfo.teacher_id) ?? classInfo.teacher_id : "unassigned"} • Schedule{" "}
          {describeSchedule(classInfo.schedule ?? null)}
        </p>
      </div>

      <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 pb-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Class details</h2>
          <p className="text-sm text-neutral-muted">
            Update the class name, section, or assigned teacher. Changes will reflect immediately in the classes tab and student
            views.
          </p>
        </div>
        <ClassDetailsForm
          classId={classInfo.id}
          initialName={classInfo.name}
          initialLevel={classInfo.level}
          initialTeacherId={classInfo.teacher_id}
          teachers={teachers.map((teacher) => ({ id: teacher.user_id, name: teacher.full_name }))}
        />
      </section>

      <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <ClassScheduleEditor classId={classInfo.id} initialSchedule={classInfo.schedule} />
      </section>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <header className="border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Enrolled students</h2>
        </header>
        <div className="px-6 py-4">
          <ClassAddStudentForm
            classId={classInfo.id}
            students={studentOptions.map((student) => ({
              user_id: student.user_id,
              full_name: student.full_name,
              class_id: student.class_id,
              class_name: student.classes?.name ?? null,
            }))}
          />
        </div>
        <div className="divide-y divide-brand-primary/10">
          {rosterRows.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-neutral-muted">
              No students assigned yet. Use the form above to add them.
            </div>
          ) : (
            rosterRows.map((student) => (
              <article
                key={student.user_id}
                className="flex items-center justify-between px-6 py-4 text-sm text-neutral-800"
              >
                <div>
                  <div className="font-medium text-brand-primary-dark">{student.full_name ?? "Unnamed student"}</div>
                  <div className="text-xs text-neutral-muted">{student.username ?? "No username"}</div>
                </div>
                <div className="flex flex-col items-end gap-2 text-xs text-neutral-muted sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3">
                    <span>Role: {student.role ?? "student"}</span>
                    <span>Test: {student.test_status ?? "none"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/users/${student.user_id}`}
                      className="font-semibold uppercase text-brand-primary hover:text-brand-primary-dark"
                    >
                      View
                    </Link>
                    <ClassRemoveStudentButton userId={student.user_id} />
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

export default ClassDetailPage;
