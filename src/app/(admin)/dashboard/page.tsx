import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";

interface StatItem {
  title: string;
  description: string;
  href: string;
  value: number;
  accent: string;
}

const AdminDashboardPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const [{ count: consultationCount }, { count: pendingConsultations }, { count: userCount }, { count: classCount }, { count: testCount }] =
    await Promise.all([
      supabase.from("consultations").select("id", { count: "exact", head: true }),
      supabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("classes").select("id", { count: "exact", head: true }),
      supabase.from("tests").select("id", { count: "exact", head: true }),
    ]);

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

export default AdminDashboardPage;
