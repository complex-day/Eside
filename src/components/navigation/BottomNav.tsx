"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Compass, Flame, Plus, Bookmark, User } from "lucide-react";
import { CreateActionSheet } from "@/components/navigation/CreateActionSheet";

export function BottomNav() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isFeed = pathname === "/" || pathname === "/feed";
  const isTopJourneys = pathname.includes("sort=recently_updated");
  const isProfile = pathname === "/profile" || pathname.startsWith("/u/");
  const isBookmarks = pathname === "/profile" && pathname.includes("tab=bookmarks");

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Hidden on desktop md+) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#050505]/90 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {/* Feed */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
              isFeed && !isTopJourneys
                ? "text-[#4DA3FF] font-semibold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Compass className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-0.5">Journeys</span>
          </Link>

          {/* Active Journeys */}
          <Link
            href="/?journey=active"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
              pathname.includes("journey=active")
                ? "text-[#4DA3FF] font-semibold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Flame className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-0.5">Active 🌻</span>
          </Link>

          {/* Elevated Create / Action Center Trigger */}
          <div className="relative -top-3">
            <button
              onClick={() => setIsSheetOpen(true)}
              aria-label="Create new journey or log milestone"
              className="flex items-center justify-center h-12 w-12 rounded-full bg-[#4DA3FF] text-black shadow-[0_0_20px_rgba(77,163,255,0.4)] hover:bg-[#60A5FA] hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#4DA3FF] focus:ring-offset-2 focus:ring-offset-[#050505]"
            >
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Bookmarks */}
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
              isBookmarks
                ? "text-[#4DA3FF] font-semibold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Bookmark className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-0.5">Saved</span>
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
              isProfile && !isBookmarks
                ? "text-[#4DA3FF] font-semibold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-0.5">Journal</span>
          </Link>
        </div>
      </nav>

      {/* Slide-Up / Bottom Sheet Action Modal */}
      <CreateActionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </>
  );
}
