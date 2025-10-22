import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/database.types";

import {
  LevelState,
  TestSection,
  SECTION_PARALLEL_DEPENDENTS,
  shiftLevelBy,
} from "./adaptiveConfig";

type SectionRow = Pick<
  Database["public"]["Tables"]["test_sections"]["Row"],
  "id" | "section" | "questions_served" | "current_level" | "current_sublevel"
>;

type SectionRowMutable = SectionRow & { current_sublevel: "1" | "2" | "3" };

type SupabaseLike = Pick<SupabaseClient<Database>, "from">;

export async function syncParallelSectionLevels(
  supabase: SupabaseLike,
  testId: string,
  baseSection: TestSection,
  baseState: LevelState
): Promise<void> {
  const dependents = SECTION_PARALLEL_DEPENDENTS[baseSection];
  if (!dependents || dependents.length === 0) {
    return;
  }

  const { data, error } = await supabase
    .from("test_sections")
    .select("id, section, questions_served, current_level, current_sublevel")
    .eq("test_id", testId);

  if (error || !data) {
    if (error) {
      console.error("parallel sync: failed to load section states", error);
    }
    return;
  }

  const sections = new Map<TestSection, SectionRowMutable>();
  for (const rawRow of data as SectionRow[]) {
    const sectionKey = rawRow.section as TestSection;
    const sublevel =
      rawRow.current_sublevel === "2"
        ? "2"
        : rawRow.current_sublevel === "3"
          ? "3"
          : "1";
    sections.set(sectionKey, {
      ...rawRow,
      current_sublevel: sublevel,
    });
  }

  const updates: Array<{ id: string; state: LevelState }> = [];

  const traverse = (section: TestSection, state: LevelState) => {
    const downstream = SECTION_PARALLEL_DEPENDENTS[section];
    if (!downstream || downstream.length === 0) {
      return;
    }

    downstream.forEach(({ section: dependentSection, offset }) => {
      const row = sections.get(dependentSection);
      if (!row) {
        return;
      }

      const alreadyStarted = (row.questions_served ?? 0) > 0;
      const targetState = shiftLevelBy(state, offset);

      let nextBase: LevelState = {
        level: row.current_level ?? targetState.level,
        sublevel: row.current_sublevel,
      };

      if (!alreadyStarted) {
        if (row.current_level !== targetState.level || row.current_sublevel !== targetState.sublevel) {
          updates.push({ id: row.id, state: targetState });
          row.current_level = targetState.level;
          row.current_sublevel = targetState.sublevel;
        }
        nextBase = targetState;
      }

      traverse(dependentSection, nextBase);
    });
  };

  traverse(baseSection, baseState);

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from("test_sections")
      .update({ current_level: update.state.level, current_sublevel: update.state.sublevel } as never)
      .eq("id", update.id);
    if (updateError) {
      console.error("parallel sync: failed to update dependent section", updateError);
    }
  }
}
