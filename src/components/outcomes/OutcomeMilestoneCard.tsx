import { formatRelativeTime } from "@/lib/utils";
import { Milestone, Clock } from "lucide-react";

export interface OutcomeItem {
  id: string;
  experience_id: string;
  days_after: number;
  content: string;
  created_at: string;
}

interface OutcomeMilestoneCardProps {
  outcome: OutcomeItem;
}

export function OutcomeMilestoneCard({ outcome }: OutcomeMilestoneCardProps) {
  const relativeTime = formatRelativeTime(outcome.created_at);

  const getMilestoneLabel = (days: number) => {
    if (days === 0) return "Day 0 (Initial Baseline)";
    if (days === 30) return "Day 30 (1 Month Later)";
    if (days === 90) return "Day 90 (3 Months Later)";
    if (days === 180) return "Day 180 (6 Months Later)";
    if (days === 365) return "Day 365 (1 Year Later)";
    return `Day ${days} Milestone`;
  };

  return (
    <div className="relative pl-6 sm:pl-8 pb-6 group last:pb-0">
      {/* Timeline Node Icon / Dot */}
      <div className="absolute -left-[13px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-card border-2 border-emerald-500 text-emerald-400 shadow-sm">
        <Milestone className="h-3 w-3" />
      </div>

      <div className="rounded-xl border border-border/80 bg-surface-card/90 p-4 space-y-2.5 transition-all hover:border-emerald-500/40">
        {/* Milestone Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              {getMilestoneLabel(outcome.days_after)}
            </span>
          </div>

          <div className="flex items-center space-x-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Logged {relativeTime}</span>
          </div>
        </div>

        {/* Milestone Narrative Content */}
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
          {outcome.content}
        </p>
      </div>
    </div>
  );
}
