"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const navigateToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#94A3B8] w-full">
      <span>
        Showing Page <strong className="text-[#F1F5F9] font-mono">{currentPage}</strong> of{" "}
        <strong className="text-[#F1F5F9] font-mono">{totalPages}</strong> ({totalItems} documented journeys)
      </span>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 px-3 text-xs border-white/10 bg-white/[0.03] text-[#F1F5F9] hover:bg-white/[0.08] disabled:opacity-30 rounded-lg"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 px-3 text-xs border-white/10 bg-white/[0.03] text-[#F1F5F9] hover:bg-white/[0.08] disabled:opacity-30 rounded-lg"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
