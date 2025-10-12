import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { levelToSeed } from "@/lib/tests/adaptiveConfig";

const DEFAULT_WEIGHTS: Record<string, number> = {
  reading: 0.4,
  grammar: 0.3,
  listening: 0.2,
  dialog: 0.1,
};

export async function finalizeTest(
  supabase: SupabaseClient<Database>,
  testId: string
): Promise<{
  weightedLevel: number | null;
  totalScore: number | null;
}> {
  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("student_id")
    .eq("id", testId)
    .maybeSingle();

  if (testError || !test) {
    throw new Error("Unable to finalize test");
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("test_sections")
    .select("*")
    .eq("test_id", testId);

  if (sectionsError || !sections || sections.length === 0) {
    throw new Error("Missing section data");
  }

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

  const updates: { id: string; score: number | null; final_level: number | null; completed: boolean }[] = [];

  sections.forEach((section) => {
    const served = section.questions_served;
    const correct = section.correct_count;
    const score = served > 0 ? Math.round((correct / served) * 1000) / 10 : 0;
    const levelValue =
      section.final_level ?? Number(levelToSeed({ level: section.current_level, sublevel: section.current_sublevel as "1" | "2" | "3" }));

    weightedLevel += (weights[section.section] ?? 0) * levelValue;
    weightsTotal += weights[section.section] ?? 0;
    totalScore += score;
    scoreCount += 1;

    updates.push({ id: section.id, score, final_level: levelValue, completed: true });
  });

  await Promise.all(
    updates.map((payload) =>
      supabase.from("test_sections").update({
        score: payload.score,
        final_level: payload.final_level,
        completed: payload.completed,
      }).eq("id", payload.id)
    )
  );

  const finalWeighted = weightsTotal > 0 ? Math.round((weightedLevel / weightsTotal) * 10) / 10 : null;
  const finalScore = scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : null;

  const updateTest = await supabase
    .from("tests")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      total_score: finalScore,
      weighted_level: finalWeighted,
    })
    .eq("id", testId);

  if (updateTest.error) {
    console.error("finalizeTest: failed to update test", updateTest.error);
  }

  await supabase
    .from("profiles")
    .update({ test_status: "completed" })
    .eq("user_id", test.student_id);

  return { weightedLevel: finalWeighted, totalScore: finalScore };
}
