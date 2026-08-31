import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Compass } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}) {
  return {
    title: `@${params.username} — Eside`,
    description: `Read lived experiences and outcomes shared anonymously by @${params.username} on Eside.`,
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

  // 2. Fetch public active experiences
  const { data: experiences } = await supabase
    .from("experiences")
    .select("id, title, story, created_at")
    .eq("author_id", userProfile.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const published = experiences || [];

  // 3. Fetch outcomes
  const expIds = published.map((e) => e.id);
  let outcomes: Array<{
    id: string;
    experience_id: string;
    days_after: number;
    content: string;
    created_at: string;
  }> = [];

  if (expIds.length > 0) {
    const { data: outcomesData } = await supabase
      .from("outcomes")
      .select("id, experience_id, days_after, content, created_at")
      .in("experience_id", expIds)
      .order("days_after", { ascending: true });
    outcomes = outcomesData || [];
  }

  const joinedDate = new Date(userProfile.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Public Profile Header */}
      <Card className="border-border bg-surface-card shadow-md">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start space-x-4">
            <UserAvatar username={userProfile.username} size="lg" />
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-foreground">
                  @{userProfile.username}
                </h1>
                <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
                  Anonymous Contributor
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                {userProfile.bio || "No public bio shared."}
              </p>
              <div className="flex items-center text-[11px] text-muted-foreground pt-1">
                <Calendar className="mr-1 h-3.5 w-3.5 text-slate-500" />
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Published Experiences */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center">
            <FileText className="mr-1.5 h-4 w-4 text-primary" />
            Shared Experiences ({published.length})
          </h2>
        </div>

        {published.length === 0 ? (
          <Card className="border-border bg-surface-card p-6 text-center text-xs text-muted-foreground">
            This contributor has not shared any public experiences yet.
          </Card>
        ) : (
          published.map((exp) => {
            const expOutcomes = outcomes.filter((o) => o.experience_id === exp.id);

            return (
              <Card
                key={exp.id}
                className="border-border bg-surface-card hover:border-slate-700 transition-colors"
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {exp.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {exp.story}
                  </p>

                  {/* Outcome timeline preview */}
                  {expOutcomes.length > 0 && (
                    <div className="pt-2 border-t border-border/50 space-y-1.5">
                      <span className="text-[10px] font-bold text-primary flex items-center">
                        <Compass className="mr-1 h-3 w-3" />
                        Outcome Timeline Updates:
                      </span>
                      {expOutcomes.map((out) => (
                        <div
                          key={out.id}
                          className="text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800 text-slate-300"
                        >
                          <span className="font-semibold text-primary">Day {out.days_after}:</span>{" "}
                          {out.content}
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 block pt-1">
                    Posted on {new Date(exp.created_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
