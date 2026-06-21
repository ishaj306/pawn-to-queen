"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { getSessionUser } from "@/features/auth/actions";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);

  useEffect(() => {
    async function initAuth() {
      try {
        const res = await getSessionUser();
        if (res) {
          setUser(res.user);
          setProfile(res.profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Failed to load auth session", err);
      }
    }
    initAuth();
  }, [setUser, setProfile]);

  return <>{children}</>;
}
