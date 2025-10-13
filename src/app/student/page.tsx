import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import WelcomeCard from "@/components/student/WelcomeCard";
import ActiveAssessmentCard from "@/components/student/ActiveAssessmentCard";
import ProgressTimeline from "@/components/student/ProgressTimeline";
import ConsultationCard from "@/components/student/ConsultationCard";
import ResourcesGrid from "@/components/student/ResourcesGrid";
import { getStudentResources } from "@/lib/studentResources";

const StudentPortal = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
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
    .maybeSingle();

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

  const upcomingConsultation = consultations.find((consultation) => consultation.status !== "cancelled") ?? null;
  const resources = getStudentResources(profile?.test_status ?? null);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <WelcomeCard
        fullName={profile?.full_name ?? "Student"}
        testStatus={profile?.test_status ?? "none"}
        className={Array.isArray(profile?.classes) ? profile?.classes?.[0]?.name ?? null : profile?.classes?.name ?? null}
      />

      {testsResult.error ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          We couldn&rsquo;t load your assessments right now. Please refresh or contact support if this continues.
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
        </div>
        <ConsultationCard consultation={upcomingConsultation} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProgressTimeline tests={completedTests} />
        </div>
        <ResourcesGrid resources={resources} />
      </section>
    </main>
  );
};

export default StudentPortal;
