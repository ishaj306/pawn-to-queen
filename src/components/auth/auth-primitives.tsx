"use client";

import React from "react";
import { Loader2 } from "lucide-react";

import { Fleur, PIECES } from "@/components/auth/auth-shell";

// ─────────────────────────────────────────────────────────────
//  In-card primitives shared across Sign In / Sign Up / Reset
// ─────────────────────────────────────────────────────────────

export function JournalCard({
  children,
  title,
  eyebrow,
}: {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
}) {
  return (
    <div className="relative bg-white border border-gold/50 rounded-sm shadow-[0_30px_80px_-40px_rgba(17,17,17,0.4)] px-7 py-9 md:px-10 md:py-11">
      <span className="absolute top-2 left-2 size-2.5 border-t border-l border-gold-deep/55" />
      <span className="absolute top-2 right-2 size-2.5 border-t border-r border-gold-deep/55" />
      <span className="absolute bottom-2 left-2 size-2.5 border-b border-l border-gold-deep/55" />
      <span className="absolute bottom-2 right-2 size-2.5 border-b border-r border-gold-deep/55" />

      <div className="text-center mb-7">
        {eyebrow && (
          <p className="font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-[11px] mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl md:text-[2.1rem] text-ink leading-tight">
          {title}
        </h1>
        <div className="mt-5 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-gold-deep/60" />
          <Fleur className="size-3.5 text-gold-deep" />
          <span className="h-px w-10 bg-gold-deep/60" />
        </div>
      </div>

      {children}
    </div>
  );
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] tracking-[0.22em] uppercase font-medium text-ink/65"
    >
      {children}
    </label>
  );
}

export const JournalInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function JournalInput({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={`mt-1.5 w-full h-11 bg-transparent border-0 border-b border-ink/25 px-0 text-[15px] text-ink font-sans placeholder:text-ink/30 focus:outline-none focus:border-emerald focus:ring-0 transition-colors ${className}`}
    />
  );
});

export function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] text-destructive font-sans -mt-3">{children}</p>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-destructive/8 border border-destructive/25 px-4 py-3 text-[13px] text-destructive font-sans rounded-sm">
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  disabled,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="group w-full mt-2 inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-6 py-3.5 text-[12px] tracking-[0.28em] uppercase hover:bg-emerald-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {children}
      <span
        className="text-gold transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      >
        →
      </span>
    </button>
  );
}

export function GoogleButton({
  onClick,
  disabled,
  loading,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full inline-flex items-center justify-center gap-3 bg-white border border-ink/80 text-ink px-6 py-3.5 text-[12px] tracking-[0.24em] uppercase hover:bg-ink hover:text-ivory transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <GoogleIcon className="size-4" />
      )}
      {label}
    </button>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <span className="h-px flex-1 bg-gold/45" />
      <span className="text-[10px] tracking-[0.32em] uppercase text-gold-deep">
        Or
      </span>
      <span className="h-px flex-1 bg-gold/45" />
    </div>
  );
}

export function CardFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-7 pt-5 border-t border-gold/35 text-center">
      <p className="text-[13px] text-ink/65 font-sans">{children}</p>
      <div
        className="mt-3 flex justify-center text-gold-deep/70"
        aria-hidden="true"
      >
        <span className="font-display text-base">{PIECES.pawn}</span>
      </div>
    </div>
  );
}
