import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import ReviewQueue from "@/components/teacher/dashboard/ReviewQueue";
import StudentLeaderboard from "@/components/teacher/dashboard/StudentLeaderboard";
import type { Database } from "@/lib/database.types";

import { loadTeacherDashboardData } from "../dashboardData";

const TeacherGradebookPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const data = await loadTeacherDashboardData(supabase, user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-teacher-primary-text">Gradebook highlights</h1>
        <p className="text-sm text-neutral-muted">
          Surface students to celebrate and the assessments that still need feedback.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <StudentLeaderboard rows={data.leaderboard} />
        <ReviewQueue items={data.reviewQueue} totalPending={data.outstandingReviewsCount} />
      </section>
    </main>
  );
};

export default TeacherGradebookPage;
