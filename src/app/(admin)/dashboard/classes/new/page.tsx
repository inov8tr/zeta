import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import CreateClassForm from "@/components/admin/CreateClassForm";
import type { Database } from "@/lib/database.types";

type TeacherRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "user_id" | "full_name">;
type StudentRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "user_id" | "full_name" | "class_id" | "username"> & {
  classes: { name: string | null } | null;
};

const NewClassPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const { data: teacherData, error: teacherError } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq("role", "teacher")
    .order("full_name", { ascending: true });

  const { data: studentData, error: studentError } = await supabase
    .from("profiles")
    .select("user_id, full_name, username, class_id, classes(name)")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  const teachers = (teacherData as TeacherRow[] | null) ?? [];
  const students = (studentData as StudentRow[] | null) ?? [];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard/classes" className="text-xs font-semibold uppercase text-brand-primary/60">
          ← Back to classes
        </Link>
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Create a class</h1>
        <p className="text-sm text-neutral-muted">
          Configure the schedule and roster for a new class. You can always adjust memberships later from the roster view.
        </p>
      </div>

      <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <CreateClassForm
          teachers={teachers.map((teacher) => ({ id: teacher.user_id, name: teacher.full_name }))}
          students={students.map((student) => ({
            user_id: student.user_id,
            full_name: student.full_name,
            class_id: student.class_id,
            class_name: student.classes?.name ?? null,
            username: student.username,
          }))}
        />
      </section>

      {teacherError || studentError ? (
        <p className="text-xs text-amber-600">
          {(teacherError?.message ?? "") + (teacherError && studentError ? " " : "") + (studentError?.message ?? "")}
        </p>
      ) : null}
    </main>
  );
};

export default NewClassPage;
