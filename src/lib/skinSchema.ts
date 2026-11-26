import { cleanLight } from "../skins/presets";
import type { BgPattern, BorderStyle, Density, Skin, SkinTokens } from "../types";
import { parseColor } from "./color";
import { isAllowedFontStack } from "./fonts";

// Skin validation + defaults (CLAUDE.md 7.6). A skin is DATA ONLY: every value
// is checked against a strict rule, and anything else is thrown away. Nothing
// here ever turns skin text into CSS or script.
//
//   colours      must parse as a colour (hex, rgb(), hsl())
//   sizes        must match  ^\d+(\.\d+)?(px|rem|em)$
//   fonts        must be exactly one of the allowed stacks in lib/fonts.ts
//   shadow       "none", or offsets + blur (+ spread) + colour, up to 4 layers
//   background   an inline PNG/JPEG/WebP/GIF data URL, about 500 KB at most
//   the rest     must be one of the listed words
//
// Missing tokens are filled in from Clean Light. A token that is present but
// invalid is reported in `problems` and replaced by the default.

export const BORDER_STYLES: readonly BorderStyle[] = [
  "solid", "dashed", "double", "outset", "inset", "ridge", "groove",
];
export const BG_PATTERNS: readonly BgPattern[] = ["cork", "none", "grid", "dots", "scanlines", "lines"];
export const DENSITIES: readonly Density[] = ["compact", "comfortable"];

const COLOR_KEYS = [
  "bg", "surface", "surfaceAlt", "text", "textMuted", "border",
  "accent", "accentText", "danger", "warning", "success",
] as const satisfies readonly (keyof SkinTokens)[];

const FONT_KEYS = ["fontBody", "fontDisplay", "fontMono"] as const satisfies readonly (keyof SkinTokens)[];
const LENGTH_KEYS = ["fontSize", "radius", "borderWidth"] as const satisfies readonly (keyof SkinTokens)[];

export const LENGTH_PATTERN = /^\d+(\.\d+)?(px|rem|em)$/;
export const MAX_NAME_LENGTH = 60;
export const MAX_ID_LENGTH = 100;
/** ~500 KB of image, as base64 text. */
export const MAX_BG_IMAGE_LENGTH = 700_000;

const SAFE_IMAGE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

/** Only inline raster images may be a skin background: no URLs, no SVG, nothing that could carry script. */
export function isSafeImageDataUrl(value: string): boolean {
  return value.length <= MAX_BG_IMAGE_LENGTH && SAFE_IMAGE.test(value);
}

// ------------------------------------------------------------------ shadows

/** Split on commas that aren't inside brackets, so "a rgba(1,2,3,.4), b" gives two layers. */
function splitLayers(text: string): string[] {
  const layers: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      layers.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  layers.push(current);
  return depth === 0 ? layers : [];
}

function isValidShadowLayer(layer: string): boolean {
  const colour = /(?:rgba?|hsla?)\([^()]*\)|#[0-9a-fA-F]{3,8}\b/.exec(layer);
  if (!colour || parseColor(colour[0]) === null) return false;

  let inset = false;
  let lengths = 0;
  for (const part of layer.replace(colour[0], " ").split(/\s+/).filter(Boolean)) {
    if (part === "inset" && !inset) inset = true;
    else if (/^-?\d+(\.\d+)?(px|rem|em)?$/.test(part)) lengths += 1;
    else return false;
  }
  return lengths >= 2 && lengths <= 4;
}

/** "none", or 1-4 comma-separated layers of: [inset] x y [blur [spread]] colour. */
export function isValidShadow(value: string): boolean {
  const text = value.trim();
  if (text === "none") return true;
  if (text === "" || text.length > 300) return false;
  const layers = splitLayers(text);
  return layers.length >= 1 && layers.length <= 4 && layers.every(isValidShadowLayer);
}

// -------------------------------------------------------------------- check

export interface SkinCheck {
  /** A complete, safe skin, or null if the input clearly isn't a skin at all. */
  skin: Skin | null;
  /** What was wrong. Invalid values have already been replaced by defaults in `skin`. */
  problems: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function show(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value) ?? String(value);
  const short = text.length > 30 ? `${text.slice(0, 30)}…` : text;
  return typeof value === "string" ? JSON.stringify(short) : short; // strings quoted, numbers etc. as-is
}

const absent = (value: unknown) => value === undefined || value === null;

