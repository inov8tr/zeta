import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

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

  const rosterRows = (roster as ProfileRow[] | null) ?? [];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard/classes" className="text-xs font-semibold uppercase text-brand-primary/60">
          ← Back to classes
        </Link>
        <h1 className="text-3xl font-semibold text-brand-primary-dark">{classInfo.name}</h1>
        <p className="text-sm text-neutral-muted">
          Level {classInfo.level ?? "custom"} • Teacher {classInfo.teacher_id ?? "unassigned"}
        </p>
      </div>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <header className="border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Enrolled students</h2>
        </header>
        <div className="divide-y divide-brand-primary/10">
          {rosterRows.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-neutral-muted">
              No students assigned yet. Use the user edit page to add them.
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
                <div className="flex items-center gap-3 text-xs text-neutral-muted">
                  <span>Role: {student.role ?? "student"}</span>
                  <span>Test: {student.test_status ?? "none"}</span>
                  <Link
                    href={`/dashboard/users/${student.user_id}`}
                    className="font-semibold uppercase text-brand-primary hover:text-brand-primary-dark"
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
