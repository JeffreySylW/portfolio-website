import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const LINKS = [
  { label: "GitHub", value: "github.com/JeffreySylW", href: "https://github.com/JeffreySylW" },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/jeffsylweaver",
    href: "https://linkedin.com/in/jeffsylweaver",
  },
  { label: "Email", value: "jeff.sylw@gmail.com", href: "mailto:jeff.sylw@gmail.com" },
  { label: "Phone", value: "(804) 895-8445", href: "tel:+18048958445" },
];

export function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <SectionHeading id="contact">contact</SectionHeading>
      <Reveal>
        <ul className="grid gap-4 sm:grid-cols-2">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex items-baseline justify-between rounded-sm border border-line px-4 py-3 transition-colors hover:border-signal focus-visible:border-signal outline-none"
              >
                <span className="font-mono text-xs tracking-wider text-ink-soft">
                  {link.label.toUpperCase()}
                </span>
                <span className="font-mono text-sm text-ink group-hover:text-signal">
                  {link.value}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
      <p className="mt-16 font-mono text-xs tracking-wider text-ink-soft/70">
        &copy; {new Date().getFullYear()} Jeffrey Weaver
      </p>
    </section>
  );
}
