import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import {
  SECTION_ORDER,
  parseSeed,
  levelToSeed,
  LevelState,
} from "@/lib/tests/adaptiveConfig";
import { syncParallelSectionLevels } from "@/lib/tests/parallel";

type RouteParams = Record<string, string | string[] | undefined>;
type StartTestRow = Pick<
  Database["public"]["Tables"]["tests"]["Row"],
  "id" | "student_id" | "status" | "seed_start" | "time_limit_seconds" | "elapsed_ms"
>;

export async function POST(
  _req: Request,
  context: { params: Promise<RouteParams> }
) {
  const paramsObject = await context.params;
  const rawTestId = paramsObject?.testId;
  const testId = Array.isArray(rawTestId) ? rawTestId[0] : rawTestId;
  if (typeof testId !== "string" || testId.length === 0) {
    return NextResponse.json({ error: "Invalid test id" }, { status: 400 });
  }
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("id, student_id, status, seed_start, time_limit_seconds, started_at, last_seen_at, elapsed_ms")
    .eq("id", testId)
    .maybeSingle();

  if (testError || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const testRow = test as StartTestRow;

  if (testRow.student_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existingSections } = await supabase
    .from("test_sections")
    .select("section")
    .eq("test_id", testId);

  const existingSectionRows = (existingSections ?? []) as Array<
    Pick<Database["public"]["Tables"]["test_sections"]["Row"], "section">
  >;
  const existing = new Set(existingSectionRows.map((row) => row.section));
  const seed = (testRow.seed_start as Record<string, string> | null) ?? {};

  const sectionsToInsert: Database["public"]["Tables"]["test_sections"]["Insert"][] = SECTION_ORDER.filter(
    (section) => !existing.has(section)
  ).map((section) => {
    const levelState = parseSeed(seed[section]);
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
    const { error: insertError } = await supabase
      .from("test_sections")
      .insert(sectionsToInsert as unknown as never);
    if (insertError) {
      console.error("start route: failed to insert test_sections", insertError);
      return NextResponse.json({ error: "Failed to prepare test" }, { status: 500 });
    }
  }

  const { data: grammarSectionRow, error: grammarSectionError } = await supabase
    .from("test_sections")
    .select("current_level, current_sublevel")
    .eq("test_id", testId)
    .eq("section", "grammar")
    .maybeSingle<{ current_level: number | null; current_sublevel: "1" | "2" | "3" | null }>();

  if (grammarSectionError) {
    console.error("start route: failed to load grammar section", grammarSectionError);
  }

  if (grammarSectionRow) {
    const fallbackSeed = parseSeed(seed.grammar);
    const sublevel = grammarSectionRow.current_sublevel ?? fallbackSeed.sublevel;
    const grammarState: LevelState = {
      level: grammarSectionRow.current_level ?? fallbackSeed.level,
      sublevel,
    };
    await syncParallelSectionLevels(supabase, testId, "grammar", grammarState);
  }

  // Mark sections with no questions as completed to avoid dangling "in_progress" tests
  const { data: sectionStateData } = await supabase
    .from("test_sections")
    .select("id, section, completed")
    .eq("test_id", testId);
  const sectionState = (sectionStateData ?? []) as Array<
    Pick<Database["public"]["Tables"]["test_sections"]["Row"], "id" | "section" | "completed">
  >;
  const pendingSections = sectionState.filter((s) => !s.completed).map((s) => s.section);
  if (pendingSections.length > 0) {
    const { data: questionsData, error: qErr } = await supabase
      .from("questions")
      .select("section")
      .in("section", pendingSections);
    if (qErr) {
      console.error("start route: failed to check question availability", qErr);
    } else {
      const available = new Set((questionsData ?? []).map((q) => (q as { section: string }).section));
      const toCompleteIds = sectionState
        .filter((s) => !s.completed && !available.has(s.section))
        .map((s) => s.id);
      if (toCompleteIds.length > 0) {
        const { error: completeErr } = await supabase
          .from("test_sections")
          .update({ completed: true } as never)
          .in("id", toCompleteIds);
        if (completeErr) {
          console.error("start route: failed to auto-complete empty sections", completeErr);
        }
      }
    }
  }

  const now = new Date().toISOString();
  const updates: Partial<Database["public"]["Tables"]["tests"]["Update"]> = {
    last_seen_at: now,
  };

  if (testRow.status === "assigned") {
    updates.status = "in_progress";
    updates.started_at = now;
  }

  const { error: updateError } = await supabase
    .from("tests")
    .update(updates as never)
    .eq("id", testId);
  if (updateError) {
    console.error("start route: failed to update test", updateError);
    return NextResponse.json({ error: "Unable to start test" }, { status: 500 });
  }

  const { data: seedSectionsData, error: seedSectionsError } = await supabase
    .from("test_sections")
    .select("section, current_level, current_sublevel")
    .eq("test_id", testId);

  if (seedSectionsError) {
    console.error("start route: failed to load section seeds", seedSectionsError);
  }

  const seedRows = (seedSectionsData ?? []) as Array<
    Pick<Database["public"]["Tables"]["test_sections"]["Row"], "section" | "current_level" | "current_sublevel">
  >;
  const seedsFromSections = new Map<string, string>();
  seedRows.forEach((row) => {
    if (row.current_level == null) {
      return;
    }
    const sectionKey = row.section;
    const sublevel = row.current_sublevel === "2" ? "2" : row.current_sublevel === "3" ? "3" : "1";
    seedsFromSections.set(sectionKey, levelToSeed({ level: row.current_level, sublevel }));
  });

  const seedsResponse = SECTION_ORDER.reduce<Record<string, string>>((acc, section) => {
    const fromDb = seedsFromSections.get(section);
    if (fromDb) {
      acc[section] = fromDb;
    } else {
      const levelState = parseSeed(seed[section]);
      acc[section] = levelToSeed(levelState);
    }
    return acc;
  }, {});

  return NextResponse.json({
    status: updates.status ?? testRow.status,
    timeLimitSeconds: testRow.time_limit_seconds,
    elapsedMs: testRow.elapsed_ms ?? 0,
    seeds: seedsResponse,
  });
}
