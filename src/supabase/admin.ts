import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

// ─────────────────────────────────────────────────────────────────
//  Server-only Supabase admin client. Uses the service-role key,
//  which BYPASSES row-level security. Every server action is
//  responsible for filtering by the Clerk user ID it gets from
//  auth() — there is no other gate.
//
//  Typed against our hand-written Database schema (src/types/database.ts)
//  so callers get row/insert typing without `as unknown as` casts.
//
//  Never import this from client components. The `server-only`
//  import will throw a build error if you try.
// ─────────────────────────────────────────────────────────────────

let cached: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  if (cached) return cached;

  // The Supabase JS SDK talks to PostgREST over HTTPS — it needs the
  // https://<ref>.supabase.co project URL, NOT a pooled Postgres
  // connection string. The pooler URL is only useful for the `pg`
  // driver, which we don't use.
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
