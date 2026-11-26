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
    bgPattern: "cork",
    density: "comfortable",
  },
};

/** Paper pinned on cork: a wall calendar, index cards and a clothesline. */
export const corkBoard: Skin = {
  id: "cork-board",
  name: "Cork Board",
  version: 1,
  tokens: {
    bg: "#A9783F", // the board
    frame: "#6E4A25",
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
    bgPattern: "cork",
    density: "comfortable",
  },
};

/** The same board in the evening: dark cork, dark paper, pale ink. */
export const nightCork: Skin = {
  id: "night-cork",
  name: "Night Cork",
  version: 1,
  tokens: {
    bg: "#3A2B1E",
    frame: "#1E140C",
    surface: "#262421",
    surfaceAlt: "#33302B",
    text: "#F1EBDD",
    textMuted: "#BDB5A4",
    border: "#4D483E",
    accent: "#FF8266",
    accentText: "#1F0D07",
    danger: "#FF9B92",
    warning: "#FFC857",
    success: "#6FD79A",
    fontBody: SANS,
    fontDisplay: fontStack("caveat"),
    fontMono: fontStack("special-elite"),
    fontSize: "15px",
    radius: "6px",
    borderWidth: "1px",
    borderStyle: "solid",
    shadow: "0 8px 14px -6px rgba(0, 0, 0, 0.7)",
    bgPattern: "cork",
    density: "comfortable",
  },
};

/** The skins you can pick from. Your own skins are added after these. */
export const presets: Skin[] = [corkBoard, nightCork];

/** Used when a saved skin can't be found. */
export const DEFAULT_SKIN: Skin = corkBoard;

/** What someone who has never picked a skin sees. */
export const FIRST_RUN_SKIN: Skin = corkBoard;

/** The light and dark skin used by "Follow system light/dark" until you choose others. */
export const SYSTEM_LIGHT_SKIN: Skin = corkBoard;
export const SYSTEM_DARK_SKIN: Skin = nightCork;

export const isBuiltInSkin = (id: string): boolean => presets.some((p) => p.id === id);
