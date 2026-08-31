"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  experienceId: string;
  initialBookmarked?: boolean;
  className?: string;
  showText?: boolean;
}

export function BookmarkButton({
  experienceId,
  initialBookmarked = false,
  className,
  showText = false,
}: BookmarkButtonProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    // Optimistic update
    const previousState = bookmarked;
    setBookmarked(!previousState);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ experience_id: experienceId }),
      });

      if (res.status === 401) {
        // Redirect to login if unauthenticated
        setBookmarked(previousState);
        router.push(`/login?next=/experiences/${experienceId}`);
        return;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        setBookmarked(previousState);
      } else {
        setBookmarked(json.data.bookmarked);
      }
    } catch {
      setBookmarked(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      title={bookmarked ? "Remove Bookmark" : "Save Experience"}
      aria-label={bookmarked ? "Remove Bookmark" : "Save Experience"}
      className={cn(
        "inline-flex items-center space-x-1 rounded-md p-1.5 text-xs font-medium transition-colors hover:bg-surface-elevated text-muted-foreground hover:text-foreground",
        bookmarked && "text-primary hover:text-primary fill-primary",
        className
      )}
    >
      <Bookmark
        className={cn(
          "h-4 w-4 transition-transform active:scale-90",
          bookmarked && "fill-primary text-primary"
        )}
      />
      {showText && <span>{bookmarked ? "Saved" : "Save"}</span>}
    </button>
  );
}
