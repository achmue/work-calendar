import type { ISODate, Project } from "../types";
import { daysBetween } from "./dates";
import { assignLanes } from "./lanes";
import { isProjectDone } from "./status";
import { barStart, sortForTimeline } from "./timeline";

/** A project's highlighter stroke across one week of the wall calendar. */
export interface WeekSpan {
  project: Project;
  /** First and last day column it covers in this week (0 = Monday). */
  from: number;
  to: number;
  /** Which row of strokes it sits in (0 = top). The same in every week, so a project doesn't jump about. */
  lane: number;
  /** True in the week the project begins. */
  starts: boolean;
}

/**
 * The strokes for each week: one per unfinished project that is running during that week.
 * Projects that would need more than `maxLanes` rows are left out (their deadline still shows on its day).
 */
export function weekSpans(projects: readonly Project[], weeks: readonly (readonly ISODate[])[], maxLanes = 2): WeekSpan[][] {
  const first = weeks[0]?.[0];
  const last = weeks[weeks.length - 1]?.[6];
  if (!first || !last) return weeks.map(() => []);

  // Only what can be seen this month takes up a row.
  const visible = sortForTimeline(projects).filter(
    (p) => !isProjectDone(p) && barStart(p) <= last && p.deadline >= first,
  );
  const lanes = assignLanes(visible.map((p) => ({ start: barStart(p), end: p.deadline })), 1);

  return weeks.map((week) => {
    const monday = week[0] as ISODate;
    const sunday = week[6] as ISODate;
    return visible.flatMap((project, i) => {
      const start = barStart(project);
      const lane = lanes[i] as number;
      if (lane >= maxLanes || start > sunday || project.deadline < monday) return [];
      return [
        {
          project,
          from: Math.max(0, daysBetween(monday, start)),
          to: Math.min(6, daysBetween(monday, project.deadline)),
          lane,
          starts: start >= monday,
        },
      ];
    });
  });
}
