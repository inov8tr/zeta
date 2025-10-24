import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import ActiveAssessmentCard from "@/components/student/ActiveAssessmentCard";
import ProgressTimeline from "@/components/student/ProgressTimeline";
import ConsultationCard from "@/components/student/ConsultationCard";
import ResourcesGrid from "@/components/student/ResourcesGrid";
import { getStudentResources } from "@/lib/studentResources";
import { formatDateTime } from "@/lib/formatDateTime";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileWithClassName = {
  full_name: ProfileRow["full_name"];
  test_status: ProfileRow["test_status"];
  classes: { name: string | null } | { name: string | null }[] | null;
};

const statusCopy: Record<
  string,
  {
    label: string;
    description: string;
  }
> = {
  none: {
    label: "Getting Started",
    description: "Work with your teacher to schedule your first assessment.",
  },
  assigned: {
    label: "Assessment Assigned",
    description: "You have an assessment waiting. Start when you feel ready.",
  },
  in_progress: {
    label: "Assessment In Progress",
    description: "Continue your test when you’re ready to finish.",
  },
  completed: {
    label: "Assessment Completed",
    description: "Great work! Review your results and next steps.",
  },
  reviewed: {
    label: "Assessment Reviewed",
    description: "Check your feedback and upcoming recommendations.",
  },
};

const StatCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string | null;
}) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
    {helper ? <p className="mt-1 text-xs text-neutral-500">{helper}</p> : null}
  </div>
);

const StudentPortal = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profilePromise = supabase
    .from("profiles")
    .select("full_name, test_status, classes(name)")
    .eq("user_id", user.id)
    .maybeSingle<ProfileWithClassName>();

  const testsPromise = supabase
    .from("tests")
    .select("id, type, status, assigned_at, completed_at, total_score, weighted_level, time_limit_seconds, elapsed_ms")
    .eq("student_id", user.id)
    .order("assigned_at", { ascending: false });

  const consultationsPromise = supabase
    .from("consultations")
    .select("id, status, preferred_start, preferred_end, timezone")
    .eq("user_id", user.id)
    .order("preferred_start", { ascending: true });

  const [profileResult, testsResult, consultationsResult] = await Promise.all([
    profilePromise,
    testsPromise,
    consultationsPromise,
  ]);

  const { data: profile } = profileResult;
  const tests = (testsResult.data ?? []) as Array<
    Pick<
      Database["public"]["Tables"]["tests"]["Row"],
      | "id"
      | "type"
      | "status"
      | "assigned_at"
      | "completed_at"
      | "total_score"
      | "weighted_level"
      | "time_limit_seconds"
      | "elapsed_ms"
    >
  >;

  const consultations = (consultationsResult.data ?? []) as Array<
    Pick<
      Database["public"]["Tables"]["consultations"]["Row"],
      "id" | "status" | "preferred_start" | "preferred_end" | "timezone"
    >
  >;

  const activeTest = tests.find((test) => test.status === "in_progress") ?? tests.find((test) => test.status === "assigned");
  const completedTests = tests.filter((test) => test.status === "completed" || test.status === "reviewed");
  const completedTestsSorted = [...completedTests].sort((a, b) => {
    const aDate = a.completed_at ?? a.assigned_at ?? null;
    const bDate = b.completed_at ?? b.assigned_at ?? null;
    return (bDate ? new Date(bDate).getTime() : 0) - (aDate ? new Date(aDate).getTime() : 0);
  });
  const latestCompletedTest = completedTestsSorted[0] ?? null;

  const upcomingConsultation = consultations.find((consultation) => consultation.status !== "cancelled") ?? null;
  const resources = getStudentResources(profile?.test_status ?? null);
  const normalizedStatus = (profile?.test_status ?? "none").toLowerCase();
  const statusInfo = statusCopy[normalizedStatus] ?? statusCopy.none;

  const stats = [
    {
      label: "Assessments completed",
      value: completedTests.length.toString(),
      helper:
        completedTests.length > 0 && latestCompletedTest?.completed_at
          ? `Last on ${formatDateTime(latestCompletedTest.completed_at)}`
          : "Waiting for your first result.",
    },
    {
      label: "Latest progress",
      value:
        latestCompletedTest?.weighted_level != null
          ? `Level ${latestCompletedTest.weighted_level}`
          : latestCompletedTest?.total_score != null
            ? `${Math.round(latestCompletedTest.total_score)}% score`
            : "TBD",
      helper:
        latestCompletedTest?.type && latestCompletedTest?.completed_at
          ? `${latestCompletedTest.type.replace(/_/g, " ")} · ${formatDateTime(latestCompletedTest.completed_at)}`
          : null,
    },
    {
      label: "Next consultation",
      value: upcomingConsultation?.preferred_start
        ? formatDateTime(upcomingConsultation.preferred_start, upcomingConsultation.timezone) ?? "Scheduled"
        : "Not scheduled",
      helper:
        upcomingConsultation?.preferred_end && upcomingConsultation?.preferred_start
          ? `Window until ${formatDateTime(upcomingConsultation.preferred_end, upcomingConsultation.timezone)}`
          : null,
    },
    {
      label: "Status",
      value: statusInfo.label,
      helper: statusInfo.description,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-col gap-6 rounded-3xl border border-brand-primary/10 bg-gradient-to-br from-brand-primary/5 via-white to-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-primary/80">Welcome back</p>
          <h1 className="mt-1 text-3xl font-semibold text-brand-primary-dark">{profile?.full_name ?? "Student"}</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-muted">
            {statusInfo.description}
            {Array.isArray(profile?.classes)
              ? profile?.classes?.[0]?.name
                ? ` Your current class: ${profile?.classes?.[0]?.name}.`
                : ""
              : profile?.classes && profile?.classes?.name
                ? ` Your current class: ${profile.classes.name}.`
                : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/resources/prep"
            className="inline-flex items-center rounded-full border border-brand-primary/30 px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:border-brand-primary hover:text-brand-primary-dark"
          >
            Review prep resources
          </Link>
          <Link
            href="/enrollment"
            className="inline-flex items-center rounded-full border border-transparent bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark"
          >
            Request support
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <div className="space-y-6">
          {activeTest ? (
            <ActiveAssessmentCard
              test={{
                id: activeTest.id,
                type: activeTest.type,
                status: activeTest.status as "assigned" | "in_progress",
                assigned_at: activeTest.assigned_at,
                time_limit_seconds: activeTest.time_limit_seconds,
                elapsed_ms: activeTest.elapsed_ms,
              }}
            />
          ) : (
            <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-brand-primary-dark">No assessments yet</h2>
              <p className="mt-2 text-sm text-neutral-muted">
                When your teacher assigns an assessment, you&rsquo;ll find it here with a quick start button.
              </p>
            </section>
          )}

          {completedTests.length > 0 ? (
            <ProgressTimeline tests={completedTests} />
          ) : (
            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">Assessment history</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Completed assessments will appear here once you finish your first one.
              </p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <ConsultationCard consultation={upcomingConsultation} />
          <ResourcesGrid resources={resources} />
        </div>
      </section>
    </main>
  );
};

export default StudentPortal;
