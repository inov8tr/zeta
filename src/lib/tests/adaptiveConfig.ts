export const SECTION_ORDER = ["reading", "grammar", "listening", "dialog"] as const;
export type TestSection = typeof SECTION_ORDER[number];

export const SECTION_MAX_QUESTIONS: Record<TestSection, number> = {
  reading: 20,
  grammar: 15,
  listening: 10,
  dialog: 10,
};

export const MIN_LEVEL = { level: 1, sublevel: "1" as const };
export const MAX_LEVEL = { level: 7, sublevel: "3" as const };

export const STREAK_UP_THRESHOLD = 3;
export const STREAK_DOWN_THRESHOLD = 3;
export const STREAK_SKIP_THRESHOLD = 5;
export const STREAK_SKIP_DELTA = 2; // represents two sublevel steps (0.2)

export const DEFAULT_SEED = "2.1";

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
