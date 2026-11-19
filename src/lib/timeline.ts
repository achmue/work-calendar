import type { ISODate, Project } from "../types";
import { addDaysISO, daysBetween, formatISO, isoWeekday } from "./dates";

/** How many days either side of everything to leave empty, and the minimum window around today. */
const PAD_DAYS = 7;
const MIN_DAYS_BEFORE_TODAY = 14;
const MIN_DAYS_AFTER_TODAY = 45;

export interface TimelineRange {
  start: ISODate;
  end: ISODate;
  /** Number of day columns, start and end included. */
  days: number;
}

/**
 * Where a project's bar begins. Uses the start date; if there isn't one, the
 * earliest checklist date (so the bar still covers the work); else the deadline.
 */
export function barStart(project: Pick<Project, "start" | "deadline" | "tasks">): ISODate {
  if (project.start !== "") return project.start <= project.deadline ? project.start : project.deadline;
  const dues = project.tasks.map((t) => t.due).filter((d) => d !== "" && d <= project.deadline);
  return dues.length > 0 ? dues.reduce((a, b) => (a < b ? a : b)) : project.deadline;
}

/** The dates the timeline must cover: every bar, every dated item, and a window around today. */
export function timelineRange(projects: readonly Project[], today: ISODate): TimelineRange {
  const dates: ISODate[] = [
    addDaysISO(today, -MIN_DAYS_BEFORE_TODAY),
    addDaysISO(today, MIN_DAYS_AFTER_TODAY),
  ];
  for (const project of projects) {
    dates.push(barStart(project), project.deadline);
    for (const task of project.tasks) if (task.due !== "") dates.push(task.due);
  }
  const first = dates.reduce((a, b) => (a < b ? a : b));
  const last = dates.reduce((a, b) => (a > b ? a : b));
  const start = addDaysISO(first, -PAD_DAYS);
  const end = addDaysISO(last, PAD_DAYS);
  return { start, end, days: daysBetween(start, end) + 1 };
}

/** Which day column (0 = first) a date sits in. */
export function dayOffset(range: Pick<TimelineRange, "start">, date: ISODate): number {
  return daysBetween(range.start, date);
}

/** Every date in the range, in order. */
export function rangeDates(range: TimelineRange): ISODate[] {
  return Array.from({ length: range.days }, (_, i) => addDaysISO(range.start, i));
}

export function isWeekend(date: ISODate): boolean {
  return isoWeekday(date) >= 6;
}

/** Earliest bar first; ties by deadline, then name. */
export function sortForTimeline(projects: readonly Project[]): Project[] {
  return [...projects].sort(
    (a, b) =>
      barStart(a).localeCompare(barStart(b)) ||
      a.deadline.localeCompare(b.deadline) ||
      a.name.localeCompare(b.name),
  );
}

export interface MonthSegment {
  label: string;
  offset: number;
  days: number;
}

/** The month labels for the top of the timeline, with where each starts and how wide it is. */
export function monthSegments(range: TimelineRange): MonthSegment[] {
  const segments: (MonthSegment & { month: string })[] = [];
  for (const [offset, date] of rangeDates(range).entries()) {
    const month = date.slice(0, 7);
    const last = segments[segments.length - 1];
    if (last && last.month === month) last.days += 1;
    else segments.push({ month, label: formatISO(date, "MMM yyyy"), offset, days: 1 });
  }
  return segments.map(({ label, offset, days }) => ({ label, offset, days }));
}
