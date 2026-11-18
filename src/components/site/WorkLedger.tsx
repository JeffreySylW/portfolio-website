import Image from "next/image";
import { SKILLS, WORK, type WorkEntry } from "@/content/work";

const DEEP_LABEL = { nasa: "Open the NASA card", bob: "Open the case file" } as const;

function Row({ w }: { w: WorkEntry }) {
  return (
    <li
      id={`work-${w.id}`}
      className="grid scroll-mt-8 gap-4 border-t border-indigo py-7 md:grid-cols-[200px_minmax(0,1fr)_280px] md:gap-8"
    >
      <p className="px-label text-[12px] leading-[1.6] text-lavender">{w.dates}</p>
      <div className="min-w-0">
        <h3 className="font-display text-[30px] font-extrabold uppercase leading-none md:text-[36px]">{w.org}</h3>
        <p className="mt-2 text-[17px] font-semibold text-lavender">{w.role}</p>
        <p className="mt-3 max-w-[42rem] text-[16px] leading-[1.6] text-mist">{w.summary}</p>
        {w.highlights && (
          <ul className="mt-4 space-y-3">
            {w.highlights.map((h) => (
              <li key={h.name} className="max-w-[42rem]">
                <p className="text-[16px] font-semibold text-starlight">
                  {h.name} <span className="font-normal text-lavender">· {h.role}</span>
                </p>
                <p className="px-label mt-1 text-[12px] text-lavender">{h.dates}</p>
                <p className="mt-1 text-[15px] leading-[1.6] text-mist">{h.summary}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[14px] text-lavender">{w.tools.join(" · ")}</p>
        {w.deep && (
          <a href={`#${w.deep}`} className="mt-4 inline-block py-2 text-[16px] text-starlight underline underline-offset-4 hover:text-lavender">
            {DEEP_LABEL[w.deep]}
          </a>
        )}
        {w.link && (
          <a
            href={w.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block py-2 text-[16px] text-starlight underline underline-offset-4 hover:text-lavender"
          >
            {w.link.label}
          </a>
        )}
      </div>
      {w.photo ? (
        <Image
          src={w.photo.src}
          alt={w.photo.alt}
          width={560}
          height={316}
          sizes="(min-width: 768px) 280px, calc(100vw - 2.5rem)"
          className="aspect-[16/9] h-auto w-full object-cover"
        />
      ) : (
        <div aria-hidden="true" className="hidden md:block" />
      )}
    </li>
  );
}

export function WorkLedger() {
  return (
    <section id="work" aria-labelledby="work-title" className="mx-auto max-w-[1312px] scroll-mt-4 px-5 py-20 md:px-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="work-title" className="font-display text-[48px] font-extrabold uppercase leading-none md:text-[64px]">
          Where I&apos;ve shipped
        </h2>
        <p className="px-label text-[12px] text-lavender">Newest first</p>
      </div>
      <ol className="mt-8 border-b border-indigo">
        {WORK.map((w) => (
          <Row key={w.id} w={w} />
        ))}
      </ol>
    </section>
  );
}

export function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title" className="mx-auto max-w-[1312px] px-5 py-16 md:px-16">
      <h2 id="skills-title" className="font-display text-[40px] font-extrabold uppercase leading-none md:text-[48px]">
        Skills
      </h2>
      <dl className="mt-8 grid gap-8 md:grid-cols-3">
        {SKILLS.map((s) => (
          <div key={s.label}>
            <dt className="px-label text-[12px] text-lavender">{s.label}</dt>
            <dd className="mt-3 text-[17px] leading-[1.7] text-mist">{s.items.join(" · ")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
