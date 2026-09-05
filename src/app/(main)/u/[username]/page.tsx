import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { JourneySnapshot } from "@/components/shared/JourneySnapshot";
import { calculateJourneyMeta } from "@/lib/journey-helpers";
import { calculateCalendarDaysDifference } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}) {
  return {
    title: `@${params.username} — Eside`,
    description: `Read decisions and outcome journeys documented anonymously by @${params.username} on Eside.`,
  };
}

export default async function PublicUserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = await createClient();

  // 1. Fetch public profile
  const { data: userProfile } = await supabase
    .from("users")
    .select("id, username, avatar_url, bio, created_at")
    .ilike("username", params.username)
    .maybeSingle();

  if (!userProfile) {
    notFound();
  }

  // 2. Fetch public active experiences with outcomes
  const { data: experiences } = await supabase
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
    .eq("author_id", userProfile.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const published = experiences || [];

  const joinedDate = new Date(userProfile.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const allOutcomes = published.flatMap((exp) => exp.outcomes || []);
  const activeCount = published.length;
  const completedCount = published.filter(
    (exp) => (exp.outcomes || []).length >= 2 || (exp.outcomes || []).some((o: { days_after: number }) => o.days_after >= 30)
  ).length;
  const outcomesCount = allOutcomes.length;
  const updatesCount = allOutcomes.length;

  const daysSinceJoin = Math.max(
    1,
    calculateCalendarDaysDifference(userProfile.created_at)
  );
  const streak = Math.min(daysSinceJoin, 23);

  return (
    <div className="space-y-6">
      {/* Public Profile Header */}
      <Card className="border-slate-800 bg-slate-900 shadow-md">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start space-x-4">
            <UserAvatar username={userProfile.username} size="lg" />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100">
                  @{userProfile.username}
                </h1>
                <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
                  Anonymous Contributor
                </Badge>
                <span className="inline-flex items-center space-x-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono tabular-nums font-bold text-amber-400 border border-amber-500/20">
                  <span>🔥 {streak} Day Streak</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                {userProfile.bio || "No public bio shared."}
              </p>
              <div className="flex items-center text-[11px] text-slate-500 pt-0.5">
                <Calendar className="mr-1 h-3.5 w-3.5" />
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Longitudinal Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800">
            <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-2.5 text-center">
              <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-primary">
                {activeCount}
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">
                Active Journeys
              </div>
            </div>

            <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-2.5 text-center">
              <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-cyan-400">
                {completedCount}
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">
                Matured
              </div>
            </div>

            <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-2.5 text-center">
              <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-emerald-400">
                {outcomesCount}
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">
                Outcomes
              </div>
            </div>

            <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-2.5 text-center">
              <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-amber-400">
                {updatesCount}
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">
                Checkpoints
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Published Decisions & Journeys */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center">
            <FileText className="mr-1.5 h-4 w-4 text-primary" />
            Documented Journeys ({published.length})
          </h2>
        </div>

        {published.length === 0 ? (
          <Card className="border-slate-800 bg-slate-900 p-6 text-center text-xs text-slate-400">
            This contributor has not published any public decision journeys yet.
          </Card>
        ) : (
          published.map((exp) => {
            const journey = calculateJourneyMeta(
              (exp.outcomes as Array<{ id: string; days_after: number; content: string; created_at: string }>) || [],
              exp.created_at,
              exp.story
            );

            return (
              <div key={exp.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                <Link href={`/experiences/${exp.id}`} className="block">
                  <h3 className="text-sm font-bold text-slate-100 hover:text-primary transition-colors line-clamp-1">
                    {exp.title}
                  </h3>
                </Link>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {exp.story}
                </p>

                <JourneySnapshot journey={journey} />

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                  <span className="text-[10px] text-slate-500">
                    Documented on {new Date(exp.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/experiences/${exp.id}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View Timeline →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
