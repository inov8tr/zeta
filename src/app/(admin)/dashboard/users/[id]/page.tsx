import type { ReactNode } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

const UserDetailPage = async ({ params }: UserDetailPageProps) => {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => Promise.resolve(cookieStore),
  });

  const profilePromise = supabase
    .from("profiles")
    .select("user_id, full_name, username, role, phone, class_id, test_status, classes(name, level)")
    .eq("user_id", id)
    .single();

  const testsPromise = supabase
    .from("tests")
    .select("id, type, status, score, assigned_at, completed_at")
    .eq("student_id", id)
    .order("assigned_at", { ascending: false });

  const consultationsPromise = supabase
    .from("consultations")
    .select("id, status, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const [{ data: profile, error: profileError }, { data: tests }, { data: consultations }] = await Promise.all([
    profilePromise,
    testsPromise,
    consultationsPromise,
  ]);

  if (profileError || !profile) {
    notFound();
  }

  const classData = Array.isArray(profile.classes) ? profile.classes[0] : profile.classes;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard/users" className="text-xs font-semibold uppercase text-neutral-400">
          ← Back to users
        </Link>
        <h1 className="text-3xl font-semibold text-neutral-900">{profile.full_name ?? "Unnamed user"}</h1>
        <p className="text-sm text-neutral-600">
          Role: <span className="font-medium text-neutral-900">{profile.role ?? "student"}</span>
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <DetailCard title="Contact">
          <dl className="space-y-2 text-sm text-neutral-700">
            <div>
              <dt className="font-medium text-neutral-900">Username</dt>
              <dd>{profile.username ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-900">Phone</dt>
              <dd>{profile.phone ?? "—"}</dd>
            </div>
          </dl>
        </DetailCard>
        <DetailCard title="Assignments">
          <dl className="space-y-2 text-sm text-neutral-700">
            <div>
              <dt className="font-medium text-neutral-900">Class</dt>
              <dd>{classData ? classData.name : "Unassigned"}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-900">Test status</dt>
              <dd>{profile.test_status ?? "none"}</dd>
            </div>
          </dl>
        </DetailCard>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <header className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Tests</h2>
        </header>
        <div className="divide-y divide-neutral-100">
          {(tests ?? []).length === 0 ? (
            <EmptyRow message="No tests assigned yet." />
          ) : (
            (tests ?? []).map((test) => (
              <article key={test.id} className="grid gap-2 px-6 py-4 text-sm text-neutral-700 sm:grid-cols-4">
                <div>
                  <div className="text-xs uppercase text-neutral-400">Type</div>
                  <div className="font-medium text-neutral-900">{test.type}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-neutral-400">Status</div>
                  <div>{test.status}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-neutral-400">Assigned</div>
                  <div>{test.assigned_at ? format(new Date(test.assigned_at), "MMM d, yyyy") : "—"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-neutral-400">Score</div>
                  <div>{test.score ?? "Pending"}</div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <header className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Consultation history</h2>
        </header>
        <div className="divide-y divide-neutral-100">
          {(consultations ?? []).length === 0 ? (
            <EmptyRow message="No consultations recorded." />
          ) : (
            (consultations ?? []).map((consultation) => (
              <article key={consultation.id} className="flex items-center justify-between px-6 py-4 text-sm">
                <div>
                  <div className="font-medium text-neutral-900">{consultation.status}</div>
                  <div className="text-xs text-neutral-500">
                    {consultation.created_at ? format(new Date(consultation.created_at), "MMM d, yyyy p") : "—"}
                  </div>
                </div>
                <Link
                  href={`/dashboard/consultations`}
                  className="text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-600"
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
  <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
);

const EmptyRow = ({ message }: { message: string }) => (
  <div className="px-6 py-8 text-center text-sm text-neutral-500">{message}</div>
);

export default UserDetailPage;
