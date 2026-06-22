import { create } from "zustand";
import type { ProfileRow } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Client-side auth store.
//
//  Clerk owns the user session itself — use `useUser()` from
//  `@clerk/nextjs` directly when you need the auth-provider's
//  shape. This store only holds the Postgres profile row that
//  AuthProvider hydrates on mount, plus a minimal SessionUser
//  snapshot for components that don't want a Clerk hook.
// ─────────────────────────────────────────────────────────────

export interface SessionUserShape {
  id:       string;
  email:    string | null;
  fullName: string | null;
  imageUrl: string | null;
}

interface AuthState {
  user:       SessionUserShape | null;
  profile:    ProfileRow | null;
  setUser:    (user: SessionUserShape | null) => void;
  setProfile: (profile: ProfileRow | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:       null,
  profile:    null,
  setUser:    (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
}));

// Back-compat alias for older imports
export type Profile = ProfileRow;
