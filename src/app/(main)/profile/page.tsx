import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { JourneySnapshot } from "@/components/shared/JourneySnapshot";
import { BotanicalStageSignal } from "@/components/botanical/BotanicalSignals";
import { determineJourneyStage } from "@/lib/journey-signals";
import { calculateJourneyMeta } from "@/lib/journey-helpers";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Edit3,
  Bookmark,
  FileText,
  Clock,
  Archive,
  Milestone,
  Plus,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Profile — Eside",
  description: "Your published journeys, longitudinal milestones, and reflections.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from("users")
    .select("id, username, avatar_url, bio, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const rawMetaUsername = metadata?.["username"];
  const fallbackUsername =
    typeof rawMetaUsername === "string" ? rawMetaUsername : "user";
  const username = profile?.username || fallbackUsername;
  const bio = profile?.bio || "Documenting real decisions and long-term outcomes on Eside.";
  const joinedDate = new Date(profile?.created_at || user.created_at).toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" }
  );

  // 2. Fetch User's Experiences along with outcomes
  const { data: userExperiences } = await supabase
    .from("experiences")
    .select(
      `
      id,
      title,
      story,
      status,
      created_at,
      deleted_at,
      category_id,
      category:categories (
        name
      ),
      outcomes (
        id,
        days_after,
        content,
        created_at
      )
    `
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const published = (userExperiences || []).filter(
    (exp) => exp.status === "active" && !exp.deleted_at
  );
  const drafts = (userExperiences || []).filter((exp) => exp.status === "hidden");
  const archived = (userExperiences || []).filter(
    (exp) => exp.status === "deleted" || Boolean(exp.deleted_at)
  );

  // 3. Flatten User's Outcomes
  const allOutcomes = (userExperiences || []).flatMap((exp) =>
    (exp.outcomes || []).map((o) => ({
      ...o,
      experience_title: exp.title,
      experience_id: exp.id,
    }))
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 4. Fetch User's Bookmarks
  const { data: bookmarksData } = await supabase
    .from("bookmarks")
    .select("experience_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const bookmarkedExpIds = (bookmarksData || []).map((b) => b.experience_id);
  let bookmarkedExperiences: Array<{
    id: string;
    title: string;
    story: string;
    created_at: string;
    outcomes: Array<{ id: string; days_after: number; content: string; created_at: string }>;
  }> = [];

  if (bookmarkedExpIds.length > 0) {
    const { data: bExpData } = await supabase
      .from("experiences")
      .select(
        `
        id,
        title,
        story,
        created_at,
        outcomes (
          id,
          days_after,
          content,
          created_at
        )
      `
      )
      .in("id", bookmarkedExpIds)
      .eq("status", "active")
      .is("deleted_at", null);
    bookmarkedExperiences = (bExpData as typeof bookmarkedExperiences) || [];
  }

  // Calculate meaningful longitudinal metrics
  const journeysStartedCount = published.length;
  
  // Turning Points (obstacles, setbacks, pivots, learning lessons)
  const turningPointsCount = allOutcomes.filter((o) => {
    const text = o.content.toLowerCase();
    return (
      text.includes("[turning point") ||
      text.includes("[obstacle") ||
      text.includes("[pivot") ||
      text.includes("obstacle") ||
      text.includes("pivot") ||
      text.includes("struggle") ||
      text.includes("failed") ||
      text.includes("disappointing") ||
      text.includes("blocked") ||
      text.includes("giving up") ||
      text.includes("changing strategy") ||
      text.includes("setback") ||
      text.includes("learned") ||
      text.includes("lesson") ||
      text.includes("need to learn")
    );
  }).length;

  // Outcomes Achieved (bloomed conclusions & final results)
  const outcomesAchievedCount = allOutcomes.filter((o) => {
    const text = o.content.toLowerCase();
    return (
      text.includes("[resolved outcome") ||
      text.includes("[outcome") ||
      text.includes("outcome:") ||
      text.includes("achieved") ||
      text.includes("launched") ||
      text.includes("concluded") ||
      text.includes("succeeded") ||
      text.includes("success") ||
      text.includes("result") ||
      text.includes("hired") ||
      text.includes("won")
    );
  }).length;

  // Active journeys currently in progress
  const activeJourneysCount = published.filter(
    (exp) => (exp.outcomes || []).length > 0
  ).length || journeysStartedCount;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16">
      {/* Profile Header Card */}
      <div className="glass-card rounded-xl p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <UserAvatar username={username} size="lg" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#F1F5F9]">
                  @{username}
                </h1>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-white/[0.04] text-[#94A3B8] border border-white/[0.08]">
                  Journal
                </span>
              </div>

              <p className="text-sm text-[#94A3B8] leading-relaxed max-w-xl">
                {bio}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-[#64748B] pt-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start shrink-0">
            <Link href="/experiences/new">
              <Button size="sm" className="h-8 text-xs font-semibold bg-[#4DA3FF] text-black hover:bg-[#60A5FA] rounded-lg shadow-sm">
                <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
                New Journey
              </Button>
            </Link>
            <Link href="/profile/edit">
              <Button variant="outline" size="sm" className="h-8 text-xs font-medium border-white/10 bg-white/[0.03] text-[#F1F5F9] hover:bg-white/[0.08] rounded-lg">
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Longitudinal Journey Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Journeys Started 🌼 */}
        <div className="glass-card rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Journeys Started</span>
            <span className="text-sm">🌼</span>
          </div>
          <span className="text-2xl font-bold text-[#F1F5F9] font-mono tabular-nums">{journeysStartedCount}</span>
          <span className="text-[11px] text-[#64748B]">Decisions logged</span>
        </div>

        {/* Metric 2: Active Journeys 🌻 */}
        <div className="glass-card rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Active Journeys</span>
            <span className="text-sm">🌻</span>
          </div>
          <span className="text-2xl font-bold text-[#FFB800] font-mono tabular-nums">{activeJourneysCount}</span>
          <span className="text-[11px] text-[#64748B]">In active growth</span>
        </div>

        {/* Metric 3: Turning Points 🍁 */}
        <div className="glass-card rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Turning Points</span>
            <span className="text-sm">🍁</span>
          </div>
          <span className="text-2xl font-bold text-[#FF6B35] font-mono tabular-nums">{turningPointsCount}</span>
          <span className="text-[11px] text-[#64748B]">Pivots & lessons</span>
        </div>

        {/* Metric 4: Outcomes Achieved 🪷 */}
        <div className="glass-card rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Outcomes Achieved</span>
            <span className="text-sm">🪷</span>
          </div>
          <span className="text-2xl font-bold text-[#4DA3FF] font-mono tabular-nums">{outcomesAchievedCount}</span>
          <span className="text-[11px] text-[#64748B]">Bloomed reflections</span>
        </div>
      </div>

      {/* Tabs & Content */}
      <Tabs defaultValue="published" className="w-full space-y-4">
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="flex items-center gap-1.5 min-w-max p-1 bg-black/40 border border-white/[0.08] rounded-xl">
            <TabsTrigger value="published" className="py-1.5 px-3 text-xs rounded-lg data-[state=active]:bg-white/[0.08] data-[state=active]:text-[#F1F5F9] text-[#94A3B8]">
              Published ({published.length})
            </TabsTrigger>
            <TabsTrigger value="outcomes" className="py-1.5 px-3 text-xs rounded-lg data-[state=active]:bg-white/[0.08] data-[state=active]:text-[#F1F5F9] text-[#94A3B8]">
              Checkpoints ({allOutcomes.length})
            </TabsTrigger>
            <TabsTrigger value="drafts" className="py-1.5 px-3 text-xs rounded-lg data-[state=active]:bg-white/[0.08] data-[state=active]:text-[#F1F5F9] text-[#94A3B8]">
              Drafts ({drafts.length})
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="py-1.5 px-3 text-xs rounded-lg data-[state=active]:bg-white/[0.08] data-[state=active]:text-[#F1F5F9] text-[#94A3B8]">
              Saved ({bookmarkedExperiences.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="py-1.5 px-3 text-xs rounded-lg data-[state=active]:bg-white/[0.08] data-[state=active]:text-[#F1F5F9] text-[#94A3B8]">
              Archived ({archived.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Published Experiences */}
        <TabsContent value="published" className="space-y-3">
          {published.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-[#64748B]" />}
              title="No published journeys yet"
              description="Share an initial dilemma or decision and return later to document what happens."
              actionHref="/experiences/new"
              actionLabel="Start a Journey"
            />
          ) : (
            published.map((exp) => {
              const journey = calculateJourneyMeta(exp.outcomes || [], exp.created_at, exp.story);
              const currentDay = journey.latestDaysAfter !== null ? journey.latestDaysAfter : journey.daysSinceStart;
              const stage = determineJourneyStage({
                outcomes_count: exp.outcomes?.length ?? 0,
                category: { name: exp.category?.name },
                journey,
              });

              return (
                <div
                  key={exp.id}
                  className="glass-card glass-card-hover rounded-xl p-5 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-[#93C5FD] border border-white/[0.08]">
                        Day {currentDay}
                      </span>
                      <BotanicalStageSignal stage={stage} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                      <span>{exp.outcomes?.length ?? 0} Update{exp.outcomes?.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div>
                    <Link href={`/experiences/${exp.id}`}>
                      <h3 className="font-sans text-base font-bold text-[#F1F5F9] hover:text-[#4DA3FF] transition-colors line-clamp-1">
                        {exp.title}
                      </h3>
                    </Link>
                    <p className="font-sans text-xs text-[#94A3B8] line-clamp-2 leading-relaxed pt-1">
                      {exp.story}
                    </p>
                  </div>

                  <JourneySnapshot journey={journey} />

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                    <span className="text-[#64748B]">
                      Started {new Date(exp.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/experiences/${exp.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-[#4DA3FF] hover:text-[#7DD3FC] transition-colors"
                    >
                      <span>View Timeline</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Tab 2: Outcomes */}
        <TabsContent value="outcomes" className="space-y-3">
          {allOutcomes.length === 0 ? (
            <EmptyState
              icon={<Milestone className="h-8 w-8 text-[#64748B]" />}
              title="No checkpoints logged yet"
              description="Return to your published decisions after 14, 30, or 90 days to log real-world results."
            />
          ) : (
            allOutcomes.map((outcome) => (
              <div key={outcome.id} className="rounded-xl glass-card p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-[#4DA3FF] border border-white/[0.08]">
                      Day {outcome.days_after} Milestone
                    </span>
                    <Link
                      href={`/experiences/${outcome.experience_id}`}
                      className="text-xs font-semibold text-[#F1F5F9] hover:text-[#4DA3FF] transition-colors line-clamp-1 max-w-xs"
                    >
                      on &quot;{outcome.experience_title}&quot;
                    </Link>
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    {new Date(outcome.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-[#CBD5E1] leading-relaxed whitespace-pre-line">
                  {outcome.content}
                </p>
              </div>
            ))
          )}
        </TabsContent>

        {/* Tab 3: Drafts */}
        <TabsContent value="drafts" className="space-y-3">
          {drafts.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-8 w-8 text-[#64748B]" />}
              title="No drafts saved"
              description="Journeys you save privately will appear here."
              actionHref="/experiences/new"
              actionLabel="Create Draft"
            />
          ) : (
            drafts.map((exp) => (
              <Link key={exp.id} href={`/experiences/${exp.id}/edit`} className="block group">
                <div className="rounded-xl glass-card glass-card-hover p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#F1F5F9] group-hover:text-[#4DA3FF] transition-colors">
                      {exp.title}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/[0.04] text-[#94A3B8]">
                      Draft
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                    {exp.story}
                  </p>
                </div>
              </Link>
            ))
          )}
        </TabsContent>

        {/* Tab 4: Bookmarks */}
        <TabsContent value="bookmarks" className="space-y-3">
          {bookmarkedExperiences.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="h-8 w-8 text-[#64748B]" />}
              title="No saved journeys"
              description="Bookmark journeys as you browse to track their outcomes over time."
              actionHref="/"
              actionLabel="Explore Journeys"
            />
          ) : (
            bookmarkedExperiences.map((bExp) => {
              const journey = calculateJourneyMeta(bExp.outcomes || [], bExp.created_at, bExp.story);
              return (
                <div key={bExp.id} className="rounded-xl glass-card p-4 space-y-3">
                  <Link href={`/experiences/${bExp.id}`} className="block">
                    <h3 className="text-sm font-bold text-[#F1F5F9] hover:text-[#4DA3FF] transition-colors line-clamp-1">
                      {bExp.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                    {bExp.story}
                  </p>
                  <JourneySnapshot journey={journey} />
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Tab 5: Archived */}
        <TabsContent value="archived" className="space-y-3">
          {archived.length === 0 ? (
            <EmptyState
              icon={<Archive className="h-8 w-8 text-[#64748B]" />}
              title="No archived journeys"
              description="Journeys you soft-delete will be preserved here."
            />
          ) : (
            archived.map((exp) => (
              <div key={exp.id} className="rounded-xl glass-card opacity-70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#94A3B8]">
                    {exp.title}
                  </h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Archived
                  </span>
                </div>
                <p className="text-xs text-[#64748B] line-clamp-2">
                  {exp.story}
                </p>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-8 text-center space-y-3 glass-card">
      <div className="flex justify-center">{icon}</div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[#F1F5F9]">{title}</h3>
        <p className="text-xs text-[#94A3B8] max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="inline-block pt-1">
          <Button size="sm" className="h-8 text-xs font-semibold bg-[#4DA3FF] text-black hover:bg-[#60A5FA]">
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}
