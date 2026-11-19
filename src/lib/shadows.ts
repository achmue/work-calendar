import { parseColor } from "./color";

// Shadow choices offered in the skin editor. Shadows are skin data, so the
// plain colours here are fine (this isn't CSS or a component).

export type ShadowPreset = "none" | "soft" | "medium" | "hard" | "glow";

export const SHADOW_PRESET_LABELS: Record<ShadowPreset, string> = {
  none: "None",
  soft: "Soft",
  medium: "Medium",
  hard: "Hard edge",
  glow: "Glow (uses the accent colour)",
};

export const SHADOW_PRESET_ORDER: readonly ShadowPreset[] = ["none", "soft", "medium", "hard", "glow"];

/** The CSS for a preset. "glow" takes its colour from the accent; falls back to a neutral glow. */
export function shadowFor(preset: ShadowPreset, accent: string): string {
  switch (preset) {
    case "none":
      return "none";
    case "soft":
      return "0 1px 3px rgba(0, 0, 0, 0.2)";
    case "medium":
      return "0 4px 12px rgba(0, 0, 0, 0.25)";
    case "hard":
      return "4px 4px 0 rgba(0, 0, 0, 0.35)";
    case "glow": {
      const c = parseColor(accent);
      const rgb = c ? `${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}` : "128, 128, 128";
      return `0 0 14px rgba(${rgb}, 0.45)`;
    }
  }
}

/** Which preset a shadow value is, or null for a custom one (e.g. from an imported skin). */
export function detectShadowPreset(shadow: string, accent: string): ShadowPreset | null {
  return SHADOW_PRESET_ORDER.find((p) => shadowFor(p, accent) === shadow) ?? null;
}
