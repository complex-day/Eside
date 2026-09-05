import Link from "next/link";
import { FloatingLotusIllustration } from "@/components/botanical/BotanicalSignals";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";

export function BotanicalHero() {
  return (
    <section className="relative w-full pt-10 pb-12 sm:pt-14 sm:pb-16 flex flex-col items-center justify-center text-center overflow-hidden">
      {/* 1. Single Floating Botanical Illustration */}
      <div className="mb-6">
        <FloatingLotusIllustration />
      </div>

      {/* 2. Core Philosophy Quote */}
      <div className="max-w-2xl px-4 space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#F1F5F9] leading-tight font-sans">
          &ldquo;Document the journey, not just the outcome.&rdquo;
        </h1>

        <p className="text-xs sm:text-sm text-[#94A3B8] font-medium tracking-wide">
          Every journey starts as a seed. Every outcome becomes a flower.
        </p>

        {/* 3. Thoughtful Progression Flow Strip */}
        <div className="pt-3 flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#64748B] font-mono font-medium">
          <span className="text-amber-200/90">Decision 🌼</span>
          <span>→</span>
          <span className="text-[#FFB800]/90">Action 🌻</span>
          <span>→</span>
          <span className="text-[#FF6B35]/90">Pivot 🍁</span>
          <span>→</span>
          <span className="text-[#4DA3FF] font-semibold">Outcome 🪷</span>
        </div>
      </div>

      {/* 4. Subtle Call-To-Action */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link href="/experiences/new">
          <Button
            size="sm"
            className="h-9 px-4 text-xs font-semibold bg-[#4DA3FF] text-black hover:bg-[#60A5FA] transition-all rounded-lg shadow-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
            <span>Start a Journey</span>
          </Button>
        </Link>
        <Link href="/#explore">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 text-xs font-medium border-white/10 bg-white/[0.02] text-[#F1F5F9] hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <span>Explore Longitudinal Logs</span>
            <ArrowRight className="ml-1.5 h-3 w-3 text-[#94A3B8]" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
