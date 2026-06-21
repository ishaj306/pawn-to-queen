"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { login } from "@/features/auth/actions";
import { useAuthStore } from "@/store/authStore";
import { createClient } from "@/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  CardFooter,
  FieldError,
  FieldLabel,
  FormError,
  GoogleButton,
  JournalCard,
  JournalInput,
  OrDivider,
  PrimaryButton,
} from "@/components/auth/auth-primitives";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  remember: z.boolean().optional(),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  const onSubmit = async (data: LoginSchema) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await login({ email: data.email, password: data.password });
      if (res.success && res.user) {
        setUser(res.user);
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrorMsg(
          res.error ||
            "We couldn't sign you in. Please verify your credentials.",
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not start Google sign-in.");
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell>
      <JournalCard title="Sign In To Your Journal" eyebrow="Welcome back">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {errorMsg && <FormError>{errorMsg}</FormError>}

          <div>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <JournalInput
              id="email"
              type="email"
              placeholder="you@domain.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-[11px] tracking-[0.22em] uppercase text-gold-deep hover:text-emerald transition-colors"
              >
                Forgot Password
              </Link>
            </div>
            <JournalInput
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <FieldError>{errors.password.message}</FieldError>
            )}
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              {...register("remember")}
              className="size-4 accent-emerald border-gold/60"
            />
            <span className="text-[12px] tracking-[0.18em] uppercase text-ink/65">
              Remember Me
            </span>
          </label>

          <PrimaryButton type="submit" disabled={loading || googleLoading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </PrimaryButton>

          <OrDivider />

          <GoogleButton
            onClick={signInWithGoogle}
            disabled={loading || googleLoading}
            loading={googleLoading}
            label="Continue With Google"
          />
        </form>

        <CardFooter>
          New here?{" "}
          <Link
            href="/signup"
            className="text-emerald font-medium underline-offset-4 hover:underline decoration-gold"
          >
            Create an account
          </Link>
        </CardFooter>
      </JournalCard>
    </AuthShell>
  );
}
