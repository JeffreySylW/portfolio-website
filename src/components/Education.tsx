import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const HONORS = [
  "Cum Laude",
  "Dean's List: 4 semesters",
];

export function Education() {
  return (
    <section id="education" className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <SectionHeading id="education">education</SectionHeading>
      <Reveal>
        <div className="rounded-sm border border-line px-6 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
            <div>
              <p className="font-mono text-xs tracking-wider text-signal">
                VIRGINIA COMMONWEALTH UNIVERSITY // COLLEGE OF ENGINEERING
              </p>
              <h3 className="mt-1 font-display text-lg sm:text-xl text-ink">
                B.S. Computer Science
              </h3>
            </div>
            <p className="font-mono text-xs tracking-wider text-ink-soft">
              AUG 2022 &ndash; MAY 2026
            </p>
          </div>
          <p className="font-serif text-sm sm:text-base leading-relaxed text-ink-soft mb-4">
            Software Engineering concentration, minor in Artificial
            Intelligence.
          </p>
          <ul className="flex flex-wrap gap-2 font-mono text-xs tracking-wider text-ink-soft">
            {HONORS.map((honor) => (
              <li key={honor} className="rounded-sm border border-line px-2 py-1">
                {honor}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
