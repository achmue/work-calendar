// The fonts a skin may use: a few system stacks plus a curated set of Google Fonts.
// A skin's font tokens must be exactly one of these stacks (CLAUDE.md 7.6), so
// a skin file can never point the app at an arbitrary font or URL.

export interface FontOption {
  id: string;
  label: string;
  /** The full CSS font-family value stored in a skin. */
  stack: string;
  group: "System" | "Google Fonts";
  /** Google Fonts family spec (the part after "family="), if this isn't a system font. */
  google?: string;
}

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", Times, serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
const HAND = '"Segoe Print", "Bradley Hand", cursive';

export const FONT_OPTIONS: readonly FontOption[] = [
  { id: "system-sans", label: "System sans-serif", stack: SANS, group: "System" },
  { id: "system-serif", label: "System serif", stack: SERIF, group: "System" },
  { id: "system-mono", label: "System monospace", stack: MONO, group: "System" },
  { id: "verdana", label: "Verdana / Tahoma", stack: "Verdana, Tahoma, Geneva, sans-serif", group: "System" },
  { id: "inter", label: "Inter", stack: `"Inter", ${SANS}`, group: "Google Fonts", google: "Inter:wght@400;600;700" },
  { id: "nunito", label: "Nunito", stack: `"Nunito", ${SANS}`, group: "Google Fonts", google: "Nunito:wght@400;600;700" },
  { id: "rajdhani", label: "Rajdhani", stack: `"Rajdhani", ${SANS}`, group: "Google Fonts", google: "Rajdhani:wght@400;600;700" },
  { id: "space-grotesk", label: "Space Grotesk", stack: `"Space Grotesk", ${SANS}`, group: "Google Fonts", google: "Space+Grotesk:wght@400;700" },
  { id: "merriweather", label: "Merriweather", stack: `"Merriweather", ${SERIF}`, group: "Google Fonts", google: "Merriweather:wght@400;700" },
  { id: "playfair", label: "Playfair Display", stack: `"Playfair Display", ${SERIF}`, group: "Google Fonts", google: "Playfair+Display:wght@400;700" },
  { id: "orbitron", label: "Orbitron", stack: `"Orbitron", ${SANS}`, group: "Google Fonts", google: "Orbitron:wght@400;700" },
  { id: "share-tech-mono", label: "Share Tech Mono", stack: `"Share Tech Mono", ${MONO}`, group: "Google Fonts", google: "Share+Tech+Mono" },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", stack: `"IBM Plex Mono", ${MONO}`, group: "Google Fonts", google: "IBM+Plex+Mono:wght@400;600" },
  { id: "vt323", label: "VT323 (pixel terminal)", stack: `"VT323", ${MONO}`, group: "Google Fonts", google: "VT323" },
  { id: "special-elite", label: "Special Elite (typewriter)", stack: `"Special Elite", ${MONO}`, group: "Google Fonts", google: "Special+Elite" },
  { id: "courier-prime", label: "Courier Prime (typewriter)", stack: `"Courier Prime", ${MONO}`, group: "Google Fonts", google: "Courier+Prime:wght@400;700" },
  { id: "kalam", label: "Kalam (handwriting)", stack: `"Kalam", ${HAND}`, group: "Google Fonts", google: "Kalam:wght@400;700" },
  { id: "indie-flower", label: "Indie Flower (handwriting)", stack: `"Indie Flower", ${HAND}`, group: "Google Fonts", google: "Indie+Flower" },
  { id: "bebas-neue", label: "Bebas Neue (tall capitals)", stack: `"Bebas Neue", ${SANS}`, group: "Google Fonts", google: "Bebas+Neue" },
  { id: "caveat", label: "Caveat (handwriting)", stack: `"Caveat", ${HAND}`, group: "Google Fonts", google: "Caveat:wght@400;700" },
  { id: "patrick-hand", label: "Patrick Hand (handwriting)", stack: `"Patrick Hand", ${HAND}`, group: "Google Fonts", google: "Patrick+Hand" },
];

export function fontStack(id: string): string {
  const option = FONT_OPTIONS.find((f) => f.id === id);
  if (!option) throw new Error(`Unknown font id: ${id}`);
  return option.stack;
}

export function fontOptionForStack(stack: string): FontOption | undefined {
  return FONT_OPTIONS.find((f) => f.stack === stack);
}

export function isAllowedFontStack(stack: string): boolean {
  return fontOptionForStack(stack) !== undefined;
}

/** The Google Fonts stylesheet URL for these font stacks, or null if none need loading. */
export function googleFontsUrl(stacks: readonly string[]): string | null {
  const specs = new Set<string>();
  for (const stack of stacks) {
    const spec = fontOptionForStack(stack)?.google;
    if (spec) specs.add(spec);
  }
  if (specs.size === 0) return null;
  const families = [...specs].sort().map((s) => `family=${s}`);
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

// --- loading (browser only) -------------------------------------------------

const requested = new Set<string>();
const LINK_ID = "wc-google-fonts";

/**
 * Make sure the Google Fonts used by these stacks are loaded. Requests add up:
 * fonts already asked for stay loaded, so the skin picker can show every preview.
 * The URL is built only from the allowed list above, never from skin data.
 */
export function requestFonts(stacks: readonly string[]): void {
  if (typeof document === "undefined") return;
  const before = requested.size;
  for (const stack of stacks) {
    if (fontOptionForStack(stack)?.google) requested.add(stack);
  }
  if (requested.size === before) return;

  const url = googleFontsUrl([...requested]);
  if (!url) return;
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = url;
}
