import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CategoryFilter, type CategoryItem } from "@/components/shared/CategoryFilter";
import { ExperienceCard, type ExperienceItem } from "@/components/shared/ExperienceCard";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { ProgressionBanner } from "@/components/feed/ProgressionBanner";
import { BotanicalHero } from "@/components/feed/BotanicalHero";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { FeedSearchBar } from "@/components/feed/FeedSearchBar";
import { normalizeTag } from "@/lib/validations/experience";
import { calculateJourneyMeta } from "@/lib/journey-helpers";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: {
    page?: string;
    category?: string;
    tag?: string;
    q?: string;
    sort?: string;
    journey?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 10;
  const offset = (page - 1) * limit;
  const selectedCategory = searchParams.category;
  const selectedTag = searchParams.tag ? normalizeTag(searchParams.tag) : undefined;
  const q = searchParams.q?.trim() ? searchParams.q.trim().slice(0, 100) : undefined;
  
  // Default to "recently_updated" journeys over static new posts
  const sort = searchParams.sort === "latest" ? "latest" : "recently_updated";
  const journey =
    searchParams.journey === "active" || searchParams.journey === "long_running"
      ? searchParams.journey
      : "all";

  const supabase = await createClient();

  // 1 & 2. Fetch categories & authenticated user in parallel
  const [categoriesResult, userResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, description")
      .order("name", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const rawCategories = categoriesResult.data;
  const user = userResult.data.user;

  const categories: CategoryItem[] = (rawCategories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
  }));

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
  let tagFilteredIds: string[] | null = null;
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

      tagFilteredIds = tagLinks?.map((tl) => tl.experience_id) ?? [];
    } else {
      tagFilteredIds = [];
    }
  }

  // 5. Resolve Journey Depth filter
  let journeyFilteredIds: string[] | null = null;
  if (journey === "active") {
    const { data: activeOutcomeLinks } = await supabase
      .from("outcomes")
      .select("experience_id");

    journeyFilteredIds = Array.from(
      new Set(activeOutcomeLinks?.map((o) => o.experience_id) ?? [])
    );
  } else if (journey === "long_running") {
    const { data: longRunningLinks } = await supabase
      .from("outcomes")
      .select("experience_id")
      .gte("days_after", 90);

    journeyFilteredIds = Array.from(
      new Set(longRunningLinks?.map((o) => o.experience_id) ?? [])
    );
  }

  // 6. Combine ID filters
  let combinedFilteredIds: string[] | null = null;
  if (tagFilteredIds !== null && journeyFilteredIds !== null) {
    const journeySet = new Set(journeyFilteredIds);
    combinedFilteredIds = tagFilteredIds.filter((id) => journeySet.has(id));
  } else if (tagFilteredIds !== null) {
    combinedFilteredIds = tagFilteredIds;
  } else if (journeyFilteredIds !== null) {
    combinedFilteredIds = journeyFilteredIds;
  }

  // 7. Resolve Search Query keywords across tags and categories
  let qTagExpIds: string[] = [];
  let qCategoryIds: string[] = [];

  if (q) {
    const sanitizedQ = q.replace(/[,()]/g, " ").trim();
    if (sanitizedQ) {
      const [tagMatches, catMatches] = await Promise.all([
        supabase
          .from("tags")
          .select("id")
          .ilike("name", `%${sanitizedQ}%`),
        supabase
          .from("categories")
          .select("id")
          .ilike("name", `%${sanitizedQ}%`),
      ]);

      if (tagMatches.data && tagMatches.data.length > 0) {
        const tagIds = tagMatches.data.map((t) => t.id);
        const { data: tagLinks } = await supabase
          .from("experience_tags")
          .select("experience_id")
          .in("tag_id", tagIds);

        qTagExpIds = Array.from(new Set(tagLinks?.map((tl) => tl.experience_id) ?? []));
      }

      if (catMatches.data && catMatches.data.length > 0) {
        qCategoryIds = catMatches.data.map((c) => c.id);
      }
    }
  }

  // 8. Handle Recently Updated Sort vs Latest Sort
  let sortedCandidateIds: string[] | null = null;
  if (sort === "recently_updated") {
    let outcomeQuery = supabase
      .from("outcomes")
      .select("experience_id, created_at")
      .order("created_at", { ascending: false });

    if (combinedFilteredIds !== null) {
      outcomeQuery = outcomeQuery.in("experience_id", combinedFilteredIds);
    }

    const { data: recentOutcomes } = await outcomeQuery;
    const seen = new Set<string>();
    const orderedIds: string[] = [];
    for (const row of recentOutcomes ?? []) {
      if (!seen.has(row.experience_id)) {
        seen.add(row.experience_id);
        orderedIds.push(row.experience_id);
      }
    }

    if (orderedIds.length === 0) {
      sortedCandidateIds = null;
    } else {
      sortedCandidateIds = orderedIds;
      combinedFilteredIds = orderedIds;
    }
  }

  // 9. Query active experiences
  let experiences: ExperienceItem[] = [];
  let totalItems = 0;

  const isFilterEmpty =
    (selectedTag && tagFilteredIds?.length === 0) ||
    (journey !== "all" && journeyFilteredIds?.length === 0) ||
    (sort === "recently_updated" && sortedCandidateIds !== null && sortedCandidateIds.length === 0) ||
    (combinedFilteredIds !== null && combinedFilteredIds.length === 0);

  if (!isFilterEmpty) {
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
          id,
          days_after,
          content,
          created_at
        ),
        comments (
          id
        )
      `,
        { count: "exact" }
      )
      .eq("status", "active")
      .is("deleted_at", null);

    if (categoryId) {
      dbQuery = dbQuery.eq("category_id", categoryId);
    }

    if (combinedFilteredIds !== null && combinedFilteredIds.length > 0) {
      dbQuery = dbQuery.in("id", combinedFilteredIds);
    }

    if (q) {
      const sanitizedQ = q.replace(/[,()]/g, " ").trim();
      if (sanitizedQ) {
        const orParts = [
          `title.ilike.%${sanitizedQ}%`,
          `story.ilike.%${sanitizedQ}%`,
        ];

        if (qCategoryIds.length > 0) {
          orParts.push(`category_id.in.(${qCategoryIds.join(",")})`);
        }
        if (qTagExpIds.length > 0) {
          orParts.push(`id.in.(${qTagExpIds.join(",")})`);
        }

        dbQuery = dbQuery.or(orParts.join(","));
      }
    }

    if (sort === "latest") {
      dbQuery = dbQuery.order("created_at", { ascending: false });
    }

    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: rows, count } = await dbQuery;
    totalItems = count ?? 0;

    let orderedRows = rows ?? [];
    if (sort === "recently_updated" && sortedCandidateIds) {
      const orderMap = new Map(sortedCandidateIds.map((id, index) => [id, index]));
      orderedRows = [...orderedRows].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 999999;
        const orderB = orderMap.get(b.id) ?? 999999;
        return orderA - orderB;
      });
    }

    // Fetch user bookmarks
    let userBookmarksSet = new Set<string>();
    if (user && orderedRows && orderedRows.length > 0) {
      const expIds = orderedRows.map((e) => e.id);
      const { data: userBookmarks } = await supabase
        .from("bookmarks")
        .select("experience_id")
        .eq("user_id", user.id)
        .in("experience_id", expIds);

      if (userBookmarks) {
        userBookmarksSet = new Set(userBookmarks.map((b) => b.experience_id));
      }
    }

    // Format experiences with Journey Snapshot metadata
    experiences = orderedRows.map((exp) => {
      const storyPreview =
        exp.story.length > 200 ? `${exp.story.slice(0, 200).trim()}...` : exp.story;

      const tags = (exp.experience_tags ?? [])
        .map((et) => et.tag?.name)
        .filter((t): t is string => Boolean(t));

      const authorData = exp.author;
      const categoryData = exp.category;
      const outcomesList = exp.outcomes ?? [];
      const commentsList = exp.comments ?? [];

      const journeyMeta = calculateJourneyMeta(outcomesList, exp.created_at, exp.story);

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
        journey: journeyMeta,
        comments_count: commentsList.length,
        is_bookmarked: userBookmarksSet.has(exp.id),
        created_at: exp.created_at,
      };
    });
  }

  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* 1. Minimalist Botanical Philosophy Hero */}
      <BotanicalHero />

      {/* 2. Longitudinal Journey Framework Guide (Dismissible) */}
      <ProgressionBanner />

      {/* 3. Feed Controls & Categorical Sorting */}
      <section id="explore" className="flex flex-col gap-3.5 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Feed Tabs */}
          <FeedTabs />

          {/* Interactive URL-driven Search Bar */}
          <FeedSearchBar />
        </div>

        {/* Domain Filters Row */}
        <div className="space-y-2">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
          />
        </div>

        {/* Active Filter Indicators Row (Search & Tag) */}
        {(q || selectedTag) && (
          <div className="flex flex-wrap items-center gap-2">
            {q && (
              <div className="inline-flex items-center gap-2 rounded-lg glass-card px-3 py-1.5 text-xs text-[#F1F5F9]">
                <Search className="h-3 w-3 text-[#4DA3FF]" />
                <span>
                  Search: <strong className="text-[#4DA3FF]">&quot;{q}&quot;</strong>
                </span>
                <Link
                  href={(() => {
                    const p = new URLSearchParams();
                    if (selectedCategory) p.set("category", selectedCategory);
                    if (selectedTag) p.set("tag", selectedTag);
                    if (searchParams.sort) p.set("sort", searchParams.sort);
                    if (searchParams.journey) p.set("journey", searchParams.journey);
                    const qs = p.toString();
                    return qs ? `/?${qs}` : "/";
                  })()}
                  className="text-[#64748B] hover:text-[#F1F5F9] transition-colors p-0.5"
                  title="Clear search keyword"
                  aria-label="Clear search keyword"
                >
                  <X className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {selectedTag && (
              <div className="inline-flex items-center gap-2 rounded-lg glass-card px-3 py-1.5 text-xs text-[#F1F5F9]">
                <span>
                  Filtering by tag: <strong className="text-[#4DA3FF]">#{selectedTag}</strong>
                </span>
                <Link
                  href={(() => {
                    const p = new URLSearchParams();
                    if (q) p.set("q", q);
                    if (selectedCategory) p.set("category", selectedCategory);
                    if (searchParams.sort) p.set("sort", searchParams.sort);
                    if (searchParams.journey) p.set("journey", searchParams.journey);
                    const qs = p.toString();
                    return qs ? `/?${qs}` : "/";
                  })()}
                  className="text-[#64748B] hover:text-[#F1F5F9] transition-colors p-0.5"
                  title="Remove tag filter"
                  aria-label="Remove tag filter"
                >
                  <X className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Longitudinal Journey Feed Stream */}
      <section className="flex flex-col gap-4">
        {experiences.length > 0 ? (
          experiences.map((exp) => (
            <ExperienceCard key={exp.id} experience={exp} />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 p-8 sm:p-12 text-center space-y-3 glass-card">
            {q ? (
              <Search className="mx-auto h-8 w-8 text-[#4DA3FF]" />
            ) : (
              <Milestone className="mx-auto h-8 w-8 text-[#64748B]" />
            )}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#F1F5F9]">
                {q ? `No journeys found for "${q}"` : "No journeys found"}
              </h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto leading-relaxed">
                {q
                  ? "No documented journeys or baseline dilemmas match your keyword search. Try searching for different terms or clearing active filters."
                  : selectedCategory || selectedTag || journey !== "all"
                  ? "No documented journeys match your selected criteria. Try adjusting your filters or be the first to share in this category."
                  : "No journeys have been shared yet. Be the first to document a real dilemma and track outcomes."}
              </p>
            </div>

            {q ? (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button asChild size="sm" variant="outline" className="text-xs border-white/10 bg-white/[0.03] text-[#F1F5F9] hover:bg-white/[0.08]">
                  <Link
                    href={(() => {
                      const p = new URLSearchParams();
                      if (selectedCategory) p.set("category", selectedCategory);
                      if (selectedTag) p.set("tag", selectedTag);
                      if (searchParams.sort) p.set("sort", searchParams.sort);
                      if (searchParams.journey) p.set("journey", searchParams.journey);
                      const qs = p.toString();
                      return qs ? `/?${qs}` : "/";
                    })()}
                  >
                    Clear Search
                  </Link>
                </Button>
                <Button asChild size="sm" className="text-xs bg-[#4DA3FF] text-black hover:bg-[#60A5FA] font-semibold shadow-sm">
                  <Link href="/experiences/new">
                    <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
                    Start New Journey
                  </Link>
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="text-xs mt-2 bg-[#4DA3FF] text-black hover:bg-[#60A5FA] font-semibold shadow-sm">
                <Link href="/experiences/new">
                  <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
                  Start a Journey
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* 5. Stream Pagination & Footnote Strip */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-4 rounded-xl glass-card">
          <div className="text-xs text-[#64748B]">
            Showing {experiences.length} of {totalItems} journeys
          </div>

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
          />
        </section>
      </section>
    </div>
  );
}
