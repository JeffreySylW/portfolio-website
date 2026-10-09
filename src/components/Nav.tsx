"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { id: "top", label: "galaxy" },
  { id: "timeline", label: "experience" },
  { id: "projects", label: "projects" },
  { id: "resume", label: "resume" },
  { id: "contact", label: "contact" },
];

export function Nav() {
  const [active, setActive] = useState<string>("top");

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 font-mono text-xs tracking-wider">
        <a href="#top" className="text-ink hover:text-signal transition-colors">
          JEFFREY.WEAVER
        </a>
        <ul className="flex flex-wrap justify-end gap-x-5 gap-y-1">
          {LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
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
      </nav>
    </header>
  );
}
