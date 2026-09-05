import { cn } from "@/lib/utils";
import { type OutcomeStatus } from "@/lib/journey-helpers";
import { CheckCircle2, Clock, Lightbulb, XCircle, HelpCircle } from "lucide-react";

interface OutcomeStatusBadgeProps {
  status: OutcomeStatus;
  size?: "sm" | "md";
  showPrefix?: boolean;
  className?: string;
}

export function OutcomeStatusBadge({
  status,
  size = "sm",
  showPrefix = true,
  className,
}: OutcomeStatusBadgeProps) {
  const configs = {
    success: {
      label: "Validated Outcome 🪷",
      icon: CheckCircle2,
      classes: "bg-[#4DA3FF]/15 text-[#4DA3FF] border-[#4DA3FF]/30",
    },
    in_progress: {
      label: "Active Journey 🌻",
      icon: Clock,
      classes: "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/25",
    },
    learning: {
      label: "Pivot / Shift 🍁",
      icon: Lightbulb,
      classes: "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/25",
    },
    failed: {
      label: "Hard Lesson 🍂",
      icon: XCircle,
      classes: "bg-[#C88A58]/15 text-[#C88A58] border-[#C88A58]/30",
    },
    unknown: {
      label: "Verdict Unclear ⏳",
      icon: HelpCircle,
      classes: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    },
  };

  const config = configs[status] || configs.unknown;
  const Icon = config.icon;

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={cn(
        "inline-flex items-center space-x-1 rounded-md font-medium border shrink-0 transition-colors",
        sizeClasses,
        config.classes,
        className
      )}
    >
      <Icon className={cn(iconSize, "shrink-0")} />
      <span>
        {showPrefix ? "Status: " : ""}
        {config.label}
      </span>
    </span>
  );
}
