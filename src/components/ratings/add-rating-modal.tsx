"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { createRatingEntry } from "@/features/ratings/actions";
import {
  encodeFormatInNotes,
  RATING_FORMATS,
  type RatingFormat,
} from "@/lib/rating-format";

// ─────────────────────────────────────────────────────────────
//  Add Rating Entry — luxury journal modal
// ─────────────────────────────────────────────────────────────

const PIECES = {
  king: "♔",
  queen: "♕",
  rook: "♖",
  bishop: "♗",
  knight: "♘",
  pawn: "♙",
};

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const schema = z.object({
  rating: z
    .number({ message: "Enter your rating." })
    .int("Whole numbers only.")
    .min(100, "Rating must be at least 100.")
    .max(3500, "That can't be right."),
  entry_date: z.string().min(1, "Date is required."),
  notes: z.string().max(500, "Keep notes under 500 characters.").optional(),
});

type FormValues = z.infer<typeof schema>;

export function AddRatingModal({
  open,
  onOpenChange,
  defaultFormat = "Rapid",
  defaultRating,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFormat?: RatingFormat;
  defaultRating?: number;
  onSaved?: () => void;
}) {
  const [format, setFormat] = useState<RatingFormat>(defaultFormat);
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
      rating: defaultRating,
      entry_date: todayISO(),
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await createRatingEntry({
        rating: values.rating,
        entry_date: values.entry_date,
        notes: encodeFormatInNotes(format, values.notes ?? ""),
      });
      if (res.success) {
        reset({ rating: undefined, entry_date: todayISO(), notes: "" });
        setFormat(defaultFormat);
        onSaved?.();
        onOpenChange(false);
      } else {
        setErrorMsg(res.error || "Could not save your entry.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
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
            {/* Corner ornaments */}
            <span className="absolute top-2 left-2 size-2.5 border-t border-l border-gold-deep/55" />
            <span className="absolute top-2 right-2 size-2.5 border-t border-r border-gold-deep/55" />
            <span className="absolute bottom-2 left-2 size-2.5 border-b border-l border-gold-deep/55" />
            <span className="absolute bottom-2 right-2 size-2.5 border-b border-r border-gold-deep/55" />

            {/* Close */}
            <DialogPrimitive.Close
              className="absolute top-4 right-4 size-8 flex items-center justify-center text-ink/55 hover:text-emerald transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>

            {/* Header */}
            <div className="text-center mb-6">
              <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-[11px] mb-2">
                New Entry
              </p>
              <DialogPrimitive.Title className="font-display text-2xl md:text-[1.6rem] text-ink leading-tight">
                Mark your rating
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="font-serif-quote italic text-ink/60 text-sm mt-2">
                Every point worth writing down.
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

            {errorMsg && (
              <div className="mb-4 bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive rounded-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Format segmented control */}
              <div>
                <p className="text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-2">
                  Format
                </p>
                <div className="flex gap-1 p-1 bg-ivory border border-gold/40 rounded-sm">
                  {RATING_FORMATS.map((f) => {
                    const active = f === format;
                    return (
                      <button
                        type="button"
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`flex-1 px-2 py-1.5 text-[11px] tracking-[0.22em] uppercase transition-colors rounded-sm ${
                          active
                            ? "bg-emerald text-ivory"
                            : "text-ink/65 hover:text-emerald"
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating + Date row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="rating"
                    className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5"
                  >
                    Rating
                  </label>
                  <input
                    id="rating"
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 850"
                    {...register("rating", { valueAsNumber: true })}
                    className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 font-display text-2xl text-emerald placeholder:text-ink/25 placeholder:font-sans placeholder:text-base focus:outline-none focus:border-emerald transition-colors"
                  />
                  {errors.rating && (
                    <p className="text-[12px] text-destructive mt-1">
                      {errors.rating.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="entry_date"
                    className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5"
                  >
                    Date
                  </label>
                  <input
                    id="entry_date"
                    type="date"
                    {...register("entry_date")}
                    className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink focus:outline-none focus:border-emerald transition-colors"
                  />
                  {errors.entry_date && (
                    <p className="text-[12px] text-destructive mt-1">
                      {errors.entry_date.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
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
                  placeholder="What changed? A new opening, an over-the-board game, a tough loss…"
                  {...register("notes")}
                  className="w-full bg-ivory/60 border border-gold/30 px-3.5 py-2.5 text-[14px] text-ink font-sans placeholder:text-ink/35 placeholder:italic placeholder:font-serif-quote rounded-sm focus:outline-none focus:border-emerald transition-colors resize-none"
                />
                {errors.notes && (
                  <p className="text-[12px] text-destructive mt-1">
                    {errors.notes.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex-1 inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Entry
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
                className="pt-3 flex justify-center text-gold-deep/55"
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
