// Project colours are user data (a hex string on each project), not skin tokens.

export const PROJECT_COLORS = [
  "#1F8A8A", // teal
  "#C2410C", // orange
  "#7C3AED", // violet
  "#2563EB", // blue
  "#BE185D", // pink
  "#15803D", // green
  "#B45309", // amber
  "#475569", // slate
] as const;

export const DEFAULT_PROJECT_COLOR: string = PROJECT_COLORS[0];

/** "#RGB" or "#RRGGBB". */
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}
