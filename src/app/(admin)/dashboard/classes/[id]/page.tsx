import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";

interface ClassDetailPageProps {
  params: { id: string };
}

const ClassDetailPage = async ({ params }: ClassDetailPageProps) => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const classPromise = supabase
    .from("classes")
    .select("id, name, level, schedule, teacher_id, created_at")
    .eq("id", params.id)
    .single();

  const rosterPromise = supabase
    .from("profiles")
    .select("user_id, full_name, role, username, test_status")
    .eq("class_id", params.id)
    .order("full_name", { ascending: true });

  const [{ data: classInfo, error }, { data: roster }] = await Promise.all([classPromise, rosterPromise]);

  if (error || !classInfo) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard/classes" className="text-xs font-semibold uppercase text-neutral-400">
          ← Back to classes
        </Link>
        <h1 className="text-3xl font-semibold text-neutral-900">{classInfo.name}</h1>
        <p className="text-sm text-neutral-600">
          Level {classInfo.level ?? "custom"} • Teacher {classInfo.teacher_id ?? "unassigned"}
        </p>
      </div>

      <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <header className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Enrolled students</h2>
        </header>
        <div className="divide-y divide-neutral-100">
          {(roster ?? []).length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-neutral-500">
              No students assigned yet. Use the user edit page to add them.
            </div>
          ) : (
            roster!.map((student) => (
              <article key={student.user_id} className="flex items-center justify-between px-6 py-4 text-sm">
                <div>
                  <div className="font-medium text-neutral-900">{student.full_name ?? "Unnamed student"}</div>
                  <div className="text-xs text-neutral-500">{student.username ?? "No username"}</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span>Role: {student.role ?? "student"}</span>
                  <span>Test: {student.test_status ?? "none"}</span>
                  <Link
                    href={`/dashboard/users/${student.user_id}`}
                    className="font-semibold uppercase text-neutral-400 hover:text-neutral-600"
                  >
                    View
                  </Link>
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
