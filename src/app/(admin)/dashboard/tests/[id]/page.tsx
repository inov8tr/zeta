import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";

type TestRow = Database["public"]["Tables"]["tests"]["Row"];
type ConsultationRow = Database["public"]["Tables"]["consultations"]["Row"];
type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "full_name">;

interface TestDetailPageProps {
  params: Promise<{ id: string }>;
}

const TestDetailPage = async ({ params }: TestDetailPageProps) => {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const { data: test, error } = await supabase
    .from("tests")
    .select("id, student_id, type, status, score, assigned_at, completed_at")
    .eq("id", id)
    .maybeSingle<TestRow>();

  if (error || !test) {
    notFound();
  }

  let consultations: ConsultationRow[] = [];
  if (test.student_id) {
    const { data: consultationsData } = await supabase
      .from("consultations")
      .select("id, status, created_at")
      .eq("user_id", test.student_id)
      .order("created_at", { ascending: false })
      .limit(5);
    consultations = (consultationsData as ConsultationRow[] | null) ?? [];
  }

  const { data: profile } = test.student_id
    ? await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", test.student_id)
        .maybeSingle<ProfileRow>()
    : { data: null };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard/tests" className="text-xs font-semibold uppercase text-brand-primary/60">
          ← Back to tests
        </Link>
        <h1 className="text-3xl font-semibold text-brand-primary-dark">{test.type}</h1>
        <p className="text-sm text-neutral-muted">
          Student: <span className="font-medium text-brand-primary-dark">{profile?.full_name ?? "Unknown"}</span>
        </p>
      </div>

      <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 text-sm text-neutral-800 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-brand-primary/70">Status</dt>
            <dd className="mt-1 text-brand-primary-dark">{test.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-brand-primary/70">Score</dt>
            <dd className="mt-1 text-brand-primary-dark">{test.score ?? "Pending"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-brand-primary/70">Assigned</dt>
            <dd className="mt-1 text-brand-primary-dark">
              {test.assigned_at ? format(new Date(test.assigned_at), "MMM d, yyyy p") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-brand-primary/70">Completed</dt>
            <dd className="mt-1 text-brand-primary-dark">
              {test.completed_at ? format(new Date(test.completed_at), "MMM d, yyyy p") : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <header className="border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Recent consultations</h2>
        </header>
        <div className="divide-y divide-brand-primary/10">
          {consultations.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-neutral-muted">
              This student has no consultation history.
            </div>
          ) : (
            consultations.map((record) => (
              <article key={record.id} className="flex items-center justify-between px-6 py-4 text-sm text-neutral-800">
                <div>
                  <div className="font-medium text-brand-primary-dark">{record.status}</div>
                  <div className="text-xs text-neutral-muted">
                    {record.created_at ? format(new Date(record.created_at), "MMM d, yyyy p") : "—"}
                  </div>
                </div>
                <Link
                  href="/dashboard/consultations"
                  className="text-xs font-semibold uppercase text-brand-primary hover:text-brand-primary-dark"
                >
                  View
                </Link>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
};

export default TestDetailPage;
