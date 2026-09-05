import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { BookmarkButton } from "@/components/shared/BookmarkButton";
import { BotanicalStageSignal } from "@/components/botanical/BotanicalSignals";
import { determineJourneyStage } from "@/lib/journey-signals";
import { type JourneyMeta } from "@/lib/journey-helpers";
import { formatRelativeTime } from "@/lib/utils";
import {
  MessageSquare,
  ArrowRight,
  Milestone,
} from "lucide-react";

export interface ExperienceItem {
  id: string;
  title: string;
  story_preview: string;
  is_anonymous: boolean;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  category: {
    id: string;
    name: string;
  };
  tags: string[];
  outcomes_count: number;
  journey: JourneyMeta;
  comments_count: number;
  is_bookmarked?: boolean;
  created_at: string;
}

interface ExperienceCardProps {
  experience: ExperienceItem;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  const relativeTime = formatRelativeTime(experience.created_at);
  const { totalUpdates, latestDaysAfter, daysSinceStart } = experience.journey;
  const currentDay = latestDaysAfter !== null ? latestDaysAfter : daysSinceStart;

  // Formatted Day representation
  const dayText = `Day ${currentDay}`;

  // Deterministically classify the journey's subtle botanical signal
  const stage = determineJourneyStage(experience);

  return (
    <article className="group relative rounded-xl glass-card glass-card-hover p-5 sm:p-6 flex flex-col gap-4">
      {/* Header: Author Info + Category + Subtle Corner Signal */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/u/${experience.author.username}`} className="shrink-0">
            <UserAvatar username={experience.author.username} size="md" />
          </Link>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/u/${experience.author.username}`}
                className="font-sans text-sm font-semibold text-[#F1F5F9] hover:text-[#4DA3FF] transition-colors"
              >
                @{experience.author.username}
              </Link>
              <span className="text-[#64748B] text-xs">•</span>
              <span className="text-xs text-[#94A3B8]">
                {relativeTime}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.04] text-[#94A3B8] border border-white/[0.06]">
                {experience.category.name}
              </span>
              {experience.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="text-[11px] text-[#64748B] hover:text-[#94A3B8] transition-colors"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Journey Day & Subtle Botanical Stage Signal */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] text-[#93C5FD] border border-white/[0.08] shadow-xs">
            {dayText}
          </span>
          <BotanicalStageSignal stage={stage} size="sm" />
        </div>
      </div>

      {/* Main Narrative / Decision Content */}
      <div className="space-y-1.5">
        <Link href={`/experiences/${experience.id}`} className="block group-hover:text-[#93C5FD] transition-colors">
          <h3 className="font-sans text-base sm:text-lg font-bold text-[#F1F5F9] leading-snug">
            {experience.title}
          </h3>
        </Link>
        <p className="font-sans text-xs sm:text-sm text-[#94A3B8] leading-relaxed line-clamp-3">
          {experience.story_preview}
        </p>
      </div>

      {/* Outcome Milestones Preview (if any checkpoints logged) */}
      {experience.outcomes_count > 0 && (
        <div className="rounded-lg bg-black/40 p-3 border border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#CBD5E1]">
            <CheckCircle2 className="h-4 w-4 text-[#4DA3FF] shrink-0" />
            <span className="font-medium">
              {experience.outcomes_count} Outcome Checkpoint{experience.outcomes_count !== 1 ? "s" : ""} Recorded
            </span>
          </div>
          <Link
            href={`/experiences/${experience.id}#outcomes`}
            className="text-xs text-[#4DA3FF] hover:text-[#7DD3FC] font-medium inline-flex items-center gap-1 transition-colors"
          >
            <span>View Timeline</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Footer Actions & Metadata */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs text-[#64748B]">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1 text-[#94A3B8]">
            <Milestone className="h-3.5 w-3.5 text-[#64748B]" />
            <span>{totalUpdates} Update{totalUpdates !== 1 ? "s" : ""}</span>
          </span>

          <Link
            href={`/experiences/${experience.id}#comments`}
            className="inline-flex items-center gap-1 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#64748B]" />
            <span>{experience.comments_count}</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <BookmarkButton
            experienceId={experience.id}
            initialBookmarked={experience.is_bookmarked}
          />
          <Link
            href={`/experiences/${experience.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#4DA3FF] hover:text-[#7DD3FC] transition-colors"
          >
            <span>Read Journey</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
