"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { MissionStarfield } from "./MissionStarfield";

const PIPELINE = [
  {
    label: "SENSORS",
    detail: "Wind tunnel pressure, temperature, and Mach readings as analog signals.",
  },
  {
    label: "DAS",
    detail: "Data Acquisition System digitizes signals into the Current Value Table.",
  },
  {
    label: "CONNECTOR",
    detail: "Packages data as a one-way UDP stream across the secure data diode.",
  },
  {
    label: "ARTIE SERVER",
    detail: "Central hub distributing live data via UDP Unicast and OPC UA.",
  },
  {
    label: "CLIENT GUI",
    detail: "Test engineers monitor live tunnel health in real time.",
    mine: true,
  },
];

const TOURS = [
  {
    src: "/images/tours/wind-tunnel-14x22.jpg",
    alt: "Empty test section of the 14x22 subsonic wind tunnel",
    name: "14x22 Subsonic Wind Tunnel",
    detail: "The massive tunnel used to test everything from aircraft landings to Mars helicopters.",
  },
  {
    src: "/images/tours/the-gantry.jpg",
    alt: "Group of interns in hard hats beneath the Gantry at NASA Langley",
    name: "The Gantry",
    detail: "Witnessed a helicopter crash-test in person, and toured the inside.",
  },
  {
    src: "/images/tours/transonic-dynamics-tunnel.jpg",
    alt: "Large cylindrical Transonic Dynamics Tunnel structure",
    name: "Transonic Dynamics Tunnel",
    detail: "A unique heavy-gas tunnel that tests the limits of aircraft structures to keep them from breaking apart in flight.",
  },
  {
    src: "/images/tours/unitary-plan-wind-tunnel.jpg",
    alt: "Group indoors at the Unitary Plan Wind Tunnel with aircraft models on the wall",
    name: "Unitary Plan Wind Tunnel",
    detail: "100,000+ horsepower and giant compressors drive the supersonic conditions used to test America's most advanced aircraft.",
  },
  {
    src: "/images/tours/national-transonic-facility.jpg",
    alt: "Group standing inside a large pipe at the National Transonic Facility",
    name: "National Transonic Facility",
    detail: "The world's largest cryogenic, high-pressure, closed-circuit wind tunnel.",
  },
  {
    src: "/images/tours/scramjet.jpg",
    alt: "Group indoors with a SCRAMJET test article on display",
    name: "SCRAMJET",
    detail: "Saw and learned about a supersonic combustion ramjet test article.",
  },
  {
    src: "/images/tours/eight-foot-high-temp-tunnel.jpg",
    alt: "Group atop the sphere of the 8-Foot High Temperature Tunnel",
    name: "8-Foot High Temperature Tunnel",
    detail: "A hypersonic wind tunnel that creates extreme heat and Mach 7 speeds.",
  },
  {
    src: "/images/tours/flight-simulator.jpg",
    alt: "Group inside the full-dome flight simulator",
    name: "Flight Simulator",
    detail: "Simulated landing a plane inside the full-dome visual simulator.",
  },
  {
    src: "/images/tours/compressor-station.jpg",
    alt: "Group outdoors among the piping at the Compressor Station",
    name: "Compressor Station",
    detail: "How each facility on center gets its compressed air for testing.",
  },
  {
    src: "/images/internship/broadcast-control-room.jpg",
    alt: "Server rack running the wind tunnel surveillance system",
    name: "Surveillance Rack",
    detail: "The hardware behind LOG.03, live.",
  },
  {
    src: "/images/internship/wind-tunnel-model-display.jpg",
    alt: "Archival scale model of an early Langley wind tunnel on display",
    name: "Legacy Hardware",
    detail: "Archival scale model of an early Langley tunnel.",
  },
];

