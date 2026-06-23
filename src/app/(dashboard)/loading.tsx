// Cascades to every dashboard route — shows while the page's data fetches.

export default function DashboardLoading() {
  return (
    <div className="relative bg-ivory min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div className="space-y-3 border-b border-gold/30 pb-6">
          <div className="h-3 w-32 bg-gold/30 rounded" />
          <div className="h-10 w-80 bg-ink/10 rounded" />
          <div className="h-4 w-72 bg-ink/10 rounded" />
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-white border border-gold/30 rounded-sm"
            />
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="h-80 bg-white border border-gold/30 rounded-sm" />

        {/* Subtle hint at bottom */}
        <div className="text-center pt-6">
          <span
            className="font-display text-4xl text-gold-deep/40 leading-none"
            aria-hidden="true"
          >
            ♕
          </span>
          <p className="mt-3 font-serif-quote italic text-gold-deep/60 tracking-[0.28em] uppercase text-[11px]">
            Turning the page…
          </p>
        </div>
      </div>
    </div>
  );
}
