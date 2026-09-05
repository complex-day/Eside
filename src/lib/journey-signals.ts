export type JourneyStage =
  | "daisy"
  | "golden"
  | "blue"
  | "hibiscus"
  | "maple"
  | "lotus";

export interface JourneySignalConfig {
  stage: JourneyStage;
  emoji: string;
  name: string;
  stageLabel: string;
  meaning: string;
  textColor: string;
  badgeBg: string;
  borderColor: string;
  dotColor: string;
  glowColor: string;
}

export const JOURNEY_SIGNALS: Record<JourneyStage, JourneySignalConfig> = {
  daisy: {
    stage: "daisy",
    emoji: "🌼",
    name: "White Daisy",
    stageLabel: "New Journey",
    meaning: "First Decision & Beginning",
    textColor: "text-amber-100",
    badgeBg: "bg-amber-100/5",
    borderColor: "border-amber-100/15",
    dotColor: "bg-[#FFD84D]",
    glowColor: "rgba(255, 253, 247, 0.12)",
  },
  golden: {
    stage: "golden",
    emoji: "🌻",
    name: "Golden Flower",
    stageLabel: "Active Growth",
    meaning: "Consistent Progress & Momentum",
    textColor: "text-[#FFB800]",
    badgeBg: "bg-[#FFB800]/10",
    borderColor: "border-[#FFB800]/25",
    dotColor: "bg-[#FFB800]",
    glowColor: "rgba(255, 184, 0, 0.15)",
  },
  blue: {
    stage: "blue",
    emoji: "🪻",
    name: "Blue Flower",
    stageLabel: "Deep Build",
    meaning: "Learning & Technical Mastery",
    textColor: "text-blue-400",
    badgeBg: "bg-blue-500/10",
    borderColor: "border-blue-500/25",
    dotColor: "bg-[#3B82F6]",
    glowColor: "rgba(59, 130, 246, 0.15)",
  },
  hibiscus: {
    stage: "hibiscus",
    emoji: "🌺",
    name: "Orange Hibiscus",
    stageLabel: "Creative Pursuit",
    meaning: "Projects, Startups & Craft",
    textColor: "text-orange-400",
    badgeBg: "bg-orange-500/10",
    borderColor: "border-orange-500/25",
    dotColor: "bg-[#FF7A18]",
    glowColor: "rgba(255, 122, 24, 0.15)",
  },
  maple: {
    stage: "maple",
    emoji: "🍁",
    name: "Maple Leaf",
    stageLabel: "Turning Point",
    meaning: "Pivots, Challenges & Critical Decisions",
    textColor: "text-[#FF6B35]",
    badgeBg: "bg-[#FF6B35]/10",
    borderColor: "border-[#FF6B35]/25",
    dotColor: "bg-[#FF6B35]",
    glowColor: "rgba(255, 107, 53, 0.15)",
  },
  lotus: {
    stage: "lotus",
    emoji: "🪷",
    name: "Blue Lotus",
    stageLabel: "Resolved Outcome",
    meaning: "Achievement & Retrospective Reflection",
    textColor: "text-[#4DA3FF]",
    badgeBg: "bg-[#4DA3FF]/10",
    borderColor: "border-[#4DA3FF]/25",
    dotColor: "bg-[#4DA3FF]",
    glowColor: "rgba(77, 163, 255, 0.2)",
  },
};

interface JourneyInput {
  outcomes_count?: number;
  category?: {
    name?: string;
  };
  journey?: {
    outcomeStatus?: "in_progress" | "success" | "learning" | "failed";
    totalUpdates?: number;
  };
  tags?: string[];
  story?: string;
}

/**
 * Deterministically maps journey metadata into one of the 6 subtle botanical signals
 */
export function determineJourneyStage(item: JourneyInput): JourneyStage {
  const outcomeStatus = item.journey?.outcomeStatus;
  const totalUpdates = item.journey?.totalUpdates ?? item.outcomes_count ?? 0;
  const categoryName = (item.category?.name || "").toLowerCase();
  const tagsStr = (item.tags || []).join(" ").toLowerCase();

  // 1. Final Outcome achieved -> Blue Lotus
  if (outcomeStatus === "success") {
    return "lotus";
  }

  // 2. Pivot / Critical Lesson -> Maple Leaf
  if (outcomeStatus === "learning" || outcomeStatus === "failed") {
    return "maple";
  }

  // 3. New Journey / Day 0 Decision -> White Daisy
  if (totalUpdates === 0) {
    return "daisy";
  }

  // 4. Creative / Startup / Writing -> Orange Hibiscus
  if (
    categoryName.includes("startup") ||
    categoryName.includes("career") ||
    categoryName.includes("business") ||
    categoryName.includes("writing") ||
    categoryName.includes("creative") ||
    tagsStr.includes("startup") ||
    tagsStr.includes("business")
  ) {
    return "hibiscus";
  }

  // 5. Technical / Building / Learning -> Blue Flower
  if (
    categoryName.includes("tech") ||
    categoryName.includes("engineer") ||
    categoryName.includes("coding") ||
    categoryName.includes("education") ||
    categoryName.includes("study") ||
    tagsStr.includes("code") ||
    tagsStr.includes("programming")
  ) {
    return "blue";
  }

  // 6. Default active momentum -> Golden Flower
  return "golden";
}
