import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const TAGS = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Node.js",
  "Express",
  "PostgreSQL",
  "Prisma",
  "Redis",
];

export function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <SectionHeading id="projects">projects</SectionHeading>
      <Reveal>
        <div className="rounded-sm border border-line px-6 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
            <h3 className="font-display text-lg sm:text-xl text-ink">
              Sports Analytics Platform
            </h3>
            <p className="font-mono text-xs tracking-wider text-ink-soft">
              AUG 2024 &ndash; DEC 2025
            </p>
          </div>
          <p className="font-serif text-sm sm:text-base leading-relaxed text-ink-soft mb-4">
            Full-stack sports analytics application with live odds comparison
            and player statistic tracking across multiple sports, built on a
            real-time data pipeline integrating the Sportradar and Odds APIs.
          </p>
          <div className="flex flex-wrap gap-2 font-mono text-xs tracking-wider text-ink-soft mb-4">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-sm border border-line px-2 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
          <a
            href="https://github.com/JeffreySylW/SportsAnalsytApp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs tracking-wider text-signal hover:underline focus-visible:underline outline-none"
          >
            view repository &rarr;
          </a>
        </div>
      </Reveal>
    </section>
  );
}
