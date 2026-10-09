"use client";

import { useEffect, useRef } from "react";

// Calls onEnter(el) once, the first time el is in view. DOM-only: no React state, so no re-render.
export function useOnEnter<T extends HTMLElement>(onEnter: (el: T) => void, threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const latest = useRef(onEnter);
  useEffect(() => {
    latest.current = onEnter;
  });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          latest.current(node);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}
