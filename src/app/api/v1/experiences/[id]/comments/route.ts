import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCommentSchema } from "@/lib/validations/comment";
import { checkCommentRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/v1/experiences/[id]/comments
 * Returns all active comments on an experience ordered chronologically.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid experience ID format.",
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Verify parent experience visibility
    const { data: experience, error: expError } = await supabase
      .from("experiences")
      .select("id, author_id, status, deleted_at")
      .eq("id", id)
      .maybeSingle();

    if (expError || !experience) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Experience not found.",
          },
        },
        { status: 404 }
      );
    }

    const isStoryAuthor = user?.id === experience.author_id;

    if (experience.deleted_at !== null && !isStoryAuthor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Experience not found.",
          },
        },
        { status: 404 }
      );
    }

    if (experience.status !== "active" && !isStoryAuthor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Experience not found.",
          },
        },
        { status: 404 }
      );
    }

    // Fetch active comments (excluding soft-deleted)
    const { data: comments, count, error: commentsError } = await supabase
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
      `,
        { count: "exact" }
      )
      .eq("experience_id", id)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("GET /api/v1/experiences/[id]/comments error:", commentsError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to fetch comments.",
          },
        },
        { status: 500 }
      );
    }

    const items = (comments ?? []).map((c) => {
      const author = c.author;
      return {
        id: c.id,
        experience_id: c.experience_id,
        content: c.content,
        author: {
          id: author?.id ?? "",
          username: author?.username ?? "Anonymous",
          avatar_url: author?.avatar_url ?? null,
        },
        is_author: user?.id === author?.id,
        is_story_author: experience.author_id === author?.id,
        created_at: c.created_at,
        updated_at: c.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        total: count ?? items.length,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/experiences/[id]/comments unhandled error:", error);
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
 * POST /api/v1/experiences/[id]/comments
 * Posts a new constructive comment on an active experience.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid experience ID format.",
          },
        },
        { status: 400 }
      );
    }

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
            message: "Authentication required to post a comment.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Enforce sliding-window rate limit (20 comments/hour)
    const rateLimit = await checkCommentRateLimit(user.id, 20, 1);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Comment rate limit exceeded. You can post at most 20 comments per hour.",
          },
        },
        { status: 429 }
      );
    }

    // 3. Verify experience is active and not deleted
    const { data: experience, error: expError } = await supabase
      .from("experiences")
      .select("id, status, deleted_at, author_id")
      .eq("id", id)
      .maybeSingle();

    if (expError || !experience) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Experience not found.",
          },
        },
        { status: 404 }
      );
    }

    if (experience.deleted_at !== null || experience.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Cannot comment on an inactive or archived experience.",
          },
        },
        { status: 400 }
      );
    }

    // 4. Validate comment body
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.errors[0]?.message ?? "Invalid comment content.",
          },
        },
        { status: 400 }
      );
    }

    const { content } = parsed.data;

    // 5. Insert comment
    const { data: newComment, error: insertError } = await supabase
      .from("comments")
      .insert({
        experience_id: id,
        author_id: user.id,
        content,
      })
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
      .single();

    if (insertError || !newComment) {
      console.error("Comment insertion error:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to post comment.",
          },
        },
        { status: 500 }
      );
    }

    const author = newComment.author;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newComment.id,
          experience_id: newComment.experience_id,
          content: newComment.content,
          author: {
            id: author?.id ?? user.id,
            username: author?.username ?? "Anonymous",
            avatar_url: author?.avatar_url ?? null,
          },
          is_author: true,
          is_story_author: experience.author_id === user.id,
          created_at: newComment.created_at,
          updated_at: newComment.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/v1/experiences/[id]/comments unhandled error:", error);
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
