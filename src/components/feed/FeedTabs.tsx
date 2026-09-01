"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, Flame } from "lucide-react";

export function FeedTabs() {
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "latest";

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "latest") {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    // Reset page to 1 on tab switch
    params.delete("page");
    const str = params.toString();
    return str ? `/?${str}` : "/";
  };

  const isLatest = currentSort === "latest";
  const isRecentlyUpdated = currentSort === "recently_updated";

  return (
    <div className="flex items-center space-x-2 border-b border-border/60 pb-2">
      <Link
        href={createQueryString("sort", "latest")}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          isLatest
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
        }`}
      >
        <Clock className="h-3.5 w-3.5" />
        <span>Latest Stories</span>
      </Link>

      <Link
        href={createQueryString("sort", "recently_updated")}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          isRecentlyUpdated
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
        }`}
      >
        <Flame className="h-3.5 w-3.5 text-amber-400" />
        <span>Recently Updated Journeys</span>
      </Link>
    </div>
  );
}
