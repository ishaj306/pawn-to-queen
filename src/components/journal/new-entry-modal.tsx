"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { createJournalEntry } from "@/features/journal/actions";
import type {
  JournalKind,
  JournalMood,
  JournalRow,
} from "@/types/database";

const KINDS: { value: JournalKind; label: string }[] = [
  { value: "lesson",     label: "Lesson" },
  { value: "mistake",    label: "Mistake" },
  { value: "tournament", label: "Tournament" },
  { value: "thought",    label: "Thought" },
  { value: "daily",      label: "Daily" },
];

const MOODS: { value: JournalMood; label: string; piece: string }[] = [
  { value: "focused",     label: "Focused",     piece: "♕" },
  { value: "curious",     label: "Curious",     piece: "♘" },
  { value: "excited",     label: "Excited",     piece: "♖" },
  { value: "calm",        label: "Calm",        piece: "♗" },
  { value: "tired",       label: "Tired",       piece: "♙" },
  { value: "frustrated",  label: "Frustrated",  piece: "♔" },
];

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const schema = z.object({
  entry_date: z.string().min(1, "Date required."),
  kind:       z.enum(["lesson", "mistake", "tournament", "thought", "daily"]),
  title:      z.string().max(120).optional(),
  body:       z.string().min(1, "Write at least a line.").max(4000, "Keep under 4000 characters."),
});
type FormValues = z.infer<typeof schema>;

export function NewJournalModal({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (row: JournalRow) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [kind, setKind] = useState<JournalKind>("lesson");
  const [mood, setMood] = useState<JournalMood | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { entry_date: todayISO(), kind: "lesson", title: "", body: "" },
  });

  const onSubmit = async (v: FormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await createJournalEntry({
        entry_date: v.entry_date,
        kind,
        title: v.title || null,
        body: v.body,
        mood,
      });
      if (res.success && res.data) {
        onSaved(res.data);
        reset();
        setKind("lesson");
        setMood(null);
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
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <div className="relative bg-white border border-gold/55 rounded-sm shadow-[0_40px_100px_-40px_rgba(17,17,17,0.5)] px-7 py-8 md:px-9 md:py-10 max-h-[90vh] overflow-y-auto scroll-luxury">
            <span className="absolute top-2 left-2 size-2.5 border-t border-l border-gold-deep/55" />
            <span className="absolute top-2 right-2 size-2.5 border-t border-r border-gold-deep/55" />
            <span className="absolute bottom-2 left-2 size-2.5 border-b border-l border-gold-deep/55" />
            <span className="absolute bottom-2 right-2 size-2.5 border-b border-r border-gold-deep/55" />

            <DialogPrimitive.Close className="absolute top-4 right-4 size-8 flex items-center justify-center text-ink/55 hover:text-emerald transition-colors" aria-label="Close">
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>

            <div className="text-center mb-6">
              <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-[11px] mb-2">
                A page in the journal
              </p>
              <DialogPrimitive.Title className="font-display text-2xl md:text-[1.6rem] text-ink leading-tight">
                New entry
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="font-serif-quote italic text-ink/60 text-sm mt-2">
                What did chess teach you today?
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
              {/* Kind segmented */}
              <div>
                <p className="text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-2">Kind</p>
                <div className="grid grid-cols-5 gap-1 p-1 bg-ivory border border-gold/40 rounded-sm">
                  {KINDS.map((k) => {
                    const active = kind === k.value;
                    return (
                      <button
                        key={k.value}
                        type="button"
                        onClick={() => setKind(k.value)}
                        className={`px-1 py-1.5 text-[10px] tracking-[0.2em] uppercase rounded-sm transition-colors ${active ? "bg-emerald text-ivory" : "text-ink/65 hover:text-emerald"}`}
                      >
                        {k.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="entry_date" className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5">Date</label>
                  <input
                    id="entry_date"
                    type="date"
                    {...register("entry_date")}
                    className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink focus:outline-none focus:border-emerald transition-colors"
                  />
                  {errors.entry_date && <p className="text-[12px] text-destructive mt-1">{errors.entry_date.message}</p>}
                </div>
                <div>
                  <label htmlFor="title" className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5">Title <span className="text-ink/35 normal-case tracking-normal">(optional)</span></label>
                  <input
                    id="title"
                    type="text"
                    placeholder="A single line"
                    {...register("title")}
                    className="w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink placeholder:text-ink/30 focus:outline-none focus:border-emerald transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="body" className="block text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-1.5">Entry</label>
                <textarea
                  id="body"
                  rows={6}
                  placeholder="A pattern I keep falling into… A line worth memorising… The hardest position of the day…"
                  {...register("body")}
                  className="w-full bg-ivory/60 border border-gold/30 px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink/35 placeholder:italic placeholder:font-serif-quote rounded-sm focus:outline-none focus:border-emerald transition-colors resize-none"
                />
                {errors.body && <p className="text-[12px] text-destructive mt-1">{errors.body.message}</p>}
              </div>

              <div>
                <p className="text-[10px] tracking-[0.24em] uppercase text-ink/60 font-medium mb-2">Mood <span className="text-ink/35 normal-case tracking-normal">(optional)</span></p>
                <div className="grid grid-cols-3 gap-2">
                  {MOODS.map((m) => {
                    const active = mood === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMood(active ? null : m.value)}
                        className={`relative flex items-center gap-2 px-3 py-2 border rounded-sm transition-colors text-left ${
                          active
                            ? "bg-emerald text-ivory border-gold"
                            : "bg-ivory/60 border-gold/30 text-ink hover:border-emerald"
                        }`}
                      >
                        <span className={`font-display text-xl leading-none ${active ? "text-gold" : "text-gold-deep"}`} aria-hidden="true">{m.piece}</span>
                        <span className="text-[11px] tracking-[0.18em] uppercase">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex-1 inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep disabled:opacity-60 transition-colors"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Entry
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
