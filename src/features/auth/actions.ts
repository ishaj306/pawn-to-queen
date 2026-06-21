"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

function checkSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = 
    url && 
    url !== "" && 
    !url.includes("your-project-id") &&
    key && 
    key !== "" && 
    !key.includes("...") &&
    key.length > 50;

  return isConfigured;
}

export async function login(formData: { email: string; password: string }) {
  if (!checkSupabaseConfig()) {
    return { 
      success: false, 
      error: "Supabase credentials are not configured. Please fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file with your active Supabase values." 
    };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true, user: data.user };
  } catch (err: any) {
    console.error("Login error:", err);
    return { 
      success: false, 
      error: "Connection failed. Please check your internet connection or verify that your Supabase credentials in .env.local are valid." 
    };
  }
}

export async function signup(formData: {
  fullName: string;
  email: string;
  password: string;
}) {
  if (!checkSupabaseConfig()) {
    return { 
      success: false, 
      error: "Supabase credentials are not configured. Please fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file with your active Supabase values." 
    };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const user = data.user;

    if (user) {
      // Create profile entry for the new user.
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: user.id,
        full_name: formData.fullName,
        current_rating: 800,
        peak_rating: 800,
        username: formData.email.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
      });

      if (profileError) {
        console.error("Error creating profile:", profileError.message);
      }
    }

    revalidatePath("/", "layout");
    return { success: true, user };
  } catch (err: any) {
    console.error("Signup error:", err);
    return { 
      success: false, 
      error: "Connection failed. Please check your internet connection or verify that your Supabase credentials in .env.local are valid." 
    };
  }
}

export async function forgotPassword(email: string) {
  if (!checkSupabaseConfig()) {
    return { 
      success: false, 
      error: "Supabase credentials are not configured. Please fill in your .env.local file." 
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return { 
      success: false, 
      error: "Connection failed. Please check your internet connection or verify your Supabase credentials." 
    };
  }
}

export async function logout() {
  if (!checkSupabaseConfig()) {
    return { success: true }; // Allow logout to pass if not configured
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("Logout error:", err);
    return { success: true };
  }
}

export async function getSessionUser() {
  if (!checkSupabaseConfig()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return { user, profile };
  } catch (err) {
    console.error("Get session user error:", err);
    return null;
  }
}
