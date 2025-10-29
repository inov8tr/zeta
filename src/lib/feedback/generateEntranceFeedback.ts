import { formatDistanceStrict } from "date-fns";

type SectionKey = "grammar" | "reading" | "listening" | "dialog";

export interface EntranceFeedbackInput {
  studentName?: string | null;
  level: number | null;
  totalScore: number | null;
  accuracy: number | null;
  timeSpentMs: number | null;
  sectionScores: Partial<Record<SectionKey, { score: number | null; level: number | null }>>;
}

export interface EntranceFeedbackResult {
  summary: string;
  advice: string[];
  sectionSummaries: Array<{ section: SectionKey; label: string; score: string; level: string }>;
  mappings: {
    zeta: string;
    korean: string;
    us: string;
  };
}

const SECTION_LABELS: Record<SectionKey, string> = {
  grammar: "Grammar",
  reading: "Reading",
  listening: "Listening",
  dialog: "Dialog",
};

const defaultSectionOrder: SectionKey[] = ["grammar", "reading", "listening", "dialog"];

export function generateEntranceFeedback(input: EntranceFeedbackInput): EntranceFeedbackResult {
  const levelValue = input.level ?? 0;
  const { zeta, korean, us } = mapLevel(levelValue);

  const studentName = input.studentName?.trim();
  const nameLabel = studentName && studentName.length > 0 ? `${studentName}` : "This student";

  const accuracyLabel = formatPercent(input.accuracy);
  const totalScoreLabel = formatPercent(input.totalScore);
  const levelLabel = levelValue > 0 ? levelValue.toFixed(1) : "—";
  const timeLabel = formatTime(input.timeSpentMs);

  const sectionSummaries = defaultSectionOrder.map((section) => {
    const detail = input.sectionScores[section];
    return {
      section,
      label: SECTION_LABELS[section],
      score: formatPercent(detail?.score),
      level: formatLevel(detail?.level),
    };
  });

  const strengthSections = sectionSummaries
    .filter((row) => parseFloat(row.score) >= 80)
    .map((row) => row.label);

  const focusSections = sectionSummaries
    .filter((row) => {
      const value = Number.parseFloat(row.score);
      return Number.isFinite(value) && value < 70;
    })
    .map((row) => row.label);

  const summary = [
    `${nameLabel} achieved an estimated Level ${levelLabel}, which aligns with our ${zeta} band (roughly Korean ${korean} / U.S. ${us}).`,
    `The overall test score was ${totalScoreLabel} with an accuracy rate of ${accuracyLabel}.`,
    timeLabel ? `The assessment was completed in about ${timeLabel}, showing steady pacing throughout the sections.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const advice: string[] = [];
  if (strengthSections.length > 0) {
    advice.push(`Strengths were observed in ${joinWithAnd(strengthSections)}.`);
  }
  if (focusSections.length > 0) {
    advice.push(`We recommend extra practice in ${joinWithAnd(focusSections)} to reinforce comprehension.`);
  } else {
    advice.push("Balanced performance across sections shows consistent comprehension and skill application.");
  }

  advice.push(`Continuing at Level ${Math.max(1, Math.floor(levelValue))} with targeted reviews will help consolidate progress before moving up.`);

  return {
    summary,
    advice,
    sectionSummaries,
    mappings: { zeta, korean, us },
  };
}

const LEVEL_RANGES = [
  { min: 0, max: 3.4, zeta: "Emerging Intermediate", korean: "초5 – 초6", us: "Grade 5 – 6" },
  { min: 3.4, max: 4.6, zeta: "Core Intermediate", korean: "중1 – 중2", us: "Grade 6 – 7" },
  { min: 4.6, max: 5.5, zeta: "High Intermediate", korean: "중2 – 중3", us: "Grade 7 – 8" },
  { min: 5.5, max: 6.3, zeta: "Upper Intermediate", korean: "중3 – 고1", us: "Grade 8 – 9" },
  { min: 6.3, max: 7.1, zeta: "Early Advanced", korean: "고1 – 고2", us: "Grade 9 – 10" },
  { min: 7.1, max: 10, zeta: "Advanced", korean: "고3 이상", us: "Grade 11 – 12" },
];

function mapLevel(level: number) {
  const match = LEVEL_RANGES.find((range) => level >= range.min && level < range.max);
  if (!match) {
    return { zeta: "Emerging", korean: "초등", us: "Elementary" };
  }
  return { zeta: match.zeta, korean: match.korean, us: match.us };
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return `${Math.round(value)}%`;
}

function formatLevel(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return value.toFixed(1);
}

function formatTime(ms: number | null | undefined) {
  if (typeof ms !== "number" || Number.isNaN(ms) || ms <= 0) {
    return "";
  }
  const now = Date.now();
  return formatDistanceStrict(now, now + ms, { roundingMethod: "ceil" });
}

function joinWithAnd(values: string[]) {
  if (values.length === 0) {
    return "";
  }
  if (values.length === 1) {
    return values[0];
  }
  const tail = values.slice(0, -1).join(", ");
  return `${tail}, and ${values[values.length - 1]}`;
}
