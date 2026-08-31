import { NextResponse, type NextRequest } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid credentials format",
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: authError?.message ?? "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    // Fetch profile username
    const { data: profile } = await supabase
      .from("users")
      .select("username, avatar_url, bio")
      .eq("id", authData.user.id)
      .maybeSingle();

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            username: profile?.username || authData.user.user_metadata?.["username"] || "anonymous",
            avatar_url: profile?.avatar_url,
            bio: profile?.bio,
          },
          session: authData.session,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "An unexpected error occurred during sign in.",
        },
      },
      { status: 500 }
    );
  }
}
