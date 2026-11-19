import { cleanLight } from "../skins/presets";
import type { BgPattern, BorderStyle, Density, Skin, SkinTokens } from "../types";

// Skin validation + defaults.
//
// STATUS: structural checks only (right shape, right types, allowed words,
// size caps), with anything missing filled in from Clean Light. Strict syntax
// checks (colours must parse, lengths must match the pattern, fonts must come
// from the allowed list, image data URLs) arrive with the skin editor and
// import work in M7-M9. See CLAUDE.md section 7.6.

export const BORDER_STYLES: readonly BorderStyle[] = [
  "solid", "dashed", "double", "outset", "inset", "ridge", "groove",
];
export const BG_PATTERNS: readonly BgPattern[] = ["none", "grid", "dots", "scanlines", "lines"];
export const DENSITIES: readonly Density[] = ["compact", "comfortable"];

/** Tokens whose value is a free-form string. */
const TEXT_TOKEN_KEYS = [
  "bg", "surface", "surfaceAlt", "text", "textMuted", "border",
  "accent", "accentText", "danger", "warning", "success",
  "fontBody", "fontDisplay", "fontMono", "fontSize",
  "radius", "borderWidth", "shadow",
] as const satisfies readonly (keyof SkinTokens)[];

const MAX_TOKEN_LENGTH = 400;
/** ~500 KB of image, as base64 text. */
export const MAX_BG_IMAGE_LENGTH = 700_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickOne<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.find((option) => option === value) ?? fallback;
}

/** Turn unknown data into a complete Skin, or null if it clearly isn't one. */
export function sanitizeSkin(raw: unknown): Skin | null {
  if (!isRecord(raw)) return null;
  const { id, name, author, version, tokens } = raw;

  if (typeof id !== "string" || id.trim() === "") return null;
  if (typeof name !== "string" || name.trim() === "") return null;
  if (version !== 1) return null;
  if (!isRecord(tokens)) return null;

  const defaults = cleanLight.tokens;
  const merged: SkinTokens = {
    ...defaults,
    borderStyle: pickOne(tokens.borderStyle, BORDER_STYLES, defaults.borderStyle),
    bgPattern: pickOne(tokens.bgPattern, BG_PATTERNS, "none"),
    density: pickOne(tokens.density, DENSITIES, "comfortable"),
  };

  for (const key of TEXT_TOKEN_KEYS) {
    const value = tokens[key];
    if (typeof value === "string" && value.trim() !== "" && value.length <= MAX_TOKEN_LENGTH) {
      merged[key] = value;
    }
  }

  const bgImage = tokens.bgImage;
  if (typeof bgImage === "string" && bgImage.length <= MAX_BG_IMAGE_LENGTH) {
    merged.bgImage = bgImage;
  } else {
    delete merged.bgImage;
  }

  const skin: Skin = { id, name: name.trim(), version: 1, tokens: merged };
  if (typeof author === "string" && author.trim() !== "") skin.author = author.trim();
  return skin;
}
