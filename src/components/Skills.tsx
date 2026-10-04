import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const GROUPS = [
  {
    label: "LANGUAGES",
    items: ["Java", "JavaScript", "TypeScript", "Python", "C/C++", "SQL", "MATLAB"],
  },
  {
    label: "WEB",
    items: [
      "React",
      "Next.js",
      "Node.js",
      "Express",
      "HTML/CSS",
      "Tailwind CSS",
      "WordPress",
      "REST APIs",
    ],
  },
  {
    label: "TOOLS & PRACTICES",
    items: [
      "Git/GitHub",
      "Docker",
      "Postman",
      "Selenium",
      "Figma",
      "TDD",
      "Agile/Scrum",
    ],
  },
];

export function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <SectionHeading id="skills">skills</SectionHeading>
      <Reveal>
        <div className="space-y-5">
          {GROUPS.map((group) => (
            <div
              key={group.label}
              className="rounded-sm border border-line px-6 py-5 sm:px-7"
            >
              <p className="font-mono text-xs tracking-wider text-signal mb-3">
                {group.label}
              </p>
              <ul className="flex flex-wrap gap-2 font-mono text-xs tracking-wider text-ink-soft">
                {group.items.map((item) => (
                  <li key={item} className="rounded-sm border border-line px-2 py-1">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
