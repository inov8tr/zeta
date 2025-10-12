import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";

interface AssessmentPageProps {
  params: Promise<{ testId: string }>;
}

const AssessmentPage = async ({ params }: AssessmentPageProps) => {
  const { testId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: test, error } = await supabase
    .from("tests")
    .select("id, student_id, type, status, assigned_at, completed_at")
    .eq("id", testId)
    .maybeSingle();

  if (error) {
    console.error("assessment page: failed to load test", error);
  }

  if (!test) {
    notFound();
  }

  if (test.student_id !== session.user.id) {
    redirect("/student");
  }

  const statusLabel =
    test.status === "completed"
      ? "Completed"
      : test.status === "in_progress"
      ? "In progress"
      : "Waiting to start";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2 text-brand-primary-dark">
        <p className="text-xs uppercase tracking-[0.4em] text-brand-primary/70">Entrance assessment</p>
        <h1 className="text-3xl font-semibold">{test.type === "entrance" ? "Entrance Test" : test.type}</h1>
        <p className="text-sm text-neutral-muted">Status: {statusLabel}</p>
      </header>

      <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <div className="space-y-4 text-sm text-neutral-700">
          <p>
            Thanks for taking the time to complete this placement assessment. We&rsquo;ll guide you through reading, grammar,
            and listening activities to find the best level for you.
          </p>
          <p>
            We&rsquo;re still wiring up the full adaptive experience. For now, your teacher will contact you with further
            instructions and unlock the test questions.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/student"
          className="inline-flex items-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:bg-brand-primary hover:text-white"
        >
          Back to student portal
        </Link>
        <Link
          href="/resources/prep"
          className="inline-flex items-center rounded-full border border-brand-primary/30 px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:border-brand-primary hover:text-brand-primary-dark"
        >
          Preparation tips
        </Link>
      </div>
    </main>
  );
};

export default AssessmentPage;
