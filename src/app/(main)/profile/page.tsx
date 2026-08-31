import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Edit3,
  Bookmark,
  FileText,
  Clock,
  Archive,
  PlusCircle,
  Compass,
} from "lucide-react";

export const metadata = {
  title: "My Profile — Eside",
  description: "Manage your anonymous profile, experiences, outcomes, and bookmarks.",
};

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
    typeof rawMetaUsername === "string" ? rawMetaUsername : "anonymous";
  const username = profile?.username || fallbackUsername;
  const bio = profile?.bio || "No bio added yet.";
  const joinedDate = new Date(profile?.created_at || user.created_at).toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" }
  );

  // 2. Fetch User's Experiences
  const { data: userExperiences } = await supabase
    .from("experiences")
    .select("id, title, story, status, created_at, deleted_at, category_id")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const published = (userExperiences || []).filter(
    (exp) => exp.status === "active" && !exp.deleted_at
  );
  const drafts = (userExperiences || []).filter((exp) => exp.status === "hidden");
  const archived = (userExperiences || []).filter(
    (exp) => exp.status === "deleted" || Boolean(exp.deleted_at)
  );

  // 3. Fetch User's Outcomes
  const experienceIds = (userExperiences || []).map((exp) => exp.id);
  let outcomes: Array<{
    id: string;
    experience_id: string;
    days_after: number;
    content: string;
    created_at: string;
  }> = [];

  if (experienceIds.length > 0) {
    const { data: outcomesData } = await supabase
      .from("outcomes")
      .select("id, experience_id, days_after, content, created_at")
      .in("experience_id", experienceIds)
      .order("days_after", { ascending: true });
    outcomes = outcomesData || [];
  }

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
  }> = [];

  if (bookmarkedExpIds.length > 0) {
    const { data: bExpData } = await supabase
      .from("experiences")
      .select("id, title, story, created_at")
      .in("id", bookmarkedExpIds)
      .eq("status", "active");
    bookmarkedExperiences = bExpData || [];
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="border-border bg-surface-card shadow-md">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start space-x-4">
              <UserAvatar username={username} size="lg" />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold text-foreground">@{username}</h1>
                  <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
                    Anonymous
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground max-w-md leading-relaxed">{bio}</p>
                <div className="flex items-center text-[11px] text-muted-foreground pt-1">
                  <Calendar className="mr-1 h-3.5 w-3.5 text-slate-500" />
                  <span>Joined {joinedDate}</span>
                </div>
              </div>
            </div>

            <Link href="/profile/edit" className="self-start">
              <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="published" className="w-full">
        <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-surface-card">
          <TabsTrigger value="published" className="py-2 text-[11px] sm:text-xs">
            Published ({published.length})
          </TabsTrigger>
          <TabsTrigger value="drafts" className="py-2 text-[11px] sm:text-xs">
            Drafts ({drafts.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="py-2 text-[11px] sm:text-xs">
            Archived ({archived.length})
          </TabsTrigger>
          <TabsTrigger value="outcomes" className="py-2 text-[11px] sm:text-xs">
            Outcomes ({outcomes.length})
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="py-2 text-[11px] sm:text-xs">
            Bookmarks ({bookmarkedExperiences.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Published Experiences */}
        <TabsContent value="published" className="space-y-3">
          {published.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-muted-foreground" />}
              title="No published experiences yet"
              description="Share a real incident, struggle, or decision to help others learn from your journey."
              actionHref="/"
              actionLabel="Explore Feed"
            />
          ) : (
            published.map((exp) => (
              <Card key={exp.id} className="border-border bg-surface-card hover:border-slate-700 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      {exp.title}
                    </CardTitle>
                    <Badge variant="active" className="text-[10px]">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {exp.story}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-2 block">
                    Posted on {new Date(exp.created_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab 2: Draft Experiences */}
        <TabsContent value="drafts" className="space-y-3">
          {drafts.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-8 w-8 text-muted-foreground" />}
              title="No drafts saved"
              description="Drafts you save privately will appear here."
            />
          ) : (
            drafts.map((exp) => (
              <Card key={exp.id} className="border-border bg-surface-card">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      {exp.title}
                    </CardTitle>
                    <Badge variant="draft" className="text-[10px]">
                      Draft
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {exp.story}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab 3: Archived Experiences */}
        <TabsContent value="archived" className="space-y-3">
          {archived.length === 0 ? (
            <EmptyState
              icon={<Archive className="h-8 w-8 text-muted-foreground" />}
              title="No archived experiences"
              description="Experiences you soft-delete or archive will be preserved here."
            />
          ) : (
            archived.map((exp) => (
              <Card key={exp.id} className="border-border bg-surface-card opacity-75">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      {exp.title}
                    </CardTitle>
                    <Badge variant="archived" className="text-[10px]">
                      Archived
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {exp.story}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab 4: My Outcomes */}
        <TabsContent value="outcomes" className="space-y-3">
          {outcomes.length === 0 ? (
            <EmptyState
              icon={<Compass className="h-8 w-8 text-muted-foreground" />}
              title="No outcome milestones yet"
              description="Return to your experiences after 30, 90, or 180 days to log what happened next."
            />
          ) : (
            outcomes.map((outcome) => (
              <Card key={outcome.id} className="border-border bg-surface-card">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">
                      Day {outcome.days_after} Milestone
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(outcome.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-foreground leading-relaxed">
                    {outcome.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab 5: Bookmarks */}
        <TabsContent value="bookmarks" className="space-y-3">
          {bookmarkedExperiences.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="h-8 w-8 text-muted-foreground" />}
              title="No saved bookmarks"
              description="Bookmark experiences as you browse to quickly reference them later."
              actionHref="/"
              actionLabel="Browse Experiences"
            />
          ) : (
            bookmarkedExperiences.map((bExp) => (
              <Card key={bExp.id} className="border-border bg-surface-card hover:border-slate-700 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {bExp.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {bExp.story}
                  </p>
                </CardContent>
              </Card>
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
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-border bg-surface-card/40 space-y-3">
      <div className="p-2.5 rounded-full bg-slate-800/80">{icon}</div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="pt-1">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}
