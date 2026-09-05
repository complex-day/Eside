import React from "react";
import { JOURNEY_SIGNALS, type JourneyStage } from "@/lib/journey-signals";

interface BotanicalStageSignalProps {
  stage: JourneyStage;
  showMeaning?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Subtle status indicator for journeys.
 * Rule: Flowers are not decorative spam; they are subtle, refined signals.
 */
export function BotanicalStageSignal({
  stage,
  showMeaning = false,
  size = "sm",
  className = "",
}: BotanicalStageSignalProps) {
  const config = JOURNEY_SIGNALS[stage] || JOURNEY_SIGNALS.golden;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-sans font-medium transition-colors ${
        config.badgeBg
      } ${config.borderColor} ${config.textColor} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${className}`}
      title={`${config.name}: ${config.meaning}`}
    >
      <span className="text-[12px] leading-none" aria-hidden="true">
        {config.emoji}
      </span>
      <span>{showMeaning ? config.meaning : config.stageLabel}</span>
    </span>
  );
}

/**
 * Single minimalist floating Blue Lotus illustration for the Hero Section.
 * Styled after Apple/Linear dark-mode aesthetic with fine vector lines and luminous core.
 */
export function FloatingLotusIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Soft Ambient Radial Glow */}
      <div className="absolute -inset-10 bg-gradient-to-t from-[#4DA3FF]/15 via-[#4DA3FF]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Handcrafted Vector Blue Lotus */}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-24 h-24 sm:w-28 sm:h-28 relative z-10 animate-lotus-float filter drop-shadow-[0_0_15px_rgba(77,163,255,0.35)]"
      >
        <defs>
          <linearGradient id="lotusCenterGlow" x1="60" y1="30" x2="60" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="40%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="petalOuter" x1="60" y1="40" x2="60" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id="sparkCore" cx="60" cy="62" r="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#93C5FD" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Base Petals */}
        <path
          d="M60 92 C35 90 18 78 20 62 C22 50 36 52 50 68 C56 75 60 85 60 92 Z"
          fill="url(#petalOuter)"
          opacity="0.65"
        />
        <path
          d="M60 92 C85 90 102 78 100 62 C98 50 84 52 70 68 C64 75 60 85 60 92 Z"
          fill="url(#petalOuter)"
          opacity="0.65"
        />

        {/* Mid-Layer Petals */}
        <path
          d="M60 90 C42 85 30 68 32 48 C36 40 48 46 54 62 C58 72 60 82 60 90 Z"
          fill="url(#lotusCenterGlow)"
          opacity="0.8"
        />
        <path
          d="M60 90 C78 85 90 68 88 48 C84 40 72 46 66 62 C62 72 60 82 60 90 Z"
          fill="url(#lotusCenterGlow)"
          opacity="0.8"
        />

        {/* Center Main Bloom Petal */}
        <path
          d="M60 28 C52 42 46 60 52 82 C56 90 60 92 60 92 C60 92 64 90 68 82 C74 60 68 42 60 28 Z"
          fill="url(#lotusCenterGlow)"
        />

        {/* Glowing Luminous Seed/Spark Center */}
        <circle cx="60" cy="64" r="8" fill="url(#sparkCore)" />
        <circle cx="60" cy="64" r="2" fill="#FFFFFF" />

        {/* Subtle Stamen Sparks */}
        <circle cx="56" cy="54" r="1" fill="#BAE6FD" opacity="0.9" />
        <circle cx="64" cy="54" r="1" fill="#BAE6FD" opacity="0.9" />
        <circle cx="60" cy="48" r="1.2" fill="#FFFFFF" opacity="0.9" />
      </svg>
    </div>
  );
}
