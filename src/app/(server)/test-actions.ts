"use server";
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
  revalidatePath("/student");
}

interface StartTestInput {
  testId: string;
}

export async function startTestAction({ testId }: StartTestInput) {
  const cookieStore = await cookies();
  const supabase = createServerActionClient<Database>({ cookies: async () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be signed in.");
  }

  const { data: test, error } = await supabase
    .from("tests")
    .select("student_id, status")
    .eq("id", testId)
    .maybeSingle<{ student_id: string; status: string }>();

  if (error || !test) {
    console.error("startTestAction: failed to load test", error);
    throw new Error("Unable to start test.");
  }

  if (test.student_id !== session.user.id) {
    throw new Error("You can only start your own tests.");
  }

  if (test.status !== "in_progress") {
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("tests")
      .update({ status: "in_progress" })
      .eq("id", testId);

    if (updateError) {
      console.error("startTestAction: update failed", updateError);
      throw new Error("Failed to start test.");
    }
  }

  revalidatePath("/student");
  revalidatePath(`/assessment/${testId}`);

  redirect(`/assessment/${testId}`);
}
