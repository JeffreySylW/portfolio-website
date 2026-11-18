import Image from "next/image";
import { CONTACT, PROFILE } from "@/content/work";

export function ResumeSection() {
  return (
    <section id="resume" aria-labelledby="resume-title" className="mx-auto max-w-[1312px] scroll-mt-4 px-5 py-16 md:px-16">
      <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <h2 id="resume-title" className="font-display text-[40px] font-extrabold uppercase leading-none md:text-[48px]">
            Resume
          </h2>
          <p className="mt-4 max-w-[34rem] text-[17px] leading-[1.6] text-mist">
            One page: education, the NASA internship, client work for Bob The Tech Guy, teaching, and the projects above.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <a href={PROFILE.resumeHref} className="px-btn">
              Open the PDF
            </a>
            <a
              href={PROFILE.resumeHref}
              download="Jeffrey-Weaver-Resume.pdf"
              className="py-3 text-[16px] text-starlight underline underline-offset-4 hover:text-lavender"
            >
              Download
            </a>
          </div>
        </div>
        <a href={PROFILE.resumeHref} className="px-frame block p-2" aria-label="Open the resume PDF">
          <Image
            src="/documents/resume-preview.png"
            alt="First page of Jeffrey Weaver's resume"
            width={1836}
            height={2376}
            sizes="(min-width: 768px) 420px, calc(100vw - 2.5rem)"
            loading="lazy"
            className="h-auto w-full bg-white"
          />
        </a>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative isolate mx-auto max-w-[1312px] scroll-mt-4 px-5 pb-12 pt-16 md:px-16">
      <h2 id="contact-title" className="font-display text-[40px] font-extrabold uppercase leading-none md:text-[48px]">
        Contact
      </h2>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {CONTACT.map((c) => (
          <li key={c.label}>
            <a
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex min-h-[56px] items-baseline justify-between gap-4 border border-indigo px-4 py-4 no-underline hover:border-lavender"
            >
              <span className="px-label text-[12px] text-lavender">{c.label}</span>
              <span className="min-w-0 break-all text-right text-[16px] text-starlight">{c.value}</span>
            </a>
          </li>
        ))}
      </ul>
      <footer className="mt-16 space-y-2 text-[14px] text-lavender">
        <p>© {new Date().getFullYear()} Jeffrey Weaver</p>
        <p>
          Earth: NASA Earth Observatory,{" "}
          <a
            href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-starlight"
          >
            Blue Marble Next Generation
          </a>{" "}
          (Reto Stöckli). The night side is drawn in pixels on purpose.
        </p>
      </footer>
    </section>
  );
}
