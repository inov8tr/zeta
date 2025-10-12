"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabaseAdmin";

interface AssignEntranceTestInput {
  studentId: string;
}

export async function assignEntranceTestAction({ studentId }: AssignEntranceTestInput) {
  const cookieStore = await cookies();
  const supabase = createServerActionClient<Database>({ cookies: async () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be signed in.");
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (actorProfile?.role !== "admin") {
    throw new Error("Only admins can assign tests.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("tests").insert({
    student_id: studentId,
    type: "entrance",
    status: "assigned",
  });

  if (error) {
    console.error("assignEntranceTestAction", error);
    throw new Error("Failed to assign test.");
  }

  revalidatePath(`/dashboard/users/${studentId}`);
  revalidatePath("/dashboard/tests");
}
