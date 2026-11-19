import type { ISODate, Project, Task } from "../types";
import { addDaysISO, addMonthsISO, daysBetween, isoWeekday, monthStartISO } from "./dates";

/**
 * The weeks to draw for the month containing `date`. Weeks start on Monday and
 * include the days of the neighbouring months needed to fill the first and last week.
 */
export function monthGrid(date: ISODate): ISODate[][] {
  const first = monthStartISO(date);
  const last = addDaysISO(addMonthsISO(first, 1), -1);
  const gridStart = addDaysISO(first, -(isoWeekday(first) - 1));
  const gridEnd = addDaysISO(last, 7 - isoWeekday(last));

  const weeks: ISODate[][] = [];
  const total = daysBetween(gridStart, gridEnd) + 1;
  for (let i = 0; i < total; i += 7) {
    weeks.push(Array.from({ length: 7 }, (_, d) => addDaysISO(gridStart, i + d)));
  }
  return weeks;
}

/** Something that happens on a day: a project deadline or a checklist item. */
export type DayItem =
  | { kind: "deadline"; project: Project }
  | { kind: "task"; project: Project; task: Task };

export type DayIndex = Map<ISODate, DayItem[]>;

/** Group every deadline and dated checklist item by day. Deadlines come first on each day. */
export function buildDayIndex(projects: readonly Project[]): DayIndex {
  const index: DayIndex = new Map();
  const add = (date: ISODate, item: DayItem) => {
    const list = index.get(date);
    if (list) list.push(item);
    else index.set(date, [item]);
  };

  // All deadlines go in before any task, so they come first on each day.
  for (const project of projects) add(project.deadline, { kind: "deadline", project });
  for (const project of projects) {
    for (const task of project.tasks) {
      if (task.due !== "") add(task.due, { kind: "task", project, task });
    }
  }
  return index;
}

export function itemsOn(index: DayIndex, date: ISODate): DayItem[] {
  return index.get(date) ?? [];
}
