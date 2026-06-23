"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { createStudySession } from "@/features/study/actions";
import type { StudyKind, StudySessionRow } from "@/types/database";

const KINDS: { value: StudyKind; label: string; piece: string }[] = [
  { value: "opening",     label: "Openings",   piece: "♔" },
  { value: "endgame",     label: "Endgames",   piece: "♚" },
  { value: "tactics",     label: "Tactics",    piece: "♘" },
  { value: "video",       label: "Video",      piece: "♗" },
  { value: "book",        label: "Book",       piece: "♖" },
  { value: "game_review", label: "Game Review", piece: "♕" },
];

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const schema = z.object({
  entry_date: z.string().min(1, "Date required."),
  minutes:    z.number({ message: "Enter minutes." }).int().min(1).max(600),
  topic:      z.string().max(120).optional(),
  notes:      z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

export function LogStudyModal({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (row: StudySessionRow) => void;
}) {
  const [kind, setKind] = useState<StudyKind>("opening");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { entry_date: todayISO(), minutes: 30, topic: "", notes: "" },
  });

  const onSubmit = async (v: FormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await createStudySession({
        entry_date: v.entry_date,
        kind,
        minutes: v.minutes,
        topic: v.topic || null,
        notes: v.notes || null,
      });
      if (res.success && res.data) {
        onSaved(res.data);
        reset();
        setKind("opening");
        onOpenChange(false);
      } else {
        setErrorMsg(res.error ?? "Could not save.");
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
              <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-[11px] mb-2">Today's Study</p>
              <DialogPrimitive.Title className="font-display text-2xl md:text-[1.6rem] text-ink leading-tight">
                Log a study session
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="font-serif-quote italic text-ink/60 text-sm mt-2">
                Books, videos, openings drilled — they all count.
              </DialogPrimitive.Description>
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-gold-deep/45" />
                <span className="font-display text-base text-gold-deep leading-none">❦</span>
                <span className="h-px w-10 bg-gold-deep/45" />
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive rounded-sm">{errorMsg}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <p className="text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-2">Kind</p>
                <div className="grid grid-cols-3 gap-2">
                  {KINDS.map((k) => {
                    const active = kind === k.value;
                    return (
                      <button
                        key={k.value}
                        type="button"
                        onClick={() => setKind(k.value)}
                        className={`flex flex-col items-center gap-1 px-2 py-2.5 border rounded-sm transition-colors ${
                          active
                            ? "bg-emerald text-ivory border-gold"
                            : "bg-ivory/60 border-gold/30 text-ink hover:border-emerald"
                        }`}
                      >
                        <span className={`font-display text-xl leading-none ${active ? "text-gold" : "text-gold-deep"}`} aria-hidden="true">{k.piece}</span>
                        <span className="text-[10px] tracking-[0.18em] uppercase">{k.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="entry_date" className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5">Date</label>
                  <input id="entry_date" type="date" {...register("entry_date")} className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink focus:outline-none focus:border-emerald transition-colors" />
                </div>
                <div>
                  <label htmlFor="minutes" className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5">Minutes</label>
                  <input id="minutes" type="number" placeholder="30" {...register("minutes", { valueAsNumber: true })} className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 font-display text-2xl text-emerald focus:outline-none focus:border-emerald transition-colors" />
                  {errors.minutes && <p className="text-[12px] text-destructive mt-1">{errors.minutes.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="topic" className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5">Topic <span className="text-ink/35 normal-case tracking-normal">(optional)</span></label>
                <input id="topic" type="text" placeholder="King's Indian Defense, rook endgames…" {...register("topic")} className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink placeholder:text-ink/30 focus:outline-none focus:border-emerald transition-colors" />
              </div>

              <div>
                <label htmlFor="notes" className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5">Notes <span className="text-ink/35 normal-case tracking-normal">(optional)</span></label>
                <textarea id="notes" rows={2} placeholder="What clicked, what to drill next…" {...register("notes")} className="w-full bg-ivory/60 border border-gold/30 px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink/35 placeholder:italic rounded-sm focus:outline-none focus:border-emerald transition-colors resize-none" />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={submitting} className="group flex-1 inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep disabled:opacity-60 transition-colors">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Session
                  <span className="text-gold transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
                </button>
                <DialogPrimitive.Close className="px-5 py-3 text-[12px] tracking-[0.22em] uppercase text-ink/65 hover:text-emerald transition-colors">Cancel</DialogPrimitive.Close>
              </div>
            </form>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
