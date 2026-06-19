import { createClient } from "@supabase/supabase-js";

// ── Public client (anon key) — safe to use client-side ──────
// NOTE: All tables have RLS with no anon policies, so this
// client has zero read/write access. Only used for type-safety.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Admin client (service role) — SERVER ONLY ────────────────
// Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
// Only import this in server-side code (API routes, tRPC routers).
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
