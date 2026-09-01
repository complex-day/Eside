"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Compass, Sparkles, Layers } from "lucide-react";

export function JourneyFilterPills() {
  const searchParams = useSearchParams();
  const currentJourney = searchParams.get("journey") || "all";

  const createQueryString = (journeyValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (journeyValue === "all") {
      params.delete("journey");
    } else {
      params.set("journey", journeyValue);
    }
    params.delete("page");
    const str = params.toString();
    return str ? `/?${str}` : "/";
  };

  const filters = [
    {
      id: "all",
      label: "All Stories",
      icon: Layers,
    },
    {
      id: "active",
      label: "Active Journeys (1+ updates)",
      icon: Compass,
    },
    {
      id: "long_running",
      label: "Long-running (90d+)",
      icon: Sparkles,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {filters.map((filter) => {
        const isSelected = currentJourney === filter.id;
        const Icon = filter.icon;
        return (
          <Link
            key={filter.id}
            href={createQueryString(filter.id)}
            className={`inline-flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
              isSelected
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm"
                : "bg-surface-card text-muted-foreground border-border/80 hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            <Icon className="h-3 w-3" />
            <span>{filter.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
