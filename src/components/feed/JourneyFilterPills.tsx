"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, Sparkles, Layers, Loader2 } from "lucide-react";

export function JourneyFilterPills() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentJourney = searchParams.get("journey") || "all";
  const [isPending, startTransition] = useTransition();
  const [optimisticJourney, setOptimisticJourney] = useState<string>(currentJourney);

  useEffect(() => {
    setOptimisticJourney(currentJourney);
  }, [currentJourney]);

  const handleFilterClick = (journeyValue: string) => {
    setOptimisticJourney(journeyValue);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (journeyValue === "all") {
        params.delete("journey");
      } else {
        params.set("journey", journeyValue);
      }
      params.delete("page");
      const str = params.toString();
      router.push(str ? `/?${str}` : "/");
    });
  };

  const filters = [
    {
      id: "all",
      label: "All Fields",
      icon: Layers,
    },
    {
      id: "active",
      label: "Active Updates (1+)",
      icon: Compass,
    },
    {
      id: "long_running",
      label: "Long-Running (90d+)",
      icon: Sparkles,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {filters.map((filter) => {
        const isSelected = optimisticJourney === filter.id;
        const Icon = filter.icon;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => handleFilterClick(filter.id)}
            disabled={isPending && isSelected}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono-label-sm text-xs whitespace-nowrap border transition-all duration-150 ${
              isSelected
                ? "bg-[#8083FF] text-[#0D0096] border-transparent font-semibold shadow-sm"
                : "bg-[#171F33] text-[#908FA0] border-[#2D3449] hover:bg-[#222A3D] hover:text-[#DAE2FD]"
            }`}
          >
            {isPending && isSelected ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Icon className="h-3 w-3" />
            )}
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
