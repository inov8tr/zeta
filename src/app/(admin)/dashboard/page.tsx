import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";

interface StatItem {
  title: string;
  description: string;
  href: string;
  value: number;
  accent: string;
}

interface PendingConsultation {
  id: string;
  full_name: string | null;
  email: string;
  preferred_start: string;
}

interface RecentTestRow {
  id: string;
  status: string;
  total_score: number | null;
  assigned_at: string | null;
  completed_at: string | null;
  profiles: { full_name: string | null } | null;
}

const AdminDashboardPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const [
    { count: consultationCount },
    { count: pendingConsultations },
    { count: userCount },
    { count: classCount },
    { count: testCount },
    pendingConsultationsList,
    recentTests,
  ] = await Promise.all([
    supabase.from("consultations").select("id", { count: "exact", head: true }),
    supabase
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("tests").select("id", { count: "exact", head: true }),
    supabase
      .from("consultations")
      .select("id, full_name, email, preferred_start")
      .eq("status", "pending")
      .order("preferred_start", { ascending: true })
      .limit(5),
    supabase
      .from("tests")
      .select(
        "id, status, total_score, assigned_at, completed_at, profiles:student_id(full_name)"
      )
      .order("assigned_at", { ascending: false })
      .limit(5),
  ]);

  const pendingConsultationItems: PendingConsultation[] = (
    (pendingConsultationsList.data as Array<{
      id: string;
      full_name: string | null;
      email: string;
      preferred_start: string;
    }> | null) ?? []
  ).map((item) => ({
    id: item.id,
    full_name: item.full_name,
    email: item.email,
    preferred_start: item.preferred_start,
  }));

  const recentTestItems: RecentTestRow[] =
    (recentTests.data as Array<RecentTestRow> | null) ?? [];

  const stats: StatItem[] = [
    {
      title: "Consultations",
      description: `${pendingConsultations ?? 0} pending responses`,
      href: "/dashboard/consultations",
      value: consultationCount ?? 0,
      accent: "text-brand-primary bg-brand-primary/10",
    },
    {
      title: "Users",
      description: "View and manage profiles",
      href: "/dashboard/users",
      value: userCount ?? 0,
      accent: "text-brand-primary-dark bg-brand-primary/10",
    },
    {
      title: "Classes",
      description: "Assign students to cohorts",
      href: "/dashboard/classes",
      value: classCount ?? 0,
      accent: "text-brand-accent-dark bg-brand-accent/10",
    },
    {
      title: "Tests",
      description: "Track assessments and scores",
      href: "/dashboard/tests",
      value: testCount ?? 0,
      accent: "text-brand-primary bg-brand-primary/10",
    },
  ];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Admin Dashboard</h1>
        <p className="text-sm text-neutral-muted">
          Stay on top of consultations, user management, class assignments, and test progress.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="group flex flex-col justify-between rounded-3xl border border-brand-primary/10 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="text-xs uppercase tracking-[0.4em] text-brand-primary/60">{stat.title}</div>
            <div className="py-4 text-4xl font-semibold text-brand-primary-dark">{stat.value}</div>
            <p className={`text-sm font-medium rounded-full px-3 py-1 ${stat.accent}`}>{stat.description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
        <PendingConsultationsCard consultations={pendingConsultationItems} />
        <RecentTestsCard tests={recentTestItems} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardQuickLink
          title="Control availability"
          description="Add or remove consultation slots, close bookings on busy days, and prevent double bookings."
          href="/dashboard/consultations/slots"
        />
        <DashboardQuickLink
          title="Assign classes and tests"
          description="Match students with the right class groups and entrance assessments."
          href="/dashboard/users"
        />
      </section>
    </main>
  );
};

const DashboardQuickLink = ({ title, description, href }: { title: string; description: string; href: string }) => (
  <Link
    href={href}
    className="flex flex-col justify-between rounded-3xl border border-brand-primary/15 bg-gradient-to-br from-white to-brand-primary/5 p-6 transition hover:border-brand-primary/40 hover:shadow-lg"
  >
    <div>
      <h2 className="text-xl font-semibold text-brand-primary-dark">{title}</h2>
      <p className="mt-2 text-sm text-neutral-muted">{description}</p>
    </div>
    <span className="mt-6 inline-flex items-center text-sm font-semibold text-brand-primary">
      Open <span className="ml-1 text-brand-accent">→</span>
    </span>
  </Link>
);

const PendingConsultationsCard = ({ consultations }: { consultations: PendingConsultation[] }) => (
  <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
    <header className="border-b border-brand-primary/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-brand-primary-dark">Pending consultations</h2>
      <p className="text-xs text-neutral-muted">Follow up with families waiting to hear back.</p>
    </header>
    <div className="divide-y divide-brand-primary/10">
      {consultations.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-neutral-muted">
          No pending consultations. Great job staying caught up!
        </div>
      ) : (
        consultations.map((consultation) => (
          <article key={consultation.id} className="flex items-center justify-between gap-3 px-6 py-4 text-sm text-neutral-800">
            <div>
              <div className="font-medium text-brand-primary-dark">{consultation.full_name ?? "Unnamed"}</div>
              <div className="text-xs text-neutral-muted">{consultation.email}</div>
            </div>
            <div className="flex flex-col items-end text-xs text-neutral-muted">
              <span>Preferred start</span>
              <span className="font-semibold text-brand-primary-dark">
                {format(new Date(consultation.preferred_start), "MMM d, yyyy p")}
              </span>
            </div>
          </article>
        ))
      )}
    </div>
    <div className="border-t border-brand-primary/10 px-6 py-4 text-right text-xs">
      <Link href="/dashboard/consultations" className="font-semibold text-brand-primary">
        Review all consultations →
      </Link>
    </div>
  </section>
);

const RecentTestsCard = ({ tests }: { tests: RecentTestRow[] }) => (
  <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
    <header className="border-b border-brand-primary/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-brand-primary-dark">Recent test activity</h2>
      <p className="text-xs text-neutral-muted">Latest assignments and completions across students.</p>
    </header>
    <div className="divide-y divide-brand-primary/10">
      {tests.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-neutral-muted">
          No tests assigned yet. Create a new entrance test to begin collecting data.
        </div>
      ) : (
        tests.map((test) => (
          <article key={test.id} className="grid gap-3 px-6 py-4 text-xs text-neutral-muted">
            <div className="flex items-center justify-between">
              <div className="font-medium text-brand-primary-dark">
                {test.profiles?.full_name ?? "Unknown student"}
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                test.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
              }`}>
                {test.status}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-neutral-800">
              <span>
                Assigned {test.assigned_at ? format(new Date(test.assigned_at), "MMM d") : "—"}
              </span>
              <span>
                Score {typeof test.total_score === "number" ? `${test.total_score}%` : "Pending"}
              </span>
              <span>
                {test.completed_at ? `Completed ${format(new Date(test.completed_at), "MMM d")}` : "In progress"}
              </span>
            </div>
          </article>
        ))
      )}
    </div>
    <div className="border-t border-brand-primary/10 px-6 py-4 text-right text-xs">
      <Link href="/dashboard/tests" className="font-semibold text-brand-primary">
        View all tests →
      </Link>
    </div>
  </section>
);

export default AdminDashboardPage;
