import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import StudentSidebar from "@/components/student/StudentSidebar";
import type { Database } from "@/lib/database.types";

const StudentLayout = async ({ children }: { children: ReactNode }) => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let showClasses = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("classroom_enabled")
      .eq("user_id", user.id)
      .maybeSingle<{ classroom_enabled: boolean | null }>();
    showClasses = Boolean(profile?.classroom_enabled);
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-neutral-lightest via-white to-student-primary/10 text-neutral-900 print:block print:bg-white">
      <StudentSidebar showClasses={showClasses} />
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto bg-white/70 backdrop-blur print:bg-white print:p-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;
