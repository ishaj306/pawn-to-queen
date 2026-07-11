"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag, unstable_cache } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { userTag } from "@/lib/cache-tags";
import { profileSchema, firstIssue } from "@/lib/validation";
import type { ProfileRow, RatingFormat } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Profile updates — Clerk + service-role
// ─────────────────────────────────────────────────────────────

export interface UpdateProfileInput {
  full_name?:          string | null;
  username?:           string | null;
  primary_format?:     RatingFormat;
  target_rating?:      number;
  chess_com_username?: string | null;
  lichess_username?:   string | null;
  bio?:                string | null;
  notify_email?:       boolean;
  notify_push?:        boolean;
}

export async function getProfile(): Promise<ProfileRow | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createAdminClient();
  const fetcher = unstable_cache(
    async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      return (data ?? null) as ProfileRow | null;
    },
    ["profile", userId],
    { tags: [userTag(userId, "profile")], revalidate: 60 },
  );
  return fetcher(userId);
}

export async function updateProfile(input: UpdateProfileInput) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Not signed in." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: firstIssue(parsed.error) };
  const v = parsed.data;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...v, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return { success: false as const, error: error.message };

    updateTag(userTag(userId, "profile"));
    return { success: true as const, data: data as unknown as ProfileRow };
  } catch (err) {
    console.error("updateProfile error:", err);
    return { success: false as const, error: "Could not save profile." };
  }
}
