"use client";

import { BODIES } from "@/content/space";
import { SunIntro } from "./SunIntro";
import { Timeline } from "./Timeline";

export function StaticExperience() {
  return (
    <div className="bg-[#03050b] min-h-screen">
      <SunIntro />
      <Timeline />
      <section aria-labelledby="bodies-heading" className="mx-auto max-w-3xl px-6 pb-20">
        <h2 id="bodies-heading" className="font-mono text-xs tracking-wider text-sky-300">everything else</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {BODIES.filter((b) => b.kind === "star").map((b) => (
            <li key={b.id} className="rounded-sm border border-slate-800 p-4">
              <h3 className="font-display text-lg text-slate-100">{b.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{b.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
