// Colour parsing and contrast, for skin validation and the contrast check.
// Supports #rgb, #rgba, #rrggbb, #rrggbbaa, rgb()/rgba(), hsl()/hsla() and "transparent".
// Colour names (like "red") are not supported on purpose: skins use explicit values.

export interface RGBA {
  r: number; // 0-255
  g: number;
  b: number;
  a: number; // 0-1
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function parseNumber(part: string, scale: number): number | null {
  // "50%" -> 0.5 * scale, "128" -> 128
  const match = /^([+-]?(?:\d+\.?\d*|\.\d+))(%?)$/.exec(part);
  if (!match) return null;
  const value = Number(match[1]);
  return match[2] === "%" ? (value / 100) * scale : value;
}

function parseHex(body: string): RGBA | null {
  if (!/^[0-9a-f]+$/i.test(body)) return null;
  let digits = body;
  if (body.length === 3 || body.length === 4) digits = [...body].map((c) => c + c).join("");
  if (digits.length !== 6 && digits.length !== 8) return null;
  const byte = (i: number) => parseInt(digits.slice(i, i + 2), 16);
  return { r: byte(0), g: byte(2), b: byte(4), a: digits.length === 8 ? byte(6) / 255 : 1 };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = (((h % 360) + 360) % 360) / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    const x = (t + 1) % 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [channel(hue + 1 / 3) * 255, channel(hue) * 255, channel(hue - 1 / 3) * 255];
}

export function parseColor(input: string): RGBA | null {
  const text = input.trim().toLowerCase();
  if (text === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (text.startsWith("#")) return parseHex(text.slice(1));

  const fn = /^(rgba?|hsla?)\(([^()]*)\)$/.exec(text);
  if (!fn) return null;
  const parts = (fn[2] ?? "").split(/[\s,/]+/).filter(Boolean);
  if (parts.length !== 3 && parts.length !== 4) return null;

  const alpha = parts[3] === undefined ? 1 : parseNumber(parts[3], 1);
  if (alpha === null) return null;

  if (fn[1]?.startsWith("rgb")) {
    const [r, g, b] = [0, 1, 2].map((i) => parseNumber(parts[i] ?? "", 255));
    if (r === null || g === null || b === null || r === undefined || g === undefined || b === undefined) return null;
    return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255), a: clamp(alpha, 0, 1) };
  }

  const hue = parseNumber((parts[0] ?? "").replace(/deg$/, ""), 360);
  const sat = parseNumber(parts[1] ?? "", 1);
  const light = parseNumber(parts[2] ?? "", 1);
  if (hue === null || sat === null || light === null) return null;
  if (!(parts[1] ?? "").endsWith("%") || !(parts[2] ?? "").endsWith("%")) return null;
  const [r, g, b] = hslToRgb(hue, clamp(sat, 0, 1), clamp(light, 0, 1));
  return { r, g, b, a: clamp(alpha, 0, 1) };
}

/** "#rrggbb" (alpha is dropped). */
export function toHex({ r, g, b }: RGBA): string {
  const hex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance({ r, g, b }: RGBA): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio (1 to 21) between two colours, or null if either can't be read. Alpha is ignored. */
export function contrastRatio(a: string, b: string): number | null {
  const first = parseColor(a);
  const second = parseColor(b);
  if (!first || !second) return null;
  const [light, dark] = [luminance(first), luminance(second)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** True if black text would read worse than white text on this colour. */
export function isDarkColor(input: string): boolean {
  const color = parseColor(input);
  return color !== null && luminance(color) < 0.179;
}

export interface ContrastCheck {
  label: string;
  ratio: number | null;
  /** True if it meets WCAG AA for normal text (4.5:1). */
  ok: boolean;
}

export const WCAG_AA = 4.5;

/** The three pairs CLAUDE.md 7.5 asks the editor to warn about. */
export function skinContrastChecks(tokens: {
  text: string;
  bg: string;
  surface: string;
  accentText: string;
  accent: string;
}): ContrastCheck[] {
  const pair = (label: string, fg: string, bg: string): ContrastCheck => {
    const ratio = contrastRatio(fg, bg);
    return { label, ratio, ok: ratio !== null && ratio >= WCAG_AA };
  };
  return [
    pair("Text on the page background", tokens.text, tokens.bg),
    pair("Text on panels", tokens.text, tokens.surface),
    pair("Text on accent buttons", tokens.accentText, tokens.accent),
  ];
}
