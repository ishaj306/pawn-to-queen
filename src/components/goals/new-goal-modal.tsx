"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { createGoal } from "@/features/goals/actions";
import type { GoalMetric, GoalRow } from "@/types/database";

const METRICS: { value: GoalMetric; label: string; piece: string; placeholder: string; suggestedTitle: string }[] = [
  { value: "rating",         label: "Rating",      piece: "♕", placeholder: "1500", suggestedTitle: "Reach 1500 Rating" },
  { value: "puzzles",        label: "Puzzles",     piece: "♘", placeholder: "100",  suggestedTitle: "Solve 100 Puzzles" },
  { value: "games",          label: "Games",       piece: "♖", placeholder: "20",   suggestedTitle: "Play 20 Games" },
  { value: "streak",         label: "Streak",      piece: "♗", placeholder: "30",   suggestedTitle: "30-Day Streak" },
  { value: "study_minutes",  label: "Study Minutes", piece: "♙", placeholder: "300", suggestedTitle: "Study 300 Minutes" },
];

const schema = z.object({
  title:        z.string().min(2, "Give your goal a name.").max(80),
  target_value: z.number({ message: "Enter a target." }).int().min(1).max(100000),
  due_date:     z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function NewGoalModal({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (row: GoalRow) => void;
}) {
  const [metric, setMetric] = useState<GoalMetric>("rating");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const meta = METRICS.find((m) => m.value === metric)!;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: meta.suggestedTitle, target_value: parseInt(meta.placeholder), due_date: "" },
  });

  const onMetricChange = (m: GoalMetric) => {
    setMetric(m);
    const next = METRICS.find((x) => x.value === m)!;
    setValue("title", next.suggestedTitle);
    setValue("target_value", parseInt(next.placeholder));
  };

  const onSubmit = async (v: FormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await createGoal({
        title: v.title,
        metric,
        target_value: v.target_value,
        due_date: v.due_date || null,
      });
      if (res.success && res.data) {
        onSaved(res.data);
        reset();
        setMetric("rating");
        onOpenChange(false);
      } else {
        setErrorMsg(res.error ?? "Could not create goal.");
      }
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

            <DialogPrimitive.Close className="absolute top-4 right-4 size-8 flex items-center justify-center text-ink/55 hover:text-emerald transition-colors" aria-label="Close">
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>

            <div className="text-center mb-6">
              <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-[11px] mb-2">A worthy aim</p>
              <DialogPrimitive.Title className="font-display text-2xl md:text-[1.6rem] text-ink leading-tight">
                Set a new goal
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="font-serif-quote italic text-ink/60 text-sm mt-2">
                Name the target. Pawn to Queen tracks the rest.
              </DialogPrimitive.Description>
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-gold-deep/45" />
                <span className="font-display text-base text-gold-deep leading-none">❦</span>
                <span className="h-px w-10 bg-gold-deep/45" />
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive rounded-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <p className="text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-2">Metric</p>
                <div className="grid grid-cols-5 gap-1 p-1 bg-ivory border border-gold/40 rounded-sm">
                  {METRICS.map((m) => {
                    const active = metric === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => onMetricChange(m.value)}
                        className={`flex flex-col items-center gap-1 px-1 py-2 text-[9px] tracking-[0.18em] uppercase rounded-sm transition-colors ${active ? "bg-emerald text-ivory" : "text-ink/65 hover:text-emerald"}`}
                      >
                        <span className={`font-display text-base leading-none ${active ? "text-gold" : "text-gold-deep"}`} aria-hidden="true">{m.piece}</span>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="title" className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5">Title</label>
                <input
                  id="title"
                  type="text"
                  {...register("title")}
                  className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink focus:outline-none focus:border-emerald transition-colors"
                />
                {errors.title && <p className="text-[12px] text-destructive mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="target_value" className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5">Target</label>
                  <input
                    id="target_value"
                    type="number"
                    placeholder={meta.placeholder}
                    {...register("target_value", { valueAsNumber: true })}
                    className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 font-display text-2xl text-emerald focus:outline-none focus:border-emerald transition-colors"
                  />
                  {errors.target_value && <p className="text-[12px] text-destructive mt-1">{errors.target_value.message}</p>}
                </div>
                <div>
                  <label htmlFor="due_date" className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5">Due <span className="text-ink/35 normal-case tracking-normal">(optional)</span></label>
                  <input
                    id="due_date"
                    type="date"
                    {...register("due_date")}
                    className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink focus:outline-none focus:border-emerald transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={submitting} className="group flex-1 inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep disabled:opacity-60 transition-colors">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Goal
                  <span className="text-gold transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
                </button>
                <DialogPrimitive.Close className="px-5 py-3 text-[12px] tracking-[0.22em] uppercase text-ink/65 hover:text-emerald transition-colors">
                  Cancel
                </DialogPrimitive.Close>
              </div>
            </form>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
