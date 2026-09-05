import { ExperienceCardSkeleton } from "@/components/shared/ExperienceCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3">
        <Skeleton className="h-4 w-40 bg-slate-800 rounded-full" />
        <Skeleton className="h-6 w-3/4 bg-slate-800" />
        <Skeleton className="h-4 w-full bg-slate-800" />
      </div>

      {/* Filter skeletons */}
      <div className="flex space-x-2 overflow-hidden py-1">
        <Skeleton className="h-7 w-20 bg-slate-800 rounded-full" />
        <Skeleton className="h-7 w-24 bg-slate-800 rounded-full" />
        <Skeleton className="h-7 w-28 bg-slate-800 rounded-full" />
        <Skeleton className="h-7 w-24 bg-slate-800 rounded-full" />
      </div>

      {/* Cards skeletons */}
      <div className="space-y-3">
        <ExperienceCardSkeleton />
        <ExperienceCardSkeleton />
        <ExperienceCardSkeleton />
      </div>
    </div>
  );
}
