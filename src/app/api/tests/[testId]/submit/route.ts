import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import {
  SECTION_MAX_QUESTIONS,
  STREAK_DOWN_THRESHOLD,
  STREAK_SKIP_DELTA,
  STREAK_SKIP_THRESHOLD,
  STREAK_UP_THRESHOLD,
  adjustLevel,
} from "@/lib/tests/adaptiveConfig";
import { finalizeTest } from "@/lib/tests/finalize";

export async function POST(req: Request, { params }: { params: { testId: string } }) {
  const body = await req.json();
  const { questionId, selectedIndex, timeSpentMs } = body ?? {};

  if (!questionId || typeof selectedIndex !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

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
    .select("id, student_id, status, time_limit_seconds, elapsed_ms")
    .eq("id", params.testId)
    .maybeSingle();

  if (testError || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  if (test.student_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id, section, level, sublevel, answer_index, passage_id")
    .eq("id", questionId)
    .maybeSingle();

  if (questionError || !question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const { data: sectionRow, error: sectionError } = await supabase
    .from("test_sections")
    .select("*")
    .eq("test_id", params.testId)
    .eq("section", question.section)
    .maybeSingle();

  if (sectionError || !sectionRow) {
    return NextResponse.json({ error: "Section state missing" }, { status: 422 });
  }

  const limitMs = (test.time_limit_seconds ?? 3000) * 1000;
  const timeSpent = typeof timeSpentMs === "number" && timeSpentMs > 0 ? timeSpentMs : 0;

  const correct = question.answer_index === selectedIndex;

  const responseInsert = await supabase.from("responses").insert({
    test_id: params.testId,
    section: question.section,
    question_id: question.id,
    selected_index: selectedIndex,
    correct,
    time_spent_ms: timeSpent,
  });

  if (responseInsert.error && responseInsert.error.code !== "23505") {
    console.error("submit route: failed to record response", responseInsert.error);
    return NextResponse.json({ error: "Unable to save response" }, { status: 500 });
  }

  const served = sectionRow.questions_served + (responseInsert.error ? 0 : 1);
  const correctCount = sectionRow.correct_count + (responseInsert.error ? 0 : correct ? 1 : 0);
  const incorrectCount = sectionRow.incorrect_count + (responseInsert.error ? 0 : correct ? 0 : 1);

  let streakUp = responseInsert.error ? sectionRow.streak_up : correct ? sectionRow.streak_up + 1 : 0;
  let streakDown = responseInsert.error ? sectionRow.streak_down : correct ? 0 : sectionRow.streak_down + 1;

  const currentLevelState = {
    level: sectionRow.current_level,
    sublevel: (sectionRow.current_sublevel as "1" | "2" | "3") ?? "1",
  };

  let newLevelState = { ...currentLevelState };

  if (!responseInsert.error) {
    if (correct) {
      if (streakUp >= STREAK_SKIP_THRESHOLD) {
        newLevelState = adjustLevel(newLevelState, "up", STREAK_SKIP_DELTA);
        streakUp = 0;
      } else if (streakUp >= STREAK_UP_THRESHOLD) {
        newLevelState = adjustLevel(newLevelState, "up", 1);
      }
    } else {
      if (streakDown >= STREAK_SKIP_THRESHOLD) {
        newLevelState = adjustLevel(newLevelState, "down", STREAK_SKIP_DELTA);
        streakDown = 0;
      } else if (streakDown >= STREAK_DOWN_THRESHOLD) {
        newLevelState = adjustLevel(newLevelState, "down", 1);
      }
    }
  }

  let currentPassageId = sectionRow.current_passage_id as string | null;
  let passageCount = sectionRow.current_passage_question_count ?? 0;
  if (!responseInsert.error && question.section === "reading") {
    passageCount += 1;
    if (passageCount >= 5) {
      currentPassageId = null;
      passageCount = 0;
    }
  }

  const sectionCompleted =
    served >= (SECTION_MAX_QUESTIONS[question.section as keyof typeof SECTION_MAX_QUESTIONS] ?? Number.MAX_SAFE_INTEGER);

  const sectionUpdatePayload: Partial<Database["public"]["Tables"]["test_sections"]["Update"]> = {
    questions_served: served,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    streak_up: streakUp,
    streak_down: streakDown,
    current_level: newLevelState.level,
    current_sublevel: newLevelState.sublevel,
    current_passage_id: currentPassageId,
    current_passage_question_count: passageCount,
  };

  if (sectionCompleted) {
    sectionUpdatePayload.completed = true;
    sectionUpdatePayload.final_level = Number(`${newLevelState.level}.${newLevelState.sublevel}`);
  }

  const { error: updateSectionError } = await supabase
    .from("test_sections")
    .update(sectionUpdatePayload)
    .eq("id", sectionRow.id);

  if (updateSectionError) {
    console.error("submit route: failed to update section", updateSectionError);
    return NextResponse.json({ error: "Unable to update section" }, { status: 500 });
  }

  const newElapsed = Math.min(limitMs, (test.elapsed_ms ?? 0) + timeSpent);
  const testUpdate: Partial<Database["public"]["Tables"]["tests"]["Update"]> = {
    elapsed_ms: newElapsed,
    last_seen_at: new Date().toISOString(),
  };

  const timeExpired = newElapsed >= limitMs;
  if (timeExpired) {
    testUpdate.status = "completed";
  }

  const { error: testUpdateError } = await supabase
    .from("tests")
    .update(testUpdate)
    .eq("id", params.testId);

  if (testUpdateError) {
    console.error("submit route: failed to update test", testUpdateError);
    return NextResponse.json({ error: "Unable to update test" }, { status: 500 });
  }

  const { data: sectionsAfter } = await supabase
    .from("test_sections")
    .select("completed")
    .eq("test_id", params.testId);
  const allCompleted =
    (sectionsAfter ?? []).length > 0 && (sectionsAfter ?? []).every((row) => row.completed);

  let finalizedSummary: Awaited<ReturnType<typeof finalizeTest>> | null = null;

  if (timeExpired || allCompleted) {
    finalizedSummary = await finalizeTest(supabase, params.testId);
  }

  return NextResponse.json({
    correct,
    sectionCompleted,
    allCompleted: allCompleted || Boolean(finalizedSummary),
    timeExpired,
    finalized: finalizedSummary,
  });
}
