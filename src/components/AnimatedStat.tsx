"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedStat({
  label,
  value,
  suffix = "",
  prefix = "",
  trigger,
  durationMs = 900,
}: {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  trigger: boolean;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!trigger || started.current) return;
    started.current = true;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [trigger, value, durationMs]);

  return (
    <div className="flex items-baseline justify-between border-b border-console-grid py-3 first:pt-0 last:border-b-0">
      <span className="font-mono text-xs tracking-wider text-console-text/70">
        {label}
      </span>
      <span className="font-mono text-lg sm:text-xl text-console-amber tabular-nums">
        {prefix}
        {display}
        {suffix}
      </span>
    </div>
  );
}
