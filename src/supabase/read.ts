import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { createAdminClient } from "./admin";
import { createUserClient } from "./user";

// ─────────────────────────────────────────────────────────────────
//  Read client selector — defense in depth for reads.
//
//  By default reads use the service-role admin client (which bypasses
//  RLS); every getter still filters by the caller's user_id, and that
//  filter is the gate. Set USE_RLS_READS=true to route reads through
//  the Clerk-JWT user client instead, so Postgres RLS enforces
//  per-user isolation as a SECOND layer — the explicit user_id filter
//  stays in place either way.
//
//  ⚠️ Only flip the flag AFTER confirming the Clerk→Supabase JWT path
//  works, using /api/rls-check while signed in (that endpoint proves
//  the "supabase" JWT template exists and migration 0005's policies
//  return rows). If the JWT template or policies are missing, the user
//  client returns NO rows and the app appears empty — hence the flag
//  defaults off and this stays a deliberate, verified switch.
//
//  Writes are unaffected: they continue to use createAdminClient()
//  directly, since RLS write policies are out of scope here.
// ─────────────────────────────────────────────────────────────────

export async function createReadClient(): Promise<SupabaseClient<Database>> {
  if (process.env.USE_RLS_READS === "true") {
    return createUserClient();
  }
  return createAdminClient();
}
