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
      accent: "border-sky-300 text-sky-800",
    },
    {
      title: "Users",
      description: "View and manage profiles",
      href: "/dashboard/users",
      value: userCount ?? 0,
      accent: "border-neutral-300 text-neutral-800",
    },
    {
      title: "Classes",
      description: "Assign students to cohorts",
      href: "/dashboard/classes",
      value: classCount ?? 0,
      accent: "border-emerald-300 text-emerald-800",
    },
    {
      title: "Tests",
      description: "Track assessments and scores",
      href: "/dashboard/tests",
      value: testCount ?? 0,
      accent: "border-indigo-300 text-indigo-800",
    },
  ];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-neutral-900">Admin Dashboard</h1>
        <p className="text-sm text-neutral-600">
          Stay on top of consultations, user management, class assignments, and test progress.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="group flex flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-sm uppercase tracking-wide text-neutral-400">{stat.title}</div>
            <div className="py-4 text-4xl font-semibold text-neutral-900">{stat.value}</div>
            <p className={`text-sm font-medium ${stat.accent}`}>{stat.description}</p>
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
    className="flex flex-col justify-between rounded-3xl border border-dashed border-neutral-300 bg-white p-6 transition hover:border-neutral-400"
  >
    <div>
      <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      <p className="mt-2 text-sm text-neutral-600">{description}</p>
    </div>
    <span className="mt-6 text-sm font-medium text-neutral-900">Open &rarr;</span>
  </Link>
);

export default AdminDashboardPage;
