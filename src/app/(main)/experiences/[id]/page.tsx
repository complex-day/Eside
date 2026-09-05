import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { TagBadge } from "@/components/shared/TagBadge";
import { ExperienceDetailActions } from "@/components/shared/ExperienceDetailActions";
import { OutcomeTimeline } from "@/components/outcomes/OutcomeTimeline";
import { type OutcomeItem } from "@/components/outcomes/OutcomeMilestoneCard";
import { CommentSection } from "@/components/comments/CommentSection";
import { type CommentItem } from "@/components/comments/CommentCard";
import { BotanicalStageSignal } from "@/components/botanical/BotanicalSignals";
import { determineJourneyStage } from "@/lib/journey-signals";
import { calculateJourneyMeta } from "@/lib/journey-helpers";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { formatFullDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ExperiencePageProps {
  params: {
    id: string;
  };
}

export default async function ExperienceDetailPage({ params }: ExperiencePageProps) {
  const { id } = params;

  // Validate UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    notFound();
  }

  const supabase = await createClient();

  // 1. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Fetch experience, outcomes, and comments concurrently
  const [expResult, outcomesResult, commentsResult] = await Promise.all([
    supabase
      .from("experiences")
      .select(
        `
        id,
        title,
        story,
        status,
        is_anonymous,
        created_at,
        updated_at,
        deleted_at,
        author_id,
        category:categories (
          id,
          name,
          description
        ),
        author:users!experiences_author_id_fkey (
          id,
          username,
          avatar_url,
          bio
        ),
        experience_tags (
          tag:tags (
            id,
            name
          )
        )
      `
      )
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("outcomes")
      .select("id, experience_id, days_after, content, created_at")
      .eq("experience_id", id)
      .order("days_after", { ascending: true })
      .order("created_at", { ascending: true }),

    supabase
      .from("comments")
      .select(
        `
        id,
        experience_id,
        content,
        created_at,
        updated_at,
        author:users!comments_author_id_fkey (
          id,
          username,
          avatar_url
        )
      `
      )
      .eq("experience_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const exp = expResult.data;
  if (expResult.error || !exp) {
    notFound();
  }

  const isAuthor = user?.id === exp.author_id;

  // Access control
  if (exp.deleted_at !== null && !isAuthor) {
    notFound();
  }
  if (exp.status !== "active" && !isAuthor) {
    notFound();
  }

  // Check if bookmarked
  let isBookmarked = false;
  if (user) {
    const { data: bookmarkRecord } = await supabase
      .from("bookmarks")
      .select("experience_id")
      .eq("user_id", user.id)
      .eq("experience_id", id)
      .maybeSingle();

    isBookmarked = Boolean(bookmarkRecord);
  }

  const authorData = exp.author;
  const categoryData = exp.category;
  const tags = (exp.experience_tags ?? [])
    .map((et) => et.tag?.name)
    .filter((t): t is string => Boolean(t));

  const rawOutcomes = outcomesResult.data ?? [];
  const initialOutcomes: OutcomeItem[] = rawOutcomes.map((o) => ({
    id: o.id,
    experience_id: o.experience_id,
    days_after: o.days_after,
    content: o.content,
    created_at: o.created_at,
  }));

  const journeyMeta = calculateJourneyMeta(initialOutcomes, exp.created_at, exp.story);
  const currentDay =
    journeyMeta.latestDaysAfter !== null
      ? journeyMeta.latestDaysAfter
      : journeyMeta.daysSinceStart;

  const stage = determineJourneyStage({
    outcomes_count: initialOutcomes.length,
    category: { name: categoryData?.name },
    journey: journeyMeta,
  });

  const initialComments: CommentItem[] = (commentsResult.data ?? []).map((c) => {
    const commentAuthor = c.author;
    return {
      id: c.id,
      experience_id: c.experience_id,
      content: c.content,
      author: {
        id: commentAuthor?.id ?? "",
        username: commentAuthor?.username ?? "Anonymous",
        avatar_url: commentAuthor?.avatar_url ?? null,
      },
      is_author: user?.id === commentAuthor?.id,
      is_story_author: exp.author_id === commentAuthor?.id,
      created_at: c.created_at,
      updated_at: c.updated_at,
    };
  });

  const formattedFullDate = formatFullDate(exp.created_at);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Back Navigation & Bookmark Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Feed
        </Link>

        <ExperienceDetailActions
          experienceId={exp.id}
          isAuthor={isAuthor}
          isBookmarked={isBookmarked}
        />
      </div>

      {/* SECTION 1: JOURNEY HEADER */}
      <header className="flex flex-col gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href={`/?category=${encodeURIComponent(categoryData?.name ?? "")}`}
            className="font-medium px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[#93C5FD] border border-white/[0.08] hover:text-white transition-colors"
          >
            {categoryData?.name ?? "General"}
          </Link>
          <span className="text-[#64748B]">•</span>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-[#93C5FD] border border-white/[0.08]">
            Day {currentDay}
          </span>
          <BotanicalStageSignal stage={stage} size="sm" showMeaning={true} />
        </div>

        <div className="space-y-2">
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F1F5F9] leading-tight">
            {exp.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#94A3B8] pt-1">
            <Link
              href={`/u/${authorData?.username ?? "anonymous"}`}
              className="flex items-center gap-2 text-[#F1F5F9] font-semibold hover:text-[#4DA3FF] transition-colors"
            >
              <UserAvatar username={authorData?.username ?? "anonymous"} size="sm" />
              <span>@{authorData?.username ?? "anonymous"}</span>
            </Link>
            <span className="text-[#64748B]">•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#64748B]" />
              <span>{formattedFullDate}</span>
            </span>
            <span className="text-[#64748B]">•</span>
            <span className="flex items-center gap-1 text-[#4DA3FF]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{initialOutcomes.length} Checkpoint{initialOutcomes.length !== 1 ? "s" : ""}</span>
            </span>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <TagBadge key={tag} name={tag} />
            ))}
          </div>
        )}
      </header>

      {/* SECTION 2: ORIGINAL STORY / DECISION */}
      <section className="rounded-xl glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-semibold text-[#F1F5F9] uppercase tracking-wide">
            Initial Decision &amp; Context
          </h2>
          <span className="text-xs text-[#64748B] font-mono">Day 0 • 🌼 Seed</span>
        </div>

        <div className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed whitespace-pre-line">
          {exp.story}
        </div>
      </section>

      {/* SECTION 3: OUTCOME TIMELINE */}
      <div id="outcomes">
        <OutcomeTimeline
          experienceId={exp.id}
          initialOutcomes={initialOutcomes}
          isAuthor={isAuthor}
          storyCreatedAt={exp.created_at}
        />
      </div>

      {/* SECTION 4: COMMENTS & DISCUSSION */}
      <div id="comments" className="pt-6 border-t border-white/[0.08]">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9] flex items-center gap-2">
            <span>Discussion &amp; Advice</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/[0.04] text-[#94A3B8]">
              {initialComments.length}
            </span>
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Ask questions, share perspectives, or discuss the trajectory of this journey.
          </p>
        </div>

        <CommentSection
          experienceId={exp.id}
          initialComments={initialComments}
          isAuthenticated={Boolean(user)}
        />
      </div>
    </div>
  );
}
