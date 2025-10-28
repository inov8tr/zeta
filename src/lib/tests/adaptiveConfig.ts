export const SECTION_ORDER = ["grammar", "reading", "listening", "dialog"] as const;
export type TestSection = (typeof SECTION_ORDER)[number];

export interface ParallelRule {
  base: TestSection;
  offset: number; // positive = steps up, negative = steps down
}

const RAW_PARALLEL_RULES: Partial<Record<TestSection, ParallelRule>> = {
  reading: { base: "grammar", offset: 0 },
  listening: { base: "grammar", offset: -1 },
  dialog: { base: "listening", offset: -1 },
};

export const SECTION_PARALLEL_RULES = RAW_PARALLEL_RULES;

export const SECTION_PARALLEL_DEPENDENTS: Record<TestSection, Array<{ section: TestSection; offset: number }>> =
  SECTION_ORDER.reduce((acc, section) => {
    acc[section] = [];
    return acc;
  }, {} as Record<TestSection, Array<{ section: TestSection; offset: number }>>);

for (const sectionKey of Object.keys(RAW_PARALLEL_RULES) as TestSection[]) {
  const rule = RAW_PARALLEL_RULES[sectionKey];
  if (!rule) {
    continue;
  }
  SECTION_PARALLEL_DEPENDENTS[rule.base].push({ section: sectionKey, offset: rule.offset });
}

export const SECTION_MAX_QUESTIONS: Record<TestSection, number> = {
  grammar: 30,
  reading: 40,
  listening: 20,
  dialog: 20,
};

export const MIN_LEVEL = { level: 1, sublevel: "1" as const };
export const MAX_LEVEL = { level: 7, sublevel: "3" as const };

export const STREAK_UP_THRESHOLD = 3;
export const STREAK_DOWN_THRESHOLD = 3;
export const STREAK_SKIP_THRESHOLD = 5;
export const STREAK_SKIP_DELTA = 2; // represents two sublevel steps (0.2)

export const DEFAULT_SEED = "2.1";

// Reading-specific configuration
// How many questions constitute one passage set before evaluating performance
export const READING_PASSAGE_SET_SIZE = 4;
// Thresholds to adjust level after completing a passage set
export const READING_SET_PROMOTE_THRESHOLD = 0.7; // >= 70% correct -> up one sublevel
export const READING_SET_DEMOTE_THRESHOLD = 0.4; // < 40% correct -> down one sublevel
export const READING_SET_SKIP_STEPS = 2; // 100% correct -> jump two sublevels

export interface LevelState {
  level: number;
  sublevel: "1" | "2" | "3";
}

export function parseSeed(seed?: unknown): LevelState {
  if (typeof seed !== "string") {
    return { level: 2, sublevel: "1" };
  }
  const [levelPart, sublevelPart] = seed.split(".");
  const level = Number.parseInt(levelPart, 10);
  const sublevel = sublevelPart === "2" ? "2" : sublevelPart === "3" ? "3" : "1";
  if (Number.isNaN(level) || level < MIN_LEVEL.level || level > MAX_LEVEL.level) {
    return { level: 2, sublevel: "1" };
  }
  return { level, sublevel };
}

export function levelToSeed({ level, sublevel }: LevelState): string {
  return `${level}.${sublevel}`;
}

function clampLevel(level: number, sublevel: "1" | "2" | "3"): LevelState {
  if (level < MIN_LEVEL.level) {
    return { ...MIN_LEVEL };
  }
  if (level > MAX_LEVEL.level) {
    return { ...MAX_LEVEL };
  }
  return { level, sublevel };
}

function stepSublevel(level: number, sublevel: "1" | "2" | "3", direction: 1 | -1): LevelState {
  if (direction === 1) {
    if (sublevel === "1") {
      return { level, sublevel: "2" };
    }
    if (sublevel === "2") {
      return { level, sublevel: "3" };
    }
    return { level: level + 1, sublevel: "1" };
  } else {
    if (sublevel === "3") {
      return { level, sublevel: "2" };
    }
    if (sublevel === "2") {
      return { level, sublevel: "1" };
    }
    return { level: level - 1, sublevel: "3" };
  }
}

export function adjustLevel(
  current: LevelState,
  direction: "up" | "down",
  steps: number
): LevelState {
  let { level, sublevel } = current;
  for (let i = 0; i < steps; i += 1) {
    const next = stepSublevel(level, sublevel, direction === "up" ? 1 : -1);
    level = next.level;
    sublevel = next.sublevel;
  }
  return clampLevel(level, sublevel);
}

export function shiftLevelBy(state: LevelState, steps: number): LevelState {
  if (steps === 0) {
    return { ...state };
  }
  const direction = steps > 0 ? "up" : "down";
  return adjustLevel(state, direction, Math.abs(steps));
}

export function clampStreak(value: number): number {
  return Math.max(0, value);
}

export function generateLevelCandidates(
  current: LevelState,
  maxSteps = 3
): LevelState[] {
  const seen = new Set<string>();
  const candidates: LevelState[] = [];

  const push = (state: LevelState) => {
    const key = levelToSeed(state);
    if (!seen.has(key)) {
      candidates.push(state);
      seen.add(key);
    }
  };

  push(current);

  for (let step = 1; step <= maxSteps; step += 1) {
    push(adjustLevel(current, "down", step));
    push(adjustLevel(current, "up", step));
  }

  return candidates;
}
