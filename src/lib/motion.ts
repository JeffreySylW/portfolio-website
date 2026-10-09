export function prefersReducedMotion(
  win: { matchMedia?: (query: string) => { matches: boolean } }
): boolean {
  return win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
