import { Suspense } from "react";
import { Header } from "@/components/shared/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sessionUser = null;

  if (user) {
    // Try to load canonical profile from public.users
    const { data: profile } = await supabase
      .from("users")
      .select("id, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const fallbackUsername =
      typeof metadata?.["username"] === "string" ? metadata["username"] : "anonymous";

    sessionUser = {
      id: user.id,
      email: user.email,
      username: profile?.username || fallbackUsername,
      avatar_url: profile?.avatar_url,
    };
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header user={sessionUser} />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-8">
        {children}
      </main>
      <Suspense fallback={null}>
        <BottomNav user={sessionUser} />
      </Suspense>
    </div>
  );
}

