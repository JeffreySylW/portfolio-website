import { BODIES, TIMELINE, type SpaceBody } from "@/content/space";

export function Timeline({ onSelect }: { onSelect?: (id: string) => void }) {
  const items = TIMELINE.map((id) => BODIES.find((b) => b.id === id)).filter(Boolean) as SpaceBody[];
  return (
    <section id="timeline" aria-labelledby="timeline-heading" className="mx-auto max-w-3xl px-6 py-16">
      <h2 id="timeline-heading" className="font-mono text-xs tracking-wider text-sky-300">experience, newest first</h2>
      <ol className="relative mt-8 border-l border-slate-700 pl-8">
        {items.map((b) => (
          <li key={b.id} className="relative mb-10">
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(b.id)}
                aria-label={`Open ${b.name}`}
                className="absolute -left-[37px] mt-2 h-2.5 w-2.5 rounded-full bg-sky-300 outline-none ring-sky-300 focus-visible:ring-2"
              />
            ) : (
              <span aria-hidden="true" className="absolute -left-[37px] mt-2 h-2.5 w-2.5 rounded-full bg-sky-300" />
            )}
            <p className="font-mono text-[11px] text-slate-400">{b.dates}</p>
            <h3 className="mt-1 font-display text-xl text-slate-100">{b.name}</h3>
            <p className="mt-1 text-sm text-sky-300">{b.subtitle}</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{b.summary}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
