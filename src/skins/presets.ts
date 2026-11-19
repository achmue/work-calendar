import { fontStack } from "../lib/fonts";
import type { Skin } from "../types";

// Skin preset data is the only place hard-coded colours are allowed.
// Every preset uses fonts from lib/fonts.ts and takes its look from tokens alone.

const SANS = fontStack("system-sans");
const MONO = fontStack("system-mono");

/** Calm default: light grey and white with a deep green accent. */
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
  },
};

/** The dark version of Clean Light. */
export const cleanDark: Skin = {
  id: "clean-dark",
  name: "Clean Dark",
  version: 1,
  tokens: {
    bg: "#111816",
    surface: "#1A2320",
    surfaceAlt: "#232E2A",
    text: "#E8F0EC",
    textMuted: "#A5B4AD",
    border: "#34423C",
    accent: "#4FC08D",
    accentText: "#08130E",
    danger: "#FF7A70",
    warning: "#F2B84B",
    success: "#5BD08F",
    fontBody: SANS,
    fontDisplay: SANS,
    fontMono: MONO,
    fontSize: "15px",
    radius: "10px",
    borderWidth: "1px",
    borderStyle: "solid",
    shadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
    bgPattern: "none",
    density: "comfortable",
  },
};

/** Inspired by 90s media-player skins: gunmetal panels, bevelled edges, green LCD readouts. */
export const retroPlayer: Skin = {
  id: "retro-player",
  name: "Retro Player",
  version: 1,
  tokens: {
    bg: "#16191B",
    surface: "#2B3135",
    surfaceAlt: "#0B100C", // the "LCD" background behind readouts
    text: "#D8DFE2",
    textMuted: "#A1ADB3",
    border: "#6B777E",
    accent: "#3DFF7A", // LCD green
    accentText: "#04130A",
    danger: "#FF6A5E",
    warning: "#FFC24A",
    success: "#3DFF7A",
    fontBody: fontStack("verdana"),
    fontDisplay: fontStack("share-tech-mono"),
    fontMono: fontStack("share-tech-mono"),
    fontSize: "14px",
    radius: "0px",
    borderWidth: "2px",
    borderStyle: "outset",
    shadow: "none",
    bgPattern: "scanlines",
    density: "compact",
  },
};

/** Off-white paper, ruled lines and a handwriting-style heading font. */
export const paperNotebook: Skin = {
  id: "paper-notebook",
  name: "Paper Notebook",
  version: 1,
  tokens: {
    bg: "#FBF6E9",
    surface: "#FFFDF7",
    surfaceAlt: "#F2EAD3",
    text: "#2A2933",
    textMuted: "#645E6B",
    border: "#C8BC9C",
    accent: "#2D4A9B", // blue ink
    accentText: "#FFFFFF",
    danger: "#B3261E",
    warning: "#8A5A00",
    success: "#236B3F",
    fontBody: fontStack("patrick-hand"),
    fontDisplay: fontStack("caveat"),
    fontMono: MONO,
    fontSize: "17px",
    radius: "4px",
    borderWidth: "1px",
    borderStyle: "solid",
    shadow: "2px 2px 0 rgba(60, 50, 30, 0.15)",
    bgPattern: "lines",
    density: "comfortable",
  },
};

/** Near-black with hot pink and cyan accents and a glow. */
export const neonNight: Skin = {
  id: "neon-night",
  name: "Neon Night",
  version: 1,
  tokens: {
    bg: "#0B0716",
    surface: "#150F26",
    surfaceAlt: "#1F1738",
    text: "#F3EEFF",
    textMuted: "#B8AEDB",
    border: "#27B8D6", // cyan
    accent: "#FF3DDB", // hot pink
    accentText: "#12051A",
    danger: "#FF5C7A",
    warning: "#FFD166",
    success: "#2EF2C8",
    fontBody: fontStack("rajdhani"),
    fontDisplay: fontStack("orbitron"),
    fontMono: fontStack("share-tech-mono"),
    fontSize: "16px",
    radius: "6px",
    borderWidth: "1px",
    borderStyle: "solid",
    shadow: "0 0 14px rgba(255, 61, 219, 0.35)",
    bgPattern: "grid",
    density: "comfortable",
  },
};

export const presets: Skin[] = [cleanLight, cleanDark, retroPlayer, paperNotebook, neonNight];

export const DEFAULT_SKIN: Skin = cleanLight;

export const isBuiltInSkin = (id: string): boolean => presets.some((p) => p.id === id);
