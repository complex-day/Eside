"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

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

  const handleCategoryClick = (categoryName: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    // Reset page to 1 on filter change
    params.delete("page");

    if (categoryName) {
      params.set("category", categoryName.toLowerCase());
    } else {
      params.delete("category");
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  };

  const isAllSelected = !selectedCategory;

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center space-x-2 min-w-max">
        <button
          onClick={() => handleCategoryClick(null)}
          className={cn(
            "rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-150 border",
            isAllSelected
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-surface-card text-muted-foreground border-border hover:text-foreground hover:bg-surface-elevated"
          )}
        >
          All Topics
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory?.toLowerCase() === cat.name.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-150 border",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-surface-card text-muted-foreground border-border hover:text-foreground hover:bg-surface-elevated"
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
