import { getSupabaseAdmin } from "./supabase";

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? "3", 10);
const WINDOW_MINUTES = 60;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check whether an IP (and optionally email) is within rate limits.
 * Uses the rate_limit_events table: counts rows in the past WINDOW_MINUTES.
 */
export async function checkRateLimit(
  ipAddress: string,
  email?: string
): Promise<RateLimitResult> {
  const db = getSupabaseAdmin();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  // Count by IP
  const { count: ipCount, error } = await db
    .from("rate_limit_events")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ipAddress)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    // If we can't check, be permissive rather than blocking all users
    console.error("[rate-limit] DB error:", error.message);
    return { allowed: true, remaining: 1, resetAt: new Date() };
  }

  const count = ipCount ?? 0;
  const resetAt = new Date(Date.now() + WINDOW_MINUTES * 60 * 1000);

  if (count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX - count, resetAt };
}

/**
 * Record that this IP/email made a request (call AFTER allowing through).
 */
export async function recordRateLimitEvent(
  ipAddress: string,
  email?: string
): Promise<void> {
  const db = getSupabaseAdmin();
  await db.from("rate_limit_events").insert({ ip_address: ipAddress, email });
}
