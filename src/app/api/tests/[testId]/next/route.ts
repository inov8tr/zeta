import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { SECTION_ORDER, generateLevelCandidates, READING_PASSAGE_SET_SIZE } from "@/lib/tests/adaptiveConfig";
import { finalizeTest } from "@/lib/tests/finalize";

type RouteParams = Record<string, string | string[] | undefined>;

interface QuestionRow {
  id: string;
  stem: string;
  options: string[];
  skill_tags: string[] | null;
  media_url: string | null;
  instructions: string | null;
  passage_id: string | null;
  question_passages: { title: string; body: string }[] | { title: string; body: string } | null;
}

export async function POST(
  _req: Request,
  context: { params: Promise<RouteParams> }
) {
  const params = await context.params;
  const rawTestId = params?.testId;
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
    .select("id, student_id, status, time_limit_seconds, elapsed_ms")
    .eq("id", testId)
    .maybeSingle<
      Pick<
        Database["public"]["Tables"]["tests"]["Row"],
        "id" | "student_id" | "status" | "time_limit_seconds" | "elapsed_ms"
      >
    >();

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
    const summary = await finalizeTest(supabase, testId);
    return NextResponse.json({ timeExpired: true, done: true, finalized: summary });
  }

  const { data: sectionRows, error: sectionsError } = await supabase
    .from("test_sections")
    .select("*")
    .eq("test_id", testId);

  if (sectionsError || !sectionRows || sectionRows.length === 0) {
    return NextResponse.json({ error: "Test sections missing" }, { status: 422 });
  }

  const sectionRowsList = sectionRows as Database["public"]["Tables"]["test_sections"]["Row"][];

  const orderedSections = SECTION_ORDER.map((section) =>
    sectionRowsList.find((row) => row.section === section)
  ).filter((row): row is NonNullable<typeof row> => Boolean(row));

  const activeSection = orderedSections.find((row) => !row.completed);
  if (!activeSection) {
    const summary = await finalizeTest(supabase, testId);
    return NextResponse.json({ done: true, finalized: summary });
  }

  const sectionResponses = await supabase
    .from("responses")
    .select("question_id")
    .eq("test_id", testId)
    .eq("section", activeSection.section);

  if (sectionResponses.error) {
    console.error("next route: failed to fetch responses", sectionResponses.error);
  }

  const responseRows = (sectionResponses.data ?? []) as Array<
    Pick<Database["public"]["Tables"]["responses"]["Row"], "question_id">
  >;
  const answeredIds = new Set(responseRows.map((row) => row.question_id));

  const currentLevelState = {
    level: activeSection.current_level,
    sublevel: (activeSection.current_sublevel as "1" | "2" | "3") ?? "1",
  };

  const levelCandidates = generateLevelCandidates(currentLevelState, 4);

  const answeredReading =
    answeredIds.size > 0 && activeSection.section === "reading"
      ? await supabase
          .from("questions")
          .select("id, passage_id")
          .in("id", Array.from(answeredIds))
      : { data: [], error: null };

  const answeredReadingRows = (answeredReading.data ?? []) as Array<
    Pick<Database["public"]["Tables"]["questions"]["Row"], "id" | "passage_id">
  >;

  const passageUsage = new Map<string, number>();
  answeredReadingRows.forEach((row) => {
    if (row.passage_id) {
      passageUsage.set(row.passage_id, (passageUsage.get(row.passage_id) ?? 0) + 1);
    }
  });

  let selectedQuestion: QuestionRow | null = null;
  let selectedCandidate = currentLevelState;
  let selectedPassage: { title: string; body: string } | null = null;
  let nextPassageId = activeSection.current_passage_id as string | null;
  let nextPassageCount = activeSection.current_passage_question_count ?? 0;

  for (const candidate of levelCandidates) {
    let passageId = nextPassageId;
    let passageCount = nextPassageCount;
    let passagePayload: { title: string; body: string } | null = null;

    if (activeSection.section === "reading") {
      const levelChanged =
        candidate.level !== currentLevelState.level || candidate.sublevel !== currentLevelState.sublevel;
      if (levelChanged || !passageId || passageCount >= READING_PASSAGE_SET_SIZE) {
        const { data: passagesData, error: passagesError } = await supabase
          .from("question_passages")
          .select("id, title, body")
          .eq("section", "reading")
          .eq("level", candidate.level)
          .eq("sublevel", candidate.sublevel)
          .order("created_at");

        if (passagesError) {
          console.error("next route: failed to load passages", passagesError);
          continue;
        }

        const passages = (passagesData ?? []) as Array<
          Pick<Database["public"]["Tables"]["question_passages"]["Row"], "id" | "title" | "body">
        >;

        // Compute per-passage unanswered availability at this level/sublevel
        const { data: candQs } = await supabase
          .from("questions")
          .select("id, passage_id")
          .eq("section", "reading")
          .eq("level", candidate.level)
          .eq("sublevel", candidate.sublevel);
        const unansweredByPassage = new Map<string, number>();
        (candQs ?? []).forEach((q) => {
          const qid = (q as { id: string }).id;
          const pid = (q as { passage_id: string | null }).passage_id;
          if (!pid) {
            return;
          }
          if (!answeredIds.has(qid)) {
            unansweredByPassage.set(pid, (unansweredByPassage.get(pid) ?? 0) + 1);
          }
        });

        const availablePassages = passages.filter(
          (row) => (unansweredByPassage.get(row.id) ?? 0) > 0 && (passageUsage.get(row.id) ?? 0) < READING_PASSAGE_SET_SIZE
        );
        if (!availablePassages.length) {
          continue;
        }

        const randomPassage = availablePassages[Math.floor(Math.random() * availablePassages.length)];
        passageId = randomPassage.id;
        passageCount = passageUsage.get(randomPassage.id) ?? 0;
        passagePayload = { title: randomPassage.title, body: randomPassage.body };
      }
    }

    let questionQuery = supabase
      .from("questions")
      .select("id, stem, options, skill_tags, media_url, instructions, passage_id, question_passages(title, body)")
      .eq("section", activeSection.section)
      .eq("level", candidate.level)
      .eq("sublevel", candidate.sublevel)
      .order("created_at");

    if (activeSection.section === "reading" && passageId) {
      questionQuery = questionQuery.eq("passage_id", passageId);
    }

    const { data: candidateQuestionsData, error: questionError } = await questionQuery;
    if (questionError) {
      console.error("next route: failed to load questions", questionError);
      continue;
    }

    const candidateQuestions = (candidateQuestionsData ?? []) as QuestionRow[];

    const unansweredQuestions = candidateQuestions.filter((row) => !answeredIds.has(row.id));
    if (unansweredQuestions.length === 0) {
      continue;
    }

    const nextQuestion = unansweredQuestions[Math.floor(Math.random() * unansweredQuestions.length)];

    if (nextQuestion) {
      selectedQuestion = nextQuestion as QuestionRow;
      selectedCandidate = candidate;
      nextPassageId = passageId;
      nextPassageCount = passageCount;
      if (activeSection.section === "reading") {
        selectedPassage =
          passagePayload ??
          (Array.isArray(nextQuestion.question_passages)
            ? nextQuestion.question_passages[0]
            : (nextQuestion.question_passages as { title: string; body: string } | null)) ??
          null;
      }
      break;
    }
  }

  if (!selectedQuestion) {
    await supabase
      .from("test_sections")
      .update({ completed: true } as never)
      .eq("id", activeSection.id);
    return NextResponse.json({ done: false, sectionCompleted: true });
  }

  const sectionUpdate: Record<string, unknown> = {};
  if (
    selectedCandidate.level !== activeSection.current_level ||
    selectedCandidate.sublevel !== activeSection.current_sublevel
  ) {
    sectionUpdate.current_level = selectedCandidate.level;
    sectionUpdate.current_sublevel = selectedCandidate.sublevel;
  }
  if (activeSection.section === "reading") {
    sectionUpdate.current_passage_id = nextPassageId;
    sectionUpdate.current_passage_question_count = nextPassageCount;
  }
  if (Object.keys(sectionUpdate).length > 0) {
    const { error: syncError } = await supabase
      .from("test_sections")
      .update(sectionUpdate as never)
      .eq("id", activeSection.id);
    if (syncError) {
      console.error("next route: failed to sync section state", syncError);
    }
  }

  const responsePayload: Record<string, unknown> = {
    testId,
    section: activeSection.section,
    timeRemainingSeconds,
    level: `${selectedCandidate.level}.${selectedCandidate.sublevel}`,
    question: (() => {
      const originalOptions = selectedQuestion.options ?? [];
      const order = originalOptions.map((_, i) => i);
      // Fisher-Yates shuffle
      for (let i = order.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const shuffled = order.map((idx) => originalOptions[idx]);
      return {
        id: selectedQuestion.id,
        stem: selectedQuestion.stem,
        options: shuffled,
        optionOrder: order,
        skillTags: selectedQuestion.skill_tags ?? [],
        mediaUrl: selectedQuestion.media_url,
        instructions: selectedQuestion.instructions ?? null,
      };
    })(),
  };

  if (activeSection.section === "reading") {
    responsePayload.passage = selectedPassage ?? null;
  }

  return NextResponse.json(responsePayload);
}
