import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and resolves Tailwind CSS conflicts with tailwind-merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date or ISO string into a human-readable format (e.g. "Aug 31, 2026").
 */
export function formatDate(input: string | Date | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a date or ISO string into a full date string (e.g. "August 31, 2026").
 */
export function formatFullDate(input: string | Date | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a date or ISO string into a relative time string (e.g. "2 hours ago", "just now").
 * Pure native zero-dependency implementation using Intl.RelativeTimeFormat.
 */
export function formatRelativeTime(input: string | Date | number): string {
  try {
    const date = new Date(input);
    const now = new Date();
    const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);

    if (Math.abs(diffSeconds) < 60) {
      return "just now";
    }

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    const cutoffs = [
      { unit: "year" as const, seconds: 31536000 },
      { unit: "month" as const, seconds: 2592000 },
      { unit: "week" as const, seconds: 604800 },
      { unit: "day" as const, seconds: 86400 },
      { unit: "hour" as const, seconds: 3600 },
      { unit: "minute" as const, seconds: 60 },
    ];

    for (const { unit, seconds } of cutoffs) {
      if (Math.abs(diffSeconds) >= seconds) {
        const delta = Math.round(diffSeconds / seconds);
        return rtf.format(delta, unit);
      }
    }

    return "just now";
  } catch {
    return formatDate(input);
  }
}

/**
 * Calculates the calendar day difference (midnight-to-midnight) between two dates.
 * Example: Sept 4 to Sept 5 is always 1 calendar day regardless of exact hour/minute.
 */
export function calculateCalendarDaysDifference(
  startDateInput: string | Date | number,
  endDateInput: string | Date | number = new Date()
): number {
  try {
    const start = new Date(startDateInput);
    const end = new Date(endDateInput);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    // Normalize both dates to midnight local time
    const startMidnight = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    ).getTime();

    const endMidnight = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate()
    ).getTime();

    const diffDays = Math.round((endMidnight - startMidnight) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch {
    return 0;
  }
}

