"use client";

import { useState } from "react";
import { useInView } from "@/lib/useInView";
import { AnimatedStat } from "./AnimatedStat";
import { CircuitBoard } from "./CircuitBoard";
import { BobCaseFile } from "./BobCaseFile";
import { CARD, BOB_SITE_URL, BOB_SITE_SSL_OK } from "@/content/bobCaseFile";

export function BobConsole() {
  const { ref, inView } = useInView<HTMLDivElement>(0.35);
  const [open, setOpen] = useState(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  return (
    <>
      <div
        ref={ref}
        className="relative isolate cursor-pointer overflow-hidden rounded-sm border border-pcb-trace bg-pcb-bg px-6 py-7 transition-colors hover:border-pcb-green/60 has-[button:focus-visible]:border-pcb-green sm:px-8 sm:py-8"
      >
        <CircuitBoard active={inView} />
        {/* The whole card opens the case file; the live-site link sits above it. */}
        <button
          type="button"
          aria-label="Open the Bob The Tech Guy case file"
          onClick={() => {
            setOriginRect(ref.current?.getBoundingClientRect() ?? null);
            setOpen(true);
          }}
          className="absolute inset-0 z-[1] cursor-pointer outline-none"
        />
        <div className="relative">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div>
              <p className="font-mono text-xs tracking-wider text-pcb-green">{CARD.label}</p>
              <h3 className="mt-1 font-display text-xl sm:text-2xl text-pcb-text">{CARD.title}</h3>
            </div>
            <p className="font-mono text-xs tracking-wider text-pcb-text/60">{CARD.dates}</p>
          </div>

          <p className="mb-7 max-w-xl font-display text-sm sm:text-base leading-relaxed text-pcb-text/90">
            {CARD.summary}
          </p>

          <div className="mb-7 grid gap-x-8 sm:grid-cols-2">
            {CARD.stats.map((s) =>
              s.text ? (
                <div
                  key={s.label}
                  className="flex items-baseline justify-between border-b border-pcb-trace py-3 last:border-b-0 sm:border-b-0 sm:py-0"
                >
                  <span className="font-mono text-xs tracking-wider text-pcb-text/70">{s.label}</span>
                  <span className="font-mono text-lg sm:text-xl text-pcb-green">{s.text}</span>
                </div>
              ) : (
                <AnimatedStat key={s.label} label={s.label} value={s.value ?? 0} trigger={inView} tone="green" />
              )
            )}
          </div>

          <div className="mb-7 flex flex-wrap gap-2 font-mono text-xs tracking-wider text-pcb-text/70">
            {CARD.tags.map((t) => (
              <span key={t} className="rounded-sm border border-pcb-trace px-2 py-1">
                {t}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={BOB_SITE_URL}
              aria-describedby={BOB_SITE_SSL_OK ? undefined : "bob-ssl-note"}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-[2] font-mono text-xs tracking-wider text-pcb-text/80 underline-offset-4 outline-none hover:underline focus-visible:underline"
            >
              &#8599; visit the live site
            </a>
            {!BOB_SITE_SSL_OK && (
              <span id="bob-ssl-note" className="font-mono text-[10px] tracking-wider text-pcb-text/70">
                SSL certificate pending — the browser may warn you
              </span>
            )}
          </div>
        </div>
      </div>
      <BobCaseFile open={open} onClose={() => setOpen(false)} originRect={originRect} />
    </>
  );
}
