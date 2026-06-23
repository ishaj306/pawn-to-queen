"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { createPuzzle } from "@/features/puzzles/actions";
import type { PuzzleRow } from "@/types/database";

// ─────────────────────────────────────────────────────────────
//  Log Puzzles modal — luxury habit-journal style
//  Posts to /features/puzzles/actions and returns the inserted row.
// ─────────────────────────────────────────────────────────────

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const schema = z.object({
  date:     z.string().min(1, "Date is required."),
  count:    z.number({ message: "Enter a number." }).int().min(1, "At least one puzzle.").max(500),
  accuracy: z.number({ message: "Enter accuracy %." }).min(0).max(100),
  minutes:  z.number({ message: "Enter minutes." }).int().min(1).max(600),
  rating:   z.number({ message: "Enter your puzzle rating." }).int().min(100).max(4000),
  notes:    z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

const PIECES = { pawn: "♙" };

export function LogPuzzlesModal({
  open,
  onOpenChange,
  defaultRating,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRating?: number;
  onSaved: (s: PuzzleRow) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: todayISO(),
      count: 10,
      accuracy: 80,
      minutes: 15,
      rating: defaultRating ?? 1100,
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await createPuzzle({
        session_date:  values.date,
        count:         values.count,
        accuracy:      values.accuracy,
        minutes:       values.minutes,
        puzzle_rating: values.rating,
        notes:         values.notes ?? null,
      });
      if (res.success && res.data) {
        onSaved(res.data);
        reset({
          date: todayISO(),
          count: 10,
          accuracy: 80,
          minutes: 15,
          rating: values.rating,
          notes: "",
        });
        onOpenChange(false);
      } else {
        setErrorMsg(res.error ?? "Could not save the session.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <div className="relative bg-white border border-gold/55 rounded-sm shadow-[0_40px_100px_-40px_rgba(17,17,17,0.5)] px-7 py-8 md:px-9 md:py-10">
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

            <div className="text-center mb-6">
              <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-[11px] mb-2">
                Today&apos;s Tactics
              </p>
              <DialogPrimitive.Title className="font-display text-2xl md:text-[1.6rem] text-ink leading-tight">
                Log puzzles today
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="font-serif-quote italic text-ink/60 text-sm mt-2">
                Even ten puzzles a day adds up to mastery.
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {errorMsg && (
                <div className="bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive font-sans rounded-sm">
                  {errorMsg}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  id="date"
                  label="Date"
                  type="date"
                  register={register("date")}
                  error={errors.date?.message}
                />
                <Field
                  id="count"
                  label="Puzzles"
                  type="number"
                  placeholder="10"
                  register={register("count", { valueAsNumber: true })}
                  error={errors.count?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  id="accuracy"
                  label="Accuracy %"
                  type="number"
                  placeholder="80"
                  register={register("accuracy", { valueAsNumber: true })}
                  error={errors.accuracy?.message}
                />
                <Field
                  id="minutes"
                  label="Minutes"
                  type="number"
                  placeholder="15"
                  register={register("minutes", { valueAsNumber: true })}
                  error={errors.minutes?.message}
                />
              </div>

              <Field
                id="rating"
                label="Puzzle Rating"
                type="number"
                placeholder="1100"
                register={register("rating", { valueAsNumber: true })}
                error={errors.rating?.message}
                emphasized
              />

              <div>
                <label
                  htmlFor="notes"
                  className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5"
                >
                  Notes{" "}
                  <span className="text-ink/35 normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  placeholder="Themes drilled, motifs spotted, blunders to remember…"
                  {...register("notes")}
                  className="w-full bg-ivory/60 border border-gold/30 px-3.5 py-2.5 text-[14px] text-ink font-sans placeholder:text-ink/35 placeholder:italic rounded-sm focus:outline-none focus:border-emerald transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex-1 inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Session
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

type RegisterReturn = ReturnType<ReturnType<typeof useForm>["register"]>;

function Field({
  id,
  label,
  type = "text",
  placeholder,
  register,
  error,
  emphasized,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  register: RegisterReturn;
  error?: string;
  emphasized?: boolean;
}) {
  return (
    <div>
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
        className={`w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-ink font-sans focus:outline-none focus:border-emerald transition-colors ${
          emphasized
            ? "font-display text-2xl text-emerald placeholder:text-ink/25 placeholder:font-sans placeholder:text-base"
            : "text-[15px] placeholder:text-ink/30"
        }`}
      />
      {error && (
        <p className="text-[12px] text-destructive mt-1 font-sans">{error}</p>
      )}
    </div>
  );
}
