import React from "react";

interface EsideLogoProps {
  size?: number;
  className?: string;
}

export function EsideLogo({ size = 32, className = "" }: EsideLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-label="Eside Logo"
    >
      <rect width="40" height="40" rx="10" fill="#090B0F" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {/* Day 0 Decision Anchor */}
      <circle cx="12" cy="20" r="3" fill="#FFD84D" />
      {/* Longitudinal Path */}
      <path
        d="M15 20H25"
        stroke="#4DA3FF"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
      {/* Outcome Blooming Node */}
      <circle cx="28" cy="20" r="3.75" fill="#4DA3FF" />
      <path
        d="M20 14L26 20L20 26"
        stroke="#7DD3FC"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
