"use client";

import { useState } from "react";
import { useInView } from "@/lib/useInView";
import { AnimatedStat } from "./AnimatedStat";
import { PixelSpaceBackground } from "./PixelSpaceBackground";
import { NasaMissionLog } from "./NasaMissionLog";

export function NasaConsole() {
  const { ref, inView } = useInView<HTMLButtonElement>(0.35);
  const [open, setOpen] = useState(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  const handleOpen = () => {
    setOriginRect(ref.current?.getBoundingClientRect() ?? null);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        ref={ref}
        onClick={handleOpen}
        className={`group relative block w-full overflow-hidden rounded-sm border border-console-grid bg-console-bg px-6 py-7 sm:px-8 sm:py-8 text-left transition-opacity duration-500 outline-none focus-visible:border-console-amber ${
          inView ? "opacity-100" : "opacity-90"
        }`}
      >
        <PixelSpaceBackground />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 bg-console-amber transition-opacity ${
            inView ? "opacity-0 duration-700" : "opacity-0"
          }`}
          style={{
            transitionDelay: inView ? "0ms" : undefined,
            animation: inView ? "console-flicker 700ms ease-out" : undefined,
          }}
        />

        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-6">
          <div>
            <p className="font-mono text-xs tracking-wider text-console-amber">
              AMENTUM // NASA LANGLEY RESEARCH CENTER
            </p>
            <h3 className="mt-1 font-display text-xl sm:text-2xl text-console-text">
              Software Engineering Intern
            </h3>
          </div>
          <p className="font-mono text-xs tracking-wider text-console-text/60">
            MAY 2025 &ndash; AUG 2025
          </p>
        </div>

        <p className="max-w-xl font-display text-sm sm:text-base leading-relaxed text-console-text/90 mb-7">
          Built a real-time data pipeline processing UDP telemetry from secure
          NASA test networks, enabling live monitoring in place of manual
          review. Worked directly with a team of engineers on system
          architecture and new features, and kept version history clean and
          collaborative with Git throughout.
        </p>

        <div className="grid gap-x-8 sm:grid-cols-3 mb-7">
          <AnimatedStat
            label="MANUAL ANALYSIS TIME"
            value={40}
            prefix="▼ "
            suffix="%"
            trigger={inView}
          />
          <AnimatedStat
            label="TEST SYSTEMS LIVE"
            value={3}
            trigger={inView}
            durationMs={500}
          />
          <div className="flex items-baseline justify-between border-b border-console-grid py-3 sm:border-b-0 sm:py-0">
            <span className="font-mono text-xs tracking-wider text-console-text/70">
              PROTOCOL
            </span>
            <span className="font-mono text-lg sm:text-xl text-console-amber">
              UDP
            </span>
          </div>
        </div>

        <div className="flex gap-2 font-mono text-xs tracking-wider text-console-text/70 mb-7">
          {["PYTHON", "MATLAB", "GIT"].map((tag) => (
            <span
              key={tag}
              className="rounded-sm border border-console-grid px-2 py-1"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="relative flex items-center gap-1.5 font-mono text-xs tracking-wider text-console-amber">
          <span aria-hidden="true">&gt;</span> view mission log
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          >
            &rarr;
          </span>
        </p>

        <style>{`
          @keyframes console-flicker {
            0% { opacity: 0.18; }
            8% { opacity: 0; }
            14% { opacity: 0.1; }
            20% { opacity: 0; }
            100% { opacity: 0; }
          }
        `}</style>
      </button>
      <NasaMissionLog
        open={open}
        onClose={() => setOpen(false)}
        originRect={originRect}
      />
    </>
  );
}
