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
  READING_PASSAGE_SET_SIZE,
  READING_SET_PROMOTE_THRESHOLD,
  READING_SET_DEMOTE_THRESHOLD,
  READING_SET_SKIP_STEPS,
  adjustLevel,
} from "@/lib/tests/adaptiveConfig";
import { finalizeTest } from "@/lib/tests/finalize";

type RouteParams = Record<string, string | string[] | undefined>;
type SubmitTestRow = Pick<
  Database["public"]["Tables"]["tests"]["Row"],
  "id" | "student_id" | "status" | "time_limit_seconds" | "elapsed_ms"
>;
type SubmitQuestionRow = Pick<
  Database["public"]["Tables"]["questions"]["Row"],
  "id" | "section" | "level" | "sublevel" | "answer_index" | "passage_id"
>;
type SubmitSectionRow = Database["public"]["Tables"]["test_sections"]["Row"];

export async function POST(
  req: Request,
  context: { params: Promise<RouteParams> }
) {
  const paramsObject = await context.params;
  const rawTestId = paramsObject?.testId;
  const testId = Array.isArray(rawTestId) ? rawTestId[0] : rawTestId;
  if (typeof testId !== "string" || testId.length === 0) {
    return NextResponse.json({ error: "Invalid test id" }, { status: 400 });
  }
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
    .eq("id", testId)
    .maybeSingle<SubmitTestRow>();

  if (testError || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const testRow = test as SubmitTestRow;

  if (testRow.student_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id, section, level, sublevel, answer_index, passage_id")
    .eq("id", questionId)
    .maybeSingle<SubmitQuestionRow>();

  if (questionError || !question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const { data: sectionRow, error: sectionError } = await supabase
    .from("test_sections")
    .select("*")
    .eq("test_id", testId)
    .eq("section", question.section)
    .maybeSingle<SubmitSectionRow>();

  if (sectionError || !sectionRow) {
    return NextResponse.json({ error: "Section state missing" }, { status: 422 });
  }

  const limitMs = (testRow.time_limit_seconds ?? 3000) * 1000;
  const timeSpent = typeof timeSpentMs === "number" && timeSpentMs > 0 ? timeSpentMs : 0;

  const correct = question.answer_index === selectedIndex;

  const responsePayload: Database["public"]["Tables"]["responses"]["Insert"] = {
    test_id: testId,
    section: question.section,
    question_id: question.id,
    selected_index: selectedIndex,
    correct,
    time_spent_ms: timeSpent,
  };

  const responseInsert = await supabase.from("responses").insert(responsePayload as never);

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
    if (question.section !== "reading") {
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
  }

  let currentPassageId = sectionRow.current_passage_id as string | null;
  let passageCount = sectionRow.current_passage_question_count ?? 0;
  if (!responseInsert.error && question.section === "reading") {
    passageCount += 1;
    if (passageCount >= READING_PASSAGE_SET_SIZE) {
      // Evaluate performance for the completed passage set
      const { data: setRows, error: setErr } = await supabase
        .from("responses")
        .select("correct, questions(passage_id)")
        .eq("test_id", testId)
        .eq("section", "reading");
      if (setErr) {
        console.error("submit route: failed to compute reading set score", setErr);
      } else {
        type ResponseWithQuestion = { correct: boolean; questions: { passage_id: string | null } | null };
        const typedRows = (setRows ?? []) as ResponseWithQuestion[];
        const forPassage = typedRows.filter((row) => row.questions?.passage_id === question.passage_id);
        const total = forPassage.length;
        const correctNum = forPassage.reduce((acc: number, r: ResponseWithQuestion) => acc + (r.correct ? 1 : 0), 0);
        const ratio = total > 0 ? correctNum / total : 0;

        // Adjust level based on set accuracy
        if (ratio >= 1) {
          newLevelState = adjustLevel(newLevelState, "up", READING_SET_SKIP_STEPS);
        } else if (ratio >= READING_SET_PROMOTE_THRESHOLD) {
          newLevelState = adjustLevel(newLevelState, "up", 1);
        } else if (ratio < READING_SET_DEMOTE_THRESHOLD) {
          newLevelState = adjustLevel(newLevelState, "down", 1);
        }
        // reset streaks for reading path
        streakUp = 0;
        streakDown = 0;
      }

      // reset passage state to trigger a new passage on next fetch
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
    .update(sectionUpdatePayload as never)
    .eq("id", sectionRow.id);

  if (updateSectionError) {
    console.error("submit route: failed to update section", updateSectionError);
    return NextResponse.json({ error: "Unable to update section" }, { status: 500 });
  }

  const newElapsed = Math.min(limitMs, (testRow.elapsed_ms ?? 0) + timeSpent);
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
    .update(testUpdate as never)
    .eq("id", testId);

  if (testUpdateError) {
    console.error("submit route: failed to update test", testUpdateError);
    return NextResponse.json({ error: "Unable to update test" }, { status: 500 });
  }

  const { data: sectionsAfterData } = await supabase
    .from("test_sections")
    .select("completed")
    .eq("test_id", testId);
  const sectionsAfter = (sectionsAfterData ?? []) as Array<
    Pick<Database["public"]["Tables"]["test_sections"]["Row"], "completed">
  >;
  const allCompleted = sectionsAfter.length > 0 && sectionsAfter.every((row) => row.completed);

  let finalizedSummary: Awaited<ReturnType<typeof finalizeTest>> | null = null;

  if (timeExpired || allCompleted) {
    finalizedSummary = await finalizeTest(supabase, testId);
  }

  return NextResponse.json({
    correct,
    sectionCompleted,
    allCompleted: allCompleted || Boolean(finalizedSummary),
    timeExpired,
    finalized: finalizedSummary,
  });
}
