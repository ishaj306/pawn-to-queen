import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory px-6">
      <div className="relative bg-white border border-gold/55 rounded-sm shadow-[0_40px_100px_-40px_rgba(17,17,17,0.4)] px-7 py-9 md:px-10 md:py-11 max-w-md w-full text-center">
        <span className="absolute top-2 left-2 size-2.5 border-t border-l border-gold-deep/55" />
        <span className="absolute top-2 right-2 size-2.5 border-t border-r border-gold-deep/55" />
        <span className="absolute bottom-2 left-2 size-2.5 border-b border-l border-gold-deep/55" />
        <span className="absolute bottom-2 right-2 size-2.5 border-b border-r border-gold-deep/55" />

        <span className="font-display text-7xl text-emerald leading-none" aria-hidden="true">
          ♟
        </span>

        <p className="mt-5 font-serif-quote italic text-gold-deep tracking-[0.32em] uppercase text-[11px]">
          A Page Not In This Book
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink leading-tight">
          404
        </h1>
        <p className="mt-4 font-serif-quote italic text-[14px] text-ink/65 leading-relaxed">
          Even pawns get lost on the board. This square doesn&apos;t exist —
          but the rest of the journal is open.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="group inline-flex items-center justify-center gap-2.5 bg-emerald text-ivory px-5 py-3 text-[12px] tracking-[0.26em] uppercase hover:bg-emerald-deep transition-colors"
          >
            Back to Dashboard
            <span
              className="text-gold transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-3 text-[12px] tracking-[0.26em] uppercase text-ink/65 hover:text-emerald transition-colors"
          >
            To the Landing
          </Link>
        </div>
      </div>
    </div>
  );
}