/** Check unknown data and build a complete skin from it. Never throws. */
export function checkSkin(raw: unknown): SkinCheck {
  if (!isRecord(raw)) {
    return { skin: null, problems: ["This isn't a skin file (expected a JSON object)."] };
  }
  const { id, name, author, version, tokens } = raw;
  const fatal = (message: string): SkinCheck => ({ skin: null, problems: [message] });

  if (typeof id !== "string" || id.trim() === "") return fatal('The skin needs an "id".');
  if (typeof name !== "string" || name.trim() === "") return fatal('The skin needs a "name".');
  if (version === undefined) return fatal('The skin is missing its "version".');
  if (version !== 1) {
    return fatal(`This skin uses format version ${show(version)}, which this app doesn't understand.`);
  }
  if (!isRecord(tokens)) return fatal('The skin has no "tokens" section.');

  const problems: string[] = [];
  if (id.length > MAX_ID_LENGTH) problems.push(`"id" is too long (up to ${MAX_ID_LENGTH} characters).`);
  if (name.trim().length > MAX_NAME_LENGTH) {
    problems.push(`"name" is too long (up to ${MAX_NAME_LENGTH} characters).`);
  }

  const defaults = cleanLight.tokens;
  const merged: SkinTokens = { ...defaults };
  const put = (key: keyof SkinTokens, value: unknown) => {
    (merged as unknown as Record<string, unknown>)[key] = value;
  };

  for (const key of COLOR_KEYS) {
    const value = tokens[key];
    if (absent(value)) continue;
    if (typeof value === "string" && value.length <= 100 && parseColor(value)) put(key, value.trim());
    else problems.push(`${key}: ${show(value)} isn't a colour this app can read (use a hex code, rgb() or hsl()).`);
  }

  for (const key of FONT_KEYS) {
    const value = tokens[key];
    if (absent(value)) continue;
    if (typeof value === "string" && isAllowedFontStack(value)) put(key, value);
    else problems.push(`${key}: that font isn't on the allowed list.`);
  }

  for (const key of LENGTH_KEYS) {
    const value = tokens[key];
    if (absent(value)) continue;
    if (typeof value === "string" && LENGTH_PATTERN.test(value)) put(key, value);
    else problems.push(`${key}: ${show(value)} isn't a size like 10px, 1.5rem or 2em.`);
  }

  const shadow = tokens.shadow;
  if (!absent(shadow)) {
    if (typeof shadow === "string" && isValidShadow(shadow)) merged.shadow = shadow.trim();
    else problems.push(`shadow: ${show(shadow)} isn't a shadow this app accepts (use "none", or offsets, blur and a colour).`);
  }

  const words = <T extends string>(key: keyof SkinTokens, allowed: readonly T[], fallback: T): T => {
    const value = tokens[key];
    if (absent(value)) return fallback;
    const found = allowed.find((option) => option === value);
    if (found) return found;
    problems.push(`${key}: ${show(value)} isn't one of: ${allowed.join(", ")}.`);
    return fallback;
  };
  merged.borderStyle = words("borderStyle", BORDER_STYLES, defaults.borderStyle);
  merged.bgPattern = words("bgPattern", BG_PATTERNS, "cork");
  merged.density = words("density", DENSITIES, "comfortable");

  // The heading font is optional too
  delete merged.fontHeading;
  const heading = tokens.fontHeading;
  if (!absent(heading)) {
    if (typeof heading === "string" && isAllowedFontStack(heading)) merged.fontHeading = heading;
    else problems.push("fontHeading: that font isn't on the allowed list.");
  }

  // The frame colour is optional: only kept if the skin sets it
  delete merged.frame;
  const frame = tokens.frame;
  if (!absent(frame)) {
    if (typeof frame === "string" && frame.length <= 100 && parseColor(frame)) merged.frame = frame.trim();
    else problems.push(`frame: ${show(frame)} isn't a colour this app can read (use a hex code, rgb() or hsl()).`);
  }

  delete merged.bgImage;
  const bgImage = tokens.bgImage;
  if (!absent(bgImage) && bgImage !== "") {
    if (typeof bgImage === "string" && isSafeImageDataUrl(bgImage)) merged.bgImage = bgImage;
    else problems.push("bgImage: must be an inline PNG, JPEG, WebP or GIF picture, under about 500 KB.");
  }

  const skin: Skin = {
    id: id.slice(0, MAX_ID_LENGTH),
    name: name.trim().slice(0, MAX_NAME_LENGTH),
    version: 1,
    tokens: merged,
  };
  if (typeof author === "string" && author.trim() !== "") skin.author = author.trim().slice(0, MAX_NAME_LENGTH);
  return { skin, problems };
}

/** The forgiving version, for data we saved ourselves: whatever is usable, or null. */
export function sanitizeSkin(raw: unknown): Skin | null {
  return checkSkin(raw).skin;
}
