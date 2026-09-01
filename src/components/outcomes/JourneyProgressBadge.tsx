import { Compass, Sparkles } from "lucide-react";

interface JourneyProgressBadgeProps {
  totalUpdates: number;
  latestDaysAfter?: number | null;
  isLongRunning?: boolean;
}

export function JourneyProgressBadge({
  totalUpdates,
  latestDaysAfter,
  isLongRunning,
}: JourneyProgressBadgeProps) {
  if (totalUpdates === 0) {
    return (
      <span className="inline-flex items-center space-x-1 rounded-md bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/40">
        <span>Single Story</span>
      </span>
    );
  }

  const daysCount = latestDaysAfter ?? 0;

  if (isLongRunning || daysCount >= 90) {
    return (
      <span className="inline-flex items-center space-x-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30 animate-in fade-in">
        <Sparkles className="h-3 w-3 shrink-0" />
        <span>Day 0 → Day {daysCount} ({totalUpdates} update{totalUpdates !== 1 ? "s" : ""})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 rounded-md bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-400 border border-cyan-500/20">
      <Compass className="h-3 w-3 shrink-0" />
      <span>Day 0 → Day {daysCount} ({totalUpdates} update{totalUpdates !== 1 ? "s" : ""})</span>
    </span>
  );
}
