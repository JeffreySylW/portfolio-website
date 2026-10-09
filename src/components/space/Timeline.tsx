"use client";

import { BODIES, TIMELINE, type SpaceBody } from "@/content/space";
import { markIn } from "@/components/Reveal";
import { ScrambleHeading } from "@/components/ScrambleHeading";
import { useOnEnter } from "@/lib/useInView";
import type { CSSProperties } from "react";

function lightUp(li: HTMLElement) {
  markIn(li);
  li.querySelector("[data-dot]")?.setAttribute("data-active", "");
}

function Item({ b, i, onSelect }: { b: SpaceBody; i: number; onSelect?: (id: string) => void }) {
  const ref = useOnEnter<HTMLLIElement>(lightUp, 0.5);
  const dot = "tl-dot absolute -left-[36px] mt-2 h-2.5 w-2.5 rounded-full";
  return (
    <li ref={ref} className="reveal relative mb-10" style={{ "--i": Math.min(i, 3) } as CSSProperties}>
      {onSelect ? (
        <button
          type="button"
          data-dot
          onClick={() => onSelect(b.id)}
          aria-label={`Open ${b.name}`}
          className={`${dot} outline-none ring-sky-300 focus-visible:ring-2`}
        />
      ) : (
        <span data-dot aria-hidden="true" className={dot} />
      )}
      <p className="font-mono text-[11px] text-slate-400">{b.dates}</p>
      <h3 className="mt-1 font-display text-xl text-slate-100">{b.name}</h3>
      <p className="mt-1 text-sm text-sky-300">{b.subtitle}</p>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{b.summary}</p>
    </li>
  );
}

export function Timeline({ onSelect }: { onSelect?: (id: string) => void }) {
  const items = TIMELINE.map((id) => BODIES.find((b) => b.id === id)).filter(Boolean) as SpaceBody[];
  return (
    <section id="timeline" aria-labelledby="timeline-heading" className="mx-auto max-w-3xl px-6 py-16">
      <ScrambleHeading id="timeline-heading" text="experience, newest first" className="font-mono text-xs tracking-wider text-sky-300" />
      <ol className="relative mt-8 pl-8">
        <span aria-hidden="true" className="absolute left-0 top-0 h-full w-px bg-slate-700" />
        <span aria-hidden="true" className="tl-line absolute left-0 top-0 h-full w-px bg-sky-300/80" />
        {items.map((b, i) => (
          <Item key={b.id} b={b} i={i} onSelect={onSelect} />
        ))}
      </ol>
    </section>
  );
}
