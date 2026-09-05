import { Milestone, Sparkles } from "lucide-react";

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
      <span className="inline-flex items-center space-x-1 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700/60">
        <span>Day 0 Baseline</span>
      </span>
    );
  }

  const daysCount = latestDaysAfter ?? 0;

  if (isLongRunning || daysCount >= 90) {
    return (
      <span className="inline-flex items-center space-x-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
        <Sparkles className="h-2.5 w-2.5 shrink-0" />
        <span>Day 0 → Day {daysCount} ({totalUpdates} update{totalUpdates !== 1 ? "s" : ""})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-400 border border-cyan-500/20">
      <Milestone className="h-2.5 w-2.5 shrink-0" />
      <span>Day 0 → Day {daysCount} ({totalUpdates} update{totalUpdates !== 1 ? "s" : ""})</span>
    </span>
  );
}
