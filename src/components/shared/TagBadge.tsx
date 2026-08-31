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
        "inline-flex items-center rounded-full bg-secondary/80 px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground hover:bg-secondary transition-colors border border-border/40",
        className
      )}
    >
      #{name}
    </Link>
  );
}
