import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import CommunicationPanel from "@/components/teacher/dashboard/CommunicationPanel";
import type { Database } from "@/lib/database.types";

import { loadTeacherDashboardData } from "../dashboardData";

const TeacherCommunicationsPage = async () => {
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

  const data = await loadTeacherDashboardData(
    supabase as unknown as Parameters<typeof loadTeacherDashboardData>[0],
    user.id,
  );

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-teacher-primary-text">Communication hub</h1>
        <p className="text-sm text-neutral-muted">
          Reach out to classes, respond to support, and log follow-ups to stay coordinated.
        </p>
      </header>

      <CommunicationPanel rosterSummary={data.classRosterSummary} />
    </main>
  );
};

export default TeacherCommunicationsPage;
