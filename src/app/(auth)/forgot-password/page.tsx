"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { forgotPassword } from "@/features/auth/actions";
import { AuthShell, Fleur, PIECES } from "@/components/auth/auth-shell";
import {
  FieldError,
  FieldLabel,
  FormError,
  JournalCard,
  JournalInput,
  PrimaryButton,
} from "@/components/auth/auth-primitives";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type Schema = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Schema>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Schema) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await forgotPassword(data.email);
      if (res.success) {
        setSuccessMsg(
          "We've dispatched a reset link to your inbox. Check your mail — and the spam folder, just in case.",
        );
      } else {
        setErrorMsg(
          res.error ||
            "Could not send the reset link. Please verify the email and try again.",
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <JournalCard title="Recover Your Account" eyebrow="A small detour">
        {successMsg ? (
          <SuccessPanel message={successMsg} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {errorMsg && <FormError>{errorMsg}</FormError>}

            <p className="text-[13.5px] text-ink/70 font-sans leading-relaxed text-center -mt-2 mb-4">
              Enter the email tied to your journal and we&apos;ll send a link to
              set a new password.
            </p>

            <div>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <JournalInput
                id="email"
                type="email"
                placeholder="you@domain.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </div>

            <PrimaryButton type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Reset Link
            </PrimaryButton>

            <div className="text-center pt-3">
              <Link
                href="/login"
                className="text-[11px] tracking-[0.22em] uppercase text-ink/60 hover:text-emerald transition-colors"
              >
                ← Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* Decorative pawn beneath the card body */}
        <div className="mt-8 pt-6 border-t border-gold/30 flex flex-col items-center gap-3">
          <span
            className="font-display text-5xl text-gold-deep/70 leading-none"
            aria-hidden="true"
          >
            {PIECES.pawn}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="h-px w-8 bg-gold-deep/40" />
            <Fleur className="size-3 text-gold-deep/70" />
            <span className="h-px w-8 bg-gold-deep/40" />
          </div>
          <p className="font-serif-quote italic text-[12px] text-ink/55 text-center max-w-xs">
            Even a pawn finds its way back to the board.
          </p>
        </div>
      </JournalCard>
    </AuthShell>
  );
}

function SuccessPanel({ message }: { message: string }) {
  return (
    <div className="space-y-5">
      <div className="bg-gold-light/40 border border-gold/40 px-5 py-5 rounded-sm">
        <div className="flex items-center justify-center mb-3">
          <span
            className="font-display text-2xl text-emerald leading-none"
            aria-hidden="true"
          >
            {PIECES.queen}
          </span>
        </div>
        <p className="font-serif-quote italic text-[15px] text-ink/85 leading-snug text-center">
          {message}
        </p>
      </div>
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-emerald hover:text-emerald-deep transition-colors"
        >
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
}
