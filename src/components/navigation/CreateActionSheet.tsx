"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";

interface CreateActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
}

export function CreateActionSheet({
  isOpen,
  onClose,
  isAuthenticated = false,
}: CreateActionSheetProps) {
  // Lock background body scroll while action sheet is active
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl glass-card text-[#F1F5F9] p-5 sm:p-6 shadow-2xl relative space-y-5 bg-[#090B0F]/98 border border-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#F1F5F9]">
              What would you like to document?
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Document an initial decision or return to log a follow-up outcome.
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/[0.05] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.1] transition-colors border border-white/[0.08]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2 Primary Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Option A: Start New Journey */}
          <Link
            href={isAuthenticated ? "/experiences/new" : "/login?next=/experiences/new"}
            onClick={onClose}
            className="group p-4 rounded-xl bg-black/40 border border-white/[0.08] hover:border-[#4DA3FF]/50 hover:bg-white/[0.03] transition-all flex flex-col justify-between gap-3"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#4DA3FF]/10 border border-[#4DA3FF]/25 flex items-center justify-center text-[#4DA3FF] mb-2 text-sm">
                🌼
              </div>
              <div className="text-sm font-semibold text-[#F1F5F9] mb-1">
                Start New Journey
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Document a decision, career pivot, project, or turning point.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#4DA3FF] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Day 0 Baseline <ArrowRight className="h-3 w-3" />
            </span>
          </Link>

          {/* Option B: Log Outcome */}
          <Link
            href={isAuthenticated ? "/profile" : "/login?next=/profile"}
            onClick={onClose}
            className="group p-4 rounded-xl bg-black/40 border border-white/[0.08] hover:border-[#4DA3FF]/50 hover:bg-white/[0.03] transition-all flex flex-col justify-between gap-3"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#4DA3FF]/10 border border-[#4DA3FF]/25 flex items-center justify-center text-[#4DA3FF] mb-2 text-sm">
                🪷
              </div>
              <div className="text-sm font-semibold text-[#F1F5F9] mb-1">
                Log Follow-up Outcome
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Add a milestone update, pivot, or real-world outcome to an existing journey.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#4DA3FF] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Add Checkpoint <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
