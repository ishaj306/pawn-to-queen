import { create } from "zustand";
import { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  chess_com_username: string | null;
  lichess_username: string | null;
  current_rating: number | null;
  peak_rating: number | null;
  country: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
}));
export type { User };
