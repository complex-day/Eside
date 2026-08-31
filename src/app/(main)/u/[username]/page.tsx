import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Milestone } from "lucide-react";

export const dynamic = "force-dynamic";

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
    .select("id, title, story, created_at, outcomes (id)")
    .eq("author_id", userProfile.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const published = experiences || [];

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
            const outcomesList = (exp.outcomes || []) as Array<{ id: string }>;

            return (
              <Link key={exp.id} href={`/experiences/${exp.id}`} className="block group">
                <Card className="border-border bg-surface-card hover:border-primary/40 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {exp.title}
                      </CardTitle>
                      {outcomesList.length > 0 && (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium text-[10px]">
                          <Milestone className="h-3 w-3" />
                          <span>{outcomesList.length} Outcome{outcomesList.length > 1 ? "s" : ""}</span>
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {exp.story}
                    </p>
                    <span className="text-[10px] text-muted-foreground/80 block">
                      Published {new Date(exp.created_at).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
