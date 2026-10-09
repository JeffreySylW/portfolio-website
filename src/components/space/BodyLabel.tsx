"use client";

import { BODIES, SUN } from "@/content/space";

export function BodyLabel({ id, onActivate }: { id: string; onActivate: (id: string) => void }) {
  const label = id === "sun" ? SUN.name : BODIES.find((b) => b.id === id)?.name ?? id;
  const kind = id === "sun" ? "sun" : BODIES.find((b) => b.id === id)?.kind ?? "";
  const body = BODIES.find((b) => b.id === id);
  const dim = kind === "star" ? "opacity-40 hover:opacity-100 focus-visible:opacity-100" : "opacity-60 hover:opacity-100 focus-visible:opacity-100";
  const hide = kind === "station" || kind === "module" ? "hidden sm:flex " : "flex ";
  // push the label out past the body's edge (about 34px per world unit at the home view), up and to the right
  const off = Math.round((body?.size ?? 1.6) * 34 * 0.71) + 4;
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onActivate(id); }}
      style={{ transform: `translate(${off}px, ${-off}px)` }}
      className={`${hide}items-center gap-1 whitespace-nowrap rounded-sm font-mono text-[9px] uppercase tracking-wider text-sky-200 outline-none ring-sky-300 transition-opacity focus-visible:ring-2 sm:text-[10px] ${dim}`}
    >
      <span aria-hidden className="size-1 shrink-0 rounded-full" style={{ background: body?.color ?? "#f5b041" }} />
      {label}
    </button>
  );
}
