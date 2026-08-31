import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createExperienceSchema,
  feedQuerySchema,
  normalizeTag,
} from "@/lib/validations/experience";
import { checkExperienceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/experiences
 * Returns a paginated list of active experiences for the public feed.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = feedQuerySchema.safeParse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 10,
      category: searchParams.get("category") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      sort: searchParams.get("sort") ?? "latest",
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsedQuery.error.errors[0]?.message ?? "Invalid query parameters.",
          },
        },
        { status: 400 }
      );
    }

    const { page, limit, category, tag } = parsedQuery.data;
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // Check optional authenticated user for bookmark status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Resolve category filter if provided
    let categoryId: string | null = null;
    if (category) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        categoryId = category;
      } else {
        const { data: catRecord } = await supabase
          .from("categories")
          .select("id")
          .ilike("name", category)
          .maybeSingle();

        if (catRecord) {
          categoryId = catRecord.id;
        } else {
          // Non-existent category returns empty items list
          return NextResponse.json({
            success: true,
            data: {
              items: [],
              pagination: { page, limit, total: 0, total_pages: 0 },
            },
          });
        }
      }
    }

    // 2. Resolve tag filter if provided
    let filteredExperienceIds: string[] | null = null;
    if (tag) {
      const normalizedTagName = normalizeTag(tag);
      const { data: tagRecord } = await supabase
        .from("tags")
        .select("id")
        .ilike("name", normalizedTagName)
        .maybeSingle();

      if (tagRecord) {
        const { data: tagLinks } = await supabase
          .from("experience_tags")
          .select("experience_id")
          .eq("tag_id", tagRecord.id);

        filteredExperienceIds = tagLinks?.map((tl) => tl.experience_id) ?? [];
        if (filteredExperienceIds.length === 0) {
          return NextResponse.json({
            success: true,
            data: {
              items: [],
              pagination: { page, limit, total: 0, total_pages: 0 },
            },
          });
        }
      } else {
        return NextResponse.json({
          success: true,
          data: {
            items: [],
            pagination: { page, limit, total: 0, total_pages: 0 },
          },
        });
      }
    }

    // 3. Build main experiences query
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

    const { data: experiences, count, error } = await dbQuery;

    if (error) {
      console.error("GET /api/v1/experiences query error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to fetch experiences feed.",
          },
        },
        { status: 500 }
      );
    }

    // 4. Fetch user bookmarks if authenticated to populate is_bookmarked
    let userBookmarksSet = new Set<string>();
    if (user && experiences && experiences.length > 0) {
      const expIds = experiences.map((e) => e.id);
      const { data: userBookmarks } = await supabase
        .from("bookmarks")
        .select("experience_id")
        .eq("user_id", user.id)
        .in("experience_id", expIds);

      if (userBookmarks) {
        userBookmarksSet = new Set(userBookmarks.map((b) => b.experience_id));
      }
    }

    const total = count ?? 0;
    const total_pages = Math.ceil(total / limit);

    // 5. Format items
    const items = (experiences ?? []).map((exp) => {
      const storyPreview =
        exp.story.length > 200 ? `${exp.story.slice(0, 200).trim()}...` : exp.story;

      // Flatten tags
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

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          total_pages,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/v1/experiences unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error.",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/experiences
 * Creates a new lived experience entry.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to share an experience.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Enforce database sliding-window rate limit (10 posts/hr)
    const rateLimit = await checkExperienceRateLimit(user.id, 10, 1);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Submission rate limit exceeded. You can post at most 10 experiences per hour.",
          },
        },
        { status: 429 }
      );
    }

    // 3. Validate request payload
    const body = await request.json();
    const parsed = createExperienceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.errors[0]?.message ?? "Invalid experience submission data.",
          },
        },
        { status: 400 }
      );
    }

    const { title, story, category_id, tags: rawTags, status } = parsed.data;

    // 4. Verify category existence
    const { data: categoryRecord, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", category_id)
      .maybeSingle();

    if (categoryError || !categoryRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "The selected category does not exist.",
          },
        },
        { status: 400 }
      );
    }

    // 5. Insert experience record
    const { data: newExperience, error: insertError } = await supabase
      .from("experiences")
      .insert({
        title,
        story,
        category_id,
        author_id: user.id,
        status,
        is_anonymous: true,
      })
      .select("id, title, status, created_at")
      .single();

    if (insertError || !newExperience) {
      console.error("Experience insertion error:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to create experience record.",
          },
        },
        { status: 500 }
      );
    }

    // 6. Normalize and link tags (max 5)
    const normalizedTags = Array.from(
      new Set(
        (rawTags ?? [])
          .map(normalizeTag)
          .filter((t) => t.length >= 2 && t.length <= 30)
      )
    ).slice(0, 5);

    if (normalizedTags.length > 0) {
      for (const tagName of normalizedTags) {
        // Upsert tag on name
        const { data: tagRecord } = await supabase
          .from("tags")
          .upsert({ name: tagName }, { onConflict: "name" })
          .select("id")
          .single();

        if (tagRecord) {
          // Link tag in experience_tags
          await supabase.from("experience_tags").insert({
            experience_id: newExperience.id,
            tag_id: tagRecord.id,
          });
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newExperience.id,
          title: newExperience.title,
          status: newExperience.status,
          created_at: newExperience.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/v1/experiences unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error.",
        },
      },
      { status: 500 }
    );
  }
}
