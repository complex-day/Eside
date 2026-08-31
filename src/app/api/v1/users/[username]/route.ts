import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    if (!username) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Username parameter is required.",
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: userProfile, error } = await supabase
      .from("users")
      .select("id, username, avatar_url, bio, created_at")
      .ilike("username", username)
      .maybeSingle();

    if (error || !userProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User profile not found.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: userProfile,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to load user profile.",
        },
      },
      { status: 500 }
    );
  }
}
