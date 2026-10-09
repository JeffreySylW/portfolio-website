"use client";

import { useEffect, useRef } from "react";
import { BODIES, SUN } from "@/content/space";

export function StoryPanel({
  id,
  onClose,
  returnFocusTo,
}: {
  id: string | null;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!id) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      returnFocusTo?.focus();
    };
  }, [id, onClose, returnFocusTo]);

  if (!id) return null;

  if (id === "sun") {
    return (
      <aside ref={panel} tabIndex={-1} aria-labelledby="story-title" className="fixed inset-x-0 bottom-0 z-10 max-h-[70vh] overflow-y-auto rounded-t-md border-t border-sky-900 bg-[#070b16]/95 p-6 text-slate-100 outline-none sm:inset-x-auto sm:right-6 sm:top-24 sm:bottom-auto sm:w-96">
        <h2 id="story-title" className="font-display text-2xl">{SUN.name}</h2>
        <p className="mt-2 font-mono text-xs text-sky-300">{SUN.title}</p>
        {SUN.intro.map((p) => <p key={p} className="mt-3 text-sm leading-relaxed text-slate-300">{p}</p>)}
        <button type="button" onClick={onClose} className="mt-5 font-mono text-xs text-sky-200 underline">back to the galaxy</button>
      </aside>
    );
  }

  const body = BODIES.find((b) => b.id === id);
  if (!body) return null;
  return (
    <aside ref={panel} tabIndex={-1} aria-labelledby="story-title" className="fixed inset-x-0 bottom-0 z-10 max-h-[70vh] overflow-y-auto rounded-t-md border-t border-sky-900 bg-[#070b16]/95 p-6 text-slate-100 outline-none sm:inset-x-auto sm:right-6 sm:top-24 sm:bottom-auto sm:w-96">
      <h2 id="story-title" className="font-display text-2xl">{body.name}</h2>
      <p className="mt-2 font-mono text-xs text-sky-300">{body.subtitle}</p>
      {body.dates && <p className="mt-1 font-mono text-[11px] text-slate-400">{body.dates}</p>}
      <p className="mt-4 text-sm leading-relaxed text-slate-300">{body.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] text-slate-300">
        {body.tools.map((t) => <li key={t} className="rounded-sm border border-slate-700 px-2 py-1">{t}</li>)}
      </ul>
      <button type="button" onClick={onClose} className="mt-5 font-mono text-xs text-sky-200 underline">back to the galaxy</button>
    </aside>
  );
}
