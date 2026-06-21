"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { signup } from "@/features/auth/actions";
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

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Please confirm your password."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupSchema = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [strength, setStrength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch("password");

  useEffect(() => {
    if (!password) {
      setStrength(0);
      return;
    }
    let s = 0;
    if (password.length >= 6) s += 1;
    if (/[0-9]/.test(password)) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[^A-Za-z0-9]/.test(password)) s += 1;
    setStrength(s);
  }, [password]);

  const onSubmit = async (data: SignupSchema) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signup({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
      if (res.success && res.user) {
        setUser(res.user);
        router.push("/dashboard?welcome=true");
        router.refresh();
      } else {
        setErrorMsg(
          res.error || "Could not create your account. Please try again.",
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const signUpWithGoogle = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard?welcome=true`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not start Google sign-up.");
      setGoogleLoading(false);
    }
  };

  const strengthLabel =
    strength === 0
      ? "Empty"
      : strength === 1
        ? "Weak"
        : strength === 2
          ? "Fair"
          : strength === 3
            ? "Good"
            : "Strong";

  return (
    <AuthShell>
      <JournalCard title="Begin Your Journey" eyebrow="Create your account">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {errorMsg && <FormError>{errorMsg}</FormError>}

          <div>
            <FieldLabel htmlFor="fullName">Name</FieldLabel>
            <JournalInput
              id="fullName"
              type="text"
              placeholder="Your full name"
              autoComplete="name"
              {...register("fullName")}
            />
            {errors.fullName && (
              <FieldError>{errors.fullName.message}</FieldError>
            )}
          </div>

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
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <JournalInput
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <FieldError>{errors.password.message}</FieldError>
            )}

            {/* Strength indicator */}
            <div className="mt-3 space-y-1.5">
              <div className="flex gap-1.5 h-[3px]">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-colors duration-300 ${
                      i <= strength ? "bg-gold" : "bg-ink/10"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] tracking-[0.22em] uppercase text-ink/55">
                <span>Strength</span>
                <span className="text-gold-deep">{strengthLabel}</span>
              </div>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
            <JournalInput
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <FieldError>{errors.confirmPassword.message}</FieldError>
            )}
          </div>

          <PrimaryButton type="submit" disabled={loading || googleLoading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Account
          </PrimaryButton>

          <OrDivider />

          <GoogleButton
            onClick={signUpWithGoogle}
            disabled={loading || googleLoading}
            loading={googleLoading}
            label="Continue With Google"
          />
        </form>

        <CardFooter>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-emerald font-medium underline-offset-4 hover:underline decoration-gold"
          >
            Sign In
          </Link>
        </CardFooter>
      </JournalCard>
    </AuthShell>
  );
}
