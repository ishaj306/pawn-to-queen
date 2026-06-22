import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────
//  Server-only Supabase admin client. Uses the service-role key,
//  which BYPASSES row-level security. Every server action is
//  responsible for filtering by the Clerk user ID it gets from
//  auth() — there is no other gate.
//
//  Untyped on purpose for now: Supabase v2.59+ generics are strict
//  about Database shape and our hand-written types don't quite
//  satisfy them. We'll swap for `supabase gen types typescript`
//  output in Phase 5; until then, callers cast to our Row types.
//
//  Never import this from client components. The `server-only`
//  import will throw a build error if you try.
// ─────────────────────────────────────────────────────────────────

let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cached;
}
