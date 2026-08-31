import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { TagBadge } from "@/components/shared/TagBadge";
import { ExperienceDetailActions } from "@/components/shared/ExperienceDetailActions";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Milestone } from "lucide-react";
import { formatRelativeTime, formatFullDate } from "@/lib/utils";

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

  // 2. Fetch experience
  const { data: exp, error } = await supabase
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
      ),
      outcomes (
        id
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !exp) {
    notFound();
  }

  const isAuthor = user?.id === exp.author_id;

  // Access control: if not active or deleted, only author can view
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

  const outcomesList = exp.outcomes ?? [];

  const relativeTime = formatRelativeTime(exp.created_at);
  const formattedFullDate = formatFullDate(exp.created_at);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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

      {/* Main Experience Article */}
      <article className="rounded-2xl border border-border bg-surface-card p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Status / Category / Date meta */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {exp.status === "hidden" && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 font-medium">
              Draft (Private)
            </Badge>
          )}

          {exp.deleted_at !== null && (
            <Badge variant="destructive" className="font-medium">
              Archived
            </Badge>
          )}

          <Link href={`/?category=${encodeURIComponent((categoryData?.name ?? "general").toLowerCase())}`}>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-colors font-semibold"
            >
              {categoryData?.name ?? "General"}
            </Badge>
          </Link>

          <span className="text-muted-foreground/40">•</span>

          <span className="inline-flex items-center space-x-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span title={formattedFullDate}>{relativeTime}</span>
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
          {exp.title}
        </h1>

        {/* Author Strip */}
        <div className="flex items-center justify-between border-y border-border/40 py-3">
          <Link
            href={`/u/${authorData?.username ?? "anonymous"}`}
            className="flex items-center space-x-3 group"
          >
            <UserAvatar username={authorData?.username ?? "anonymous"} size="md" />
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                @{authorData?.username ?? "Anonymous"}
              </p>
              {authorData?.bio ? (
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {authorData.bio}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Anonymous Contributor
                </p>
              )}
            </div>
          </Link>
        </div>

        {/* Story Narrative */}
        <div className="prose prose-invert max-w-none text-xs sm:text-sm text-foreground/90 leading-relaxed sm:leading-loose whitespace-pre-line space-y-4">
          {exp.story}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="border-t border-border/40 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Related Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <TagBadge key={tag} name={tag} />
              ))}
            </div>
          </div>
        )}

        {/* Outcome Milestones Badge Summary */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-2">
          <div className="flex items-center space-x-2 text-primary font-semibold text-xs sm:text-sm">
            <Milestone className="h-4 w-4 shrink-0" />
            <span>Outcome Progress ({outcomesList.length} Logged)</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {outcomesList.length > 0
              ? `This contributor has documented ${outcomesList.length} follow-up outcome milestone${outcomesList.length > 1 ? "s" : ""} on how this situation evolved.`
              : "No follow-up outcomes have been documented for this experience yet."}
          </p>
        </div>
      </article>
    </div>
  );
}
