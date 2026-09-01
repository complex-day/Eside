import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { TagBadge } from "@/components/shared/TagBadge";
import { BookmarkButton } from "@/components/shared/BookmarkButton";
import { JourneyProgressBadge } from "@/components/outcomes/JourneyProgressBadge";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

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
  journey?: {
    total_updates: number;
    latest_days_after: number | null;
    latest_update_at: string | null;
    is_long_running: boolean;
  };
  comments_count: number;
  is_bookmarked?: boolean;
  created_at: string;
}

interface ExperienceCardProps {
  experience: ExperienceItem;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  const relativeTime = formatRelativeTime(experience.created_at);

  const totalUpdates = experience.journey?.total_updates ?? experience.outcomes_count;
  const latestDays = experience.journey?.latest_days_after ?? null;
  const isLongRunning = experience.journey?.is_long_running ?? false;

  return (
    <article className="group rounded-xl border border-border bg-surface-card p-4 transition-all duration-150 hover:border-primary/40 hover:bg-surface-card/80 hover:shadow-md hover:shadow-black/20">
      {/* Top Header: Author & Category & Time */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-2 min-w-0">
          <Link
            href={`/u/${experience.author.username}`}
            className="flex items-center space-x-2 shrink-0 group-hover:opacity-90"
          >
            <UserAvatar username={experience.author.username} size="sm" />
            <span className="text-xs font-semibold text-foreground truncate hover:underline">
              @{experience.author.username}
            </span>
          </Link>

          <span className="text-muted-foreground/40 text-xs">•</span>

          <Link
            href={`/?category=${encodeURIComponent(experience.category.name.toLowerCase())}`}
            className="shrink-0"
          >
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-2 font-medium bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors"
            >
              {experience.category.name}
            </Badge>
          </Link>
        </div>

        <div className="flex items-center space-x-1 text-[11px] text-muted-foreground shrink-0">
          <Clock className="h-3 w-3" />
          <span>{relativeTime}</span>
        </div>
      </div>

      {/* Main Content: Title & Excerpt */}
      <div className="space-y-1.5 mb-3">
        <Link href={`/experiences/${experience.id}`} className="block">
          <h2 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {experience.title}
          </h2>
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {experience.story_preview}
        </p>
      </div>

      {/* Tags List */}
      {experience.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {experience.tags.map((tag) => (
            <TagBadge key={tag} name={tag} />
          ))}
        </div>
      )}

      {/* Card Footer: Living Journey Progress Badge, Comments & Bookmark Action */}
      <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-2">
        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
          {/* Journey Progress Indicator */}
          <JourneyProgressBadge
            totalUpdates={totalUpdates}
            latestDaysAfter={latestDays}
            isLongRunning={isLongRunning}
          />

          {/* Comments count */}
          <span className="inline-flex items-center space-x-1 text-[11px]">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{experience.comments_count}</span>
          </span>
        </div>

        {/* Bookmark Button */}
        <BookmarkButton
          experienceId={experience.id}
          initialBookmarked={experience.is_bookmarked}
        />
      </div>
    </article>
  );
}
