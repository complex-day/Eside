import { NextResponse, type NextRequest } from "next/server";
import { profileUpdateSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
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
            message: "Authentication required to view profile.",
          },
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, username, avatar_url, bio, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      // Auto-provision profile record if missing
      const fallbackUsername =
        user.user_metadata?.["username"] || `user_${user.id.substring(0, 8)}`;
      const { data: newProfile } = await supabase
        .from("users")
        .upsert(
          {
            id: user.id,
            username: fallbackUsername,
            bio: user.user_metadata?.["bio"] || null,
          },
          { onConflict: "id" }
        )
        .select("id, username, avatar_url, bio, created_at, updated_at")
        .single();

      return NextResponse.json(
        {
          success: true,
          data: newProfile || {
            id: user.id,
            username: fallbackUsername,
            avatar_url: null,
            bio: null,
            created_at: user.created_at,
            updated_at: user.created_at,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: profile,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to load profile.",
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
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
            message: "Authentication required to update profile.",
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        },
        { status: 400 }
      );
    }

    const { username, bio, avatar_url } = parsed.data;

    // Check if new username collides with an existing one
    if (username) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .ilike("username", username)
        .neq("id", user.id)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "Username is already taken by another user.",
            },
          },
          { status: 409 }
        );
      }
    }

    const updates: {
      username?: string;
      bio?: string | null;
      avatar_url?: string | null;
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const { data: updatedProfile, error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("id, username, avatar_url, bio, created_at, updated_at")
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: updateError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedProfile,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to update profile.",
        },
      },
      { status: 500 }
    );
  }
}
