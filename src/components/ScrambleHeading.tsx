"use client";

import { useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/motion";
import { useOnEnter } from "@/lib/useInView";

const GLYPHS = "!<>-_/[]{}=+*^?#";
const DURATION = 700;

// The real text is the heading's accessible name; the visible span is aria-hidden and scrambled via the DOM.
export function ScrambleHeading({ text, id, className }: { text: string; id?: string; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const span = useRef<HTMLSpanElement | null>(null);
  const ref = useOnEnter<HTMLHeadingElement>(() => {
    const target = span.current;
    if (reduced || !target) return;
    let t0 = -1;
    const step = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = now - t0;
      if (t >= DURATION || !target.isConnected) {
        target.textContent = text;
        return;
      }
      let out = "";
      for (let k = 0; k < text.length; k++) {
        const settled = t >= DURATION * 0.35 + (k / text.length) * DURATION * 0.65;
        out += settled || text[k] === " " ? text[k] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      target.textContent = out;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  return (
    <h2 ref={ref} id={id} aria-label={text} className={className}>
      <span ref={span} aria-hidden="true">{text}</span>
    </h2>
  );
}
