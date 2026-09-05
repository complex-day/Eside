import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOutcomeSchema } from "@/lib/validations/outcome";
import { calculateCalendarDaysDifference } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/v1/experiences/[id]/outcomes
 * Returns all chronological outcome milestones for an experience.
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

    // Check optional authenticated user for access to private/draft experiences
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch parent experience to verify visibility
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

    const isAuthor = user?.id === experience.author_id;

    if (experience.deleted_at !== null && !isAuthor) {
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

    if (experience.status !== "active" && !isAuthor) {
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

    // Fetch outcomes ordered by days_after ASC, then created_at ASC
    const { data: outcomes, error: outcomesError } = await supabase
      .from("outcomes")
      .select("id, experience_id, days_after, content, created_at")
      .eq("experience_id", id)
      .order("days_after", { ascending: true })
      .order("created_at", { ascending: true });

    if (outcomesError) {
      console.error("GET /api/v1/experiences/[id]/outcomes error:", outcomesError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to fetch outcome timeline.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: outcomes ?? [],
    });
  } catch (error) {
    console.error("GET /api/v1/experiences/[id]/outcomes unhandled error:", error);
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
 * POST /api/v1/experiences/[id]/outcomes
 * Appends a new outcome milestone to an owned experience.
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
            message: "Authentication required to log an outcome milestone.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Fetch experience to verify ownership & active status
    const { data: experience, error: expError } = await supabase
      .from("experiences")
      .select("id, author_id, status, deleted_at, created_at")
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
            message: "Only the author of this experience can post journey updates.",
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
            message: "Cannot add journey updates to an archived experience.",
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
            message: parsed.error.errors[0]?.message ?? "Invalid journey update data.",
          },
        },
        { status: 400 }
      );
    }

    const { days_after, content } = parsed.data;

    // Auto-calculate elapsed calendar days from story creation date if not explicitly specified
    let computedDaysAfter = days_after;
    if (computedDaysAfter === undefined || computedDaysAfter === null) {
      computedDaysAfter = calculateCalendarDaysDifference(experience.created_at);
    }

    // 4. Insert journey outcome update
    const { data: newOutcome, error: insertError } = await supabase
      .from("outcomes")
      .insert({
        experience_id: id,
        days_after: computedDaysAfter,
        content,
      })
      .select("id, experience_id, days_after, content, created_at")
      .single();

    if (insertError || !newOutcome) {
      console.error("Outcome insertion error:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to record journey update.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newOutcome,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/v1/experiences/[id]/outcomes unhandled error:", error);
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
