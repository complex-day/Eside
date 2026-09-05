import { Skeleton } from "@/components/ui/skeleton";

export function ExperienceCardSkeleton() {
  return (
    <div className="rounded-xl glass-card p-5 sm:p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8 rounded-full bg-white/[0.06]" />
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-24 bg-white/[0.06]" />
            <Skeleton className="h-3 w-16 bg-white/[0.04]" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 bg-white/[0.06] rounded-md" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4 bg-white/[0.07]" />
        <Skeleton className="h-3.5 w-full bg-white/[0.04]" />
        <Skeleton className="h-3.5 w-5/6 bg-white/[0.04]" />
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
        <Skeleton className="h-3.5 w-20 bg-white/[0.05]" />
        <Skeleton className="h-6 w-20 bg-white/[0.06] rounded" />
      </div>
    </div>
  );
}
