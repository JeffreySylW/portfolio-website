"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  CLIENT,
  COMMUNICATION,
  PIPELINE,
  TOOLING,
  AI_NOTE,
  WORK,
  RESULTS,
  BOB_SITE_URL,
  BOB_SITE_SSL_OK,
} from "@/content/bobCaseFile";

function Label({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="px-label mb-4 text-[12px] text-lavender">
      {n} &middot; {children}
    </p>
  );
}

function Shot({ w }: { w: (typeof WORK)[number] }) {
  return (
    <figure className="mb-3 overflow-hidden border border-indigo">
      <Image
        src={w.src}
        alt={w.alt}
        width={w.width}
        height={w.height}
        loading="lazy"
        sizes="(min-width: 768px) 360px, calc(100vw - 2rem)"
        className={`h-auto bg-deep ${w.phone ? "mx-auto w-full max-w-[200px]" : "w-full"}`}
      />
      <figcaption className="px-2.5 py-2 text-[13px] leading-snug text-mist">{w.caption}</figcaption>
    </figure>
  );
}

function Side({ side, title, note }: { side: "before" | "after"; title: string; note: string }) {
  return (
    <div className="min-w-0">
      <h3 className="px-label mb-1 text-[12px] text-lavender">{title}</h3>
      <p className="mb-3 text-[13px] text-mist">{note}</p>
      {WORK.filter((w) => w.side === side).map((w) => <Shot key={w.src} w={w} />)}
    </div>
  );
}

export function BobCaseFile({
  open,
  onClose,
  returnFocusTo,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const [rendered, setRendered] = useState(open);
  const [entered, setEntered] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  // a click beside the case file's content closes it; press and release must both land there
  const pressedOutside = useRef(false);

  if (open && !rendered) setRendered(true);
  if (!open && entered) setEntered(false);

  useEffect(() => {
    if (!open || !rendered) return;
    opener.current = returnFocusTo ?? document.activeElement;
    const raf = requestAnimationFrame(() => {
      setEntered(true);
      closeRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, rendered, returnFocusTo]);

  useEffect(() => {
    if (open || !rendered) return;
    const t = setTimeout(() => setRendered(false), 300);
    return () => clearTimeout(t);
  }, [open, rendered]);

  // Keep keyboard and screen-reader focus inside the dialog: everything else on
  // the page is inert while it is open. Focus goes back to the opener after.
  useEffect(() => {
    if (!rendered) return;
    const dialog = dialogRef.current;
    const others = [...document.body.children].filter((el) => el !== dialog);
    others.forEach((el) => el.setAttribute("inert", ""));
    return () => {
      others.forEach((el) => el.removeAttribute("inert"));
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [rendered]);

  useEffect(() => {
    if (!rendered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [rendered, onClose]);

  if (!rendered) return null;

  return createPortal(
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Bob The Tech Guy case file" className="fixed inset-0 z-[100]">
      <div aria-hidden="true" className={`absolute inset-0 bg-void transition-opacity duration-200 ease-out ${entered ? "opacity-100" : "opacity-0"}`} />
      <div aria-hidden="true" className={`stars absolute inset-0 transition-opacity duration-200 ${entered ? "opacity-40" : "opacity-0"}`} />

      <div
        style={{ pointerEvents: entered ? "auto" : "none" }}
        onPointerDown={(e) => { pressedOutside.current = e.target === e.currentTarget; }}
        onClick={(e) => {
          if (pressedOutside.current && e.target === e.currentTarget) onClose();
          pressedOutside.current = false;
        }}
        className={`relative z-10 h-full overflow-y-auto px-4 py-6 transition-opacity ease-out sm:py-10 ${
          entered ? "opacity-100 duration-200 delay-150" : "opacity-0 duration-100"
        }`}
      >
        <div className="px-frame mx-auto max-w-3xl bg-void p-5 sm:p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="px-label text-[12px] text-lavender">Client work · Bob The Tech Guy</p>
              <h2 className="mt-2 font-display text-[34px] font-extrabold uppercase leading-none text-starlight sm:text-[44px]">Case file</h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="px-label shrink-0 py-2 text-[12px] text-starlight hover:text-lavender"
            >
              Close &#x2715;
            </button>
          </div>

          <section className="mb-10">
            <Label n="01">THE CLIENT</Label>
            <div className="space-y-3 text-[16px] leading-[1.6] text-mist">
              {CLIENT.map((p) => <p key={p}>{p}</p>)}
            </div>
          </section>

          <section className="mb-10">
            <Label n="02">COMMUNICATION</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {COMMUNICATION.map((c) => (
                <div key={c.title} className="border border-indigo bg-deep px-4 py-4">
                  <p className="px-label text-[12px] text-lavender">{c.title}</p>
                  <p className="mt-2 text-[15px] leading-[1.6] text-mist">{c.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <Label n="03">DEVELOPMENT LIFECYCLE</Label>
            <ol className="grid gap-2 sm:grid-cols-4">
              {PIPELINE.map((s, i) => (
                <li
                  key={s.label}
                  className={`border px-3 py-3 ${s.test ? "border-lavender bg-deep" : "border-indigo"}`}
                >
                  <p className={`px-label text-[12px] ${s.test ? "text-starlight" : "text-lavender"}`}>
                    {String(i + 1).padStart(2, "0")} {s.label}
                  </p>
                  <p className="mt-1 text-[14px] leading-snug text-mist">{s.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <Label n="04">TOOLING</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {TOOLING.map((t) => (
                <div key={t.name} className="border border-indigo px-4 py-3">
                  <p className="px-label text-[12px] text-lavender">{t.name}</p>
                  <p className="mt-1 text-[14px] leading-snug text-mist">{t.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-mist">{AI_NOTE}</p>
          </section>

          <section className="mb-10">
            <Label n="05">THE WORK</Label>
            <div className="grid gap-6 md:grid-cols-[1fr_1px_1fr] md:gap-5">
              <Side side="before" title="BEFORE" note="The old site" />
              <div aria-hidden="true" className="h-px bg-indigo md:h-auto md:w-px" />
              <Side side="after" title="AFTER" note="The new site" />
            </div>
          </section>

          <section className="mb-10">
            <Label n="06">RESULTS</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {RESULTS.map((r) => (
                <div key={r.label} className="border border-indigo px-4 py-4">
                  <p className="font-display text-[40px] font-extrabold leading-none text-starlight">{r.value}</p>
                  <p className="px-label mt-2 text-[12px] text-lavender">{r.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href={BOB_SITE_URL}
                aria-describedby={BOB_SITE_SSL_OK ? undefined : "bob-ssl-note-casefile"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-btn"
              >
                See it live &#8599;
              </a>
              {!BOB_SITE_SSL_OK && (
                <span id="bob-ssl-note-casefile" className="text-[13px] text-mist">
                  SSL certificate pending — the browser may warn you
                </span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
