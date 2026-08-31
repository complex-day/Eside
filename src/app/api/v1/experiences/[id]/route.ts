import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  updateExperienceSchema,
  normalizeTag,
} from "@/lib/validations/experience";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/v1/experiences/[id]
 * Retrieves full experience details, author, category, tags, and outcomes count.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Validate UUID format
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

    // Check optional authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        ),
        comments (
          id
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !exp) {
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

    // Access control: if not active or deleted, only the author can view
    const isAuthor = user?.id === exp.author_id;
    if (exp.deleted_at !== null && !isAuthor) {
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

    if (exp.status !== "active" && !isAuthor) {
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

    // Check if bookmarked by current user
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

    // Flatten tags
    const tags = (exp.experience_tags ?? [])
      .map((et) => et.tag?.name)
      .filter((t): t is string => Boolean(t));

    const authorData = exp.author;
    const categoryData = exp.category;
    const outcomesList = exp.outcomes ?? [];
    const commentsList = exp.comments ?? [];

    return NextResponse.json({
      success: true,
      data: {
        id: exp.id,
        title: exp.title,
        story: exp.story,
        status: exp.status,
        is_anonymous: exp.is_anonymous,
        is_author: isAuthor,
        is_bookmarked: isBookmarked,
        author: {
          id: authorData?.id ?? "",
          username: authorData?.username ?? "Anonymous",
          avatar_url: authorData?.avatar_url ?? null,
          bio: authorData?.bio ?? null,
        },
        category: {
          id: categoryData?.id ?? "",
          name: categoryData?.name ?? "General",
          description: categoryData?.description ?? null,
        },
        tags,
        outcomes_count: outcomesList.length,
        comments_count: commentsList.length,
        created_at: exp.created_at,
        updated_at: exp.updated_at,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/experiences/[id] unhandled error:", error);
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
 * PUT /api/v1/experiences/[id]
 * Updates an owned experience.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
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
            message: "Authentication required to update an experience.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Fetch existing experience to verify ownership
    const { data: existingExp, error: fetchError } = await supabase
      .from("experiences")
      .select("id, author_id, deleted_at")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existingExp) {
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

    if (existingExp.author_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to edit this experience.",
          },
        },
        { status: 403 }
      );
    }

    if (existingExp.deleted_at !== null) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Cannot edit an archived or deleted experience.",
          },
        },
        { status: 400 }
      );
    }

    // 3. Validate request payload
    const body = await request.json();
    const parsed = updateExperienceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.errors[0]?.message ?? "Invalid update data.",
          },
        },
        { status: 400 }
      );
    }

    const { title, story, category_id, tags: rawTags, status } = parsed.data;

    // 4. Update experience record
    const updates: {
      title?: string;
      story?: string;
      category_id?: string;
      status?: "active" | "hidden";
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (story !== undefined) updates.story = story;
    if (category_id !== undefined) updates.category_id = category_id;
    if (status !== undefined) updates.status = status;

    const { data: updatedExp, error: updateError } = await supabase
      .from("experiences")
      .update(updates)
      .eq("id", id)
      .select("id, title, status, updated_at")
      .single();

    if (updateError || !updatedExp) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to update experience record.",
          },
        },
        { status: 500 }
      );
    }

    // 5. Update tags if provided
    if (rawTags !== undefined) {
      // Remove existing tag links
      await supabase.from("experience_tags").delete().eq("experience_id", id);

      const normalizedTags = Array.from(
        new Set(
          rawTags
            .map(normalizeTag)
            .filter((t) => t.length >= 2 && t.length <= 30)
        )
      ).slice(0, 5);

      for (const tagName of normalizedTags) {
        const { data: tagRecord } = await supabase
          .from("tags")
          .upsert({ name: tagName }, { onConflict: "name" })
          .select("id")
          .single();

        if (tagRecord) {
          await supabase.from("experience_tags").insert({
            experience_id: id,
            tag_id: tagRecord.id,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedExp.id,
        title: updatedExp.title,
        status: updatedExp.status,
        updated_at: updatedExp.updated_at,
      },
    });
  } catch (error) {
    console.error("PUT /api/v1/experiences/[id] unhandled error:", error);
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
 * DELETE /api/v1/experiences/[id]
 * Soft-deletes an owned experience.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
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
            message: "Authentication required.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Fetch existing experience to verify ownership
    const { data: existingExp, error: fetchError } = await supabase
      .from("experiences")
      .select("id, author_id, deleted_at")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existingExp) {
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

    if (existingExp.author_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to delete this experience.",
          },
        },
        { status: 403 }
      );
    }

    // 3. Soft-delete: update status to 'deleted' and set deleted_at
    const now = new Date().toISOString();
    const { error: deleteError } = await supabase
      .from("experiences")
      .update({
        status: "deleted",
        deleted_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to delete experience.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        deleted: true,
        deleted_at: now,
      },
    });
  } catch (error) {
    console.error("DELETE /api/v1/experiences/[id] unhandled error:", error);
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
