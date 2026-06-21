"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

// ─────────────────────────────────────────────────────────────
//  Log Game modal — luxury grandmaster's-notebook style
//  Adds a game to local state (no DB schema yet).
// ─────────────────────────────────────────────────────────────

export type GameResult = "win" | "loss" | "draw";
export type GameFormat = "Rapid" | "Blitz" | "Bullet";
export type GamePlatform = "Chess.com" | "Lichess" | "OTB";

export interface LoggedGame {
  id: string;
  opponent: string;
  date: string;
  platform: GamePlatform;
  result: GameResult;
  opening: string;
  accuracy: number;
  timeControl: string;
  format: GameFormat;
  blunders: number;
  mistakes: number;
  brilliant: number;
  missedWins: number;
  notes: string;
}

const RESULTS: GameResult[] = ["win", "loss", "draw"];
const FORMATS: GameFormat[] = ["Rapid", "Blitz", "Bullet"];
const PLATFORMS: GamePlatform[] = ["Chess.com", "Lichess", "OTB"];

const OPENING_OPTIONS = [
  "Italian Game",
  "London System",
  "Sicilian Defense",
  "Caro-Kann",
  "French Defense",
  "Queen's Gambit",
  "Ruy Lopez",
  "King's Indian",
];

const PIECES = {
  king: "♔",
  queen: "♕",
  pawn: "♙",
};

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const schema = z.object({
  opponent: z.string().min(1, "Opponent is required.").max(60),
  date: z.string().min(1, "Date is required."),
  platform: z.enum(PLATFORMS),
  result: z.enum(RESULTS),
  opening: z.string().min(1, "Opening is required.").max(60),
  format: z.enum(FORMATS),
  accuracy: z.number().min(0).max(100),
  timeControl: z.string().min(1, "Time control is required.").max(20),
  blunders: z.number().min(0).max(50),
  mistakes: z.number().min(0).max(50),
  brilliant: z.number().min(0).max(50),
  missedWins: z.number().min(0).max(50),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export function LogGameModal({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (g: LoggedGame) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      opponent: "",
      date: todayISO(),
      platform: "Chess.com",
      result: "win",
      opening: "Italian Game",
      format: "Rapid",
      accuracy: 80,
      timeControl: "10+0",
      blunders: 0,
      mistakes: 0,
      brilliant: 0,
      missedWins: 0,
      notes: "",
    },
  });

  const result = watch("result");
  const format = watch("format");
  const platform = watch("platform");

  const onSubmit = (values: FormValues) => {
    setSubmitting(true);
    const game: LoggedGame = {
      id: `g-${Date.now()}`,
      opponent: values.opponent,
      date: values.date,
      platform: values.platform,
      result: values.result,
      opening: values.opening,
      accuracy: values.accuracy,
      timeControl: values.timeControl,
      format: values.format,
      blunders: values.blunders,
      mistakes: values.mistakes,
      brilliant: values.brilliant,
      missedWins: values.missedWins,
      notes: values.notes ?? "",
    };
    onSaved(game);
    reset();
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <div className="relative bg-white border border-gold/55 rounded-sm shadow-[0_40px_100px_-40px_rgba(17,17,17,0.5)] px-7 py-8 md:px-10 md:py-10 max-h-[90vh] overflow-y-auto scroll-luxury">
            <span className="absolute top-2 left-2 size-2.5 border-t border-l border-gold-deep/55" />
            <span className="absolute top-2 right-2 size-2.5 border-t border-r border-gold-deep/55" />
            <span className="absolute bottom-2 left-2 size-2.5 border-b border-l border-gold-deep/55" />
            <span className="absolute bottom-2 right-2 size-2.5 border-b border-r border-gold-deep/55" />

            <DialogPrimitive.Close
              className="absolute top-4 right-4 size-8 flex items-center justify-center text-ink/55 hover:text-emerald transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>

            <div className="text-center mb-7">
              <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-[11px] mb-2">
                New Entry · Scorebook
              </p>
              <DialogPrimitive.Title className="font-display text-2xl md:text-[1.7rem] text-ink leading-tight">
                Log a new game
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="font-serif-quote italic text-ink/60 text-sm mt-2">
                Every game leaves behind a lesson.
              </DialogPrimitive.Description>
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-gold-deep/45" />
                <span
                  className="font-display text-base text-gold-deep leading-none"
                  aria-hidden="true"
                >
                  ❦
                </span>
                <span className="h-px w-10 bg-gold-deep/45" />
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Result + Format + Platform — segmented controls */}
              <div className="space-y-4">
                <Segmented
                  label="Result"
                  value={result}
                  options={RESULTS.map((r) => ({
                    label: r === "win" ? "Win" : r === "loss" ? "Loss" : "Draw",
                    value: r,
                  }))}
                  onChange={(v) => setValue("result", v as GameResult)}
                  tone={(v) =>
                    v === "win"
                      ? "emerald"
                      : v === "loss"
                        ? "gold"
                        : "ink"
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <Segmented
                    label="Format"
                    value={format}
                    options={FORMATS.map((f) => ({ label: f, value: f }))}
                    onChange={(v) => setValue("format", v as GameFormat)}
                  />
                  <Segmented
                    label="Platform"
                    value={platform}
                    options={PLATFORMS.map((p) => ({ label: p, value: p }))}
                    onChange={(v) => setValue("platform", v as GamePlatform)}
                  />
                </div>
              </div>

              {/* Opponent + Date + TimeControl */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldText
                  id="opponent"
                  label="Opponent"
                  placeholder="e.g. M. Goldberg"
                  register={register("opponent")}
                  error={errors.opponent?.message}
                  className="md:col-span-2"
                />
                <FieldText
                  id="date"
                  label="Date"
                  type="date"
                  register={register("date")}
                  error={errors.date?.message}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldSelect
                  id="opening"
                  label="Opening"
                  options={OPENING_OPTIONS}
                  register={register("opening")}
                  error={errors.opening?.message}
                  className="md:col-span-2"
                />
                <FieldText
                  id="timeControl"
                  label="Time Control"
                  placeholder="10+0"
                  register={register("timeControl")}
                  error={errors.timeControl?.message}
                />
              </div>

              <FieldText
                id="accuracy"
                label="Accuracy %"
                type="number"
                register={register("accuracy", { valueAsNumber: true })}
                error={errors.accuracy?.message}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FieldText
                  id="blunders"
                  label="Blunders"
                  type="number"
                  register={register("blunders", { valueAsNumber: true })}
                  error={errors.blunders?.message}
                />
                <FieldText
                  id="mistakes"
                  label="Mistakes"
                  type="number"
                  register={register("mistakes", { valueAsNumber: true })}
                  error={errors.mistakes?.message}
                />
                <FieldText
                  id="brilliant"
                  label="Brilliant"
                  type="number"
                  register={register("brilliant", { valueAsNumber: true })}
                  error={errors.brilliant?.message}
                />
                <FieldText
                  id="missedWins"
                  label="Missed Wins"
                  type="number"
                  register={register("missedWins", { valueAsNumber: true })}
                  error={errors.missedWins?.message}
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5"
                >
                  Notes <span className="text-ink/35 normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="What did you learn? A line to remember, a pattern to drill…"
                  {...register("notes")}
                  className="w-full bg-ivory/60 border border-gold/30 px-3.5 py-2.5 text-[14px] text-ink font-sans placeholder:text-ink/35 placeholder:italic rounded-sm focus:outline-none focus:border-emerald transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex-1 inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  Save Game
                  <span
                    className="text-gold transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>
                <DialogPrimitive.Close className="px-5 py-3 text-[12px] tracking-[0.22em] uppercase text-ink/65 hover:text-emerald transition-colors">
                  Cancel
                </DialogPrimitive.Close>
              </div>

              <div
                className="pt-2 flex justify-center text-gold-deep/55"
                aria-hidden="true"
              >
                <span className="font-display text-base">{PIECES.pawn}</span>
              </div>
            </form>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ─── small reusable form atoms ───

function Segmented({
  label,
  value,
  options,
  onChange,
  tone,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  tone?: (v: string) => "emerald" | "gold" | "ink";
}) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-2">
        {label}
      </p>
      <div className="flex gap-1 p-1 bg-ivory border border-gold/40 rounded-sm">
        {options.map((opt) => {
          const active = opt.value === value;
          const t = tone?.(opt.value) ?? "emerald";
          const activeBg =
            t === "emerald"
              ? "bg-emerald text-ivory"
              : t === "gold"
                ? "bg-gold-deep text-ivory"
                : "bg-ink text-ivory";
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex-1 px-2 py-1.5 text-[11px] tracking-[0.22em] uppercase transition-colors rounded-sm ${
                active ? activeBg : "text-ink/65 hover:text-emerald"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type RegisterReturn = ReturnType<ReturnType<typeof useForm>["register"]>;

function FieldText({
  id,
  label,
  placeholder,
  type = "text",
  register,
  error,
  className = "",
}: {
  id: string;
  label: string;
  placeholder?: string;
  type?: string;
  register: RegisterReturn;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5"
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
      {error && (
        <p className="text-[12px] text-destructive mt-1 font-sans">{error}</p>
      )}
    </div>
  );
}

function FieldSelect({
  id,
  label,
  options,
  register,
  error,
  className = "",
}: {
  id: string;
  label: string;
  options: string[];
  register: RegisterReturn;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5"
      >
        {label}
      </label>
      <select
        id={id}
        {...register}
        className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink font-sans focus:outline-none focus:border-emerald transition-colors appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-[12px] text-destructive mt-1 font-sans">{error}</p>
      )}
    </div>
  );
}
