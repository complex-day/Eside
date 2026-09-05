"use client";

import { useState } from "react";
import Link from "next/link";
import {
  OutcomeMilestoneCard,
  type OutcomeItem,
} from "@/components/outcomes/OutcomeMilestoneCard";
import { AddOutcomeModal } from "@/components/outcomes/AddOutcomeModal";
import { Button } from "@/components/ui/button";
import {
  Route,
  Plus,
  Edit2,
} from "lucide-react";

interface OutcomeTimelineProps {
  experienceId: string;
  initialOutcomes: OutcomeItem[];
  isAuthor: boolean;
  storyCreatedAt?: string;
}

export function OutcomeTimeline({
  experienceId,
  initialOutcomes,
  isAuthor,
  storyCreatedAt,
}: OutcomeTimelineProps) {
  const [outcomes, setOutcomes] = useState<OutcomeItem[]>(
    [...initialOutcomes].sort((a, b) => {
      if (a.days_after !== b.days_after) {
        return a.days_after - b.days_after;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOutcomeAdded = (newOutcome: OutcomeItem) => {
    setOutcomes((prev) =>
      [...prev, newOutcome].sort((a, b) => {
        if (a.days_after !== b.days_after) {
          return a.days_after - b.days_after;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
    );
  };

  const handleOutcomeUpdated = (updatedOutcome: OutcomeItem) => {
    setOutcomes((prev) =>
      prev
        .map((o) => (o.id === updatedOutcome.id ? updatedOutcome : o))
        .sort((a, b) => {
          if (a.days_after !== b.days_after) {
            return a.days_after - b.days_after;
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        })
    );
  };

  const handleOutcomeDeleted = (deletedId: string) => {
    setOutcomes((prev) => prev.filter((o) => o.id !== deletedId));
  };

  return (
    <section className="flex flex-col gap-5 pt-2">
      {/* Timeline Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-base font-bold text-[#F1F5F9]">
          <Route className="h-5 w-5 text-[#4DA3FF]" />
          <h2>Longitudinal Outcome Timeline</h2>
        </div>

        {isAuthor && (
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-8 text-xs font-semibold bg-[#4DA3FF] text-black hover:bg-[#60A5FA] transition-colors rounded-lg shadow-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
            Add Milestone / Outcome
          </Button>
        )}
      </div>

      {/* Continuous Spine Timeline */}
      <div className="relative pl-6 sm:pl-8 flex flex-col gap-4">
        {/* Continuous Spine Line */}
        <div className="absolute left-2.5 sm:left-3.5 top-3 bottom-6 w-0.5 bg-white/10"></div>

        {/* Day 0 Anchor Node: Decision 🌼 */}
        <div className="relative pl-6 sm:pl-8 pb-4 group">
          <div className="absolute -left-3 sm:-left-3.5 top-2 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-amber-300/60 bg-[#050505] shadow-xs" title="Initial Decision (🌼)">
            <span className="text-[11px] sm:text-xs leading-none select-none">🌼</span>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-white/[0.06]">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-amber-100 border border-amber-100/15 flex items-center gap-1">
                <span>🌼</span>
                <span>Day 0 • Initial Decision</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B]">
                  {storyCreatedAt ? new Date(storyCreatedAt).toLocaleDateString() : "Baseline"}
                </span>
                {isAuthor && (
                  <Link
                    href={`/experiences/${experienceId}/edit`}
                    className="inline-flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#4DA3FF] hover:bg-white/[0.05] px-1.5 py-0.5 rounded transition-colors ml-1"
                    title="Edit Day 0 Decision"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </Link>
                )}
              </div>
            </div>

            <h3 className="text-sm font-semibold text-[#F1F5F9] mt-1">
              Journey Initiated
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Initial decision, hypothesis, and starting conditions logged to the public record.
            </p>
          </div>
        </div>

        {/* Outcomes & Milestones List */}
        {outcomes.length > 0 ? (
          outcomes.map((outcome, index) => {
            const prevDays = index === 0 ? 0 : outcomes[index - 1]?.days_after ?? 0;
            const deltaDays = outcome.days_after - prevDays;

            return (
              <OutcomeMilestoneCard
                key={outcome.id}
                outcome={outcome}
                experienceId={experienceId}
                isAuthor={isAuthor}
                deltaDays={deltaDays}
                isLatest={index === outcomes.length - 1}
                onOutcomeUpdated={handleOutcomeUpdated}
                onOutcomeDeleted={handleOutcomeDeleted}
              />
            );
          })
        ) : (
          <div className="relative pl-6 sm:pl-8 py-2">
            <div className="rounded-xl border border-dashed border-white/10 glass-card p-5 text-center space-y-2">
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {isAuthor
                  ? "No follow-up updates logged yet. Return at Day 14, 30, or 90 to document how your journey unfolded!"
                  : "No follow-up checkpoints have been recorded yet."}
              </p>
              {isAuthor && (
                <Button
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="h-7 text-xs bg-[#4DA3FF] text-black hover:bg-[#60A5FA] font-semibold"
                >
                  <Plus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />
                  Log First Milestone
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Journey Update Modal */}
      {isAuthor && (
        <AddOutcomeModal
          experienceId={experienceId}
          storyCreatedAt={storyCreatedAt}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onOutcomeAdded={handleOutcomeAdded}
        />
      )}
    </section>
  );
}
