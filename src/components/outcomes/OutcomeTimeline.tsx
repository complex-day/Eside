"use client";

import { useState } from "react";
import {
  OutcomeMilestoneCard,
  type OutcomeItem,
} from "@/components/outcomes/OutcomeMilestoneCard";
import { AddOutcomeModal } from "@/components/outcomes/AddOutcomeModal";
import { Button } from "@/components/ui/button";
import { Milestone, PlusCircle, Sparkles } from "lucide-react";

interface OutcomeTimelineProps {
  experienceId: string;
  initialOutcomes: OutcomeItem[];
  isAuthor: boolean;
}

export function OutcomeTimeline({
  experienceId,
  initialOutcomes,
  isAuthor,
}: OutcomeTimelineProps) {
  const [outcomes, setOutcomes] = useState<OutcomeItem[]>(
    [...initialOutcomes].sort((a, b) => a.days_after - b.days_after)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOutcomeAdded = (newOutcome: OutcomeItem) => {
    setOutcomes((prev) =>
      [...prev, newOutcome].sort((a, b) => a.days_after - b.days_after)
    );
  };

  return (
    <section className="space-y-4 pt-2">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Milestone className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center space-x-2">
              <span>Outcome Progression Timeline</span>
              <span className="text-xs font-normal text-muted-foreground">
                ({outcomes.length} milestone{outcomes.length !== 1 ? "s" : ""})
              </span>
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Follow-up reflections documenting how this situation unfolded over time.
            </p>
          </div>
        </div>

        {isAuthor && (
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            Log Outcome Milestone
          </Button>
        )}
      </div>

      {/* Connected Vertical Timeline */}
      <div className="relative border-l-2 border-border/60 ml-3 sm:ml-4 my-2">
        {/* Step 0: Baseline Situation */}
        <div className="relative pl-6 sm:pl-8 pb-6">
          <div className="absolute -left-[13px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-card border-2 border-primary text-primary shadow-sm">
            <Sparkles className="h-3 w-3" />
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
            <span className="text-xs font-bold text-primary">
              Day 0 (Initial Situation)
            </span>
            <p className="text-xs text-muted-foreground">
              The baseline experience narrative described above began at this checkpoint.
            </p>
          </div>
        </div>

        {/* Milestone Outcomes */}
        {outcomes.length > 0 ? (
          outcomes.map((outcome) => (
            <OutcomeMilestoneCard key={outcome.id} outcome={outcome} />
          ))
        ) : (
          <div className="relative pl-6 sm:pl-8 py-4">
            <div className="rounded-xl border border-dashed border-border/70 bg-surface-card/40 p-4 sm:p-5 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                {isAuthor
                  ? "You have not logged any follow-up milestones yet. Share what happened 30, 90, or 180 days later to help others learn from the outcome!"
                  : "The author has not logged follow-up outcome milestones yet."}
              </p>
              {isAuthor && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsModalOpen(true)}
                  className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <PlusCircle className="mr-1.5 h-3 w-3" />
                  Log Day 30 / 90 / 180 Checkpoint
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Outcome Modal for Author */}
      {isAuthor && (
        <AddOutcomeModal
          experienceId={experienceId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onOutcomeAdded={handleOutcomeAdded}
        />
      )}
    </section>
  );
}
