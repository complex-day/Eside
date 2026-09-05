"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function FeedTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "recently_updated";
  const [isPending, startTransition] = useTransition();
  const [optimisticSort, setOptimisticSort] = useState<string>(currentSort);

  useEffect(() => {
    setOptimisticSort(currentSort);
  }, [currentSort]);

  const handleTabClick = (sortValue: string) => {
    setOptimisticSort(sortValue);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (sortValue === "recently_updated") {
        params.delete("sort");
      } else {
        params.set("sort", sortValue);
      }
      params.delete("page");
      const str = params.toString();
      router.push(str ? `/?${str}` : "/");
    });
  };

  const isRecentlyUpdated = optimisticSort === "recently_updated";
  const isLatest = optimisticSort === "latest";

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl glass-card self-start">
      {/* 1. Recently Updated Journeys */}
      <button
        type="button"
        onClick={() => handleTabClick("recently_updated")}
        disabled={isPending && isRecentlyUpdated}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
          isRecentlyUpdated
            ? "bg-white/[0.08] text-[#F1F5F9] shadow-xs"
            : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.03]"
        }`}
      >
        {isPending && isRecentlyUpdated && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4DA3FF]" />
        )}
        <span>Recently Updated</span>
      </button>

      {/* 2. Latest Decisions */}
      <button
        type="button"
        onClick={() => handleTabClick("latest")}
        disabled={isPending && isLatest}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
          isLatest
            ? "bg-white/[0.08] text-[#F1F5F9] shadow-xs"
            : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.03]"
        }`}
      >
        {isPending && isLatest && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4DA3FF]" />
        )}
        <span>Newest</span>
      </button>
    </div>
  );
}
