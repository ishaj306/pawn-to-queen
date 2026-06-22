"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

import { useAuthStore } from "@/store/authStore";
import { getSessionUser } from "@/features/auth/actions";

// ─────────────────────────────────────────────────────────────
//  Hydrates the Postgres profile row into the client store
//  whenever Clerk reports the user as signed-in. On sign-out
//  it clears the store.
//
//  This DOES NOT manage the auth session — Clerk does that via
//  ClerkProvider in the root layout. We're just mirroring the
//  Postgres profile for fast client access.
// ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const setUser = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setUser(null);
      setProfile(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await getSessionUser();
        if (cancelled) return;
        if (res) {
          setUser(res.user);
          setProfile(res.profile);
        }
      } catch (err) {
        console.error("AuthProvider: failed to hydrate profile", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, clerkUser?.id, setUser, setProfile]);

  return <>{children}</>;
}
