import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type MemberRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "user_id" | "class_id" | "role" | "full_name">;

const ClassesPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => Promise.resolve(cookieStore),
  });

  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, name, level, teacher_id, schedule, created_at")
    .order("created_at", { ascending: false });

  const { data: membersData } = await supabase
    .from("profiles")
    .select("user_id, full_name, class_id, role")
    .not("class_id", "is", null);

  if (error) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold text-red-600">Unable to load classes</h1>
        <p className="text-sm text-neutral-600">{error.message}</p>
      </main>
    );
  }

  const members = (membersData as MemberRow[] | null) ?? [];

  const enrollment = new Map<string, number>();
  members.forEach((member) => {
    if (member.class_id) {
      enrollment.set(member.class_id, (enrollment.get(member.class_id) ?? 0) + 1);
    }
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-neutral-900">Classes</h1>
        <p className="text-sm text-neutral-600">
          Organize students into cohorts and keep track of teacher assignments.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {((classes as ClassRow[] | null) ?? []).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
            No classes yet. Create them with a Supabase migration or admin action.
          </div>
        ) : (
          ((classes as ClassRow[] | null) ?? []).map((item) => (
            <article key={item.id} className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">{item.name}</h2>
                  <p className="text-xs uppercase text-neutral-400">
                    {item.level ? `Level ${item.level}` : "Custom level"}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                  {enrollment.get(item.id) ?? 0} students
                </span>
              </div>
              <div className="space-y-2 text-sm text-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Teacher</span>
                  <span className="font-medium text-neutral-900">{item.teacher_id ?? "Unassigned"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Schedule</span>
                  <span className="font-medium text-neutral-900">{item.schedule ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Created</span>
                  <span className="font-medium text-neutral-900">
                    {item.created_at ? format(new Date(item.created_at), "MMM d, yyyy") : "—"}
                  </span>
                </div>
              </div>
              <div>
                <Link
                  href={`/dashboard/classes/${item.id}`}
                  className="inline-flex items-center rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold uppercase text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
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
