"use client";

// Circuit-board backdrop for the Bob card, drawn like a real PCB: dark solder
// mask, copper traces, gold (ENIG) pads, silkscreen designators and test
// points. On first view a pulse of current runs the traces and a pixel bug
// walks into chip U1 and turns into a ✓. Reduced motion is handled by the
// global rule in globals.css, which jumps every animation to its end state.
import type { CSSProperties } from "react";

const TRACES = [
  "M0 64 H150 V118 H330",
  "M0 212 H96 V164 H262 V232 H438",
  "M540 0 V72 H652 V150 H800",
  "M800 262 H708 V330",
  "M330 118 H470 V64 H540",
  "M600 232 H700 V200 H800",
];
// The bug's route ends at U1's left pin.
const BUG_PATH = "M0 212 H96 V164 H262 V232 H438";
const PADS: [number, number][] = [[150, 64], [330, 118], [96, 212], [262, 164], [470, 64], [652, 72], [708, 262], [700, 200]];
const SILK: [number, number, string][] = [[156, 56, "R7"], [336, 110, "C12"], [476, 56, "R3"], [658, 64, "C4"], [714, 254, "J1"]];
const TEST_POINTS: [number, number, string][] = [[210, 290, "TP1"], [560, 300, "TP2"], [760, 120, "TP3"]];

function Bug() {
  // 8×6 pixel bug, centred on its path position
  const px = ["01100110", "00111100", "11111111", "00111100", "11111111", "01000010"];
  return (
    <g transform="translate(-8,-6)">
      {px.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "1" ? <rect key={`${x}-${y}`} x={x * 2} y={y * 2} width="2" height="2" fill="var(--pcb-green)" /> : null
        )
      )}
    </g>
  );
}

export function CircuitBoard({ active }: { active: boolean }) {
  const silk = { fill: "var(--pcb-silk)", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: 1, opacity: 0.55 } as const;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 330"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* copper traces under the mask */}
      <g stroke="var(--pcb-trace)" strokeWidth="2" fill="none" strokeLinejoin="round">
        {TRACES.map((d) => <path key={d} d={d} />)}
      </g>

      {/* one-shot current pulse */}
      {active && (
        <g fill="none" stroke="var(--pcb-green)" strokeWidth="2" strokeLinejoin="round">
          {TRACES.map((d, i) => (
            <path
              key={d}
              d={d}
              pathLength={1}
              strokeDasharray="1"
              style={{ animation: `pcb-pulse 1.4s ease-out ${i * 120}ms both` }}
            />
          ))}
        </g>
      )}

      {/* gold pads, silkscreen designators, test points */}
      <g fill="var(--pcb-gold)" opacity="0.8">
        {PADS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />)}
      </g>
      {SILK.map(([x, y, t]) => <text key={t} x={x} y={y} style={silk}>{t}</text>)}
      {TEST_POINTS.map(([x, y, t]) => (
        <g key={t}>
          <circle cx={x} cy={y} r="5" fill="none" stroke="var(--pcb-gold)" strokeWidth="1.5" opacity="0.8" />
          <text x={x + 9} y={y + 3} style={silk}>{t}</text>
        </g>
      ))}

      {/* chip U1 — where the bug ends up */}
      <g transform="translate(446 214)">
        <rect width="64" height="38" rx="3" fill="var(--pcb-panel)" stroke="var(--pcb-trace)" strokeWidth="2" />
        {[8, 20, 32, 44, 56].map((x) => (
          <g key={x} fill="var(--pcb-gold)" opacity="0.7">
            <rect x={x - 2} y={-6} width="4" height="6" />
            <rect x={x - 2} y={38} width="4" height="6" />
          </g>
        ))}
        <text x="6" y="-10" style={silk}>U1</text>
      </g>

      {/* the bug walks in… */}
      {active && (
        <g style={{ offsetPath: `path("${BUG_PATH}")`, offsetRotate: "0deg", animation: "pcb-crawl 2.6s ease-in-out 600ms both" } as CSSProperties}>
          <Bug />
        </g>
      )}

      {/* …and gets fixed */}
      <g transform="translate(478 233)">
        <g
          style={
            active
              ? ({ animation: "pcb-fix 300ms ease-out 3.2s both", transformBox: "fill-box", transformOrigin: "center" } as CSSProperties)
              : { opacity: 0 }
          }
        >
          <circle r="11" fill="var(--pcb-panel)" stroke="var(--pcb-green)" strokeWidth="2" />
          <path d="M-5 0 L-1 4 L6 -4" stroke="var(--pcb-green)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
