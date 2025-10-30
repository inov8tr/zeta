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
  levelBand: string;
  lexile: string;
  cefr: string;
  koreanEquivalent: string;
  usEquivalent: string;
  narrative: string;
  feedbackText: string;
}

const SECTION_LABELS: Record<SectionKey, string> = {
  grammar: "Grammar",
  reading: "Reading",
  listening: "Listening",
  dialog: "Dialog",
};

const defaultSectionOrder: SectionKey[] = ["grammar", "reading", "listening", "dialog"];

type EducationMapping = {
  band: string;
  lexile: string;
  cefr: string;
  korean_equiv: string;
  us_equiv: string;
  narrative: string;
};

export function generateEntranceFeedback(input: EntranceFeedbackInput): EntranceFeedbackResult {
  const levelValue = input.level ?? 0;
  const mapping = getEducationMapping(levelValue);

  const studentName = input.studentName?.trim();
  const nameLabel = studentName && studentName.length > 0 ? studentName : "This student";

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

  const strengths = sectionSummaries
    .filter((row) => parseFloat(row.score) >= 80)
    .map((row) => row.label);
  const opportunities = sectionSummaries
    .filter((row) => {
      const value = Number.parseFloat(row.score);
      return Number.isFinite(value) && value < 70;
    })
    .map((row) => row.label);

  const summarySegments = [
    `${nameLabel} achieved Level ${levelLabel}, placing them in our ${mapping.band} band (${mapping.korean_equiv} / ${mapping.us_equiv}).`,
    `Lexile range: ${mapping.lexile} | CEFR: ${mapping.cefr}.`,
    `Accuracy: ${accuracyLabel} | Total score: ${totalScoreLabel}.`,
    timeLabel ? `Time on task: ${timeLabel}.` : null,
  ].filter(Boolean);

  const advice: string[] = [];
  if (strengths.length > 0) {
    advice.push(`Strengths observed in ${joinWithAnd(strengths)}.`);
  }
  if (opportunities.length > 0) {
    advice.push(`Focus on ${joinWithAnd(opportunities)} to solidify comprehension at this level.`);
  } else {
    advice.push("Balanced performance across sections—maintain current study habits.");
  }
  advice.push(`Prepare for Level ${Math.max(1, Math.floor(levelValue) + 1)} with continued practice and extended reading.`);

  const feedbackText = [
    summarySegments.join(" "),
    "",
    mapping.narrative,
    "",
    strengths.length > 0 ? `Strengths: ${joinWithAnd(strengths)}.` : "",
    opportunities.length > 0 ? `Focus areas: ${joinWithAnd(opportunities)}.` : "",
  ]
    .filter((line) => line && line.trim().length > 0)
    .join("\n");

  return {
    summary: summarySegments.join(" "),
    advice,
    sectionSummaries,
    levelBand: mapping.band,
    lexile: mapping.lexile,
    cefr: mapping.cefr,
    koreanEquivalent: mapping.korean_equiv,
    usEquivalent: mapping.us_equiv,
    narrative: mapping.narrative,
    feedbackText,
  };
}

function getEducationMapping(level: number): EducationMapping {
  if (level < 2) {
    return {
      band: "Early Explorers",
      lexile: "BR–200L",
      cefr: "Pre-A1",
      korean_equiv: "유치원–초2",
      us_equiv: "Kindergarten–Grade 1",
      narrative:
        "Students are beginning English literacy—learning phonics, sight words, and short oral comprehension. Focus on decoding, listening with visuals, and repeating simple sentences.",
    };
  }
  if (level < 3) {
    return {
      band: "Foundation Builders",
      lexile: "200–300L",
      cefr: "A1",
      korean_equiv: "초2–초4",
      us_equiv: "Grade 2–3",
      narrative:
        "Learners can read and understand short sentences and mini-stories, use simple grammar forms, and participate in guided dialogues with support.",
    };
  }
  if (level < 4) {
    return {
      band: "Knowledge Navigators",
      lexile: "250–500L",
      cefr: "A2",
      korean_equiv: "초5–중1",
      us_equiv: "Grade 4–5",
      narrative:
        "Students read short paragraphs and early chapter books, expand vocabulary in context, and write short paragraphs with growing grammar accuracy.",
    };
  }
  if (level < 5) {
    return {
      band: "Skill Sharpeners",
      lexile: "600–700L",
      cefr: "B1",
      korean_equiv: "중1–중2",
      us_equiv: "Grade 6–7",
      narrative:
        "Learners manage multi-paragraph readings, use complex sentences, and engage in discussions using conjunctions and descriptive vocabulary.",
    };
  }
  if (level < 6) {
    return {
      band: "Advanced Learners",
      lexile: "660–950L",
      cefr: "B1+ – B2",
      korean_equiv: "중3–고1",
      us_equiv: "Grade 8–9",
      narrative:
        "Learners analyze thematic texts, apply academic vocabulary, and compose structured essays with increasing independence and control.",
    };
  }
  if (level < 7) {
    return {
      band: "Critical Thinkers",
      lexile: "900–1100L",
      cefr: "B2+",
      korean_equiv: "고2–고3",
      us_equiv: "Grade 10–11",
      narrative:
        "Students demonstrate advanced syntax, evidence-based argumentation, and abstract reasoning in academic discussions and writing.",
    };
  }
  return {
    band: "Leadership Pathfinders",
    lexile: "1100L+",
    cefr: "C1–C2",
    korean_equiv: "대학 수준",
    us_equiv: "Grade 12 – University",
    narrative:
      "Learners exhibit full academic fluency, rhetorical control, and the ability to synthesize complex ideas across disciplines.",
  };
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
