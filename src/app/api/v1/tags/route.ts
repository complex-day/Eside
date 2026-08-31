import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tags?q=searchterm
 * Returns tags matching search query, ordered alphabetically by name.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase();

    const supabase = await createClient();

    let dbQuery = supabase.from("tags").select("id, name, created_at").limit(20);

    if (query) {
      dbQuery = dbQuery.ilike("name", `%${query}%`);
    } else {
      dbQuery = dbQuery.order("name", { ascending: true });
    }

    const { data: tags, error } = await dbQuery;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to fetch tags.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tags ?? [],
    });
  } catch (error) {
    console.error("GET /api/v1/tags unhandled error:", error);
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
