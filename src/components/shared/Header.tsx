"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { EsideLogo } from "@/components/shared/EsideLogo";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Plus } from "lucide-react";

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
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#050505]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <EsideLogo size={28} className="transition-transform group-hover:scale-105" />
            <span className="font-sans text-lg font-bold tracking-tight text-[#F1F5F9]">
              Eside
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            <Link
              href="/"
              className="text-[#F1F5F9] hover:text-[#4DA3FF] transition-colors"
            >
              Journeys
            </Link>
            <Link
              href="/?sort=recently_updated"
              className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            >
              Recently Updated
            </Link>
          </nav>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Post Journey CTA */}
              <Link href="/experiences/new">
                <Button
                  size="sm"
                  className="h-8 text-xs font-semibold px-3 rounded-lg bg-[#4DA3FF] text-black hover:bg-[#60A5FA] shadow-sm border-0 transition-all flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Start Journey</span>
                </Button>
              </Link>

              {/* User Identity */}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full py-1 px-1.5 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-[#F1F5F9] leading-tight group-hover:text-[#4DA3FF]">
                    @{user.username || "profile"}
                  </span>
                </div>
                <UserAvatar username={user.username} size="sm" />
              </Link>

              {/* Log out */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-[#94A3B8] hover:text-rose-400 hover:bg-white/[0.04]"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9]">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="h-8 text-xs font-semibold px-3.5 bg-[#4DA3FF] text-black hover:bg-[#60A5FA] shadow-sm rounded-lg"
                >
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
