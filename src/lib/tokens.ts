// Colour tokens (mirrored as CSS variables in globals.css) and the text/background pairs the site uses.

export const TOKENS = {
  void: "#07061a",
  deep: "#15123d",
  indigo: "#2b2a7a",
  violet: "#5b54d6",
  lavender: "#a9a4ff",
  starlight: "#f2f0ff",
  /** Body copy: a softened starlight for long paragraphs. */
  mist: "#d9d6ff",
} as const;

export type Token = keyof typeof TOKENS;

/** [text, background] pairs used for readable text. Violet is decoration only and never carries text. */
export const TEXT_PAIRS: [Token, Token][] = [
  ["starlight", "void"],
  ["mist", "void"],
  ["lavender", "void"],
  ["starlight", "deep"],
  ["mist", "deep"],
  ["lavender", "deep"],
  ["starlight", "indigo"],
  ["mist", "indigo"],
  ["void", "lavender"],
  ["void", "starlight"],
];

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
