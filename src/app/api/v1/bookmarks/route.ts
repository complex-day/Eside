import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bookmarkSchema } from "@/lib/validations/experience";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/bookmarks
 * Toggles bookmark status for an experience for the authenticated user.
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
            message: "Authentication required to bookmark an experience.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Validate request
    const body = await request.json();
    const parsed = bookmarkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.errors[0]?.message ?? "Invalid bookmark request data.",
          },
        },
        { status: 400 }
      );
    }

    const { experience_id } = parsed.data;

    // 3. Check if bookmark currently exists
    const { data: existingBookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("experience_id", experience_id)
      .maybeSingle();

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("experience_id", experience_id);

      if (deleteError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SERVER_ERROR",
              message: "Failed to remove bookmark.",
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          experience_id,
          bookmarked: false,
        },
      });
    } else {
      // Add bookmark
      const { error: insertError } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        experience_id,
      });

      if (insertError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SERVER_ERROR",
              message: "Failed to add bookmark.",
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          experience_id,
          bookmarked: true,
        },
      });
    }
  } catch (error) {
    console.error("POST /api/v1/bookmarks unhandled error:", error);
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
