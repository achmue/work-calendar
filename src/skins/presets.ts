import type { Skin } from "../types";

// Skin presets are the only place hard-coded colours are allowed.
// More presets arrive in M7.

const SYSTEM_SANS =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SYSTEM_MONO =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

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
    fontBody: SYSTEM_SANS,
    fontDisplay: SYSTEM_SANS,
    fontMono: SYSTEM_MONO,
    fontSize: "15px",
    radius: "10px",
    borderWidth: "1px",
    borderStyle: "solid",
    shadow: "0 1px 3px rgba(20, 40, 30, 0.12)",
    bgPattern: "none",
    density: "comfortable",
  },
};

export const presets: Skin[] = [cleanLight];

export const DEFAULT_SKIN: Skin = cleanLight;
