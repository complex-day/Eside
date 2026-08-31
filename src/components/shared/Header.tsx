"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User as UserIcon, Loader2 } from "lucide-react";

interface HeaderProps {
  user?: {
    id: string;
    email?: string;
    username?: string;
    avatar_url?: string | null;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      // Force refresh on error
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-white shadow-md shadow-primary/25">
            E
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-base font-bold tracking-tight text-foreground">
              Eside
            </span>
            <span className="hidden text-[10px] font-medium text-muted-foreground sm:inline-block">
              Learn from real outcomes
            </span>
          </div>
        </Link>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-2.5">
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/profile"
                className="flex items-center space-x-2 rounded-full p-1 pr-2.5 hover:bg-slate-800/60 transition-colors"
              >
                <UserAvatar username={user.username} size="sm" />
                <span className="hidden text-xs font-semibold text-foreground sm:inline-block">
                  @{user.username || "anonymous"}
                </span>
              </Link>

              <Link href="/profile">
                <Button variant="outline" size="sm" className="h-8 text-xs px-2.5">
                  <UserIcon className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2 text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Log out"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="default" size="sm" className="h-8 text-xs font-semibold">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
