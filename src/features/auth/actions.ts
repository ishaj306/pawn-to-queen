"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

import { createAdminClient } from "@/supabase/admin";
import type { ProfileRow } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Auth server actions, Clerk edition.
//
//  Clerk owns sign-in, sign-up, OAuth, email verification, MFA
//  and password resets. Those flows live in the auth pages via
//  Clerk Elements and never call into here.
//
//  This file is now only for things Clerk doesn't do:
//  - Read the current user + their Postgres profile
//  - Ensure a profile row exists on first sign-in
// ─────────────────────────────────────────────────────────────

export interface SessionUser {
  user: {
    id: string;            // Clerk user id, e.g. "user_2AbcXyz"
    email: string | null;
    fullName: string | null;
    imageUrl: string | null;
  };
  profile: ProfileRow | null;
}

// Username slug from email, with a small random suffix so collisions
// don't fail the first insert.
function makeUsername(email: string | null | undefined): string {
  const base = (email ?? "player").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  const tail = Math.floor(Math.random() * 9000) + 1000;
  return `${base || "player"}_${tail}`;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    null;

  const supabase = createAdminClient();

  // Try to fetch existing profile
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    console.error("getSessionUser fetch profile error:", fetchError.message);
  }

  let profile = existing as ProfileRow | null;

  // First sign-in — create a default profile row.
  if (!profile) {
    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({
        user_id:        userId,
        full_name:      fullName,
        username:       makeUsername(email),
        current_rating: 800,
        peak_rating:    800,
        target_rating:  1500,
      })
      .select()
      .single();

    if (insertError) {
      console.error("getSessionUser create profile error:", insertError.message);
    } else {
      profile = created as ProfileRow;
    }
  }

  return {
    user: {
      id:       userId,
      email,
      fullName,
      imageUrl: clerkUser.imageUrl ?? null,
    },
    profile,
  };
}
