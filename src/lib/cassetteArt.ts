import { parseColor, toHex } from "./color";
import type { StatusKind } from "./status";

// The cassette drawing. Like the project colours, the physical bits of a tape
// (paper label, brown tape, black window, white hubs) are data, not theme colours.
// Anything that carries meaning (status LED, counter, label ink) uses skin tokens instead.

export const TAPE_ART = {
  paper: "#F5EEDB",
  paperInk: "#1D2230",
  rule: "#9DB3D6",
  window: "#141414",
  tape: "#4A3426",
  hub: "#EDEBE6",
  hubHole: "#151515",
  gloss: "#FFFFFF",
  stripeText: "#FFFFFF",
  shadow: "#000000",
} as const;

/** The label stripe is the project colour darkened by this much, so white text on it is always readable. */
const STRIPE_SHARE = 0.45;

/**
 * Fill for the label stripe: the project colour at 45% brightness. Even a pure white
 * project colour comes out dark enough for white text (4.7:1), so any colour is safe.
 */
export function stripeFill(projectColor: string): string {
  const c = parseColor(projectColor);
  if (!c) return TAPE_ART.window;
  return toHex({ r: c.r * STRIPE_SHARE, g: c.g * STRIPE_SHARE, b: c.b * STRIPE_SHARE, a: 1 });
}

const MIN_REEL = 15;
const REEL_SWING = 12;

/**
 * Radius of the tape wound on each reel. At 0% progress all the tape is on the
 * left reel; as items get ticked off it winds across to the right one.
 */
export function reelRadii(progress: number): { left: number; right: number } {
  const p = Math.min(1, Math.max(0, progress));
  return { left: MIN_REEL + (1 - p) * REEL_SWING, right: MIN_REEL + p * REEL_SWING };
}

export interface LedInfo {
  /** The skin colour variable the LED glows with. */
  color: "var(--success)" | "var(--warning)" | "var(--danger)";
  label: string;
}

export function ledFor(kind: StatusKind): LedInfo {
  switch (kind) {
    case "overdue":
      return { color: "var(--danger)", label: "OVERDUE" };
    case "due-today":
    case "due-soon":
      return { color: "var(--warning)", label: "SOON" };
    case "done":
      return { color: "var(--success)", label: "DONE" };
    case "on-track":
      return { color: "var(--success)", label: "PLAY" };
  }
}

/** The 3-digit tape counter: percent done, e.g. "040". */
export function counterText(percent: number): string {
  return String(Math.round(Math.min(100, Math.max(0, percent)))).padStart(3, "0");
}
