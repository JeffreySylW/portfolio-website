"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CircuitBoard } from "./CircuitBoard";
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
    <p className="mb-4 font-mono text-xs tracking-wider text-pcb-green">
      {n} &middot; {children}
    </p>
  );
}

function Shot({ w }: { w: (typeof WORK)[number] }) {
  return (
    <figure className="overflow-hidden rounded-sm border border-pcb-trace">
      <div className="relative bg-pcb-panel" style={{ aspectRatio: "4 / 3" }}>
        <Image src={w.src} alt={w.alt} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover object-top" />
      </div>
      <figcaption className="px-2.5 py-2 font-mono text-[10px] tracking-wider text-pcb-text/65">{w.caption}</figcaption>
    </figure>
  );
}

export function BobCaseFile({
  open,
  onClose,
  originRect,
}: {
  open: boolean;
  onClose: () => void;
  originRect: DOMRect | null;
}) {
  const [rendered, setRendered] = useState(open);
  const [entered, setEntered] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  if (open && !rendered) setRendered(true);
  if (!open && entered) setEntered(false);

  useEffect(() => {
    if (!open || !rendered) return;
    opener.current = document.activeElement;
    const raf = requestAnimationFrame(() => {
      setEntered(true);
      closeRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, rendered]);

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

  const shape: CSSProperties =
    entered || !originRect
      ? { transform: "translate(0px, 0px) scale(1, 1)", borderRadius: 0 }
      : (() => {
          const sx = originRect.width / window.innerWidth;
          const sy = originRect.height / window.innerHeight;
          return {
            transform: `translate(${originRect.left}px, ${originRect.top}px) scale(${sx}, ${sy})`,
            borderRadius: `${8 / Math.max(sx, sy, 0.001)}px`,
          };
        })();

  const pairs = ["Home", "Networking"];
  const singles = WORK.filter((w) => !w.pair);

  return createPortal(
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Bob The Tech Guy case file" className="fixed inset-0 z-[100]">
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-pcb-bg/70 backdrop-blur-md transition-opacity duration-300 ease-out ${entered ? "opacity-100" : "opacity-0"}`}
      />
      <div
        aria-hidden="true"
        style={shape}
        className="absolute inset-0 origin-top-left bg-pcb-bg transition-[transform,border-radius] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      />
      <div
        aria-hidden="true"
        className={`absolute inset-0 overflow-hidden transition-opacity duration-500 ease-out ${entered ? "opacity-40" : "opacity-0"}`}
      >
        <CircuitBoard active={entered} />
      </div>

      <div
        style={{ pointerEvents: entered ? "auto" : "none" }}
        className={`relative z-10 h-full overflow-y-auto px-4 py-6 transition-opacity ease-out sm:py-10 ${
          entered ? "opacity-100 duration-200 delay-150" : "opacity-0 duration-100"
        }`}
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-wider text-pcb-green">CLIENT WORK // BOB THE TECH GUY</p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl text-pcb-text">Case File</h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="shrink-0 font-mono text-xs tracking-wider text-pcb-text hover:text-pcb-green focus-visible:text-pcb-green focus-visible:underline outline-none"
            >
              close &#x2715;
            </button>
          </div>

          <section className="mb-10">
            <Label n="01">THE CLIENT</Label>
            <div className="space-y-3 font-display text-sm sm:text-base leading-relaxed text-pcb-text/85">
              {CLIENT.map((p) => <p key={p}>{p}</p>)}
            </div>
          </section>

          <section className="mb-10">
            <Label n="02">COMMUNICATION</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {COMMUNICATION.map((c) => (
                <div key={c.title} className="rounded-sm border border-pcb-trace bg-pcb-panel/60 px-4 py-4">
                  <p className="font-mono text-[11px] tracking-wider text-pcb-green">{c.title.toUpperCase()}</p>
                  <p className="mt-2 font-display text-sm leading-relaxed text-pcb-text/75">{c.detail}</p>
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
                  className={`rounded-sm border px-3 py-3 ${s.test ? "border-pcb-green/60 bg-pcb-green/5" : "border-pcb-trace"}`}
                >
                  <p className={`font-mono text-[11px] tracking-wider ${s.test ? "text-pcb-green" : "text-pcb-text/70"}`}>
                    {String(i + 1).padStart(2, "0")} {s.label}
                  </p>
                  <p className="mt-1 font-display text-xs leading-snug text-pcb-text/75">{s.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <Label n="04">TOOLING</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {TOOLING.map((t) => (
                <div key={t.name} className="rounded-sm border border-pcb-trace px-4 py-3">
                  <p className="font-mono text-[11px] tracking-wider text-pcb-green">{t.name}</p>
                  <p className="mt-1 font-display text-xs leading-snug text-pcb-text/70">{t.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] tracking-wider text-pcb-text/70">{AI_NOTE}</p>
          </section>

          <section className="mb-10">
            <Label n="05">THE WORK</Label>
            {pairs.map((p) => (
              <div key={p} className="mb-4 grid gap-3 sm:grid-cols-2">
                {WORK.filter((w) => w.pair === p).map((w) => <Shot key={w.src} w={w} />)}
              </div>
            ))}
            <div className="grid gap-3 sm:grid-cols-3">
              {singles.map((w) => <Shot key={w.src} w={w} />)}
            </div>
          </section>

          <section className="mb-10">
            <Label n="06">RESULTS</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RESULTS.map((r) => (
                <div key={r.label} className="rounded-sm border border-pcb-trace px-4 py-4">
                  <p className="font-mono text-3xl text-pcb-green">{r.value}</p>
                  <p className="mt-1 font-mono text-[11px] tracking-wider text-pcb-text/65">{r.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href={BOB_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-pcb-green px-4 py-2 font-mono text-xs tracking-wider text-pcb-green hover:bg-pcb-green/10 focus-visible:bg-pcb-green/10 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pcb-green"
              >
                see it live &#8599;
              </a>
              {!BOB_SITE_SSL_OK && (
                <span className="font-mono text-[10px] tracking-wider text-pcb-text/70">
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
