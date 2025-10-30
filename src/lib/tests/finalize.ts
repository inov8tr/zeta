import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { levelToSeed } from "@/lib/tests/adaptiveConfig";
import { generateEntranceFeedback, type EntranceFeedbackInput } from "@/lib/feedback/generateEntranceFeedback";

const DEFAULT_WEIGHTS: Record<string, number> = {
  reading: 0.4,
  grammar: 0.3,
  listening: 0.2,
  dialog: 0.1,
};

type SectionKey = "grammar" | "reading" | "listening" | "dialog";
const SECTION_KEYS: SectionKey[] = ["grammar", "reading", "listening", "dialog"];

type FinalizableTestRow = Pick<
  Database["public"]["Tables"]["tests"]["Row"],
  "student_id" | "type" | "elapsed_ms" | "started_at" | "assigned_at" | "completed_at"
>;

const isSectionKey = (value: string): value is SectionKey => SECTION_KEYS.includes(value as SectionKey);

export async function finalizeTest(
  supabaseClient: unknown,
  testId: string
): Promise<{
  weightedLevel: number | null;
  totalScore: number | null;
}> {
  const supabase = supabaseClient as SupabaseClient<Database>;
  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("student_id, type, elapsed_ms, started_at, assigned_at, completed_at")
    .eq("id", testId)
    .maybeSingle<FinalizableTestRow>();

  if (testError || !test) {
    throw new Error("Unable to finalize test");
  }

  const studentId = test.student_id;
  if (!studentId) {
    throw new Error("Test missing student");
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("test_sections")
    .select("*")
    .eq("test_id", testId)
    .returns<Database["public"]["Tables"]["test_sections"]["Row"][]>();

  if (sectionsError || !sections || sections.length === 0) {
    throw new Error("Missing section data");
  }

  const sectionRows = sections as Database["public"]["Tables"]["test_sections"]["Row"][];

  const { data: settings } = await supabase
    .from("analytics_settings")
    .select("weights, caps")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const weights = { ...DEFAULT_WEIGHTS, ...(settings?.weights as Record<string, number> | null) };

  let weightedLevel = 0;
  let weightsTotal = 0;
  let totalScore = 0;
  let scoreCount = 0;
  let totalCorrect = 0;
  let totalServed = 0;

  const updates: { id: string; score: number | null; final_level: number | null; completed: boolean }[] = [];
  const sectionScores: EntranceFeedbackInput["sectionScores"] = {};

  sectionRows.forEach((section) => {
    const served = section.questions_served;
    const correct = section.correct_count;
    const score = served > 0 ? Math.round((correct / served) * 1000) / 10 : 0;
    const levelValue =
      section.final_level ?? Number(levelToSeed({ level: section.current_level, sublevel: section.current_sublevel as "1" | "2" | "3" }));

    weightedLevel += (weights[section.section] ?? 0) * levelValue;
    weightsTotal += weights[section.section] ?? 0;
    totalScore += score;
    scoreCount += 1;
    totalCorrect += correct;
    totalServed += served;

    if (isSectionKey(section.section)) {
      sectionScores[section.section] = { score, level: levelValue };
    }

    updates.push({ id: section.id, score, final_level: levelValue, completed: true });
  });

  await Promise.all(
    updates.map((payload) =>
      supabase
        .from("test_sections")
        .update({
          score: payload.score,
          final_level: payload.final_level,
          completed: payload.completed,
        } as never)
        .eq("id", payload.id)
    )
  );

  const finalWeighted = weightsTotal > 0 ? Math.round((weightedLevel / weightsTotal) * 10) / 10 : null;
  const finalScore = scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : null;
  const accuracy = totalServed > 0 ? Math.round((totalCorrect / totalServed) * 1000) / 10 : null;

  const completionDate = new Date();
  const completedAtIso = completionDate.toISOString();
  const startReference = test.started_at ?? test.assigned_at;
  const computedTime = startReference ? Math.max(0, completionDate.getTime() - new Date(startReference).getTime()) : null;
  const finalTimeSpentMs = typeof test.elapsed_ms === "number" && test.elapsed_ms > 0 ? test.elapsed_ms : computedTime;

  const updateTest = await supabase
    .from("tests")
    .update({
      status: "completed",
      completed_at: completedAtIso,
      total_score: finalScore,
      weighted_level: finalWeighted,
      elapsed_ms: finalTimeSpentMs ?? test.elapsed_ms ?? null,
    } as never)
    .eq("id", testId);

  if (updateTest.error) {
    console.error("finalizeTest: failed to update test", updateTest.error);
  }

  await supabase
    .from("profiles")
    .update({ test_status: "completed" } as never)
    .eq("user_id", studentId);

  if (test.type === "entrance") {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", studentId)
      .maybeSingle<{ full_name: string | null }>();

    const feedbackInput: EntranceFeedbackInput = {
      studentName: profileRow?.full_name ?? null,
      level: finalWeighted,
      totalScore: finalScore,
      accuracy,
      timeSpentMs: finalTimeSpentMs ?? null,
      sectionScores,
    };

    const feedback = generateEntranceFeedback(feedbackInput);
    await supabase
      .from("entrance_feedback")
      .upsert(
        {
          user_id: studentId,
          test_id: testId,
          estimated_level: finalWeighted,
          total_score: finalScore,
          accuracy,
          time_spent: finalTimeSpentMs != null ? `${finalTimeSpentMs} milliseconds` : null,
          grammar_score: sectionScores.grammar?.score ?? null,
          reading_score: sectionScores.reading?.score ?? null,
          listening_score: sectionScores.listening?.score ?? null,
          dialog_score: sectionScores.dialog?.score ?? null,
          band: feedback.levelBand,
          lexile: feedback.lexile,
          cefr: feedback.cefr,
          korean_equiv: feedback.koreanEquivalent,
          us_equiv: feedback.usEquivalent,
          feedback_text: feedback.feedbackText,
        } as Database["public"]["Tables"]["entrance_feedback"]["Insert"],
        { onConflict: "test_id" }
      );
  }

  return { weightedLevel: finalWeighted, totalScore: finalScore };
}
