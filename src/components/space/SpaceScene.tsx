"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { BODIES } from "@/content/space";
import { canUseWebGL } from "@/lib/webgl";
import { prefersReducedMotion } from "@/lib/motion";
import { BodyLabel } from "./BodyLabel";
import { SceneBoundary } from "./SceneBoundary";
import { SunIntro } from "./SunIntro";
import { Timeline } from "./Timeline";
import { StoryPanel } from "./StoryPanel";
import { NasaDeepDive } from "./NasaDeepDive";
import { BobCaseFile } from "../BobCaseFile";
import { StaticExperience } from "./StaticExperience";

const GalaxyCanvas = dynamic(() => import("./GalaxyCanvas").then((m) => m.GalaxyCanvas), {
  ssr: false,
  loading: () => null,
});

const KNOWN = new Set(["sun", ...BODIES.map((b) => b.id)]);

export default function SpaceScene() {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [reduced, setReduced] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [arrived, setArrived] = useState<string | null>(null);
  const [opener, setOpener] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // mount-only: WebGL and hash can only be read in the browser (SSR-safe)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(canUseWebGL(document));
    setReduced(prefersReducedMotion(window));
    const fromHash = window.location.hash.replace("#", "");
    if (KNOWN.has(fromHash)) setSelected(fromHash);
  }, []);

  const choose = useCallback((id: string | null) => {
    if (id) setOpener(document.activeElement as HTMLElement | null);
    setArrived(null);
    setSelected(id);
  }, []);

  // cards (NASA, Bob) open once the camera has arrived (at once under reduced motion); the canvas freezes then
  const deep = selected === "nasa" || selected === "bob";
  const cardOpen = deep && (reduced || arrived === selected);

  const close = useCallback(() => choose(null), [choose]);

  const intro = (
    <>
      <SunIntro />
      <Timeline onSelect={choose} />
    </>
  );
  if (webgl === null) return intro;
  if (!webgl) return <StaticExperience />;

  return (
    <>
      <div id="top" className="relative h-[100svh] w-full overflow-hidden bg-[#03050b]">
        {/* labels use a high z-index; hide them behind the full-screen case file */}
        <div className={`absolute inset-0${selected === "bob" && cardOpen ? " invisible" : ""}`}>
          <SceneBoundary onError={() => setWebgl(false)}>
            <GalaxyCanvas
              selectedId={selected}
              onSelect={choose}
              reducedMotion={reduced}
              paused={cardOpen}
              onArrive={setArrived}
              onCreated={(canvas) => canvas.addEventListener("webglcontextlost", () => setWebgl(false), { once: true })}
              labelFor={(id) => <BodyLabel id={id} onActivate={choose} />}
            />
          </SceneBoundary>
        </div>
        {deep ? (
          selected === "nasa" && cardOpen ? <NasaDeepDive onClose={close} returnFocusTo={opener} /> : null
        ) : (
          <StoryPanel id={selected} onClose={close} returnFocusTo={opener} />
        )}
        <BobCaseFile open={selected === "bob" && cardOpen} onClose={close} originRect={null} returnFocusTo={opener} />
        <p className="sr-only">
          Explore the galaxy with the planet buttons, or scroll down for the timeline.
        </p>
      </div>
      {intro}
    </>
  );
}
