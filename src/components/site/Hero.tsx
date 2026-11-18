import { PLACES, PROFILE } from "@/content/work";
import { pinPosition } from "@/lib/pins";
import { LiveEarth, SunReadout } from "./LiveEarth";

const NAV = [
  { href: "#work", label: "Work" },
  { href: "#nasa", label: "NASA" },
  { href: "#bob", label: "Bob" },
  { href: "#resume", label: "Resume" },
  { href: "#contact", label: "Contact" },
];

function PixelPlus({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 5 5" shapeRendering="crispEdges" className={className}>
      <rect x="2" y="0" width="1" height="5" fill="currentColor" />
      <rect x="0" y="2" width="5" height="1" fill="currentColor" />
    </svg>
  );
}

export function Hero() {
  const rva = pinPosition("richmond");
  const hampton = pinPosition("hampton");
  return (
    <section id="top" aria-label="Introduction" className="relative isolate min-h-[100svh] overflow-hidden">
      <div aria-hidden="true" className="stars absolute inset-0 -z-10 opacity-90" />
      <div aria-hidden="true" className="stars-twinkle absolute inset-0 -z-10" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 md:px-16 md:py-9">
        <a href="#top" className="px-label text-[16px] text-starlight no-underline md:text-[18px]" aria-label="Jeffrey Weaver, back to top">
          JW
        </a>
        <nav aria-label="Main">
          <ul className="flex gap-4 md:gap-9">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="px-label inline-block py-3 text-[12px] text-starlight no-underline hover:text-lavender">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* the Earth: baked image first (no JavaScript needed), then the live repaint on top */}
      <div
        data-earth
        className="absolute left-[-38vw] top-[-14vw] aspect-square w-[150vw] md:left-[-16vw] md:top-1/2 md:w-[min(78vw,1180px)] md:-translate-y-[52%]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- exact pixels matter: the night side must not be resampled */}
        <img
          src="/textures/earth/globe-1600.webp"
          srcSet="/textures/earth/globe-900.webp 900w, /textures/earth/globe-1600.webp 1600w"
          sizes="(min-width: 768px) min(78vw, 1180px), 150vw"
          width={1600}
          height={1600}
          alt="The Earth over the Americas: the daylit side is a NASA Blue Marble photo, the night side is drawn as indigo pixel art"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full"
        />
        <LiveEarth />

        <div className="absolute" style={{ left: `${rva.x * 100}%`, top: `${rva.y * 100}%` }}>
          <PixelPlus className="absolute h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 text-starlight md:h-5 md:w-5" />
          <div aria-hidden="true" className="absolute left-[10px] top-[-1px] hidden h-[2px] w-[118px] bg-starlight md:block" />
          <a
            href="#work-vcu"
            className="px-label px-frame absolute left-[128px] top-[-14px] hidden whitespace-nowrap px-2.5 py-1.5 text-[12px] leading-[1.5] text-starlight no-underline md:block"
          >
            {PLACES.richmond.label}
            <br />
            <span className="text-lavender">VCU · Bob The Tech Guy</span>
          </a>
        </div>
        <div className="absolute" style={{ left: `${hampton.x * 100}%`, top: `${hampton.y * 100}%` }}>
          <div aria-hidden="true" className="absolute left-[-1px] top-[6px] hidden h-[58px] w-[2px] bg-lavender md:block" />
          <a
            href="#work-nasa"
            className="px-label px-frame absolute left-[0px] top-[62px] hidden whitespace-nowrap px-2.5 py-1.5 text-[12px] leading-[1.5] text-starlight no-underline md:block"
          >
            {PLACES.hampton.label}
            <br />
            <span className="text-lavender">NASA Langley</span>
          </a>
        </div>
      </div>

      <div className="relative z-10 px-5 pb-28 pt-[112vw] md:absolute md:right-[6vw] md:top-1/2 md:w-[min(520px,40vw)] md:-translate-y-1/2 md:p-0">
        <p className="px-label text-[12px] text-lavender">
          {PROFILE.role} · {PROFILE.location}
        </p>
        <h1 className="mt-5 font-display text-[clamp(72px,10vw,156px)] font-extrabold uppercase leading-[0.84] tracking-[-0.01em]">
          Jeffrey
          <br />
          Weaver
        </h1>
        <p className="mt-6 max-w-[26rem] text-[17px] leading-[1.55] text-mist md:text-[19px]">{PROFILE.intro}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <a href="#work" className="px-btn">
            See the work
          </a>
          <a href={PROFILE.resumeHref} className="py-3 text-[16px] text-starlight underline underline-offset-4 hover:text-lavender">
            Resume (PDF)
          </a>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 md:px-16 md:pb-8">
        <SunReadout />
      </div>
    </section>
  );
}
