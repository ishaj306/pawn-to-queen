"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { getProfile, updateProfile } from "@/features/profile/actions";
import { titleFor, nextTitle, TITLE_JOURNEY } from "@/utils/stats";
import type { ProfileRow } from "@/types/database";

const PIECES = {
  king: "♔",
  queen: "♕",
  rook: "♖",
  bishop: "♗",
  knight: "♘",
  pawn: "♙",
};

function Fleur({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2c-1 3-3 4-3 6 0 1.5 1 2.5 3 2.5s3-1 3-2.5c0-2-2-3-3-6zM3 12c3 1 4 3 6 3 1.5 0 2.5-1 2.5-3S10.5 9 9 9c-2 0-3 2-6 3zm18 0c-3-1-5-3-6-3-1.5 0-2.5 1-2.5 3s1 3 2.5 3c1 0 3-2 6-3zM12 13c-1 3-3 4-3 6 0 1.5 1 2.5 3 2.5s3-1 3-2.5c0-2-2-3-3-6z"
        fill="currentColor"
        opacity="0.85"
      />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

const schema = z.object({
  full_name:           z.string().min(1, "Name is required.").max(80),
  bio:                 z.string().max(280, "Keep it under 280 characters.").optional().nullable(),
  target_rating:       z.number().int().min(100).max(4000),
  chess_com_username:  z.string().max(60).optional().nullable(),
  lichess_username:    z.string().max(60).optional().nullable(),
});
type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      setProfile(p);
      if (p) {
        reset({
          full_name:          p.full_name ?? "",
          bio:                p.bio ?? "",
          target_rating:      p.target_rating,
          chess_com_username: p.chess_com_username ?? "",
          lichess_username:   p.lichess_username ?? "",
        });
      }
      setLoading(false);
    })();
  }, [reset]);

  const onSubmit = async (v: FormValues) => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await updateProfile({
        full_name:          v.full_name,
        bio:                v.bio ?? null,
        target_rating:      v.target_rating,
        chess_com_username: v.chess_com_username || null,
        lichess_username:   v.lichess_username || null,
      });
      if (res.success && res.data) {
        setProfile(res.data);
        setSavedAt(Date.now());
      } else {
        setErrorMsg(res.error ?? "Could not save.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingShell />;

  const current = profile?.current_rating ?? 800;
  const peak = profile?.peak_rating ?? 800;
  const title = titleFor(current);
  const upcoming = nextTitle(current);
  const initials = (profile?.full_name ?? "Player")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // XP = peak rating (simple, story-friendly metric for the portfolio level)
  const xp = peak;

  return (
    <div className="relative bg-ivory">
      <span
        className="pointer-events-none absolute top-32 -left-12 font-display text-gold/15 leading-none select-none hidden lg:block"
        style={{ fontSize: "26rem" }}
        aria-hidden="true"
      >
        {PIECES.king}
      </span>
      <span
        className="pointer-events-none absolute bottom-20 -right-10 font-display text-emerald/[0.05] leading-none select-none hidden lg:block"
        style={{ fontSize: "24rem" }}
        aria-hidden="true"
      >
        {PIECES.queen}
      </span>

      <div className="relative max-w-5xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-10">
        {/* HERO HEADER */}
        <FadeUp>
          <header className="relative bg-white border border-gold/45 rounded-sm p-8 lg:p-10 overflow-hidden">
            <span className="absolute top-2 left-2 size-2.5 border-t border-l border-gold-deep/55" />
            <span className="absolute top-2 right-2 size-2.5 border-t border-r border-gold-deep/55" />
            <span className="absolute bottom-2 left-2 size-2.5 border-b border-l border-gold-deep/55" />
            <span className="absolute bottom-2 right-2 size-2.5 border-b border-r border-gold-deep/55" />

            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-3 flex justify-center">
                <div className="relative">
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(230, 196, 106, 0)",
                        "0 0 0 16px rgba(230, 196, 106, 0.18)",
                        "0 0 0 0 rgba(230, 196, 106, 0)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 rounded-full"
                  />
                  <div className="relative size-32 rounded-full bg-emerald border-2 border-gold flex items-center justify-center">
                    <span className="font-display text-5xl text-gold">{initials}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-9 text-center lg:text-left">
                <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-2">
                  Your Profile
                </p>
                <h1 className="font-display text-4xl text-ink leading-tight">
                  {profile?.full_name ?? "Player"}
                </h1>
                <p className="mt-2 font-serif-quote italic text-ink/65 text-base">
                  @{profile?.username ?? "player"} ·{" "}
                  <span className="text-emerald">
                    {title.piece} {title.name}
                  </span>
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0">
                  <Stat label="Current" value={current} />
                  <Stat label="Peak"    value={peak} />
                  <Stat label="Target"  value={profile?.target_rating ?? 1500} />
                </div>

                {upcoming && (
                  <p className="mt-4 font-serif-quote italic text-[12px] text-gold-deep">
                    {upcoming.threshold - current} points to {upcoming.piece}{" "}
                    {upcoming.name}
                  </p>
                )}
              </div>
            </div>
          </header>
        </FadeUp>

        {/* EDIT FORM */}
        <FadeUp delay={0.05}>
          <section className="relative bg-white border border-gold/45 rounded-sm p-7 lg:p-9">
            <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/45" />
            <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/45" />
            <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/45" />
            <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/45" />

            <SectionHeading eyebrow="Edit" title="The details" />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {errorMsg && (
                <div className="bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive rounded-sm">
                  {errorMsg}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-5">
                <Field id="full_name" label="Display Name" register={register("full_name")} error={errors.full_name?.message} />
                <Field id="target_rating" label="Target Rating" type="number" register={register("target_rating", { valueAsNumber: true })} error={errors.target_rating?.message} />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <Field id="chess_com_username" label="Chess.com Username" placeholder="optional" register={register("chess_com_username")} error={errors.chess_com_username?.message} />
                <Field id="lichess_username" label="Lichess Username" placeholder="optional" register={register("lichess_username")} error={errors.lichess_username?.message} />
              </div>

              <div>
                <label htmlFor="bio" className="block text-[11px] tracking-[0.22em] uppercase font-medium text-ink/65 mb-1.5">
                  Bio <span className="text-ink/35 normal-case tracking-normal">(optional, max 280)</span>
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  placeholder="A line or two about your chess journey…"
                  {...register("bio")}
                  className="w-full bg-ivory/60 border border-gold/30 px-3.5 py-2.5 text-[14px] text-ink font-sans placeholder:text-ink/35 placeholder:italic rounded-sm focus:outline-none focus:border-emerald transition-colors resize-none"
                />
                {errors.bio && <p className="text-[12px] text-destructive mt-1">{errors.bio.message}</p>}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={saving || !isDirty}
                  className="group inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors min-w-[12rem]"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Profile
                  <span className="text-gold transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
                </button>
                {savedAt && (
                  <motion.span
                    key={savedAt}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-serif-quote italic text-[12px] text-gold-deep"
                  >
                    Saved ✓
                  </motion.span>
                )}
              </div>
            </form>
          </section>
        </FadeUp>

        {/* JOURNEY + XP */}
        <FadeUp delay={0.05}>
          <section className="relative bg-gold-light/40 border border-gold-deep/40 rounded-sm p-7 lg:p-9 overflow-hidden">
            <span className="absolute top-2 left-2 size-2 border-t border-l border-gold-deep/55" />
            <span className="absolute top-2 right-2 size-2 border-t border-r border-gold-deep/55" />
            <span className="absolute bottom-2 left-2 size-2 border-b border-l border-gold-deep/55" />
            <span className="absolute bottom-2 right-2 size-2 border-b border-r border-gold-deep/55" />

            <SectionHeading eyebrow="The Journey" title="From Pawn to Queen" />

            <ol className="grid grid-cols-5 gap-3 mt-6">
              {TITLE_JOURNEY.map((b) => {
                const reached = current >= b.threshold;
                const isCurrent = b.name === title.name;
                return (
                  <li key={b.name} className="text-center">
                    <div
                      className={`mx-auto size-14 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCurrent
                          ? "bg-emerald border-gold text-gold scale-110"
                          : reached
                            ? "bg-white border-gold-deep text-emerald"
                            : "bg-ivory border-ink/15 text-ink/30"
                      }`}
                    >
                      <span className="font-display text-2xl" aria-hidden="true">
                        {b.piece}
                      </span>
                    </div>
                    <p className={`mt-2 font-display text-sm ${isCurrent ? "text-emerald" : "text-ink"}`}>
                      {b.name}
                    </p>
                    <p className={`text-[10px] tracking-[0.18em] uppercase ${reached ? "text-gold-deep" : "text-ink/40"}`}>
                      {b.threshold}
                    </p>
                  </li>
                );
              })}
            </ol>

            <div className="mt-7 pt-5 border-t border-gold-deep/30 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55">Total XP</p>
                <p className="font-display text-3xl text-emerald leading-none mt-1">
                  {xp.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-px w-12 bg-gold-deep/50" />
                <Fleur className="size-4 text-gold-deep" />
                <span className="h-px w-12 bg-gold-deep/50" />
              </div>
              <div className="text-right">
                <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55">Level</p>
                <p className="font-display text-3xl text-emerald leading-none mt-1">
                  {title.piece} {title.name}
                </p>
              </div>
            </div>
          </section>
        </FadeUp>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center lg:text-left">
      <p className="text-[10px] tracking-[0.22em] uppercase text-ink/55">{label}</p>
      <p className="font-display text-3xl text-emerald leading-none mt-1">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

type RegisterReturn = ReturnType<ReturnType<typeof useForm>["register"]>;
function Field({
  id,
  label,
  type = "text",
  placeholder,
  register,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  register: RegisterReturn;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] tracking-[0.22em] uppercase font-medium text-ink/65 mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        {...register}
        className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink font-sans placeholder:text-ink/30 focus:outline-none focus:border-emerald transition-colors"
      />
      {error && <p className="text-[12px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px] mb-1.5">
        {eyebrow}
      </p>
      <h2 className="font-display text-2xl text-ink leading-tight">{title}</h2>
    </div>
  );
}

function FadeUp({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 0.85, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function LoadingShell() {
  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10 space-y-8 animate-pulse">
      <div className="h-48 bg-white border border-gold/30 rounded-sm" />
      <div className="h-72 bg-white border border-gold/30 rounded-sm" />
      <div className="h-56 bg-gold-light/30 border border-gold-deep/30 rounded-sm" />
    </div>
  );
}
