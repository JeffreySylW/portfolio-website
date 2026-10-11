"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { BODIES } from "@/content/space";
import { GALLERY, SECTIONS, inGroup, type GalleryGroup, type GalleryImage } from "@/content/nasaGallery";

const NASA = BODIES.find((b) => b.id === "nasa")!;
// Photos shown inside a section, as on the matching slide of the presentation; the tours get their own grid at the end.
const SECTION_PHOTOS: Record<string, GalleryGroup> = {
  "Side quest 1: wind tunnel surveillance system": "surveillance",
  Makerspace: "makerspace",
};

function Heading({ children }: { children: string }) {
  return <h3 className="mb-3 font-mono text-xs tracking-wider text-sky-300">{children}</h3>;
}

function PhotoGrid({ images, masonry, register, onOpen }: {
  images: GalleryImage[];
  masonry?: boolean;
  register: (index: number, el: HTMLButtonElement | null) => void;
  onOpen: (index: number) => void;
}) {
  return (
    <ul className={masonry ? "columns-2 gap-3 sm:columns-3" : "grid grid-cols-2 gap-3 sm:grid-cols-3"}>
      {images.map((g) => {
        const i = GALLERY.indexOf(g);
        return (
          <li key={g.src} className={masonry ? "mb-3 break-inside-avoid" : undefined}>
            <button
              type="button"
              ref={(el) => register(i, el)}
              onClick={() => onOpen(i)}
              aria-label={`View ${g.name} full size`}
              className="group block w-full overflow-hidden rounded-sm border border-slate-800 text-left outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <span className={`relative block overflow-hidden bg-[#0d1117] ${masonry ? "" : "aspect-[4/3]"}`} style={masonry ? { aspectRatio: `${g.width} / ${g.height}` } : undefined}>
                <Image src={g.src} alt={g.alt} width={g.width} height={g.height} sizes="(min-width: 896px) 270px, 45vw" loading="lazy" className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />
              </span>
              <span className="block px-2.5 py-2">
                <span className="block font-mono text-[10px] tracking-wider text-sky-300">{g.name}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-slate-300">{g.detail}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function NasaDeepDive({ onClose, returnFocusTo }: { onClose: () => void; returnFocusTo: HTMLElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const viewerClose = useRef<HTMLButtonElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const [view, setView] = useState<number | null>(null);
  // a click outside the card closes it; both press and release must be outside, so selecting text never does
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

  useEffect(() => {
    if (view !== null) viewerClose.current?.focus();
  }, [view]);

  const register = (i: number, el: HTMLButtonElement | null) => { cards.current[i] = el; };

  const closeViewer = () => {
    const i = view;
    setView(null);
    if (i !== null) cards.current[i]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (view === null) return;
    const n = GALLERY.length;
    if (e.key === "ArrowRight") setView((view + 1) % n);
    else if (e.key === "ArrowLeft") setView((view - 1 + n) % n);
    else return;
    e.preventDefault();
  };

  const shown = view === null ? null : GALLERY[view];

  return (
    <dialog
      ref={dialog}
      aria-labelledby="nasa-title"
      onKeyDown={onKeyDown}
      onPointerDown={(e) => { pressedOutside.current = isOutside(e); }}
      onClick={(e) => {
        if (pressedOutside.current && isOutside(e)) dialog.current?.close();
        pressedOutside.current = false;
      }}
      onCancel={(e) => {
        // Escape steps back from the viewer to the grid first
        if (view !== null) {
          e.preventDefault();
          closeViewer();
        }
      }}
      onClose={() => {
        returnFocusTo?.focus();
        onClose();
      }}
      className="deep-dialog card-glass m-auto max-h-[92dvh] w-[min(56rem,calc(100%-1rem))] overflow-y-auto rounded-md border border-sky-900 p-5 text-slate-100 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <button type="button" onClick={() => dialog.current?.close()} className="order-2 shrink-0 rounded-sm font-mono text-xs tracking-wider text-sky-200 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-sky-300">
          close &#x2715;
        </button>
        <div className="order-1">
          <p className="font-mono text-xs tracking-wider text-sky-300">{NASA.subtitle}</p>
          <h2 id="nasa-title" className="mt-1 font-display text-2xl sm:text-3xl">{NASA.name}</h2>
          <p id="nasa-dates" className="mt-1 font-mono text-[11px] text-slate-300">{NASA.dates}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-300">{NASA.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] text-slate-300">
        {NASA.tools.map((t) => <li key={t} className="rounded-sm border border-slate-700 px-2 py-1">{t}</li>)}
      </ul>

      {SECTIONS.map((sec) => (
        <section key={sec.heading} className="mt-8">
          <Heading>{sec.heading.toUpperCase()}</Heading>
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            {sec.paragraphs.map((p) => <p key={p}>{p}</p>)}
          </div>
          {SECTION_PHOTOS[sec.heading] && (
            <div className="mt-4">
              <PhotoGrid images={inGroup(SECTION_PHOTOS[sec.heading])} masonry register={register} onOpen={setView} />
            </div>
          )}
        </section>
      ))}

      <section className="mt-8">
        <Heading>PHOTOS AND FACILITIES TOURED</Heading>
        <PhotoGrid images={inGroup("tours")} register={register} onOpen={setView} />
      </section>

      {shown && view !== null && (
        <div role="group" aria-label="Photo viewer" className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#03050b]/95 p-4">
          <button ref={viewerClose} type="button" onClick={closeViewer} className="self-end rounded-sm font-mono text-xs tracking-wider text-sky-200 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-sky-300">
            back to photos &#x2715;
          </button>
          <Image key={shown.src} src={shown.src} alt={shown.alt} width={shown.width} height={shown.height} sizes="(min-width: 900px) 800px, 100vw" className="h-auto max-h-[65dvh] w-auto max-w-full object-contain" />
          <p className="text-center font-mono text-xs tracking-wider text-sky-300">{shown.name}</p>
          <p className="max-w-xl text-center text-xs leading-snug text-slate-300">{shown.detail}</p>
          <div className="flex items-center gap-6 font-mono text-xs text-sky-200">
            <button type="button" onClick={() => setView((view - 1 + GALLERY.length) % GALLERY.length)} className="rounded-sm px-2 py-1 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-sky-300">&larr; previous</button>
            <span aria-live="polite">{view + 1} / {GALLERY.length}</span>
            <button type="button" onClick={() => setView((view + 1) % GALLERY.length)} className="rounded-sm px-2 py-1 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-sky-300">next &rarr;</button>
          </div>
        </div>
      )}
    </dialog>
  );
}
