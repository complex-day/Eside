import { NextResponse, type NextRequest } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

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

    const { email, password, username, bio } = parsed.data;
    const supabase = await createClient();
    const origin = request.nextUrl.origin;

    // Check if username already exists in public.users (case-insensitive)
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .ilike("username", username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Username is already taken. Please choose another handle.",
          },
        },
        { status: 409 }
      );
    }

    // Register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          bio: bio || null,
        },
        emailRedirectTo: `${origin}/api/v1/auth/callback`,
      },
    });

    if (authError) {
      // Catch Supabase specific errors
      const isConflict =
        authError.status === 422 ||
        authError.message.toLowerCase().includes("already registered");

      return NextResponse.json(
        {
          success: false,
          error: {
            code: isConflict ? "CONFLICT" : "VALIDATION_ERROR",
            message: authError.message,
          },
        },
        { status: isConflict ? 409 : 400 }
      );
    }

    // Profile auto-provision fallback: if trigger didn't run or in dev mode
    if (authData.user) {
      await supabase
        .from("users")
        .upsert(
          {
            id: authData.user.id,
            username,
            bio: bio || null,
          },
          { onConflict: "id" }
        );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: authData.user?.id,
            email: authData.user?.email,
            username,
          },
          session: authData.session,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "An unexpected error occurred during registration.",
        },
      },
      { status: 500 }
    );
  }
}
