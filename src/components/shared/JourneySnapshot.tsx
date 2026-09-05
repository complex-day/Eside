import { cn } from "@/lib/utils";
import { type JourneyMeta } from "@/lib/journey-helpers";
import { OutcomeStatusBadge } from "@/components/shared/OutcomeStatusBadge";
import { Milestone, Flame, Clock, Sparkles } from "lucide-react";

interface JourneySnapshotProps {
  journey: JourneyMeta;
  variant?: "card" | "detail" | "compact";
  className?: string;
}

export function JourneySnapshot({
  journey,
  variant = "card",
  className,
}: JourneySnapshotProps) {
  const { totalUpdates, daySpanLabel, outcomeStatus, health, isLongRunning } = journey;

  const healthConfig = {
    recently_updated: {
      label: "Recently Updated",
      icon: Flame,
      classes: "text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/20",
    },
    needs_update: {
      label: "Update Due",
      icon: Clock,
      classes: "text-[#94A3B8] bg-white/[0.03] border-white/[0.08]",
    },
    dormant: {
      label: "Dormant",
      icon: Clock,
      classes: "text-[#64748B] bg-white/[0.02] border-white/[0.05]",
    },
  }[health];

  const HealthIcon = healthConfig.icon;

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        <span className="inline-flex items-center space-x-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono tabular-nums font-medium text-[#F1F5F9] border border-white/[0.08]">
          <Milestone className="h-2.5 w-2.5 text-[#4DA3FF]" aria-hidden="true" />
          <span>{daySpanLabel}</span>
        </span>
        <OutcomeStatusBadge status={outcomeStatus} size="sm" showPrefix={false} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-white/[0.06] bg-black/30 p-2.5 sm:p-3 space-y-2",
        variant === "detail" && "p-3.5 sm:p-4 bg-black/40 border-white/[0.08]",
        className
      )}
    >
      {/* Top Header: Timeline Span & Update Count */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
        <div className="flex items-center space-x-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#4DA3FF]/10 text-[#4DA3FF]">
            <Milestone className="h-3 w-3" aria-hidden="true" />
          </div>
          <span className="font-mono tabular-nums text-[11px] sm:text-xs font-bold text-[#F1F5F9]">
            {daySpanLabel}
          </span>
          {isLongRunning && (
            <span className="inline-flex items-center font-mono tabular-nums text-[10px] text-[#4DA3FF] font-semibold bg-[#4DA3FF]/10 px-1.5 py-0.5 rounded border border-[#4DA3FF]/20">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
              90d+
            </span>
          )}
        </div>

        {/* Updates Count */}
        <span className="text-[11px] font-medium text-[#94A3B8]">
          {totalUpdates === 0
            ? "Day 0 Baseline"
            : `${totalUpdates} Milestone${totalUpdates !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Latest Update Quote Preview if present */}
      {journey.latestUpdateContent && (
        <div className="rounded bg-black/40 p-2 border border-white/[0.05] text-[11px] text-[#CBD5E1] leading-relaxed italic">
          <span className="font-semibold not-italic text-[#94A3B8] mr-1.5">Latest Milestone:</span>
          &ldquo;{journey.latestUpdateContent.length > 130
            ? `${journey.latestUpdateContent.slice(0, 130).trim()}...`
            : journey.latestUpdateContent}&rdquo;
        </div>
      )}

      {/* Bottom Bar: Health and Outcome Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2">
        {/* Journey Freshness Health */}
        <div className="flex items-center space-x-1.5">
          <span
            className={cn(
              "inline-flex items-center space-x-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border",
              healthConfig.classes
            )}
          >
            <HealthIcon className="h-2.5 w-2.5" />
            <span>{healthConfig.label}</span>
          </span>
        </div>

        {/* Outcome Status Badge */}
        <OutcomeStatusBadge status={outcomeStatus} size="sm" showPrefix={true} />
      </div>
    </div>
  );
}
