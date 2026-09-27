export function Hero() {
  return (
    <section
      id="top"
      className="relative mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28"
    >
      <div
        aria-hidden="true"
        className="bg-grid-paper pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 sm:h-96"
      />
      <p className="flex items-center gap-2 font-mono text-xs tracking-wider text-signal mb-4">
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full bg-signal animate-pulse"
        />
        STATUS: VCU alumni (May 2026) &middot; seeking software engineering roles
      </p>
      <h1 className="font-display text-4xl sm:text-6xl font-medium tracking-tight text-ink">
        Jeffrey Weaver
      </h1>
      <p className="mt-3 font-serif text-xl sm:text-2xl italic text-ink-soft">
        Software Engineer &mdash; Richmond, VA
      </p>
      <p className="mt-6 max-w-xl font-serif text-base sm:text-lg leading-relaxed text-ink-soft">
        Full-stack development and machine learning, most recently built and
        shipped at NASA Langley Research Center.
      </p>
    </section>
  );
}
