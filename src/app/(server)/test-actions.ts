"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { SECTION_ORDER, parseSeed, LevelState, levelToSeed, MIN_LEVEL, MAX_LEVEL } from "@/lib/tests/adaptiveConfig";
import { syncParallelSectionLevels } from "@/lib/tests/parallel";
import { computePlacementSeedForStudent } from "@/lib/tests/placement";

interface AssignEntranceTestInput {
  studentId: string;
  followUp?: boolean;
}

type StartableTestRow = Pick<
  Database["public"]["Tables"]["tests"]["Row"],
  "id" | "student_id" | "status" | "seed_start" | "time_limit_seconds" | "elapsed_ms"
>;

export async function assignEntranceTestAction({ studentId, followUp = false }: AssignEntranceTestInput) {
  const cookieStore = await cookies();
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

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
  const toLevelState = (value: number | null | undefined) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return { level: MIN_LEVEL.level, sublevel: MIN_LEVEL.sublevel };
    }
    const normalized = Number(value.toFixed(1));
    const [intPart, decimalPartRaw = "1"] = normalized.toFixed(1).split(".");
    let level = Number.parseInt(intPart, 10);
    if (Number.isNaN(level)) {
      level = MIN_LEVEL.level;
    }
    level = Math.min(Math.max(level, MIN_LEVEL.level), MAX_LEVEL.level);
    const decimalPart = decimalPartRaw.padEnd(1, "0").slice(0, 1);
    let sublevel: "1" | "2" | "3" = "1";
    if (decimalPart === "2") {
      sublevel = "2";
    } else if (decimalPart === "3") {
      sublevel = "3";
    }
    return { level, sublevel };
  };

  let seedStart: Record<string, unknown> | null = null;

  if (followUp) {
    const { data: lastTest } = await admin
      .from("tests")
      .select("id, weighted_level, completed_at")
      .eq("student_id", studentId)
      .eq("type", "entrance")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; weighted_level: number | null }>();

    if (lastTest?.id) {
      const { data: sections } = await admin
        .from("test_sections")
        .select("section, final_level")
        .eq("test_id", lastTest.id);

      if (sections && sections.length > 0) {
        const levelLookup = new Map<string, number | null | undefined>();
        for (const section of sections) {
          levelLookup.set(section.section, section.final_level as number | null | undefined);
        }

        const seeds: Record<string, string> = {};
        SECTION_ORDER.forEach((section) => {
          const levelValue = levelLookup.get(section) ?? lastTest.weighted_level ?? MIN_LEVEL.level;
          seeds[section] = levelToSeed(toLevelState(levelValue));
        });

        seedStart = {
          ...seeds,
          __meta: {
            source: "follow_up",
            previous_test_id: lastTest.id,
          },
        };
      }
    }
  }

  if (!seedStart) {
    const placement = await computePlacementSeedForStudent(admin, studentId);
    if (placement?.seedStart && typeof placement.seedStart === "object" && !Array.isArray(placement.seedStart)) {
      const baseSeed = placement.seedStart as Record<string, unknown>;
      const existingMeta = (baseSeed.__meta ?? {}) as Record<string, unknown>;
      seedStart = {
        ...baseSeed,
        __meta: {
          source: "initial",
          ...existingMeta,
        },
      };
    }
  }

  const testPayload: Database["public"]["Tables"]["tests"]["Insert"] = {
    student_id: studentId,
    type: "entrance",
    status: "assigned",
    assigned_at: new Date().toISOString(),
    seed_start: (seedStart ?? null) as Database["public"]["Tables"]["tests"]["Insert"]["seed_start"],
  };

  const { error } = await admin.from("tests").insert(testPayload as unknown as never);

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
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

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

  // Do not allow starting/resuming a completed or reviewed test
  if (test.status === "completed" || test.status === "reviewed") {
    revalidatePath("/student");
    redirect("/student");
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

  const { data: grammarSectionRow, error: grammarSectionError } = await supabase
    .from("test_sections")
    .select("current_level, current_sublevel")
    .eq("test_id", testId)
    .eq("section", "grammar")
    .maybeSingle<{ current_level: number | null; current_sublevel: "1" | "2" | "3" | null }>();

  if (grammarSectionError) {
    console.error("startTestAction: failed to load grammar section", grammarSectionError);
  }

  if (grammarSectionRow) {
    const fallbackSeed = parseSeed(seeds.grammar);
    const sublevel = grammarSectionRow.current_sublevel ?? fallbackSeed.sublevel;
    const grammarState: LevelState = {
      level: grammarSectionRow.current_level ?? fallbackSeed.level,
      sublevel,
    };
    await syncParallelSectionLevels(supabase, testId, "grammar", grammarState);
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
