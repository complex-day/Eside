import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CategoryFilter, type CategoryItem } from "@/components/shared/CategoryFilter";
import { ExperienceCard, type ExperienceItem } from "@/components/shared/ExperienceCard";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Button } from "@/components/ui/button";
import { normalizeTag } from "@/lib/validations/experience";
import { PlusCircle, Sparkles, BookOpen, X } from "lucide-react";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: {
    page?: string;
    category?: string;
    tag?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 10;
  const offset = (page - 1) * limit;
  const selectedCategory = searchParams.category;
  const selectedTag = searchParams.tag ? normalizeTag(searchParams.tag) : undefined;

  const supabase = await createClient();

  // 1. Fetch categories for filter bar
  const { data: rawCategories } = await supabase
    .from("categories")
    .select("id, name, description")
    .order("name", { ascending: true });

  const categories: CategoryItem[] = (rawCategories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
  }));

  // 2. Fetch authenticated user for bookmarks
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Resolve category ID if selected
  let categoryId: string | null = null;
  if (selectedCategory) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedCategory);
    if (isUuid) {
      categoryId = selectedCategory;
    } else {
      const match = categories.find(
        (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (match) {
        categoryId = match.id;
      }
    }
  }

  // 4. Resolve tag ID if selected
  let filteredExperienceIds: string[] | null = null;
  if (selectedTag) {
    const { data: tagRecord } = await supabase
      .from("tags")
      .select("id")
      .ilike("name", selectedTag)
      .maybeSingle();

    if (tagRecord) {
      const { data: tagLinks } = await supabase
        .from("experience_tags")
        .select("experience_id")
        .eq("tag_id", tagRecord.id);

      filteredExperienceIds = tagLinks?.map((tl) => tl.experience_id) ?? [];
    } else {
      filteredExperienceIds = [];
    }
  }

  // 5. Query active experiences
  let experiences: ExperienceItem[] = [];
  let totalItems = 0;

  if (selectedTag && filteredExperienceIds && filteredExperienceIds.length === 0) {
    experiences = [];
    totalItems = 0;
  } else {
    let dbQuery = supabase
      .from("experiences")
      .select(
        `
        id,
        title,
        story,
        status,
        is_anonymous,
        created_at,
        category:categories (
          id,
          name,
          description
        ),
        author:users!experiences_author_id_fkey (
          id,
          username,
          avatar_url
        ),
        experience_tags (
          tag:tags (
            id,
            name
          )
        ),
        outcomes (
          id
        ),
        comments (
          id
        )
      `,
        { count: "exact" }
      )
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (categoryId) {
      dbQuery = dbQuery.eq("category_id", categoryId);
    }

    if (filteredExperienceIds && filteredExperienceIds.length > 0) {
      dbQuery = dbQuery.in("id", filteredExperienceIds);
    }

    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: rows, count } = await dbQuery;
    totalItems = count ?? 0;

    // Fetch user bookmarks
    let userBookmarksSet = new Set<string>();
    if (user && rows && rows.length > 0) {
      const expIds = rows.map((e) => e.id);
      const { data: userBookmarks } = await supabase
        .from("bookmarks")
        .select("experience_id")
        .eq("user_id", user.id)
        .in("experience_id", expIds);

      if (userBookmarks) {
        userBookmarksSet = new Set(userBookmarks.map((b) => b.experience_id));
      }
    }

    // Format experiences
    experiences = (rows ?? []).map((exp) => {
      const storyPreview =
        exp.story.length > 200 ? `${exp.story.slice(0, 200).trim()}...` : exp.story;

      const tags = (exp.experience_tags ?? [])
        .map((et) => et.tag?.name)
        .filter((t): t is string => Boolean(t));

      const authorData = exp.author;
      const categoryData = exp.category;
      const outcomesList = exp.outcomes ?? [];
      const commentsList = exp.comments ?? [];

      return {
        id: exp.id,
        title: exp.title,
        story_preview: storyPreview,
        is_anonymous: exp.is_anonymous,
        author: {
          id: authorData?.id ?? "",
          username: authorData?.username ?? "Anonymous",
          avatar_url: authorData?.avatar_url ?? null,
        },
        category: {
          id: categoryData?.id ?? "",
          name: categoryData?.name ?? "General",
        },
        tags,
        outcomes_count: outcomesList.length,
        comments_count: commentsList.length,
        is_bookmarked: userBookmarksSet.has(exp.id),
        created_at: exp.created_at,
      };
    });
  }

  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="space-y-6">
      {/* Platform Hero Banner */}
      <section className="rounded-2xl border border-border/60 bg-gradient-to-b from-surface-elevated/40 via-surface-card to-surface-card p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Real human experiences & outcomes</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Learn from real stories, not assumptions.
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Discover authentic anonymous accounts of struggles, career pivots, failures, and what happened 30, 90, and 180 days later.
            </p>
          </div>

          <Button asChild size="sm" className="shrink-0 font-semibold shadow-sm">
            <Link href="/experiences/new">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Share Experience
            </Link>
          </Button>
        </div>
      </section>

      {/* Category Pills Filter Bar */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Explore by Category
          </h2>
          {selectedCategory && (
            <Link
              href="/"
              className="text-[11px] text-primary hover:underline font-medium"
            >
              Clear filter
            </Link>
          )}
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
        />
      </section>

      {/* Active Tag Filter Indicator */}
      {selectedTag && (
        <div className="inline-flex items-center space-x-2 rounded-lg bg-secondary/80 px-3 py-1.5 text-xs text-foreground border border-border">
          <span>
            Filtering by tag: <strong className="text-primary">#{selectedTag}</strong>
          </span>
          <Link
            href={selectedCategory ? `/?category=${encodeURIComponent(selectedCategory)}` : "/"}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Experiences Feed List */}
      <section className="space-y-3">
        {experiences.length > 0 ? (
          experiences.map((exp) => (
            <ExperienceCard key={exp.id} experience={exp} />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 sm:p-12 text-center space-y-3 bg-surface-card/30">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                No experiences found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {selectedCategory || selectedTag
                  ? "No published stories match your selected filter. Be the first to share an experience in this topic!"
                  : "No experiences have been published yet. Share the first story to help others learn from your journey."}
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="text-xs mt-2">
              <Link href="/experiences/new">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Share Your Story
              </Link>
            </Button>
          </div>
        )}

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
        />
      </section>
    </div>
  );
}
