import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";
import { formatScheduleEntries, parseScheduleEntries } from "@/utils/classSchedule";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type MemberRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "user_id" | "class_id" | "role" | "full_name">;
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

const ClassesPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, name, level, teacher_id, schedule, created_at")
    .order("created_at", { ascending: false });

  const { data: membersData } = await supabase
    .from("profiles")
    .select("user_id, full_name, class_id, role")
    .not("class_id", "is", null);

  const { data: teacherData, error: teacherError } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq("role", "teacher")
    .order("full_name", { ascending: true });

  if (error) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold text-red-600">Unable to load classes</h1>
        <p className="text-sm text-neutral-600">{error.message}</p>
      </main>
    );
  }

  const members = (membersData as MemberRow[] | null) ?? [];
  const teachers = (teacherData as TeacherRow[] | null) ?? [];

  const enrollment = new Map<string, number>();
  members.forEach((member) => {
    if (member.class_id) {
      enrollment.set(member.class_id, (enrollment.get(member.class_id) ?? 0) + 1);
    }
  });

  const teacherNames = new Map<string, string>();
  teachers.forEach((teacher) => {
    if (teacher.user_id) {
      teacherNames.set(teacher.user_id, teacher.full_name ?? "Unnamed teacher");
    }
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Classes</h1>
        <p className="text-sm text-neutral-muted">
          Organize students into cohorts and keep track of teacher assignments.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/dashboard/classes/roster"
            className="inline-flex items-center rounded-full border border-brand-primary px-5 py-2 text-sm font-semibold uppercase text-brand-primary transition hover:bg-brand-primary/10"
          >
            View roster overview
          </Link>
          <Link
            href="/dashboard/classes/new"
            className="inline-flex items-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold uppercase text-white transition hover:bg-brand-primary-dark"
          >
            Create class
          </Link>
        </div>
      </header>

      {teacherError ? <p className="text-xs text-amber-600">{teacherError.message}</p> : null}

      <section className="grid gap-4 md:grid-cols-2">
        {((classes as ClassRow[] | null) ?? []).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-brand-primary/20 bg-white p-10 text-center text-neutral-muted">
            No classes yet. Create them with a Supabase migration or admin action.
          </div>
        ) : (
          ((classes as ClassRow[] | null) ?? []).map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-brand-primary-dark">{item.name}</h2>
                  <p className="text-xs uppercase text-brand-primary/70">
                    {item.level ? `Section ${item.level}` : "No section"}
                  </p>
                </div>
                <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary-dark">
                  {enrollment.get(item.id) ?? 0} students
                </span>
              </div>
              <div className="space-y-2 text-sm text-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-muted">Teacher</span>
                  <span className="font-medium text-brand-primary-dark">
                    {item.teacher_id ? teacherNames.get(item.teacher_id) ?? item.teacher_id : "Unassigned"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-muted">Schedule</span>
                  <span className="font-medium text-brand-primary-dark">{describeSchedule(item.schedule ?? null)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-muted">Created</span>
                  <span className="font-medium text-brand-primary-dark">
                    {item.created_at ? format(new Date(item.created_at), "MMM d, yyyy") : "—"}
                  </span>
                </div>
              </div>
              <div>
                <Link
                  href={`/dashboard/classes/${item.id}`}
                  className="inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark"
                >
                  View roster
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
};

export default ClassesPage;
