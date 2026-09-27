import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { NasaConsole } from "./NasaConsole";

const LIDAR_TAGS = ["PyTorch", "EfficientNet", "Python", "Agile/Scrum"];
const TA_TAGS = ["Java", "Python", "Data Structures", "Mentorship"];

export function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <SectionHeading id="experience">experience</SectionHeading>

      <div className="space-y-8">
        <Reveal>
          <NasaConsole />
        </Reveal>

        <Reveal delayMs={100}>
          <div className="rounded-sm border border-line px-6 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
              <div>
                <p className="font-mono text-xs tracking-wider text-signal">
                  DOD ASPIRE CAPSTONE // U.S. ARMY
                </p>
                <h3 className="mt-1 font-display text-lg sm:text-xl text-ink">
                  LiDAR &amp; Camera Sensor Data Fusion Researcher
                </h3>
              </div>
              <p className="font-mono text-xs tracking-wider text-ink-soft">
                AUG 2024 &ndash; MAY 2025
              </p>
            </div>
            <p className="font-serif text-sm sm:text-base leading-relaxed text-ink-soft mb-4">
              Developed a multi-modal deep learning system for pedestrian
              detection, reaching 85% accuracy, with a custom preprocessing
              pipeline for fusing sensor inputs. Ran the project as two-week
              Agile sprints with daily stand-ups, hitting every milestone on
              schedule.
            </p>
            <div className="flex flex-wrap gap-2 font-mono text-xs tracking-wider text-ink-soft">
              {LIDAR_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm border border-line px-2 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={150}>
          <div className="rounded-sm border border-line px-6 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
              <div>
                <p className="font-mono text-xs tracking-wider text-signal">
                  VCU COLLEGE OF ENGINEERING
                </p>
                <h3 className="mt-1 font-display text-lg sm:text-xl text-ink">
                  Computer Science Teaching Assistant
                </h3>
              </div>
              <p className="font-mono text-xs tracking-wider text-ink-soft">
                AUG 2024 &ndash; MAY 2026
              </p>
            </div>
            <p className="font-serif text-sm sm:text-base leading-relaxed text-ink-soft mb-4">
              Spent a full year as TA for Introduction to Data Structures
              (CMSC 256), helping students work through Java implementations
              of linked lists, stacks, queues, and binary trees, along with
              searching and sorting algorithms &mdash; debugging in office
              hours, walking through recursion and complexity tradeoffs, and
              grading for correctness and design. Also TA&apos;d Computers
              and Programming (CMSC 210), introducing non-majors to
              object-oriented Python and structured programming logic.
            </p>
            <p className="font-serif text-sm sm:text-base leading-relaxed text-ink-soft mb-4">
              Across both courses, mentored 150+ students and worked with the
              professor and other TAs to improve lab support and response
              time &mdash; lab and test scores rose 20%.
            </p>
            <div className="flex flex-wrap gap-2 font-mono text-xs tracking-wider text-ink-soft">
              {TA_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm border border-line px-2 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
