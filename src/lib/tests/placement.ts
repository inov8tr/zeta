import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/database.types";
import type { ParentSurveyForm } from "@/app/(public)/survey/shared";
import { MAX_LEVEL, MIN_LEVEL, type LevelState } from "@/lib/tests/adaptiveConfig";

const SECTION_KEYS = ["grammar", "reading", "listening", "dialog"] as const;
type PlacementSection = (typeof SECTION_KEYS)[number];

const MIN_LEVEL_VALUE = MIN_LEVEL.level + sublevelToIncrement(MIN_LEVEL.sublevel);
const MAX_LEVEL_VALUE = MAX_LEVEL.level + sublevelToIncrement(MAX_LEVEL.sublevel);

type BackgroundCategory =
  | "worksheet_only"
  | "mixed"
  | "academy_plus"
  | "multi_academy"
  | "overseas";

type PlacementComputation = {
  seedStart: Json;
  baseLevel: number;
  startLevels: Record<PlacementSection, number>;
  skillModifiers: Record<PlacementSection, number>;
  profileTags: string[];
};

export async function computePlacementSeedForStudent(
  admin: SupabaseClient<Database>,
  studentId: string
): Promise<PlacementComputation | null> {
  const { data: surveyRow, error: surveyError } = await admin
    .from("parent_surveys")
    .select("data")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ data: ParentSurveyForm }>();

  if (surveyError || !surveyRow?.data) {
    return null;
  }

  const survey = surveyRow.data;

  const inputs = extractPlacementInputs(survey);
  const baseLevel = determineBaseLevel(inputs);
  const skillModifiers = determineSkillModifiers(inputs);

  const startLevels = SECTION_KEYS.reduce<Record<PlacementSection, number>>((acc, section) => {
    const modifier = skillModifiers[section] ?? 0;
    acc[section] = clampLevelValue(baseLevel + modifier);
    return acc;
  }, {} as Record<PlacementSection, number>);

  const profileTags = buildProfileTags(inputs, skillModifiers, startLevels);

  const seedStart: Json = {
    grammar: startLevelToSeed(startLevels.grammar),
    reading: startLevelToSeed(startLevels.reading),
    listening: startLevelToSeed(startLevels.listening),
    dialog: startLevelToSeed(startLevels.dialog),
    __meta: {
      source: "parent_survey",
      computed_at: new Date().toISOString(),
      base_level: baseLevel,
      skill_modifiers: skillModifiers,
      start_levels: startLevels,
      profile_tags: profileTags,
    },
  };

  return {
    seedStart,
    baseLevel,
    startLevels,
    skillModifiers,
    profileTags,
  };
}

type PlacementInputs = {
  gradeValue: number | null;
  gradeRaw: string | null;
  backgroundCategory: BackgroundCategory;
  academyCount: number;
  highestScore: number | null;
  weeklyReadingCount: number | null;
  strongestSubject: string | null;
  weakestSubject: string | null;
  motivation: string | null;
  homeworkAmount: string | null;
  perceivedGap: string | null;
  additionalNotes: string | null;
  pastLearning: string[];
};

function extractPlacementInputs(survey: ParentSurveyForm): PlacementInputs {
  const gradeRaw = survey.grade?.trim() || null;
  const gradeValue = parseGradeValue(gradeRaw);
  const pastLearning = survey.pastLearningMethods ?? [];
  const academyCount = parseAcademyCount(survey.currentAcademyCount);
  const highestScore = parseIntegerFromString(survey.highestEnglishScore);
  const weeklyReadingCount = parseIntegerFromString(survey.weeklyReadingCount);
  const backgroundCategory = determineBackgroundCategory(
    pastLearning,
    academyCount,
    survey.additionalNotes,
    survey.reasonForChange,
    survey.perceivedGap
  );

  return {
    gradeValue,
    gradeRaw,
    backgroundCategory,
    academyCount,
    highestScore,
    weeklyReadingCount,
    strongestSubject: normalizeSubject(survey.strongestSubject),
    weakestSubject: normalizeSubject(survey.weakestSubject),
    motivation: survey.academyGoal || survey.reasonForChange || null,
    homeworkAmount: survey.homeworkAmount || null,
    perceivedGap: survey.perceivedGap || null,
    additionalNotes: survey.additionalNotes || null,
    pastLearning,
  };
}

