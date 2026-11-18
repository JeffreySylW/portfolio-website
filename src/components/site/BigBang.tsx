import { introScript } from "@/lib/bigBang";
import { BigBangPlayer } from "./BigBangPlayer";

// The opening Big Bang (see src/lib/bigBang.ts): white screen, a black drop, ink, a burst of stars. The veil is display:none unless the inline script below
// arms it before first paint, so without JavaScript nothing is ever covered. aria-hidden: it is decoration;
// any key, click, tap or scroll ends it, so keyboard and screen-reader users are never held up.
export function BigBang() {
  return (
    <>
      <div id="bang" className="bang-veil" aria-hidden="true" suppressHydrationWarning>
        <BigBangPlayer />
      </div>
      <script dangerouslySetInnerHTML={{ __html: introScript }} />
    </>
  );
}
