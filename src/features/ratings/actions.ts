"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import type { RatingFormat } from "@/types/database";

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

export async function createRatingEntry(input: RatingEntryInput) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false as const, error: "Not signed in." };
  }

  try {
    const supabase = createAdminClient();

    const { data: newEntry, error: insertError } = await supabase
      .from("rating_entries")
      .insert({
        user_id:           userId,
        rating:            input.rating,
        format:            input.format ?? "Rapid",
        entry_date:        input.entry_date,
        notes:             input.notes || null,
        game_result:       input.game_result || null,
        mistake_category:  input.mistake_category || null,
        mindset:           input.mindset || null,
        takeaway:          input.takeaway || null,
        is_starred:        false,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false as const, error: insertError.message };
    }

    // Update profile's current and peak rating
    const { data: profile } = await supabase
      .from("profiles")
      .select("peak_rating")
      .eq("user_id", userId)
      .single();

    const newPeak = profile?.peak_rating
      ? Math.max(profile.peak_rating as number, input.rating)
      : input.rating;

    await supabase
      .from("profiles")
      .update({
        current_rating: input.rating,
        peak_rating:    newPeak,
        updated_at:     new Date().toISOString(),
      })
      .eq("user_id", userId);

    revalidatePath("/", "layout");
    return { success: true as const, data: newEntry };
  } catch (err: unknown) {
    console.error("Create entry error:", err);
    return configError();
  }
}

export async function getRatingEntries() {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("rating_entries")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching rating entries:", error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error("Fetch entries error:", err);
    return [];
  }
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

    revalidatePath("/", "layout");
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

    // Recalculate current and peak ratings from remaining entries
    const { data: remaining } = await supabase
      .from("rating_entries")
      .select("rating")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true });

    let currentRating = 800;
    let peakRating = 800;
    if (remaining && remaining.length > 0) {
      const ratings = (remaining as { rating: number }[]).map((r) => r.rating);
      currentRating = ratings[ratings.length - 1];
      peakRating = Math.max(...ratings);
    }

    await supabase
      .from("profiles")
      .update({
        current_rating: currentRating,
        peak_rating:    peakRating,
        updated_at:     new Date().toISOString(),
      })
      .eq("user_id", userId);

    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (err) {
    console.error("Delete rating entry error:", err);
    return configError();
  }
}