function determineBaseLevel(inputs: PlacementInputs): number {
  const { gradeValue, backgroundCategory, highestScore, weeklyReadingCount } = inputs;

  if (!gradeValue) {
    return 2.1;
  }

  const overseas =
    backgroundCategory === "overseas" ||
    Boolean(inputs.additionalNotes?.includes("유학") || inputs.additionalNotes?.includes("해외"));

  if (overseas) {
    return 6.9;
  }

  const gradeBase = (() => {
    if (gradeValue <= 4) {
      return 1.0;
    }
    if (gradeValue <= 6) {
      return 2.0;
    }
    if (gradeValue <= 8) {
      return 4.0;
    }
    if (gradeValue <= 10) {
      return 5.0;
    }
    return 6.0;
  })();

  let adjustment = 0;

  if (backgroundCategory === "multi_academy") {
    adjustment += 0.2;
  } else if (backgroundCategory === "academy_plus") {
    adjustment += 0.1;
  } else if (backgroundCategory === "worksheet_only") {
    adjustment -= 0.1;
  }

  if (typeof highestScore === "number") {
    if (highestScore >= 95) {
      adjustment += 0.2;
    } else if (highestScore >= 90) {
      adjustment += 0.1;
    } else if (highestScore < 70) {
      adjustment -= 0.1;
    }
  }

  if (typeof weeklyReadingCount === "number") {
    if (weeklyReadingCount >= 5) {
      adjustment += 0.2;
    } else if (weeklyReadingCount >= 3) {
      adjustment += 0.1;
    } else if (weeklyReadingCount <= 1) {
      adjustment -= 0.1;
    }
  }

  const rawLevel = clampLevelValue(gradeBase + adjustment);

  // For lower grades ensure at least 1.1 range
  if (gradeValue <= 4) {
    return clampLevelValue(Math.max(rawLevel, 1.1));
  }

  return rawLevel;
}

function determineSkillModifiers(inputs: PlacementInputs): Record<PlacementSection, number> {
  const modifiers: Record<PlacementSection, number> = {
    grammar: 0,
    reading: 0,
    listening: 0,
    dialog: 0,
  };

  const weak = inputs.weakestSubject;
  if (weak) {
    if (weak.includes("듣")) {
      modifiers.listening -= 0.3;
    } else if (weak.includes("읽")) {
      modifiers.reading -= 0.3;
    } else if (weak.includes("문법") || weak.includes("쓰")) {
      modifiers.grammar -= 0.3;
    } else if (weak.includes("말") || weak.includes("회화") || weak.includes("대화") || weak.includes("스피킹")) {
      modifiers.dialog -= 0.3;
    }
  }

  const strong = inputs.strongestSubject;
  if (strong) {
    if (strong.includes("듣")) {
      modifiers.listening += 0.1;
    } else if (strong.includes("읽")) {
      modifiers.reading += 0.1;
    } else if (strong.includes("문법") || strong.includes("쓰")) {
      modifiers.grammar += 0.1;
    } else if (strong.includes("말") || strong.includes("회화") || strong.includes("대화") || strong.includes("스피킹")) {
      modifiers.dialog += 0.1;
    }
  }

  SECTION_KEYS.forEach((section) => {
    modifiers[section] = clampModifier(modifiers[section]);
  });

  return modifiers;
}

function buildProfileTags(
  inputs: PlacementInputs,
  modifiers: Record<PlacementSection, number>,
  startLevels: Record<PlacementSection, number>
): string[] {
  const tags: string[] = [];
  if (inputs.gradeRaw) {
    tags.push(`grade_${inputs.gradeRaw.replace(/\s+/g, "")}`);
  }

  tags.push(`background_${inputs.backgroundCategory}`);

  if (typeof inputs.weeklyReadingCount === "number") {
    tags.push(`reads_${inputs.weeklyReadingCount}pw`);
  }

  if (typeof inputs.highestScore === "number") {
    const scoreBand = Math.floor(inputs.highestScore / 10) * 10;
    tags.push(`score_${scoreBand}`);
  }

  SECTION_KEYS.forEach((section) => {
    if (modifiers[section] < 0) {
      tags.push(`weak_${section}`);
    } else if (modifiers[section] > 0) {
      tags.push(`strong_${section}`);
    }
    tags.push(`${section}_${startLevels[section].toFixed(1)}`);
  });

  if (inputs.motivation) {
    tags.push(`motivation_${sanitizeTag(inputs.motivation)}`);
  }

  if (inputs.homeworkAmount) {
    tags.push(`homework_${inputs.homeworkAmount}`);
  }

  return Array.from(new Set(tags));
}

