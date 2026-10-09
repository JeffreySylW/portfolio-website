"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { id: "top", label: "galaxy" },
  { id: "timeline", label: "experience" },
  { id: "projects", label: "projects" },
  { id: "resume", label: "resume" },
  { id: "contact", label: "contact" },
];

function SectionLinks({ active, className }: { active: string; className: string }) {
  return (
    <ul className={className}>
      {LINKS.map((link) => (
        <li key={link.id}>
          <a
            href={`#${link.id}`}
            aria-current={active === link.id ? "location" : undefined}
            className={`transition-colors hover:text-signal focus-visible:text-signal outline-none ${
              active === link.id ? "text-signal" : "text-ink-soft"
            }`}
          >
            {active === link.id && (
              <span aria-hidden="true" className="mr-1">
                &bull;
              </span>
            )}
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Nav() {
  const [active, setActive] = useState<string>("top");

  useEffect(() => {
    // Scroll spy: the section crossing a thin band near the upper-middle of the viewport is active.
    // Deferred a frame so sections rendered by siblings after mount (the scene's #top) exist.
    let observer: IntersectionObserver | undefined;
    const raf = requestAnimationFrame(() => {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActive(entry.target.id);
          }
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );
      for (const l of LINKS) {
        const el = document.getElementById(l.id);
        if (el) observer.observe(el);
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-sm lg:hidden">
        <nav aria-label="Sections" className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 font-mono text-xs tracking-wider">
          <a href="#top" className="text-ink hover:text-signal transition-colors">
            JEFFREY.WEAVER
          </a>
          <SectionLinks active={active} className="flex flex-wrap justify-end gap-x-5 gap-y-1" />
        </nav>
      </header>
      {/* Desktop rail: pinned left while the sections scroll on the right; hidden over the hero. */}
      <nav
        aria-label="Section rail"
        className={`fixed left-4 top-1/2 z-50 hidden w-32 -translate-y-1/2 font-mono text-xs tracking-wider transition-opacity duration-500 lg:block ${
          active === "top" ? "invisible opacity-0" : "opacity-100"
        }`}
      >
        <a href="#top" className="mb-4 block text-ink transition-colors hover:text-signal">
          JEFFREY.WEAVER
        </a>
        <SectionLinks active={active} className="flex flex-col gap-2" />
      </nav>
    </>
  );
}
