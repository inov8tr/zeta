import type { AboutDictionary } from "@/lib/i18n";

export interface LevelPalette {
  bar: {
    from: string;
    to: string;
    border: string;
  };
  arrow: {
    from: string;
    to: string;
    text: string;
  };
  shadow: string;
}

const palettes: readonly LevelPalette[] = [
  {
    bar: { from: "#b8c6ff", to: "#7f91e3", border: "#5b6ad0" },
    arrow: { from: "#7285e5", to: "#4d63d0", text: "#ffffff" },
    shadow: "rgba(86, 102, 210, 0.25)",
  },
  {
    bar: { from: "#a5c4ff", to: "#5d8fe1", border: "#4472c5" },
    arrow: { from: "#5b9bef", to: "#2f6dd3", text: "#ffffff" },
    shadow: "rgba(59, 107, 211, 0.25)",
  },
  {
    bar: { from: "#d4efc2", to: "#99d281", border: "#6fb055" },
    arrow: { from: "#88d36e", to: "#5aa33e", text: "#1f3312" },
    shadow: "rgba(88, 163, 62, 0.25)",
  },
  {
    bar: { from: "#fbe9b4", to: "#f3d477", border: "#d3b252" },
    arrow: { from: "#f6d567", to: "#d7a72e", text: "#2d2208" },
    shadow: "rgba(215, 167, 46, 0.25)",
  },
  {
    bar: { from: "#fde0a8", to: "#f5ba4f", border: "#d49526" },
    arrow: { from: "#f5bb47", to: "#d78b17", text: "#2d1602" },
    shadow: "rgba(215, 139, 23, 0.25)",
  },
  {
    bar: { from: "#ffd0c1", to: "#f7986c", border: "#d26c3d" },
    arrow: { from: "#f79a62", to: "#d87035", text: "#331207" },
    shadow: "rgba(216, 112, 53, 0.25)",
  },
  {
    bar: { from: "#ffc4df", to: "#f15c8f", border: "#d23c71" },
    arrow: { from: "#f15b8d", to: "#d43263", text: "#ffffff" },
    shadow: "rgba(209, 50, 99, 0.25)",
  },
] as const;

export const LEVEL_ARROW_CLIP_PATH = "polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%)";

const MIN_BAR_HEIGHT = 120;
const MAX_BAR_HEIGHT = 220;

function getLevelPalette(index: number): LevelPalette {
  if (index < 0) {
    return palettes[0];
  }
  return palettes[index % palettes.length];
}

export function getLevelBarHeight(index: number, total: number): number {
  if (total <= 1) {
    return MAX_BAR_HEIGHT;
  }

  const clampedIndex = Math.max(0, Math.min(index, total - 1));
  const ratio = clampedIndex / (total - 1);
  return Math.round(MIN_BAR_HEIGHT + (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) * ratio);
}

export type LevelsDiagramItem = AboutDictionary["levels"]["items"][number] & {
  index: number;
  palette: LevelPalette;
  barHeight: number;
  label?: string;
};

export function createLevelsDiagram(items: AboutDictionary["levels"]["items"] = []): LevelsDiagramItem[] {
  return items.map((item, index) => ({
    ...item,
    index,
    palette: getLevelPalette(index),
    barHeight: getLevelBarHeight(index, items.length),
  }));
}
