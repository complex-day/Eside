"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

export function FeedSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQ = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(currentQ);

  // Synchronize internal state with URL search param if changed externally
  useEffect(() => {
    setInputValue(currentQ);
  }, [currentQ]);

  // Push URL update helper (preserves category, tag, sort, journey; resets page)
  const updateSearchQuery = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = term.trim();

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }

    // Always reset to page 1 on search change
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Debounced search (300ms)
  useEffect(() => {
    // Only debounce if inputValue differs from the current URL param
    if (inputValue.trim() === currentQ.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      updateSearchQuery(inputValue);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateSearchQuery(inputValue);
    }
  };

  const handleClear = () => {
    setInputValue("");
    updateSearchQuery("");
  };

  return (
    <div className="relative w-full sm:w-72">
      <div className="relative flex items-center">
        <Search
          className={`absolute left-3 h-4 w-4 transition-colors ${
            inputValue ? "text-[#4DA3FF]" : "text-[#64748B]"
          }`}
          aria-hidden="true"
        />

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search journeys, dilemmas & tags..."
          className="w-full bg-white/[0.03] border border-white/[0.08] pl-9 pr-8 py-1.5 rounded-lg text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#4DA3FF]/50 focus:ring-1 focus:ring-[#4DA3FF]/30 transition-all shadow-xs"
        />

        {isPending ? (
          <div className="absolute right-2.5 flex items-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4DA3FF]" />
          </div>
        ) : inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 rounded-full p-0.5 text-[#64748B] hover:text-[#F1F5F9] hover:bg-white/[0.08] transition-colors"
            title="Clear search"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
