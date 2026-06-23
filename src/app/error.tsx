"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in dev / hosting logs; production-grade monitoring lands later.
    console.error("Root error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory px-6">
      <div className="relative bg-white border border-gold/55 rounded-sm shadow-[0_40px_100px_-40px_rgba(17,17,17,0.4)] px-7 py-9 md:px-10 md:py-11 max-w-md w-full text-center">
        <span className="absolute top-2 left-2 size-2.5 border-t border-l border-gold-deep/55" />
        <span className="absolute top-2 right-2 size-2.5 border-t border-r border-gold-deep/55" />
        <span className="absolute bottom-2 left-2 size-2.5 border-b border-l border-gold-deep/55" />
        <span className="absolute bottom-2 right-2 size-2.5 border-b border-r border-gold-deep/55" />

        <span className="font-display text-6xl text-gold-deep leading-none" aria-hidden="true">
          ♚
        </span>

        <p className="mt-5 font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-[11px]">
          A Pause in the Game
        </p>
        <h1 className="mt-2 font-display text-2xl text-ink leading-tight">
          Something went wrong
        </h1>
        <p className="mt-4 font-serif-quote italic text-[13.5px] text-ink/65 leading-relaxed">
          Even grandmasters lose track of a move. The board is still set —
          let&apos;s try again.
        </p>

        {error?.digest && (
          <p className="mt-3 text-[10px] tracking-[0.22em] uppercase text-ink/40 font-mono">
            #{error.digest}
          </p>
        )}

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="group inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-5 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors"
          >
            Try Again
            <span
              className="text-gold transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              →
            </span>
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-3 text-[12px] tracking-[0.26em] uppercase text-ink/65 hover:text-emerald transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
