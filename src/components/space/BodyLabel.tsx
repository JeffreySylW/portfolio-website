"use client";

import { BODIES, SUN } from "@/content/space";

export function BodyLabel({ id, onActivate }: { id: string; onActivate: (id: string) => void }) {
  const label = id === "sun" ? SUN.name : BODIES.find((b) => b.id === id)?.name ?? id;
  const kind = id === "sun" ? "sun" : BODIES.find((b) => b.id === id)?.kind ?? "";
  const dim = kind === "star" ? "opacity-60 hover:opacity-100 focus-visible:opacity-100" : "";
  const hide = kind === "station" || kind === "module" ? "hidden sm:block " : "";
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onActivate(id); }}
      className={`${hide}whitespace-nowrap rounded-sm px-1.5 py-0.5 font-mono text-[9px] tracking-tight sm:text-[10px] sm:tracking-wider text-sky-200 outline-none ring-sky-300 focus-visible:ring-2 ${dim}`}
    >
      {label}
    </button>
  );
}
