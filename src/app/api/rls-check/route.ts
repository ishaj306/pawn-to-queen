import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createUserClient } from "@/supabase/user";

// ─────────────────────────────────────────────────────────────
//  RLS diagnostic — hit /api/rls-check while signed in.
//
//  Proves the full Clerk-JWT → Supabase-RLS path works BEFORE we
//  switch the app's reads onto the JWT client. It is read-only and
//  additive; it changes no existing behaviour. Delete it once RLS
//  is confirmed working.
// ─────────────────────────────────────────────────────────────

export async function GET() {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json(
      { ok: false, reason: "Not signed in — open this URL in a tab where you're logged in." },
      { status: 401 },
    );
  }

  // 1) Does Clerk mint a Supabase-signed JWT for the "supabase" template?
  let tokenPresent = false;
  let tokenError: string | null = null;
  try {
    const token = await getToken({ template: "supabase" });
    tokenPresent = Boolean(token);
  } catch (e) {
    tokenError = e instanceof Error ? e.message : String(e);
  }

  // 2) Does an RLS-scoped query actually return this user's rows?
  let rlsError: string | null = null;
  let gamesVisible = 0;
  let ratingRowsVisible = 0;
  try {
    const supabase = await createUserClient();
    const games = await supabase.from("games").select("id").limit(5);
    if (games.error) rlsError = games.error.message;
    gamesVisible = games.data?.length ?? 0;

    const ratings = await supabase
      .from("rating_entries")
      .select("*", { count: "exact", head: true });
    if (ratings.error && !rlsError) rlsError = ratings.error.message;
    ratingRowsVisible = ratings.count ?? 0;
  } catch (e) {
    rlsError = e instanceof Error ? e.message : String(e);
  }

  const ok = tokenPresent && !rlsError;

  let hint: string;
  if (!tokenPresent) {
    hint =
      "❌ No Supabase JWT came back from Clerk. The JWT template is missing or not named exactly 'supabase'. Reads would return EMPTY if flipped — do NOT flip yet.";
  } else if (rlsError) {
    hint =
      "⚠️ Token is present but the query errored. Usual causes: migration 0005 not applied, or user_id columns are still 'uuid' instead of 'text' (migration 0003). Fix before flipping.";
  } else {
    hint =
      "✅ Token present and RLS reads succeed. It is safe to flip the app onto the JWT client. (If the counts above look right for your account, you're good.)";
  }

  return NextResponse.json({
    ok,
    userId,
    tokenPresent,
    tokenError,
    rlsError,
    gamesVisible,
    ratingRowsVisible,
    hint,
  });
}
