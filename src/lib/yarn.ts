import type { ISODate, Project } from "../types";

// The red yarn that ties an index card to its deadline pin on the wall calendar.

/**
 * Which project the yarn ties: the card being pointed at if its pin is on the wall, otherwise the next
 * deadline coming up, otherwise the most recently missed one. `pinned` holds the projects with a pin on show.
 */
export function yarnTarget(
  projects: readonly Pick<Project, "id" | "deadline">[],
  pinned: ReadonlySet<string>,
  today: ISODate,
  pointedId: string | null,
): string | null {
  const onWall = projects.filter((p) => pinned.has(p.id));
  if (pointedId && onWall.some((p) => p.id === pointedId)) return pointedId;
  const byDate = [...onWall].sort((a, b) => a.deadline.localeCompare(b.deadline));
  const next = byDate.find((p) => p.deadline >= today) ?? byDate[byDate.length - 1];
  return next?.id ?? null;
}

export interface Point {
  x: number;
  y: number;
}

/** An SVG path for a piece of yarn hanging loosely between two pins. */
export function yarnPath(a: Point, b: Point): string {
  const distance = Math.hypot(b.x - a.x, b.y - a.y);
  const slack = Math.min(130, 30 + distance * 0.18);
  const round = (n: number) => Math.round(n * 10) / 10;
  return `M${round(a.x)},${round(a.y)} Q${round((a.x + b.x) / 2)},${round(Math.max(a.y, b.y) + slack)} ${round(b.x)},${round(b.y)}`;
}
