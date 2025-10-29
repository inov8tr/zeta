import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import TeacherShell from "@/components/teacher/TeacherShell";
import type { Database } from "@/lib/database.types";

type TeacherProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "role" | "full_name">;

const TeacherLayout = async ({ children }: { children: ReactNode }) => {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("user_id", user.id)
    .maybeSingle<TeacherProfileRow>();

  if (!profile || (profile.role ?? "").toLowerCase() !== "teacher") {
    redirect("/login");
  }

  return <TeacherShell teacherName={profile.full_name}>{children}</TeacherShell>;
};

export default TeacherLayout;

