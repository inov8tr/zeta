import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import ResourcePanel from "@/components/teacher/dashboard/ResourcePanel";
import type { Database } from "@/lib/database.types";

const TeacherResourcesPage = async () => {
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

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-teacher-primary-text">Resources</h1>
        <p className="text-sm text-neutral-muted">
          Access teaching materials, policies, and live support whenever you need them.
        </p>
      </header>

      <ResourcePanel />
    </main>
  );
};

export default TeacherResourcesPage;
