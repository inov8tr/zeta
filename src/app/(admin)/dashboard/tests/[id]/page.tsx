import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";

interface TestDetailPageProps {
  params: { id: string };
}

const TestDetailPage = async ({ params }: TestDetailPageProps) => {
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookies(),
  });

  const { data: test, error } = await supabase
    .from("tests")
    .select("id, student_id, type, status, score, assigned_at, completed_at")
    .eq("id", params.id)
    .single();

  if (error || !test) {
    notFound();
  }

  const { data: consultations } = await supabase
    .from("consultations")
    .select("id, status, created_at")
    .eq("user_id", test.student_id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: profile } =
    test.student_id
      ? await supabase.from("profiles").select("full_name").eq("user_id", test.student_id).single()
      : { data: null };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard/tests" className="text-xs font-semibold uppercase text-neutral-400">
          ← Back to tests
        </Link>
        <h1 className="text-3xl font-semibold text-neutral-900">{test.type}</h1>
        <p className="text-sm text-neutral-600">
          Student: <span className="font-medium text-neutral-900">{profile?.full_name ?? "Unknown"}</span>
        </p>
      </div>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 text-sm text-neutral-700 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-neutral-400">Status</dt>
            <dd className="mt-1 text-neutral-900">{test.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-neutral-400">Score</dt>
            <dd className="mt-1 text-neutral-900">{test.score ?? "Pending"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-neutral-400">Assigned</dt>
            <dd className="mt-1 text-neutral-900">
              {test.assigned_at ? format(new Date(test.assigned_at), "MMM d, yyyy p") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-neutral-400">Completed</dt>
            <dd className="mt-1 text-neutral-900">
              {test.completed_at ? format(new Date(test.completed_at), "MMM d, yyyy p") : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <header className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Recent consultations</h2>
        </header>
        <div className="divide-y divide-neutral-100">
          {(consultations ?? []).length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-neutral-500">
              This student has no consultation history.
            </div>
          ) : (
            consultations!.map((record) => (
              <article key={record.id} className="flex items-center justify-between px-6 py-4 text-sm">
                <div>
                  <div className="font-medium text-neutral-900">{record.status}</div>
                  <div className="text-xs text-neutral-500">
                    {record.created_at ? format(new Date(record.created_at), "MMM d, yyyy p") : "—"}
                  </div>
                </div>
                <Link
                  href="/dashboard/consultations"
                  className="text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-600"
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
