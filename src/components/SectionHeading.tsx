import { ScrambleHeading } from "./ScrambleHeading";

export function SectionHeading({ id, children }: { id: string; children: string }) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <span className="font-mono text-xs tracking-wider text-signal shrink-0">
        SEC.{id.toUpperCase()}
      </span>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
      <ScrambleHeading text={children} className="font-mono text-xs tracking-wider text-ink-soft shrink-0" />
    </div>
  );
}
