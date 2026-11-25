"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { EXPERIENCE_CARDS, ME_CARD, type CardId } from "@/content/cards";

/** A pixel-framed native <dialog>, like the NASA card: Escape or a click outside closes it. */
function CardDialog({ labelId, onClose, returnFocusTo, children }: { labelId: string; onClose: () => void; returnFocusTo: HTMLElement | null; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pressedOutside = useRef(false);
  const isOutside = (e: { target: EventTarget; clientX: number; clientY: number }) => {
    const d = dialog.current;
    if (!d || e.target !== d) return false;
    const r = d.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={labelId}
      onPointerDown={(e) => { pressedOutside.current = isOutside(e); }}
      onClick={(e) => {
        if (pressedOutside.current && isOutside(e)) dialog.current?.close();
        pressedOutside.current = false;
      }}
      onClose={() => {
        returnFocusTo?.focus();
        onClose();
      }}
      className="deep-dialog px-frame m-auto max-h-[92dvh] w-[min(46rem,calc(100%-1rem))] overflow-y-auto bg-void p-5 text-starlight sm:p-8"
    >
      <div className="flex justify-end">
        <button type="button" onClick={() => dialog.current?.close()} className="px-label py-2 text-[12px] text-starlight hover:text-lavender">
          Close &#x2715;
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function MeCard({ onClose, returnFocusTo }: { onClose: () => void; returnFocusTo: HTMLElement | null }) {
  const [main, ...more] = ME_CARD.photos;
  return (
    <CardDialog labelId="me-title" onClose={onClose} returnFocusTo={returnFocusTo}>
      <p className="px-label text-[12px] text-lavender">The core</p>
      <h2 id="me-title" className="mt-2 font-display text-[44px] font-extrabold uppercase leading-none sm:text-[60px]">
        {ME_CARD.title}
      </h2>
      <p className="mt-4 max-w-[34rem] text-[18px] leading-[1.55] text-mist">{ME_CARD.lead}</p>
      <figure className="m-0 mt-6 border border-indigo">
        {/* eslint-disable-next-line @next/next/no-img-element -- already sized webp copies */}
        <img
          src={main.src}
          srcSet={`${main.small} 560w, ${main.src} 1040w`}
          sizes="(min-width: 768px) 640px, calc(100vw - 3rem)"
          width={main.width}
          height={main.height}
          alt={main.alt}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full bg-deep"
        />
      </figure>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {more.map((p) => (
          <figure key={p.src} className="m-0 overflow-hidden border border-indigo">
            {/* eslint-disable-next-line @next/next/no-img-element -- already sized webp copies */}
            <img
              src={p.small}
              srcSet={`${p.small} ${p.width > p.height ? 560 : 400}w, ${p.src} ${p.width}w`}
              sizes="(min-width: 768px) 320px, calc(50vw - 2rem)"
              width={p.width}
              height={p.height}
              alt={p.alt}
              loading="lazy"
              decoding="async"
              className="block aspect-[4/3] h-auto w-full bg-deep object-cover"
            />
          </figure>
        ))}
      </div>
    </CardDialog>
  );
}

export function ExperienceCard({ id, onClose, returnFocusTo }: { id: CardId; onClose: () => void; returnFocusTo: HTMLElement | null }) {
  const c = EXPERIENCE_CARDS[id];
  const tools = "tools" in c ? c.tools : undefined;
  const link = "link" in c ? c.link : undefined;
  return (
    <CardDialog labelId={`${id}-title`} onClose={onClose} returnFocusTo={returnFocusTo}>
      <p className="px-label text-[12px] text-lavender">{c.dates}</p>
      <h2 id={`${id}-title`} className="mt-2 font-display text-[36px] font-extrabold uppercase leading-none sm:text-[48px]">
        {c.title}
      </h2>
      <p className="mt-3 text-[16px] text-lavender">{c.role}</p>
      <p className="mt-5 max-w-[38rem] text-[17px] leading-[1.6] text-mist">{c.summary}</p>
      {tools && (
        <ul aria-label="Coursework and tools" className="mt-5 flex flex-wrap gap-2">
          {tools.map((t) => (
            <li key={t} className="px-label border border-indigo px-2.5 py-1.5 text-[12px] text-starlight">{t}</li>
          ))}
        </ul>
      )}
      {link && (
        <a href={link.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block py-2 text-[16px] text-starlight underline underline-offset-4 hover:text-lavender">
          {link.label}
        </a>
      )}
    </CardDialog>
  );
}
