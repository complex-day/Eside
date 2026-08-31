import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateCommentSchema } from "@/lib/validations/comment";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PUT /api/v1/comments/[id]
 * Updates an owned comment.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid comment ID format.",
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
            message: "Authentication required to edit a comment.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Fetch existing comment to verify ownership
    const { data: existingComment, error: fetchError } = await supabase
      .from("comments")
      .select("id, author_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existingComment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Comment not found.",
          },
        },
        { status: 404 }
      );
    }

    if (existingComment.author_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to edit this comment.",
          },
        },
        { status: 403 }
      );
    }

    // 3. Validate body
    const body = await request.json();
    const parsed = updateCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.errors[0]?.message ?? "Invalid comment update content.",
          },
        },
        { status: 400 }
      );
    }

    const { content } = parsed.data;
    const now = new Date().toISOString();

    // 4. Update comment
    const { data: updatedComment, error: updateError } = await supabase
      .from("comments")
      .update({
        content,
        updated_at: now,
      })
      .eq("id", id)
      .select("id, content, updated_at")
      .single();

    if (updateError || !updatedComment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to update comment.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    console.error("PUT /api/v1/comments/[id] unhandled error:", error);
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
 * DELETE /api/v1/comments/[id]
 * Deletes an owned comment.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid comment ID format.",
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
            message: "Authentication required to delete a comment.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Fetch existing comment to verify ownership
    const { data: existingComment, error: fetchError } = await supabase
      .from("comments")
      .select("id, author_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existingComment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Comment not found.",
          },
        },
        { status: 404 }
      );
    }

    if (existingComment.author_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to delete this comment.",
          },
        },
        { status: 403 }
      );
    }

    // 3. Delete comment
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to delete comment.",
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
      },
    });
  } catch (error) {
    console.error("DELETE /api/v1/comments/[id] unhandled error:", error);
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