function sanitizeTag(value: string): string {
  return value.replace(/\s+/g, "_").replace(/[^\w-]/g, "").toLowerCase();
}

function parseGradeValue(raw: string | null): number | null {
  if (!raw) {
    return null;
  }
  const normalized = raw.replace(/\s+/g, "");
  const match = normalized.match(/(초|중|고)(\d)/);
  if (!match) {
    const numeric = parseIntegerFromString(normalized);
    return numeric ?? null;
  }
  const [, stage, gradeStr] = match;
  const gradeNum = Number(gradeStr);

  const stageOffset: Record<string, number> = {
    초: 0,
    중: 6,
    고: 9,
  };

  const offset = stageOffset[stage];
  if (offset === undefined) {
    return null;
  }
  return offset + gradeNum;
}

function determineBackgroundCategory(
  pastLearning: string[],
  academyCount: number,
  additionalNotes?: string | null,
  reasonForChange?: string | null,
  perceivedGap?: string | null
): BackgroundCategory {
  const notes = [additionalNotes, reasonForChange, perceivedGap].filter(Boolean).join(" ");
  if (notes.includes("유학") || notes.includes("해외")) {
    return "overseas";
  }

  const hasWorksheet = pastLearning.includes("worksheet_program");
  const hasAcademy = pastLearning.includes("subject_academy") || pastLearning.includes("multi_subject_academy");
  const hasPrivate = pastLearning.includes("private_tutoring");

  if (!hasAcademy && !hasPrivate && hasWorksheet && academyCount === 0) {
    return "worksheet_only";
  }

  if (academyCount >= 2 || pastLearning.includes("multi_subject_academy")) {
    return "multi_academy";
  }

  if (academyCount >= 1 || hasPrivate) {
    return "academy_plus";
  }

  return hasWorksheet ? "mixed" : "worksheet_only";
}

function parseAcademyCount(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  switch (value) {
    case "none":
      return 0;
    case "one":
      return 1;
    case "two":
      return 2;
    case "three":
      return 3;
    case "four_plus":
      return 4;
    default:
      return parseIntegerFromString(value) ?? 0;
  }
}

function parseIntegerFromString(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const match = value.replace(/[,권\s]/g, "").match(/-?\d+/);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[0], 10);
}

function normalizeSubject(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.trim();
}

function clampModifier(value: number): number {
  if (value > 0.3) {
    return 0.3;
  }
  if (value < -0.6) {
    return -0.6;
  }
  return Number(value.toFixed(2));
}

function clampLevelValue(value: number): number {
  const clamped = Math.min(MAX_LEVEL_VALUE, Math.max(MIN_LEVEL_VALUE, value));
  return normalizeToSeedValue(clamped);
}

function normalizeToSeedValue(value: number): number {
  const level = Math.floor(value);
  let fractional = value - level;

  if (fractional < 0.1) {
    fractional = 0.1;
  }

  if (fractional >= 0.25) {
    fractional = 0.3;
  } else if (fractional >= 0.17) {
    fractional = 0.2;
  } else {
    fractional = 0.1;
  }

  const adjustedLevel = Math.max(MIN_LEVEL.level, Math.min(MAX_LEVEL.level, level));
  if (adjustedLevel === MAX_LEVEL.level && fractional > 0.3) {
    fractional = 0.3;
  }

  return Number((adjustedLevel + fractional).toFixed(1));
}

function startLevelToSeed(value: number): string {
  const state = numericToLevelState(value);
  return levelStateToSeed(state);
}

function numericToLevelState(value: number): LevelState {
  const normalized = clampLevelValue(value);
  const level = Math.floor(normalized);
  const fractional = Number((normalized - level).toFixed(1));

  let sublevel: LevelState["sublevel"] = "1";
  if (fractional >= 0.29) {
    sublevel = "3";
  } else if (fractional >= 0.19) {
    sublevel = "2";
  }

  return {
    level,
    sublevel,
  };
}

function levelStateToSeed(state: LevelState): string {
  return `${state.level}.${state.sublevel}`;
}

function sublevelToIncrement(sublevel: LevelState["sublevel"]): number {
  switch (sublevel) {
    case "1":
      return 0.1;
    case "2":
      return 0.2;
    case "3":
      return 0.3;
    default:
      return 0.1;
  }
}
