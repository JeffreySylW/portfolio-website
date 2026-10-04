import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

export function About() {
  return (
    <section id="about" className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <SectionHeading id="about">about</SectionHeading>
      <Reveal>
        <div className="max-w-2xl space-y-5 font-serif text-base sm:text-lg leading-relaxed text-ink">
          <p>
            I&apos;m looking for a software engineering role where I can keep
            building things that are actually used.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
