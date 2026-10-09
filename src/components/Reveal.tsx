"use client";

import { useOnEnter } from "@/lib/useInView";
import type { CSSProperties, ReactNode } from "react";

// Hidden/shown state lives in CSS (.reveal in globals.css); the final state is the default.
export function markIn(el: HTMLElement) {
  el.setAttribute("data-in", "");
}

export function Reveal({
  children,
  className = "",
  i = 0,
}: {
  children: ReactNode;
  className?: string;
  /** stagger index; delay = i * 70ms, capped */
  i?: number;
}) {
  const ref = useOnEnter<HTMLDivElement>(markIn);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ "--i": i } as CSSProperties}>
      {children}
    </div>
  );
}
