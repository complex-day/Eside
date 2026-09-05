import { calculateCalendarDaysDifference } from "@/lib/utils";

export type OutcomeStatus =
  | "success"
  | "in_progress"
  | "learning"
  | "failed"
  | "unknown";

export type JourneyHealth = "recently_updated" | "needs_update" | "dormant";

export interface JourneyMeta {
  totalUpdates: number;
  latestDaysAfter: number | null;
  latestUpdateAt: string | null;
  latestUpdateContent?: string | null;
  daysSinceStart: number;
  createdAt: string;
  isLongRunning: boolean;
  outcomeStatus: OutcomeStatus;
  health: JourneyHealth;
  daySpanLabel: string;
}


/**
 * Derives the outcome status from outcome milestone contents and updates count.
 * Uses intelligent keyword & milestone analysis as a robust heuristic when no explicit status column exists.
 */
export function deriveOutcomeStatus(
  outcomes: Array<{ content: string; days_after: number }> | undefined,
  storyText?: string
): OutcomeStatus {
  if (!outcomes || outcomes.length === 0) {
    if (!storyText) return "in_progress";
    const lower = storyText.toLowerCase();
    if (lower.includes("failed") || lower.includes("mistake") || lower.includes("lost")) {
      return "learning";
    }
    return "in_progress";
  }

  // Check the latest outcome update first
  const sorted = [...outcomes].sort((a, b) => b.days_after - a.days_after);
  const latestContent = sorted[0]?.content.toLowerCase() ?? "";

  // 1. Hard Lesson / Negative terminal heuristics
  if (
    latestContent.includes("[hard lesson") ||
    latestContent.includes("[cautionary") ||
    latestContent.includes("failed") ||
    latestContent.includes("rejected") ||
    latestContent.includes("gave up") ||
    latestContent.includes("closed down") ||
    latestContent.includes("bankrupt") ||
    latestContent.includes("fired")
  ) {
    return "failed";
  }

  // 2. Unresolved / Verdict Unclear heuristics
  if (
    latestContent.includes("[unresolved") ||
    latestContent.includes("[verdict unclear") ||
    latestContent.includes("inconclusive")
  ) {
    return "unknown";
  }

  // 3. Validated Outcome / Success heuristics
  if (
    latestContent.includes("[validated outcome") ||
    latestContent.includes("[resolved outcome") ||
    latestContent.includes("succeeded") ||
    latestContent.includes("success") ||
    latestContent.includes("achieved") ||
    latestContent.includes("graduated") ||
    latestContent.includes("promoted") ||
    latestContent.includes("recovered") ||
    latestContent.includes("solved") ||
    latestContent.includes("won") ||
    latestContent.includes("landed the job") ||
    latestContent.includes("hired")
  ) {
    return "success";
  }

  // 4. Learning / Pivot heuristics
  if (
    latestContent.includes("[learning") ||
    latestContent.includes("[turning point") ||
    latestContent.includes("pivoted") ||
    latestContent.includes("learned") ||
    latestContent.includes("lesson") ||
    latestContent.includes("shifted") ||
    latestContent.includes("rethought") ||
    latestContent.includes("adjusted") ||
    latestContent.includes("new direction")
  ) {
    return "learning";
  }

  // If multiple updates and ongoing
  return "in_progress";
}

/**
 * Determines journey health freshness based on elapsed days since the last update.
 */
export function getJourneyHealth(
  latestUpdateAt: string | null,
  createdAt: string,
  totalUpdates: number
): JourneyHealth {
  const referenceTime = latestUpdateAt || createdAt;
  const diffDays = calculateCalendarDaysDifference(referenceTime);

  // If updated in the last 30 days
  if (diffDays <= 30 && totalUpdates > 0) {
    return "recently_updated";
  }

  // If between 31 and 90 days or brand new without follow-ups
  if (diffDays > 60 && diffDays <= 180) {
    return "needs_update";
  }

  if (diffDays > 180) {
    return "dormant";
  }

  return "recently_updated";
}

/**
 * Computes full journey metadata for an experience.
 */
export function calculateJourneyMeta(
  outcomesList: Array<{ id: string; days_after: number; content?: string; created_at: string }>,
  storyCreatedAt: string,
  storyText?: string
): JourneyMeta {
  const totalUpdates = outcomesList.length;
  let latestDaysAfter: number | null = null;
  let latestUpdateAt: string | null = null;
  let latestUpdateContent: string | null = null;
  let isLongRunning = false;

  const daysSinceStart = calculateCalendarDaysDifference(storyCreatedAt);

  if (totalUpdates > 0) {
    const sortedByDays = [...outcomesList].sort((a, b) => b.days_after - a.days_after);
    const sortedByTime = [...outcomesList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    latestDaysAfter = sortedByDays[0]?.days_after ?? 0;
    latestUpdateAt = sortedByTime[0]?.created_at ?? null;
    latestUpdateContent = sortedByDays[0]?.content ?? null;
    isLongRunning = latestDaysAfter >= 90;
  }

  const outcomeStatus = deriveOutcomeStatus(
    outcomesList.map((o) => ({ content: o.content || "", days_after: o.days_after })),
    storyText
  );

  const health = getJourneyHealth(latestUpdateAt, storyCreatedAt, totalUpdates);

  const daySpanLabel =
    totalUpdates > 0
      ? `Day 0 → Day ${latestDaysAfter ?? 0}`
      : `Day ${daysSinceStart} (Baseline Decision)`;

  return {
    totalUpdates,
    latestDaysAfter,
    latestUpdateAt,
    latestUpdateContent,
    daysSinceStart,
    createdAt: storyCreatedAt,
    isLongRunning,
    outcomeStatus,
    health,
    daySpanLabel,
  };
}

