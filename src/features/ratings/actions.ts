"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag, unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/supabase/admin";
import { createReadClient } from "@/supabase/read";
import { userTag } from "@/lib/cache-tags";
import { ratingEntrySchema, firstIssue } from "@/lib/validation";
import { recomputeGoals } from "@/features/goals/actions";
import type { RatingFormat, FormatRatings, Database } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Rating entries — server actions (Clerk + service-role)
// ─────────────────────────────────────────────────────────────

export interface RatingEntryInput {
  rating:            number;
  format?:           RatingFormat;
  entry_date:        string; // YYYY-MM-DD
  notes?:            string;
  game_result?:      string;
  mistake_category?: string;
  mindset?:          string;
  takeaway?:         string;
}

function configError() {
  return {
    success: false as const,
    error:
      "Server is missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  };
}

// Recompute per-format current/peak from the source rating_entries rows,
// then mirror the user's PRIMARY format into the headline current_rating /
// peak_rating. Authoritative — safe for back-dated entries and deletes,
// and a Blitz entry never clobbers a Rapid headline. Called after every
// rating write/delete.
async function syncFormatRatings(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase
    .from("rating_entries")
    .select("rating, format, entry_date, created_at")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as {
    rating: number;
    format: RatingFormat;
  }[];

  // Fold ascending rows → last-seen per format is the latest = "current".
  const byFormat: FormatRatings = {};
  for (const r of rows) {
    const slot = byFormat[r.format];
    if (!slot) byFormat[r.format] = { current: r.rating, peak: r.rating };
    else {
      slot.current = r.rating;
      slot.peak = Math.max(slot.peak, r.rating);
    }
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("primary_format")
    .eq("user_id", userId)
    .maybeSingle();
  const primary = ((prof?.primary_format as RatingFormat) ?? "Rapid");

  // Headline follows the primary format; fall back to the overall latest
  // when the user has no entries in their primary format yet.
  const headline =
    byFormat[primary] ??
    (rows.length
      ? {
          current: rows[rows.length - 1].rating,
          peak: Math.max(...rows.map((r) => r.rating)),
        }
      : { current: 800, peak: 800 });

  await supabase
    .from("profiles")
    .update({
      format_ratings: byFormat,
      current_rating: headline.current,
      peak_rating: headline.peak,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

// Public wrapper so other server actions (e.g. the importer) can refresh
// the profile's per-format + headline ratings after writing rating rows.
export async function recomputeFormatRatings() {
  const { userId } = await auth();
  if (!userId) return;
  const supabase = createAdminClient();
  await syncFormatRatings(supabase, userId);
  updateTag(userTag(userId, "profile"));
}

export async function createRatingEntry(input: RatingEntryInput) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false as const, error: "Not signed in." };
  }

  const parsed = ratingEntrySchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: firstIssue(parsed.error) };
  const v = parsed.data;

  try {
    const supabase = createAdminClient();

    const { data: newEntry, error: insertError } = await supabase
      .from("rating_entries")
      .insert({
        user_id:           userId,
        rating:            v.rating,
        format:            v.format ?? "Rapid",
        entry_date:        v.entry_date,
        notes:             v.notes || null,
        game_result:       v.game_result || null,
        mistake_category:  v.mistake_category || null,
        mindset:           v.mindset || null,
        takeaway:          v.takeaway || null,
        is_starred:        false,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false as const, error: insertError.message };
    }

    // Recompute per-format current/peak (+ the primary-format headline)
    // from the DB so cross-format tracking and back-dated entries stay correct.
    await syncFormatRatings(supabase, userId);

    updateTag(userTag(userId, "ratings"));
    updateTag(userTag(userId, "profile"));
    // Bump any rating-tracked goals
    recomputeGoals().catch((e) => console.error("recomputeGoals (rating):", e));
    return { success: true as const, data: newEntry };
  } catch (err: unknown) {
    console.error("Create entry error:", err);
    return configError();
  }
}

export async function getRatingEntries() {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createReadClient();
  const fetcher = unstable_cache(
    async (uid: string) => {
      try {
        const { data, error } = await supabase
          .from("rating_entries")
          .select("*")
          .eq("user_id", uid)
          .order("entry_date", { ascending: true })
          .order("created_at", { ascending: true });
        if (error) {
          console.error("getRatingEntries error:", error.message);
          return [];
        }
        return data ?? [];
      } catch (err) {
        console.error("getRatingEntries exception:", err);
        return [];
      }
    },
    ["rating_entries", userId],
    { tags: [userTag(userId, "ratings")], revalidate: 60 },
  );

  return fetcher(userId);
}

export async function toggleStarEntry(id: string, isStarred: boolean) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false as const, error: "Not signed in." };
  }

  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("rating_entries")
      .update({ is_starred: isStarred })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return { success: false as const, error: error.message };

    updateTag(userTag(userId, "ratings"));
    return { success: true as const };
  } catch (err) {
    console.error("Toggle star error:", err);
    return configError();
  }
}

export async function deleteRatingEntry(id: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false as const, error: "Not signed in." };
  }

  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("rating_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return { success: false as const, error: error.message };

    // Recompute per-format current/peak from the remaining entries.
    await syncFormatRatings(supabase, userId);

    updateTag(userTag(userId, "ratings"));
    updateTag(userTag(userId, "profile"));
    return { success: true as const };
  } catch (err) {
    console.error("Delete rating entry error:", err);
    return configError();
  }
}
