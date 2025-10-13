"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { SECTION_ORDER, parseSeed } from "@/lib/tests/adaptiveConfig";

interface AssignEntranceTestInput {
  studentId: string;
}

type StartableTestRow = Pick<
  Database["public"]["Tables"]["tests"]["Row"],
  "id" | "student_id" | "status" | "seed_start" | "time_limit_seconds" | "elapsed_ms"
>;

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
    .select("id, student_id, status, seed_start, time_limit_seconds, elapsed_ms")
    .eq("id", testId)
    .maybeSingle<StartableTestRow>();

  if (error || !test) {
    console.error("startTestAction: failed to load test", error);
    throw new Error("Unable to start test.");
  }

  if (test.student_id !== session.user.id) {
    throw new Error("You can only start your own tests.");
  }

  const { data: existingSections } = await supabase
    .from("test_sections")
    .select("section")
    .eq("test_id", testId);

  const existingSectionRows = (existingSections ?? []) as Array<
    Pick<Database["public"]["Tables"]["test_sections"]["Row"], "section">
  >;
  const existing = new Set(existingSectionRows.map((row) => row.section));
  const seeds = (test.seed_start as Record<string, string> | null) ?? {};

  const sectionsToInsert: Database["public"]["Tables"]["test_sections"]["Insert"][] = SECTION_ORDER.filter(
    (section) => !existing.has(section)
  ).map((section) => {
    const levelState = parseSeed(seeds[section]);
    return {
      test_id: testId,
      section,
      current_level: levelState.level,
      current_sublevel: levelState.sublevel,
      current_passage_id: null,
      current_passage_question_count: 0,
    } satisfies Database["public"]["Tables"]["test_sections"]["Insert"];
  });

  if (sectionsToInsert.length > 0) {
    const insertResult = await supabase
      .from("test_sections")
      .insert(sectionsToInsert as unknown as never);
    if (insertResult.error) {
      console.error("startTestAction: failed to prepare sections", insertResult.error);
      throw new Error("Unable to start test.");
    }
  }

  const now = new Date().toISOString();
  const updates: Partial<Database["public"]["Tables"]["tests"]["Update"]> = {
    last_seen_at: now,
  };
  if (test.status === "assigned") {
    updates.status = "in_progress";
    updates.started_at = now;
  }

  const admin = createAdminClient();
  const { error: updateError } = await admin.from("tests").update(updates).eq("id", testId);
  if (updateError) {
    console.error("startTestAction: update failed", updateError);
    throw new Error("Failed to start test.");
  }

  revalidatePath("/student");
  revalidatePath(`/assessment/${testId}`);

  redirect(`/assessment/${testId}`);
}