export function NasaMissionLog({
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

  if (open && !rendered) {
    setRendered(true);
  }
  if (!open && entered) {
    setEntered(false);
  }

  useEffect(() => {
    if (!open || !rendered) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [open, rendered]);

  useEffect(() => {
    if (open || !rendered) return;
    const timeout = setTimeout(() => setRendered(false), 300);
    return () => clearTimeout(timeout);
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [rendered, onClose]);

  if (!rendered) return null;

  const shapeStyle: CSSProperties =
    entered || !originRect
      ? { transform: "translate(0px, 0px) scale(1, 1)", borderRadius: 0 }
      : (() => {
          const scaleX = originRect.width / window.innerWidth;
          const scaleY = originRect.height / window.innerHeight;
          return {
            transform: `translate(${originRect.left}px, ${originRect.top}px) scale(${scaleX}, ${scaleY})`,
            borderRadius: `${8 / Math.max(scaleX, scaleY, 0.001)}px`,
          };
        })();

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="NASA Langley mission log"
      className="fixed inset-0 z-[100]"
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-console-bg/70 backdrop-blur-md transition-opacity duration-300 ease-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        aria-hidden="true"
        style={shapeStyle}
        className="absolute inset-0 origin-top-left bg-console-bg transition-[transform,border-radius] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      />

      <div
        aria-hidden="true"
        className={`absolute inset-0 overflow-hidden transition-opacity duration-500 ease-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      >
        <MissionStarfield />
      </div>

      <div
        style={{ pointerEvents: entered ? "auto" : "none" }}
        className={`relative z-10 h-full overflow-y-auto px-4 py-6 transition-opacity ease-out sm:py-10 ${
          entered ? "opacity-100 duration-200 delay-150" : "opacity-0 duration-100"
        }`}
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-wider text-console-amber">
                AMENTUM // NASA LANGLEY RESEARCH CENTER
              </p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl text-console-text">
                Mission Log
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 font-mono text-xs tracking-wider text-console-text hover:text-console-amber focus-visible:text-console-amber outline-none"
            >
              close &#x2715;
            </button>
          </div>

          <section className="mb-10">
            <p className="mb-4 font-mono text-xs tracking-wider text-console-amber">
              LOG.01 &mdash; SYSTEM ARCHITECTURE
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
              {PIPELINE.map((stage, i) => (
                <div key={stage.label} className="flex items-center sm:flex-1">
                  <div
                    className={`flex-1 rounded-sm border px-3 py-3 ${
                      stage.mine
                        ? "border-console-amber bg-console-amber/5"
                        : "border-console-grid"
                    }`}
                  >
                    <p
                      className={`font-mono text-[11px] tracking-wider ${
                        stage.mine ? "text-console-amber" : "text-console-text/70"
                      }`}
                    >
                      {stage.label}
                      {stage.mine && " (BUILT)"}
                    </p>
                    <p className="mt-1 font-display text-xs leading-snug text-console-text/80">
                      {stage.detail}
                    </p>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="flex shrink-0 items-center justify-center px-1 font-mono text-console-grid sm:rotate-0 rotate-90"
                    >
                      &rarr;
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <p className="mb-4 font-mono text-xs tracking-wider text-console-amber">
              LOG.02 &mdash; THE FIX
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-sm border border-console-grid px-4 py-4">
                <p className="font-mono text-[11px] tracking-wider text-console-text/60">
                  BEFORE // LABVIEW
                </p>
                <p className="mt-2 font-mono text-2xl text-console-text">10</p>
                <p className="font-mono text-[11px] tracking-wider text-console-text/60">
                  fixed tag/value slots
                </p>
                <p className="mt-3 font-display text-xs leading-relaxed text-console-text/70">
                  Hardcoded for posixtime, sequence, and tags 1&ndash;8 &mdash;
                  no room for the other 34 tags in the packet.
                </p>
              </div>
              <div className="rounded-sm border border-console-amber/40 px-4 py-4">
                <p className="font-mono text-[11px] tracking-wider text-console-amber">
                  BUILT // MATLAB
                </p>
                <p className="mt-2 font-mono text-2xl text-console-amber">22</p>
                <p className="font-mono text-[11px] tracking-wider text-console-text/60">
                  dynamic slots, 42 tags
                </p>
                <p className="mt-3 font-display text-xs leading-relaxed text-console-text/70">
                  Every slot gets a dropdown across all 42 tags, updating its
                  value field live on selection.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <p className="mb-4 font-mono text-xs tracking-wider text-console-amber">
              LOG.03 &mdash; SIDE QUEST: WIND TUNNEL SURVEILLANCE
            </p>
            <div className="space-y-3 font-display text-sm leading-relaxed text-console-text/80">
              <p>
                Built a system combining live video with real-time test data.
                Two cameras on the test section fed a hardware Multiview,
                combining both angles into a single split-screen display.
              </p>
              <p>
                A dedicated Linux system read sensor data &mdash; pressure,
                temperature, Mach number &mdash; and overlaid it as text tags
                directly onto the video feed. The combined stream went to a
                Mac Mini, recording a video log for every test run.
              </p>
              <p>
                Remote Desktop streamed the main display, letting anyone on
                the lab network monitor the experiment live from their own
                workstation.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <p className="mb-4 font-mono text-xs tracking-wider text-console-amber">
              LOG.04 &mdash; FACILITIES TOURED
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TOURS.map((tour) => (
                <figure
                  key={tour.name}
                  className="group overflow-hidden rounded-sm border border-console-grid"
                >
                  <div
                    className="relative overflow-hidden bg-console-panel"
                    style={{ aspectRatio: "4 / 3" }}
                  >
                    <Image
                      src={tour.src}
                      alt={tour.alt}
                      fill
                      sizes="(min-width: 640px) 33vw, 50vw"
                      className="scale-[1.03] object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                  </div>
                  <figcaption className="px-2.5 py-2">
                    <p className="font-mono text-[10px] tracking-wider text-console-amber">
                      {tour.name}
                    </p>
                    <p className="mt-0.5 font-display text-[11px] leading-snug text-console-text/60">
                      {tour.detail}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <blockquote className="border-l-2 border-console-amber pl-4 font-display text-sm italic leading-relaxed text-console-text/80">
            &ldquo;Software engineering is also systems engineering &mdash;
            building effective software takes a real understanding of the
            hardware it runs on, not just the code.&rdquo;
          </blockquote>
        </div>
      </div>
    </div>,
    document.body
  );
}
