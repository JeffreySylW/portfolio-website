import { SUN } from "@/content/space";

export function SunIntro() {
  return (
    <section aria-labelledby="sun-heading" className="mx-auto max-w-3xl px-6 py-16">
      <h1 id="sun-heading" className="font-display text-4xl text-slate-100 sm:text-6xl">{SUN.name}</h1>
      <p className="mt-3 font-mono text-sm text-sky-300">{SUN.title}</p>
      {SUN.intro.map((p) => <p key={p} className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">{p}</p>)}
    </section>
  );
}
