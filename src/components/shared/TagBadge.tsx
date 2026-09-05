import Link from "next/link";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  className?: string;
}

export function TagBadge({ name, className }: TagBadgeProps) {
  return (
    <Link
      href={`/?tag=${encodeURIComponent(name)}`}
      className={cn(
        "inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors border border-slate-700/60",
        className
      )}
    >
      #{name}
    </Link>
  );
}
