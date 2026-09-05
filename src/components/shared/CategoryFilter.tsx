"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
}

interface CategoryFilterProps {
  categories: CategoryItem[];
  selectedCategory?: string;
}

export function CategoryFilter({ categories, selectedCategory }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [optimisticCategory, setOptimisticCategory] = useState<string | undefined>(selectedCategory);

  useEffect(() => {
    setOptimisticCategory(selectedCategory);
  }, [selectedCategory]);

  const handleCategoryClick = (categoryName: string | null) => {
    const nextVal = categoryName ? categoryName.toLowerCase() : undefined;
    setOptimisticCategory(nextVal);

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");

      if (categoryName) {
        params.set("category", categoryName.toLowerCase());
      } else {
        params.delete("category");
      }

      const queryString = params.toString();
      router.push(queryString ? `/?${queryString}` : "/");
    });
  };

  const isAllSelected = !optimisticCategory;

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-2 min-w-max">
        <button
          onClick={() => handleCategoryClick(null)}
          disabled={isPending && isAllSelected}
          className={cn(
            "rounded-full px-3.5 py-1 text-xs transition-all duration-150 border shrink-0 flex items-center gap-1",
            isAllSelected
              ? "bg-[#4DA3FF] text-black border-transparent font-semibold shadow-xs"
              : "glass-card text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.06]"
          )}
        >
          {isPending && isAllSelected && <Loader2 className="h-3 w-3 animate-spin mr-1 text-black" />}
          <span>All Categories ({categories.length})</span>
        </button>

        {categories.map((cat) => {
          const isSelected = optimisticCategory?.toLowerCase() === cat.name.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              disabled={isPending && isSelected}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs transition-all duration-150 border shrink-0 flex items-center gap-1",
                isSelected
                  ? "bg-[#4DA3FF] text-black border-transparent font-semibold shadow-xs"
                  : "glass-card text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.06]"
              )}
            >
              {isPending && isSelected && <Loader2 className="h-3 w-3 animate-spin mr-1 text-black" />}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
