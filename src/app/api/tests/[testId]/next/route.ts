import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { SECTION_ORDER } from "@/lib/tests/adaptiveConfig";

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
    .select("id, student_id, status, time_limit_seconds, elapsed_ms, seed_start")
    .eq("id", params.testId)
    .maybeSingle();

  if (testError || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  if (test.student_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (test.status === "completed" || test.status === "reviewed") {
    return NextResponse.json({ done: true });
  }

  const limitMs = (test.time_limit_seconds ?? 3000) * 1000;
  const elapsedMs = test.elapsed_ms ?? 0;
  const timeRemainingSeconds = Math.max(0, Math.floor((limitMs - elapsedMs) / 1000));
  if (timeRemainingSeconds <= 0) {
    return NextResponse.json({ timeExpired: true, done: true });
  }

  const { data: sectionRows, error: sectionsError } = await supabase
    .from("test_sections")
    .select("*")
    .eq("test_id", params.testId);

  if (sectionsError || !sectionRows || sectionRows.length === 0) {
    return NextResponse.json({ error: "Test sections missing" }, { status: 422 });
  }

  const orderedSections = SECTION_ORDER.map((section) =>
    sectionRows.find((row) => row.section === section)
  ).filter((row): row is NonNullable<typeof row> => Boolean(row));

  const activeSection = orderedSections.find((row) => !row.completed);
  if (!activeSection) {
    return NextResponse.json({ done: true });
  }

  const sectionResponses = await supabase
    .from("responses")
    .select("question_id")
    .eq("test_id", params.testId)
    .eq("section", activeSection.section);

  if (sectionResponses.error) {
    console.error("next route: failed to fetch responses", sectionResponses.error);
  }

  const answeredIds = new Set(sectionResponses.data?.map((row) => row.question_id) ?? []);

  let currentPassageId = activeSection.current_passage_id as string | null;
  let passageQuestionCount = activeSection.current_passage_question_count ?? 0;

  if (activeSection.section === "reading" && (!currentPassageId || passageQuestionCount >= 5)) {
    const { data: answeredQuestions } = answeredIds.size
      ? await supabase
          .from("questions")
          .select("id, passage_id")
          .in("id", Array.from(answeredIds))
      : { data: [], error: null };
    const passageUsage = new Map<string, number>();
    answeredQuestions?.forEach((row) => {
      if (row.passage_id) {
        passageUsage.set(
          row.passage_id,
          (passageUsage.get(row.passage_id) ?? 0) + 1
        );
      }
    });

    const { data: passages, error: passagesError } = await supabase
      .from("question_passages")
      .select("id")
      .eq("section", "reading")
      .eq("level", activeSection.current_level)
      .eq("sublevel", activeSection.current_sublevel)
      .order("created_at");

    if (passagesError) {
      console.error("next route: failed to load passages", passagesError);
      return NextResponse.json({ error: "No passages available" }, { status: 500 });
    }

    const nextPassage = passages?.find(
      (passage) => (passageUsage.get(passage.id) ?? 0) < 5
    );

  if (activeSection.section === "reading" && (!currentPassageId || passageQuestionCount >= 5)) {
    const { data: answeredQuestions } = answeredIds.size
      ? await supabase
          .from("questions")
          .select("id, passage_id")
          .in("id", Array.from(answeredIds))
      : { data: [], error: null };
    const passageUsage = new Map<string, number>();
    answeredQuestions?.forEach((row) => {
      if (row.passage_id) {
        passageUsage.set(row.passage_id, (passageUsage.get(row.passage_id) ?? 0) + 1);
      }
    });

    const { data: passages, error: passagesError } = await supabase
      .from("question_passages")
      .select("id")
      .eq("section", "reading")
      .eq("level", activeSection.current_level)
      .eq("sublevel", activeSection.current_sublevel)
      .order("created_at");

    if (passagesError) {
      console.error("next route: failed to load passages", passagesError);
      return NextResponse.json({ error: "No passages available" }, { status: 500 });
    }

    const nextPassage = passages?.find((passage) => (passageUsage.get(passage.id) ?? 0) < 5);

    if (!nextPassage) {
      await supabase
        .from("test_sections")
        .update({ completed: true, final_level: Number(`${activeSection.current_level}.${activeSection.current_sublevel}`) })
        .eq("id", activeSection.id);
      return NextResponse.json({ done: false, sectionCompleted: true });
    }

    currentPassageId = nextPassage.id;
    passageQuestionCount = 0;
    await supabase
      .from("test_sections")
      .update({ current_passage_id: currentPassageId, current_passage_question_count: passageQuestionCount })
      .eq("id", activeSection.id);
  }

  let questionQuery = supabase
    .from("questions")
    .select(
      "id, stem, options, skill_tags, media_url, passage_id, question_passages(title, body)"
    )
    .eq("section", activeSection.section)
    .eq("level", activeSection.current_level)
    .eq("sublevel", activeSection.current_sublevel)
    .order("created_at");

  if (activeSection.section === "reading" && currentPassageId) {
    questionQuery = questionQuery.eq("passage_id", currentPassageId);
  }

  const { data: candidateQuestions, error: questionError } = await questionQuery;
  if (questionError) {
    console.error("next route: failed to load questions", questionError);
    return NextResponse.json({ error: "No questions available" }, { status: 500 });
  }

  const nextQuestion = candidateQuestions?.find((question) => !answeredIds.has(question.id));

  if (!nextQuestion) {
    await supabase
      .from("test_sections")
      .update({ completed: true })
      .eq("id", activeSection.id);
    return NextResponse.json({ done: false, sectionCompleted: true });
  }

  const responsePayload: Record<string, unknown> = {
    testId: params.testId,
    section: activeSection.section,
    timeRemainingSeconds,
    level: `${activeSection.current_level}.${activeSection.current_sublevel}`,
    question: {
      id: nextQuestion.id,
      stem: nextQuestion.stem,
      options: nextQuestion.options,
      skillTags: nextQuestion.skill_tags ?? [],
      mediaUrl: nextQuestion.media_url,
    },
  };

  if (activeSection.section === "reading") {
    const passage = Array.isArray(nextQuestion.question_passages)
      ? nextQuestion.question_passages[0]
      : (nextQuestion.question_passages as { title: string; body: string } | null);
    responsePayload.passage = passage ?? null;
  }

  return NextResponse.json(responsePayload);
}
