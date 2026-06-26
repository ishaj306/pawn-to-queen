import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────
//  User-context Supabase client.
//
//  Unlike createAdminClient() in ./admin.ts, this client passes the
//  Clerk-issued JWT to Supabase as the user's access token. With the
//  policies installed by migration 0005, Postgres enforces RLS based
//  on the JWT's sub claim. If the policies block a query, the request
//  fails. No accidental cross-user reads, even if a userId filter is
//  forgotten.
//
//  Prerequisites for this to work (one-time setup):
//   1. In Clerk dashboard → Configure → Customization → JWT templates,
//      create a template named "supabase" signed with Supabase's JWT
//      secret (Settings → API → JWT Secret in Supabase). Default
//      payload is fine; Clerk auto-includes `sub`.
//   2. Apply supabase/migrations/0005_clerk_jwt_rls.sql.
//
//  If either step is missing, queries from this client will return
//  no rows (RLS rejects the request).
//
//  Server-only — the `server-only` import blocks accidental client use.
// ─────────────────────────────────────────────────────────────────

export async function createUserClient(): Promise<SupabaseClient> {
  const { getToken } = await auth();
  const token = await getToken({ template: "supabase" });

  const url =
    process.env.SUPABASE_POOLER_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      // Passing the Clerk-signed JWT here makes Supabase treat the
      // request as authenticated. RLS policies in migration 0005
      // read the sub claim from this token.
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    },
  });
}
