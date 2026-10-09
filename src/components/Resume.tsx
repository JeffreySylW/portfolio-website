"use client";

import { useEffect, useState } from "react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const RESUME_PDF = "/documents/Jeffrey-Weaver-Resume.pdf";
const VIEWER_PARAMS = "#view=FitH&toolbar=0&navpanes=0";

export function Resume() {
  const [enlarged, setEnlarged] = useState(false);

  useEffect(() => {
    if (!enlarged) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEnlarged(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [enlarged]);

  return (
    <section id="resume" className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <SectionHeading id="resume">resume</SectionHeading>
      <Reveal>
        <div className="rounded-sm border border-line overflow-hidden">
          <iframe
            src={`${RESUME_PDF}${VIEWER_PARAMS}`}
            title="Jeffrey Weaver's resume"
            className="h-[60vh] w-full bg-white"
          />
        </div>
      </Reveal>
      <Reveal i={2}>
        <div className="mt-4 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setEnlarged(true)}
            className="inline-flex items-center gap-1.5 font-mono text-sm tracking-wide text-signal hover:underline focus-visible:underline outline-none"
          >
            &#x2922; enlarge
          </button>
          <a
            href={RESUME_PDF}
            download="Jeffrey-Weaver-Resume.pdf"
            className="inline-flex items-center gap-2 font-mono text-sm tracking-wide text-signal hover:underline focus-visible:underline outline-none"
          >
            &gt; download resume.pdf
          </a>
        </div>
      </Reveal>

      {enlarged && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged resume"
          className="fixed inset-0 z-[100] flex flex-col items-center bg-console-bg/95 px-4 py-6 sm:py-10"
        >
          <div className="mb-4 flex w-full max-w-3xl items-center justify-between">
            <a
              href={RESUME_PDF}
              download="Jeffrey-Weaver-Resume.pdf"
              className="font-mono text-xs tracking-wider text-console-amber hover:underline"
            >
              &gt; download resume.pdf
            </a>
            <button
              type="button"
              onClick={() => setEnlarged(false)}
              className="font-mono text-xs tracking-wider text-console-text hover:text-console-amber focus-visible:text-console-amber outline-none"
            >
              close &#x2715;
            </button>
          </div>
          <div className="w-full max-w-3xl flex-1 overflow-hidden rounded-sm bg-white">
            <iframe
              src={`${RESUME_PDF}${VIEWER_PARAMS}`}
              title="Jeffrey Weaver's resume, enlarged"
              className="h-full w-full"
            />
          </div>
        </div>
      )}
    </section>
  );
}
