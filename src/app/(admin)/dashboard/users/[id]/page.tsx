import type { ReactNode } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";
import AssignTestButton from "@/components/admin/AssignTestButton";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileWithRelations = ProfileRow & {
  classes: { name: string; level: string | null } | { name: string; level: string | null }[] | null;
};
type TestRow = Database["public"]["Tables"]["tests"]["Row"];
type ConsultationRow = Database["public"]["Tables"]["consultations"]["Row"];

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

const UserDetailPage = async ({ params }: UserDetailPageProps) => {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const profilePromise = supabase
    .from("profiles")
    .select("user_id, full_name, username, role, phone, class_id, test_status, classes(name, level)")
    .eq("user_id", id)
    .maybeSingle<ProfileWithRelations>();

  const testsPromise = supabase
    .from("tests")
    .select("id, type, status, total_score, assigned_at, completed_at")
    .eq("student_id", id)
    .order("assigned_at", { ascending: false })
    .returns<TestRow[]>();

  const consultationsPromise = supabase
    .from("consultations")
    .select("id, status, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .returns<ConsultationRow[]>();

  const [profileResult, testsResult, consultationsResult] = await Promise.all([
    profilePromise,
    testsPromise,
    consultationsPromise,
  ]);

  const { data: profile, error: profileError } = profileResult;
  const tests = (testsResult.data as TestRow[] | null) ?? [];
  const consultations = (consultationsResult.data as ConsultationRow[] | null) ?? [];

  if (profileError || !profile) {
    notFound();
  }

  const classData = Array.isArray(profile.classes) ? profile.classes[0] : profile.classes;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/dashboard/users" className="text-xs font-semibold uppercase text-brand-primary/60">
            ← Back to users
          </Link>
          <h1 className="text-3xl font-semibold text-brand-primary-dark">{profile.full_name ?? "Unnamed user"}</h1>
          <p className="text-sm text-neutral-muted">
            Role: <span className="font-medium text-brand-primary-dark">{profile.role ?? "student"}</span>
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
          <Link
            href={`/dashboard/users/${id}/edit`}
            className="inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark"
          >
            Edit user
          </Link>
          <AssignTestButton studentId={id} />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <DetailCard title="Contact">
          <dl className="space-y-2 text-sm text-neutral-800">
            <div>
              <dt className="font-medium text-brand-primary-dark">Username</dt>
              <dd>{profile.username ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-brand-primary-dark">Phone</dt>
              <dd>{profile.phone ?? "—"}</dd>
            </div>
          </dl>
        </DetailCard>
        <DetailCard title="Assignments">
          <dl className="space-y-2 text-sm text-neutral-800">
            <div>
              <dt className="font-medium text-brand-primary-dark">Class</dt>
              <dd>{classData ? classData.name : "Unassigned"}</dd>
            </div>
            <div>
              <dt className="font-medium text-brand-primary-dark">Test status</dt>
              <dd>{profile.test_status ?? "none"}</dd>
            </div>
          </dl>
        </DetailCard>
      </section>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <header className="border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Tests</h2>
        </header>
        <div className="divide-y divide-brand-primary/10">
          {tests.length === 0 ? (
            <EmptyRow message="No tests assigned yet." />
          ) : (
            tests.map((test) => (
              <article key={test.id} className="grid gap-2 px-6 py-4 text-sm text-neutral-800 sm:grid-cols-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Type</div>
                  <div className="font-medium text-brand-primary-dark">{test.type}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Status</div>
                  <div>{test.status}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Assigned</div>
                  <div className="text-brand-primary-dark">
                    {test.assigned_at ? format(new Date(test.assigned_at), "MMM d, yyyy") : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Score</div>
                  <div className="text-brand-primary-dark">{test.total_score ?? "Pending"}</div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <header className="border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Consultation history</h2>
        </header>
        <div className="divide-y divide-brand-primary/10">
          {consultations.length === 0 ? (
            <EmptyRow message="No consultations recorded." />
          ) : (
            consultations.map((consultation) => (
              <article key={consultation.id} className="flex items-center justify-between px-6 py-4 text-sm text-neutral-800">
                <div>
                  <div className="font-medium text-brand-primary-dark">{consultation.status}</div>
                  <div className="text-xs text-neutral-muted">
                    {consultation.created_at ? format(new Date(consultation.created_at), "MMM d, yyyy p") : "—"}
                  </div>
                </div>
                <Link
                  href={`/dashboard/consultations`}
                  className="text-xs font-semibold uppercase text-brand-primary hover:text-brand-primary-dark"
                >
                  Manage
                </Link>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
};

const DetailCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-brand-primary-dark">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
);

const EmptyRow = ({ message }: { message: string }) => (
  <div className="px-6 py-8 text-center text-sm text-neutral-muted">{message}</div>
);

export default UserDetailPage;
