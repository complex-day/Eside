import { createClient } from "@/lib/supabase/server";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  resetTimeMs: number;
}

/**
 * Enforces a database-backed sliding-window rate limit for experience submissions.
 * Default: 10 posts per hour per authenticated user.
 */
export async function checkExperienceRateLimit(
  userId: string,
  limit = 10,
  windowHours = 1
): Promise<RateLimitResult> {
  const supabase = await createClient();
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("experiences")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId)
    .gte("created_at", windowStart);

  if (error) {
    // If the check fails unexpectedly, allow the request to avoid blocking valid user traffic
    console.error("Rate limit check query error:", error);
    return {
      allowed: true,
      count: 0,
      limit,
      resetTimeMs: Date.now() + windowHours * 60 * 60 * 1000,
    };
  }

  const currentCount = count ?? 0;
  const allowed = currentCount < limit;

  return {
    allowed,
    count: currentCount,
    limit,
    resetTimeMs: Date.now() + windowHours * 60 * 60 * 1000,
  };
}
