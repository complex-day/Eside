import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/categories
 * Returns all platform categories ordered by name.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name, description, created_at")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to fetch categories.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: categories ?? [],
    });
  } catch (error) {
    console.error("GET /api/v1/categories unhandled error:", error);
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
