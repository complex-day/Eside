import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOutcomeSchema } from "@/lib/validations/outcome";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
    outcomeId: string;
  };
}

/**
 * PUT /api/v1/experiences/[id]/outcomes/[outcomeId]
 * Updates an outcome milestone by the experience author.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, outcomeId } = params;

    // Validate UUIDs
    const isUuidExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isUuidOutcome = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(outcomeId);

    if (!isUuidExp || !isUuidOutcome) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid ID format.",
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
            message: "Authentication required.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Fetch experience to verify ownership
    const { data: experience, error: expError } = await supabase
      .from("experiences")
      .select("id, author_id, deleted_at")
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

    if (experience.author_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to edit this milestone.",
          },
        },
        { status: 403 }
      );
    }

    if (experience.deleted_at !== null) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Cannot edit milestones on an archived experience.",
          },
        },
        { status: 400 }
      );
    }

    // 3. Validate request payload
    const body = await request.json();
    const parsed = createOutcomeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.errors[0]?.message ?? "Invalid outcome data.",
          },
        },
        { status: 400 }
      );
    }

    const { content, days_after } = parsed.data;

    const updates: {
      content: string;
      days_after?: number;
    } = {
      content,
    };

    if (typeof days_after === "number") {
      updates.days_after = days_after;
    }

    // 4. Update the outcome record
    const { data: updatedOutcome, error: updateError } = await supabase
      .from("outcomes")
      .update(updates)
      .eq("id", outcomeId)
      .eq("experience_id", id)
      .select("id, experience_id, days_after, content, created_at")
      .single();

    if (updateError || !updatedOutcome) {
      console.error("PUT outcome error:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to update outcome milestone.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedOutcome,
    });
  } catch (error) {
    console.error("PUT /api/v1/experiences/[id]/outcomes/[outcomeId] unhandled error:", error);
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
 * DELETE /api/v1/experiences/[id]/outcomes/[outcomeId]
 * Deletes an outcome milestone by the experience author.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id, outcomeId } = params;

    const isUuidExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isUuidOutcome = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(outcomeId);

    if (!isUuidExp || !isUuidOutcome) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid ID format.",
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
            message: "Authentication required.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Fetch experience to verify ownership
    const { data: experience, error: expError } = await supabase
      .from("experiences")
      .select("id, author_id")
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

    if (experience.author_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to delete this milestone.",
          },
        },
        { status: 403 }
      );
    }

    // 3. Delete the outcome record
    const { error: deleteError } = await supabase
      .from("outcomes")
      .delete()
      .eq("id", outcomeId)
      .eq("experience_id", id);

    if (deleteError) {
      console.error("DELETE outcome error:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to delete outcome milestone.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: outcomeId,
        deleted: true,
      },
    });
  } catch (error) {
    console.error("DELETE /api/v1/experiences/[id]/outcomes/[outcomeId] unhandled error:", error);
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
