"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export interface RatingEntryInput {
  rating: number;
  notes?: string;
  entry_date: string; // YYYY-MM-DD
  game_result?: string;
  mistake_category?: string;
  mindset?: string;
  takeaway?: string;
}

function checkSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    url && 
    url !== "" && 
    !url.includes("your-project-id") &&
    key && 
    key !== "" && 
    !key.includes("...") &&
    key.length > 50
  );
}

export async function createRatingEntry(input: RatingEntryInput) {
  if (!checkSupabaseConfig()) {
    return { success: false, error: "Database not configured. Please set up your .env.local file first." };
  }

  try {
    const supabase = await createClient();

    // Get active user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized access." };
    }

    // Insert rating entry
    const { data: newEntry, error: insertError } = await supabase
      .from("rating_entries")
      .insert({
        user_id: user.id,
        rating: input.rating,
        notes: input.notes || "",
        entry_date: input.entry_date,
        game_result: input.game_result || null,
        mistake_category: input.mistake_category || null,
        mindset: input.mindset || null,
        takeaway: input.takeaway || null,
        is_starred: false,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Update profile's current and peak rating
    const { data: profile } = await supabase
      .from("profiles")
      .select("peak_rating")
      .eq("user_id", user.id)
      .single();

    const newPeak = profile?.peak_rating 
      ? Math.max(profile.peak_rating, input.rating) 
      : input.rating;

    await supabase
      .from("profiles")
      .update({
        current_rating: input.rating,
        peak_rating: newPeak,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    revalidatePath("/", "layout");
    return { success: true, data: newEntry };
  } catch (err: any) {
    console.error("Create entry error:", err);
    return { success: false, error: "Database connection failed. Please try again." };
  }
}

export async function getRatingEntries() {
  if (!checkSupabaseConfig()) {
    return [];
  }

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    const { data, error } = await supabase
      .from("rating_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching rating entries:", error.message);
      return [];
    }

    return data;
  } catch (err) {
    console.error("Fetch entries error:", err);
    return [];
  }
}

export async function toggleStarEntry(id: string, isStarred: boolean) {
  if (!checkSupabaseConfig()) {
    return { success: false, error: "Database not configured." };
  }

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const { error } = await supabase
      .from("rating_entries")
      .update({ is_starred: isStarred })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("Toggle star error:", err);
    return { success: false, error: "Connection to database failed." };
  }
}

export async function deleteRatingEntry(id: string) {
  if (!checkSupabaseConfig()) {
    return { success: false, error: "Database not configured." };
  }

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const { error } = await supabase
      .from("rating_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Recalculate current and peak ratings based on remaining entries
    const { data: remaining } = await supabase
      .from("rating_entries")
      .select("rating")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: true });

    let currentRating = 800;
    let peakRating = 800;

    if (remaining && remaining.length > 0) {
      currentRating = remaining[remaining.length - 1].rating;
      peakRating = Math.max(...remaining.map((r) => r.rating));
    }

    await supabase
      .from("profiles")
      .update({
        current_rating: currentRating,
        peak_rating: peakRating,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("Delete rating entry error:", err);
    return { success: false, error: "Connection to database failed." };
  }
}
