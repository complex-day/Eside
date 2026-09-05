"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function ProgressionBanner() {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem("eside_botanical_banner_dismissed");
    if (!dismissed) {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("eside_botanical_banner_dismissed", "true");
  };

  if (isDismissed) {
    return null;
  }

  return (
    <section className="relative rounded-xl glass-card p-5 sm:p-6 mb-6 overflow-hidden transition-all duration-300">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4DA3FF]/10 border border-[#4DA3FF]/20 flex items-center justify-center text-sm">
            🌱
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#F1F5F9]">
              How Eside Works: The Longitudinal Journal
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Document the initial decision today, then return at Day 14, 30, or 90 to record real-world outcomes.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#94A3B8] hover:text-[#F1F5F9] text-xs transition-colors border border-white/[0.06]"
        >
          <span>Dismiss</span>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 4-Stage Botanical Progression Chain */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {/* Stage 01: Decision 🌼 */}
        <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/[0.04] text-amber-100 border border-amber-100/10">
              01 • DECISION 🌼
            </span>
          </div>
          <div className="font-semibold text-xs sm:text-sm text-[#F1F5F9] mt-0.5">The Dilemma</div>
          <div className="text-xs text-[#94A3B8] leading-relaxed">
            The initial situation, options considered, and why you chose a path.
          </div>
        </div>

        {/* Stage 02: Actions 🌻 */}
        <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20">
              02 • ACTION 🌻
            </span>
          </div>
          <div className="font-semibold text-xs sm:text-sm text-[#F1F5F9] mt-0.5">Execution & Momentum</div>
          <div className="text-xs text-[#94A3B8] leading-relaxed">
            Concrete steps taken, experiments conducted, and progress over time.
          </div>
        </div>

        {/* Stage 03: Pivots 🍁 */}
        <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20">
              03 • TURNING POINT 🍁
            </span>
          </div>
          <div className="font-semibold text-xs sm:text-sm text-[#F1F5F9] mt-0.5">Pivots & Lessons</div>
          <div className="text-xs text-[#94A3B8] leading-relaxed">
            Unfiltered updates: unexpected obstacles, broken hypotheses, and shifts.
          </div>
        </div>

        {/* Stage 04: Outcomes 🪷 */}
        <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#4DA3FF]/15 text-[#4DA3FF] border border-[#4DA3FF]/25">
              04 • OUTCOME 🪷
            </span>
          </div>
          <div className="font-semibold text-xs sm:text-sm text-[#F1F5F9] mt-0.5">Real-World Reflection</div>
          <div className="text-xs text-[#94A3B8] leading-relaxed">
            Measured conclusions, retrospective insights, and lasting takeaways.
          </div>
        </div>
      </div>
    </section>
  );
}
