import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { SECTION_ORDER, parseSeed, levelToSeed } from "@/lib/tests/adaptiveConfig";

export async function POST(_req: Request, { params }: { params: { testId: string } }) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("id, student_id, status, seed_start, time_limit_seconds, started_at, last_seen_at, elapsed_ms")
    .eq("id", params.testId)
    .maybeSingle();

  if (testError || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  if (test.student_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existingSections } = await supabase
    .from("test_sections")
    .select("section")
    .eq("test_id", params.testId);

  const existing = new Set(existingSections?.map((row) => row.section) ?? []);
  const seed = (test.seed_start as Record<string, string> | null) ?? {};

  const sectionsToInsert = SECTION_ORDER.filter((section) => !existing.has(section)).map((section) => {
    const levelState = parseSeed(seed[section]);
    return {
      test_id: params.testId,
      section,
      current_level: levelState.level,
      current_sublevel: levelState.sublevel,
      current_passage_id: null,
      current_passage_question_count: 0,
    };
  });

  if (sectionsToInsert.length > 0) {
    const { error: insertError } = await supabase.from("test_sections").insert(sectionsToInsert);
    if (insertError) {
      console.error("start route: failed to insert test_sections", insertError);
      return NextResponse.json({ error: "Failed to prepare test" }, { status: 500 });
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

  const { error: updateError } = await supabase.from("tests").update(updates).eq("id", params.testId);
  if (updateError) {
    console.error("start route: failed to update test", updateError);
    return NextResponse.json({ error: "Unable to start test" }, { status: 500 });
  }

  return NextResponse.json({
    status: updates.status ?? test.status,
    timeLimitSeconds: test.time_limit_seconds,
    elapsedMs: test.elapsed_ms ?? 0,
    seeds: SECTION_ORDER.reduce<Record<string, string>>((acc, section) => {
      const levelState = parseSeed(seed[section]);
      acc[section] = levelToSeed(levelState);
      return acc;
    }, {}),
  });
}
