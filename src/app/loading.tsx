// Root-level fallback while any segment is loading.
// Kept lightweight — most segments have their own loading.tsx.

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory">
      <div className="text-center">
        <span
          className="font-display text-6xl text-emerald animate-pulse leading-none"
          aria-hidden="true"
        >
          ♕
        </span>
        <p className="mt-4 font-serif-quote italic text-gold-deep tracking-[0.28em] uppercase text-[11px]">
          Opening the journal…
        </p>
      </div>
    </div>
  );
}
