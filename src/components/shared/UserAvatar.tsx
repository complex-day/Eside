import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const AVATAR_PALETTES = [
  "from-indigo-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-fuchsia-600",
];

export function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index] ?? "from-indigo-500 to-purple-600";
}

interface UserAvatarProps {
  username?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({ username, size = "md", className }: UserAvatarProps) {
  const name = username || "Anonymous";
  const initial = name.charAt(0).toUpperCase();
  const gradient = getAvatarGradient(name);

  const sizeClasses = {
    sm: "h-7 w-7 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
    xl: "h-16 w-16 text-lg",
  }[size];

  return (
    <Avatar className={cn(sizeClasses, "border-slate-700 shadow-sm", className)}>
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br font-mono font-bold text-white shadow-inner",
          gradient
        )}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
