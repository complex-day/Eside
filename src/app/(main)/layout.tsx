import { Header } from "@/components/shared/Header";
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

  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const rawUsername = metadata?.["username"];
  const username = typeof rawUsername === "string" ? rawUsername : undefined;

  const sessionUser = user
    ? {
        email: user.email,
        username,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header user={sessionUser} />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 sm:pb-8">
        {children}
      </main>
    </div>
  );
}
