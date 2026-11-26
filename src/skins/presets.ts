import { fontStack } from "../lib/fonts";
import type { Skin } from "../types";

// Skin preset data is the only place hard-coded colours are allowed.
// Every preset uses fonts from lib/fonts.ts and takes its look from tokens alone.

const SANS = fontStack("system-sans");
const MONO = fontStack("system-mono");

/**
 * A plain, calm skin (light grey and white, deep green accent). It is NOT offered as a choice any more:
 * it's the base that fills in any value a skin leaves out (see lib/skinSchema.ts).
 */
export const cleanLight: Skin = {
  id: "clean-light",
  name: "Clean Light",
  version: 1,
  tokens: {
    bg: "#F3F5F4",
    surface: "#FFFFFF",
    surfaceAlt: "#EAEEEC",
    text: "#1B2421",
    textMuted: "#56635D",
    border: "#D3DAD6",
    accent: "#1F6B4F",
    accentText: "#FFFFFF",
    danger: "#B3261E",
    warning: "#8A5A00",
    success: "#1E7A46",
    fontBody: SANS,
    fontDisplay: SANS,
    fontMono: MONO,
    fontSize: "15px",
    radius: "10px",
    borderWidth: "1px",
    borderStyle: "solid",
    shadow: "0 1px 3px rgba(20, 40, 30, 0.12)",
    bgPattern: "none",
    density: "comfortable",
    layout: "tape",
  },
};

/**
 * The designed default: Apple Calendar-style layout in cool silver, with a portable
 * player deck (green-grey LCD, transport keys, equaliser) and cassette project cards.
 */
export const portableSilver: Skin = {
  id: "portable-silver",
  name: "Portable Silver",
  version: 1,
  tokens: {
    bg: "#E3E5E9",
    surface: "#FBFAF7",
    surfaceAlt: "#E6E9EE",
    text: "#1D1F24",
    textMuted: "#5F646C",
    border: "#C5CAD2",
    accent: "#B8321F", // record red, also today
    accentText: "#FFFFFF",
    danger: "#B3261E",
    warning: "#8A5A00",
    success: "#1B6E3F",
    fontBody: SANS,
    fontDisplay: fontStack("caveat"), // handwriting, like the label on a tape
    fontMono: fontStack("share-tech-mono"),
    fontSize: "15px",
    radius: "12px",
    borderWidth: "1px",
    borderStyle: "solid",
    shadow: "0 1px 2px rgba(0, 0, 0, 0.06), 0 8px 18px -10px rgba(30, 30, 50, 0.3)",
    bgPattern: "none",
    density: "comfortable",
    layout: "tape",
    lcdBg: "#B5C79A", // classic green-grey LCD
    lcdText: "#1C2A14",
  },
};

/** Black plastic boombox with an amber display. The dark partner of Portable Silver. */
export const boombox: Skin = {
  id: "boombox",
  name: "Boombox",
  version: 1,
  tokens: {
    bg: "#16171A",
    surface: "#202226",
    surfaceAlt: "#2B2E33",
    text: "#EDEDED",
    textMuted: "#AEB1B8",
    border: "#3C4047",
    accent: "#FF6A3D",
    accentText: "#1A0D08",
    danger: "#FF7B72",
    warning: "#FFC24A",
    success: "#5BD08F",
    fontBody: SANS,
    fontDisplay: fontStack("caveat"),
    fontMono: fontStack("share-tech-mono"),
    fontSize: "15px",
    radius: "12px",
    borderWidth: "1px",
    borderStyle: "solid",
    shadow: "0 1px 2px rgba(0, 0, 0, 0.5), 0 10px 24px -12px rgba(0, 0, 0, 0.7)",
    bgPattern: "none",
    density: "comfortable",
    layout: "tape",
    lcdBg: "#241A0A",
    lcdText: "#FFB84A", // amber
  },
};

/** Paper pinned on cork: a wall calendar, index cards and a clothesline. */
export const corkBoard: Skin = {
  id: "cork-board",
  name: "Cork Board",
  version: 1,
  tokens: {
    bg: "#EFE6D2",
    surface: "#FFFDF6",
    surfaceAlt: "#F3EBD8",
    text: "#26303F",
    textMuted: "#575D6B",
    border: "#D9CFB4",
    accent: "#B8321F", // red marker: today, buttons
    accentText: "#FFFFFF",
    danger: "#B3261E",
    warning: "#805000",
    success: "#1B6E3F",
    fontBody: SANS,
    fontDisplay: fontStack("caveat"), // handwriting
    fontMono: fontStack("special-elite"), // typewriter, for card titles
    fontSize: "15px",
    radius: "6px",
    borderWidth: "1px",
    borderStyle: "solid",
    shadow: "0 8px 14px -6px rgba(40, 20, 0, 0.45)",
    bgPattern: "none",
    density: "comfortable",
    layout: "cork",
  },
};

/** The skins you can pick from. Your own skins are added after these. */
export const presets: Skin[] = [corkBoard, portableSilver, boombox];

/** Used when a saved skin can't be found. */
export const DEFAULT_SKIN: Skin = corkBoard;

/** What someone who has never picked a skin sees. */
export const FIRST_RUN_SKIN: Skin = corkBoard;

/** The light and dark skin used by "Follow system light/dark" until you choose others. */
export const SYSTEM_LIGHT_SKIN: Skin = corkBoard;
export const SYSTEM_DARK_SKIN: Skin = boombox;

export const isBuiltInSkin = (id: string): boolean => presets.some((p) => p.id === id);
