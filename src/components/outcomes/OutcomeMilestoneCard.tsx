import { formatRelativeTime } from "@/lib/utils";
import { Compass, Clock, ArrowRight } from "lucide-react";

export interface OutcomeItem {
  id: string;
  experience_id: string;
  days_after: number;
  content: string;
  created_at: string;
}

interface OutcomeMilestoneCardProps {
  outcome: OutcomeItem;
  deltaDays?: number;
}

export function OutcomeMilestoneCard({ outcome, deltaDays }: OutcomeMilestoneCardProps) {
  const relativeTime = formatRelativeTime(outcome.created_at);

  const formatDelta = (delta: number) => {
    if (delta === 0) return "Same day update";
    if (delta === 1) return "+1 day later";
    if (delta < 14) return `+${delta} days later`;
    if (delta < 60) return `+${Math.floor(delta / 7)} weeks later`;
    if (delta < 365) return `+${Math.floor(delta / 30)} months later`;
    return `+${(delta / 365).toFixed(1)} years later`;
  };

  const getJourneyNodeLabel = (days: number) => {
    if (days === 0) return "Day 0 (Initial Update)";
    if (days === 1) return "Day 1 (Next Day)";
    return `Day ${days}`;
  };

  return (
    <div className="relative pl-6 sm:pl-8 pb-6 group last:pb-0">
      {/* Timeline Node Icon */}
      <div className="absolute -left-[13px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-card border-2 border-emerald-500 text-emerald-400 shadow-sm">
        <Compass className="h-3 w-3" />
      </div>

      <div className="rounded-xl border border-border/80 bg-surface-card/90 p-4 space-y-2.5 transition-all hover:border-emerald-500/40">
        {/* Journey Node Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              {getJourneyNodeLabel(outcome.days_after)}
            </span>

            {typeof deltaDays === "number" && (
              <span className="inline-flex items-center space-x-1 text-[11px] text-muted-foreground bg-surface-elevated px-1.5 py-0.5 rounded">
                <ArrowRight className="h-2.5 w-2.5 text-primary" />
                <span>{formatDelta(deltaDays)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Logged {relativeTime}</span>
          </div>
        </div>

        {/* Narrative Content */}
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
          {outcome.content}
        </p>
      </div>
    </div>
  );
}
